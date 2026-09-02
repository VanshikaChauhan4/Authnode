import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileImage,
  LoaderCircle,
  ScanLine,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  Upload,
  User,
  Hash,
} from 'lucide-react'
import { createWorker } from 'tesseract.js'
import './Verify.css'

/* ============================================================
   OCR TEXT PARSING HELPERS
============================================================ */

function preprocessOcrText(rawText = '') {
  if (!rawText) return ''
  // 1. Rejoin hyphenated line breaks: e.g. "TBI-2026-PTQU-\nFZ45" -> "TBI-2026-PTQU-FZ45"
  let text = rawText.replace(/([A-Za-z0-9]+-)\s*[\r\n]+\s*([A-Za-z0-9]+)/g, '$1$2')
  // 2. Normalize horizontal spaces
  text = text.replace(/[ \t]+/g, ' ')
  return text
}

function extractCertificateId(rawText) {
  const text = preprocessOcrText(rawText)
  if (!text) return ''

  // Priority 1: Specifically preceded by "CERTIFICATE ID", "CERTIFICATE NO", etc.
  const certIdRegexes = [
    /certificate\s*(?:id|no|number|code|#)\s*[:#-]?\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+|[A-Za-z0-9]{8,})/i,
    /cert\s*(?:id|no|number|code|#)\s*[:#-]?\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+|[A-Za-z0-9]{8,})/i,
  ]

  for (const regex of certIdRegexes) {
    const match = text.match(regex)
    if (match?.[1]) {
      const candidate = match[1].trim()
      if (candidate.length >= 6 && !/^(intern|details|verification|name|role|click)$/i.test(candidate)) {
        return candidate
      }
    }
  }

  // Priority 2: Multi-segmented hyphenated code (e.g. TBI-2026-PTQU-FZ45 has 3+ dashes)
  // Distinguishes Certificate ID from single-hyphen IDs like Intern ID (TBI-26100255)
  const multiSegmentMatches = text.match(/\b([A-Z0-9]{2,8}(?:-[A-Z0-9]{2,10}){2,5})\b/gi)
  if (multiSegmentMatches && multiSegmentMatches.length > 0) {
    return multiSegmentMatches[0].trim()
  }

  // Priority 3: Fallback patterns
  const fallbackPatterns = [
    /(?:credential|verification|license)\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Za-z0-9-_]{6,30})/i,
    /\b([a-f0-9]{12})\b/i,
  ]

  for (const pattern of fallbackPatterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  // Priority 4: Look line-by-line, EXPLICITLY SKIPPING lines with "intern id" or "student id"
  const lines = text.split('\n')
  for (const line of lines) {
    if (/intern\s*id|student\s*id|employee\s*id|user\s*id/i.test(line)) {
      continue // Skip Intern ID like TBI-26100255!
    }
    const match = line.match(/\b([A-Z]{2,6}-[0-9A-Z]{4,16})\b/i)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return ''
}

function extractStudentName(rawText) {
  const text = preprocessOcrText(rawText)
  if (!text) return ''

  const patterns = [
    // 1. "INTERN NAME", "STUDENT NAME", "CANDIDATE NAME", "RECIPIENT NAME"
    /(?:intern|student|candidate|recipient|learner|participant)\s*name\s*[:\-]?\s*([A-Za-z][A-Za-z'.]+(?:\s+[A-Za-z][A-Za-z'.]+){1,3})/i,

    // 2. "INTERN:" or "STUDENT:" followed by name
    /(?:intern|student|candidate|recipient)\s*[:\-]\s*([A-Za-z][A-Za-z'.]+(?:\s+[A-Za-z][A-Za-z'.]+){1,3})/i,

    // 3. Awarded to / Presented to / Issued to
    /(?:is\s+)?(?:awarded|presented|conferred|granted|issued)\s+to\s*[:\-]?\s*([A-Za-z][A-Za-z'.]+(?:\s+[A-Za-z][A-Za-z'.]+){1,3})/i,

    // 4. This certifies that [Name]
    /this\s+(?:is\s+to\s+)?certif(?:y\s+that|ies\s+that)\s+([A-Za-z][A-Za-z'.]+(?:\s+[A-Za-z][A-Za-z'.]+){1,3})/i,

    // 5. Generic "Name: Vanshika Chauhan"
    /\bname\s*[:\-]\s*([A-Za-z][A-Za-z'.]+(?:\s+[A-Za-z][A-Za-z'.]+){1,3})/i,

    // 6. Email greeting: "Dear Vanshika Chauhan,"
    /(?:dear|congratulations|hello|hi)\s+([A-Za-z][A-Za-z'.]+(?:\s+[A-Za-z][A-Za-z'.]+){1,3})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      let raw = match[1].replace(/[|*#_]/g, '').trim()
      raw = raw.replace(/\s+(?:for|has|in recognition|on|who|with|at|from|successfully|role|intern|certificate)\b.*$/i, '').trim()
      raw = raw.replace(/[,.:;]+$/, '').trim()
      if (raw.length >= 2 && raw.length <= 50) {
        return raw
      }
    }
  }

  // Fallback for multi-line table format: check line containing "INTERN NAME" or "STUDENT NAME"
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    if (/(?:intern|student|candidate|recipient)\s*name/i.test(lines[i])) {
      const onSameLine = lines[i].replace(/.*(?:intern|student|candidate|recipient)\s*name\s*[:\-]?/i, '').trim()
      if (onSameLine && onSameLine.split(' ').length >= 2) {
        return onSameLine
      }
      if (i + 1 < lines.length && /^[A-Za-z][A-Za-z'.]+(\s+[A-Za-z][A-Za-z'.]+)+$/.test(lines[i + 1])) {
        return lines[i + 1]
      }
    }
  }

  return ''
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function Verify() {
  const navigate = useNavigate()
  const { id: idFromRoute } = useParams()
  const fileInputRef = useRef(null)

  const [stage, setStage] = useState('upload') // 'upload' | 'ready' | 'scanning' | 'review' | 'result'
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)

  // Extracted and editable fields
  const [certificateId, setCertificateId] = useState(idFromRoute || '')
  const [studentName, setStudentName] = useState('')
  const [extractedId, setExtractedId] = useState('')
  const [extractedName, setExtractedName] = useState('')

  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (idFromRoute) {
      setCertificateId(idFromRoute)
    }
  }, [idFromRoute])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setResult(null)
    setOcrText('')
    setExtractedId('')
    setExtractedName('')

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file such as PNG, JPG, JPEG, or WEBP.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10 MB.')
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStage('ready')
  }

  async function readCertificateImage() {
    if (!selectedFile) {
      setError('Please upload your certificate email screenshot first.')
      return
    }

    setError('')
    setResult(null)
    setStage('scanning')
    setIsProcessing(true)
    setOcrProgress(0)

    let worker = null

    try {
      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            setOcrProgress(Math.round(message.progress * 100))
          }
        },
      })

      await worker.setParameters({
        preserve_interword_spaces: '1',
      })

      const recognition = await worker.recognize(selectedFile)
      const text = recognition?.data?.text || ''

      setOcrText(text)

      const detectedId = extractCertificateId(text)
      const detectedName = extractStudentName(text)

      setExtractedId(detectedId)
      setExtractedName(detectedName)

      if (detectedId) setCertificateId(detectedId)
      if (detectedName) setStudentName(detectedName)

      setOcrProgress(100)
      setStage('review')
    } catch (err) {
      console.error('OCR scanning failed:', err)
      setError('Could not process this image. Please upload a clearer screenshot.')
      setStage('ready')
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch {
          // Silent cleanup
        }
      }
      setIsProcessing(false)
    }
  }

  async function verifyWithBackend() {
    const cleanId = (certificateId || extractedId).trim()
    const cleanName = (studentName || extractedName).trim()

    if (!cleanId) {
      setError('Certificate ID is required. Please type it in if OCR did not detect it.')
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const queryParam = cleanName ? `?studentName=${encodeURIComponent(cleanName)}` : ''

      const endpointsToTry = [
        `${API_BASE}/certificates/${encodeURIComponent(cleanId)}/verify${queryParam}`,
        `${API_BASE}/certificates/verify/${encodeURIComponent(cleanId)}${queryParam}`,
        `/api/certificates/${encodeURIComponent(cleanId)}/verify${queryParam}`,
        `/api/certificates/verify/${encodeURIComponent(cleanId)}${queryParam}`,
      ]

      let data = null
      let lastError = null

      for (const endpoint of endpointsToTry) {
        try {
          const res = await fetch(endpoint, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          })

          if (res.ok || res.status === 404 || res.status === 400) {
            data = await res.json()
            break
          }
        } catch (fetchErr) {
          lastError = fetchErr
        }
      }

      if (!data) {
        throw lastError || new Error('No response from verification server')
      }

      const certData = data.certificate || data.entry || null

      setResult({
        status: data.status,
        message: data.message || (data.status === 'verified' ? 'Certificate authenticated successfully.' : ''),
        certificate: certData,
        certificateId: cleanId,
        studentName: cleanName || certData?.student_name || 'N/A',
        registeredName: data.registeredName || certData?.student_name,
        verification: data.verification,
      })

      setStage('result')
    } catch (err) {
      console.error('Backend verification failed:', err)
      setError('Unable to reach the verification server. Please ensure the backend is running on http://localhost:5000.')
    } finally {
      setIsVerifying(false)
    }
  }

  function continueToRecord() {
    if (!result || result.status !== 'verified') return

    navigate('/certificate-record', {
      state: {
        verifiedCertificate: {
          certificateId: result.certificate?.id || result.certificateId,
          studentName: result.certificate?.student_name || result.studentName,
          course: result.certificate?.course,
          institution: result.certificate?.institution,
          issueDate: result.certificate?.issue_date,
          hash: result.certificate?.hash,
          verificationMethod: 'EMAIL_OCR_SHA256',
          verifiedAt: new Date().toISOString(),
          sourceFileName: selectedFile?.name || '',
        },
      },
    })
  }

  function resetVerification() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setStage('upload')
    setSelectedFile(null)
    setPreviewUrl('')
    setOcrText('')
    setOcrProgress(0)
    setExtractedId('')
    setExtractedName('')
    setCertificateId(idFromRoute || '')
    setStudentName('')
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Verify</span>
          <h1>Verify your certificate</h1>
          <p>
            Upload the certificate email screenshot you received. AuthNode will read the Certificate ID and student name, then cryptographically verify the record against the database.
          </p>
        </div>

        <div className="verify-layout">
          <AnimatePresence mode="wait">
            {(stage === 'upload' || stage === 'ready') && (
              <motion.div
                key="upload"
                className="card verify-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div
                  className="verify-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Uploaded certificate screenshot"
                      className="verify-image-preview"
                    />
                  ) : (
                    <>
                      <div className="verify-upload-icon">
                        <Upload size={30} />
                      </div>
                      <h3>Upload certificate email</h3>
                      <p>Click here to select the screenshot received after certificate completion.</p>
                      <span>PNG, JPG, JPEG or WEBP · Max 10 MB</span>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  hidden
                />

                {selectedFile && (
                  <div className="verify-file-info">
                    <FileImage size={18} />
                    <div>
                      <strong>{selectedFile.name}</strong>
                      <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="verify-error">
                    <AlertTriangle size={17} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary verify-submit"
                  onClick={readCertificateImage}
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle size={18} className="spin" />
                      Reading screenshot {ocrProgress}%
                    </>
                  ) : (
                    <>
                      <ScanLine size={18} />
                      Scan Certificate Screenshot
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {stage === 'scanning' && (
              <motion.div
                key="scanning"
                className="card verify-scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="scan-line"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                />
                <ScanLine size={46} strokeWidth={1.3} />
                <h3>Reading certificate email</h3>
                <p>AuthNode OCR is extracting the Certificate ID and student name...</p>
                <strong>{ocrProgress}%</strong>
              </motion.div>
            )}

            {stage === 'review' && (
              <motion.div
                key="review"
                className="card verify-review"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div className="verify-review-header">
                  <FileImage size={24} />
                  <div>
                    <h2>Information detected</h2>
                    <p>Review and confirm the information extracted from your screenshot.</p>
                  </div>
                </div>

                <div className="verify-detected-grid">
                  <div className="verify-detected-item">
                    <Hash size={18} />
                    <div style={{ width: '100%' }}>
                      <span>CERTIFICATE ID</span>
                      <input
                        type="text"
                        className="form-control"
                        value={certificateId}
                        onChange={(e) => setCertificateId(e.target.value)}
                        placeholder={extractedId || 'e.g. TBI-2026-PTQU-FZ45'}
                        style={{
                          marginTop: '4px',
                          width: '100%',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '6px 10px',
                          fontWeight: 'bold',
                        }}
                      />
                    </div>
                  </div>

                  <div className="verify-detected-item">
                    <User size={18} />
                    <div style={{ width: '100%' }}>
                      <span>STUDENT NAME</span>
                      <input
                        type="text"
                        className="form-control"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder={extractedName || 'Enter student name from certificate'}
                        style={{
                          marginTop: '4px',
                          width: '100%',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '6px 10px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {!certificateId && (
                  <div className="verify-warning">
                    <AlertTriangle size={17} />
                    <span>Certificate ID was not detected. Please type it in from the screenshot before verifying.</span>
                  </div>
                )}

                {error && (
                  <div className="verify-error">
                    <AlertTriangle size={17} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="verify-actions">
                  <button type="button" className="btn btn-ghost" onClick={resetVerification} disabled={isVerifying}>
                    Upload another image
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={verifyWithBackend}
                    disabled={isVerifying || !certificateId}
                  >
                    {isVerifying ? (
                      <>
                        <LoaderCircle size={17} className="spin" />
                        Verifying with database...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={17} />
                        Verify information
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 'result' && result && (
              <motion.div
                key="result"
                className={`card verify-result verify-result-${result.status}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* 1. VERIFIED */}
                {result.status === 'verified' && (
                  <>
                    <ShieldCheck size={58} strokeWidth={1.4} style={{ color: '#10b981' }} />
                    <h2>Certificate Verified & Authenticated</h2>
                    <p className="verify-result-sub">
                      The certificate is authentic. The Certificate ID and cryptographic SHA-256 hash match the official database record.
                    </p>

                    <div className="verify-result-details">
                      <div>
                        <span>Certificate ID</span>
                        <strong>{result.certificate?.id || result.certificateId}</strong>
                      </div>
                      <div>
                        <span>Student</span>
                        <strong>{result.certificate?.student_name || result.studentName}</strong>
                      </div>
                      {result.certificate?.course && (
                        <div>
                          <span>Course</span>
                          <strong>{result.certificate.course}</strong>
                        </div>
                      )}
                      {result.certificate?.institution && (
                        <div>
                          <span>Institution</span>
                          <strong>{result.certificate.institution}</strong>
                        </div>
                      )}
                    </div>

                    <div className="verify-success-note">
                      <CheckCircle2 size={17} />
                      <span>SHA-256 Hash Authenticated · Cryptographic Integrity Verified</span>
                    </div>

                    <div className="verify-actions" style={{ marginTop: '20px', width: '100%' }}>
                      <button type="button" className="btn btn-ghost" onClick={resetVerification}>
                        Verify another
                      </button>
                      <button type="button" className="btn btn-primary verify-again" onClick={continueToRecord}>
                        Continue to Certificate Record
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </>
                )}

                {/* 2. NOT FOUND */}
                {result.status === 'not_found' && (
                  <>
                    <ShieldX size={58} strokeWidth={1.4} style={{ color: '#ef4444' }} />
                    <h2>Certificate Not Found</h2>
                    <p className="verify-result-sub">
                      No matching certificate was found in the database with ID: <strong>{result.certificateId}</strong>.
                    </p>
                    <button type="button" className="btn btn-ghost verify-again" onClick={resetVerification}>
                      Try another certificate
                    </button>
                  </>
                )}

                {/* 3. TAMPERED */}
                {result.status === 'tampered' && (
                  <>
                    <ShieldX size={58} strokeWidth={1.4} style={{ color: '#ef4444' }} />
                    <h2>Cryptographic Integrity Check Failed</h2>
                    <p className="verify-result-sub">
                      The SHA-256 hash does not match the stored certificate record. The certificate details have been tampered with or forged.
                    </p>
                    <button type="button" className="btn btn-ghost verify-again" onClick={resetVerification}>
                      Try another certificate
                    </button>
                  </>
                )}

                {/* 4. NAME MISMATCH */}
                {result.status === 'name_mismatch' && (
                  <>
                    <ShieldX size={58} strokeWidth={1.4} style={{ color: '#f59e0b' }} />
                    <h2>Student Name Mismatch</h2>
                    <p className="verify-result-sub">
                      The certificate ID was located, but the student name detected on the screenshot (<strong>{result.providedName || result.studentName}</strong>) does not match the registered recipient (<strong>{result.registeredName || result.certificate?.student_name}</strong>).
                    </p>
                    <button type="button" className="btn btn-ghost verify-again" onClick={resetVerification}>
                      Verify another
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="verify-security-note">
          <ShieldQuestion size={20} />
          <div>
            <strong>How this verification works</strong>
            <p>
              AuthNode reads the uploaded screenshot using Tesseract OCR, sends the extracted ID and name to the backend, and validates it against the database and SHA-256 cryptographic proof to ensure complete integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}