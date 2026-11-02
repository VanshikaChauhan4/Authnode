
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  UploadCloud,
  FileText,
  Search,
  LoaderCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Hash,
  User,
  Building2,
  BookOpen,
  Fingerprint,
  X,
} from 'lucide-react'

import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import { useAuth } from '../../context/AuthContext'
import './Verify.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '')

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_PAGES = 5

function normalizeId(value = '') {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim()
}

function normalizeText(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function extractCertificateId(text = '') {
  const cleaned = String(text)
    .replace(/\r/g, '')
    .replace(/([A-Z0-9]+-)\s*\n\s*([A-Z0-9]+)/gi, '$1$2')

  const patterns = [
    /certificate\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Z0-9]+(?:-[A-Z0-9]+){1,5})/i,
    /credential\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Z0-9_-]{6,40})/i,
    /verification\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Z0-9_-]{6,40})/i,
    /\b(?:CERT|TBI)-[A-Z0-9-]{4,35}\b/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    const candidate = match?.[1] || match?.[0]

    if (candidate && normalizeId(candidate).length >= 6) {
      return candidate.trim()
    }
  }

  return ''
}

function extractStudentName(text = '') {
  const patterns = [
    /(?:student|recipient|candidate|intern)\s*name\s*[:\-]?\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /(?:awarded|presented|conferred|granted|issued)\s+to\s+([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /this\s+(?:is\s+to\s+)?certif(?:y|ies)\s+that\s+([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /\bname\s*[:\-]\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return normalizeText(match[1])
        .replace(/\s+(?:has|for|who|successfully|completed|on)\b.*$/i, '')
        .trim()
    }
  }

  return ''
}

function extractField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return normalizeText(match[1])
        .split('\n')[0]
        .slice(0, 120)
    }
  }

  return ''
}

function parseCertificate(text) {
  return {
    certificateId: extractCertificateId(text),
    studentName: extractStudentName(text),
    course: extractField(text, [
      /(?:course|program|training|internship)\s*(?:name|title)?\s*[:\-]\s*([^\n]+)/i,
    ]),
    institution: extractField(text, [
      /(?:institution|issued\s+by|organization|university|college)\s*[:\-]\s*([^\n]+)/i,
    ]),
  }
}

async function readPdfWithOcr(file, onProgress) {
  let worker

  try {
    const buffer = await file.arrayBuffer()

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    }).promise

    if (pdf.numPages > MAX_PAGES) {
      throw new Error(
        `This PDF has ${pdf.numPages} pages. Please upload a PDF containing no more than ${MAX_PAGES} pages.`
      )
    }

    worker = await createWorker('eng')

    let fullText = ''

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      onProgress(
        Math.round(((pageNumber - 1) / pdf.numPages) * 100)
      )

      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 2 })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context,
        viewport,
      }).promise

      const recognition = await worker.recognize(canvas)

      fullText += `\n${recognition.data.text}\n`

      canvas.width = 0
      canvas.height = 0

      onProgress(
        Math.round((pageNumber / pdf.numPages) * 100)
      )
    }

    return fullText
  } finally {
    if (worker) {
      await worker.terminate()
    }
  }
}

export default function Verify() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const { user, loading } = useAuth()

  const inputRef = useRef(null)

  const [certificateId, setCertificateId] = useState(routeId || '')
  const [file, setFile] = useState(null)
  const [stage, setStage] = useState('upload')

  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrData, setOcrData] = useState(null)
  const [ocrText, setOcrText] = useState('')

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [isReading, setIsReading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user || user.role !== 'student') {
      navigate('/auth?role=student')
    }
  }, [user, loading, navigate])

  function handleFileSelect(event) {
    const selected = event.target.files?.[0]

    if (!selected) return

    if (
      selected.type !== 'application/pdf' &&
      !selected.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('Please upload a valid PDF certificate.')
      return
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('The certificate PDF must be smaller than 10 MB.')
      return
    }

    setFile(selected)
    setOcrData(null)
    setOcrText('')
    setResult(null)
    setError('')
    setStage('upload')
  }

  function removeFile() {
    setFile(null)
    setOcrData(null)
    setOcrText('')
    setResult(null)
    setError('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setStage('upload')
  }

  async function scanCertificate() {
    if (!file || !certificateId.trim()) {
      setError('Enter your Certificate ID and upload your certificate PDF.')
      return
    }

    setError('')
    setResult(null)
    setIsReading(true)
    setStage('scanning')
    setOcrProgress(0)

    try {
      const text = await readPdfWithOcr(file, setOcrProgress)
      const extracted = parseCertificate(text)

      setOcrText(text)
      setOcrData(extracted)

      if (!extracted.certificateId) {
        setError(
          'OCR could not identify a Certificate ID. Upload a clearer, original certificate PDF.'
        )
        setStage('upload')
        return
      }

      if (
        normalizeId(extracted.certificateId) !==
        normalizeId(certificateId)
      ) {
        setResult({
          status: 'id_mismatch',
          message:
            'The Certificate ID entered does not match the ID detected in the uploaded certificate.',
          enteredId: certificateId,
          detectedId: extracted.certificateId,
        })

        setStage('result')
        return
      }

      setStage('review')
    } catch (err) {
      console.error('Certificate OCR failed:', err)
      setError(err.message || 'Could not read the uploaded certificate.')
      setStage('upload')
    } finally {
      setIsReading(false)
    }
  }

  async function verifyCertificate() {
    if (!file || !certificateId.trim() || !ocrData) {
      setError('Complete the certificate scanning process first.')
      return
    }

    if (
      normalizeId(ocrData.certificateId) !==
      normalizeId(certificateId)
    ) {
      setError('Certificate ID mismatch. Verification stopped.')
      return
    }

    setError('')
    setResult(null)
    setIsVerifying(true)
    setStage('verifying')

    try {
      const formData = new FormData()

      formData.append('cert_id', certificateId.trim())
      formData.append('file', file)

      const response = await fetch(
        `${API_BASE}/certificates/verify`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          `Verification failed with HTTP ${response.status}.`
        )
      }

      const status =
        data.verification_status || 'verification_error'

      setResult({
        status,
        certificate: data.certificate || null,
        certificateId: data.certificate_id || certificateId,
        uploadedPdfSha256: data.uploaded_pdf_sha256 || '',
        blockchainEnabled: data.blockchain_enabled,
        blockchainRegistered: data.blockchain_registered,
        pdfHashSemantics: data.pdf_hash_semantics || '',
        message: data.message || '',
        ocrData,
      })

      setStage('result')
    } catch (err) {
      console.error('Certificate verification failed:', err)

      setResult({
        status: 'network_error',
        message:
          err.message ||
          'Could not connect to the AuthNode verification server.',
      })

      setStage('result')
    } finally {
      setIsVerifying(false)
    }
  }

  function resetVerification() {
    setCertificateId(routeId || '')
    setFile(null)
    setOcrData(null)
    setOcrText('')
    setOcrProgress(0)
    setResult(null)
    setError('')
    setStage('upload')
    setIsReading(false)
    setIsVerifying(false)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function continueToRecord() {
    if (
      result?.status !== 'verified' ||
      !result.certificate
    ) {
      return
    }

    const certificate = result.certificate

    navigate('/certificate-record', {
      state: {
        verifiedCertificate: {
          certificateId:
            certificate.id || result.certificateId,

          studentName: certificate.student_name || '',

          studentEmail: certificate.student_email || '',

          courseName: certificate.course || '',

          certificateTitle:
            certificate.certificate_title ||
            certificate.course ||
            'Certificate of Completion',

          issuerName:
            certificate.institution || 'AuthNode Institution',

          issuerId: certificate.institution_id || '',

          issuedAt: certificate.issue_date || '',

          certificateHash: certificate.hash || '',

          blockchainTxHash:
            certificate.blockchain_tx_hash || '',

          blockchainNetwork:
            certificate.blockchain_network || '',

          blockchainTimestamp:
            certificate.blockchain_timestamp || '',

          status: 'VERIFIED',

          verificationType: 'PDF_RECORD_SHA256_RSA_VERIFICATION',

          verifiedAt: new Date().toISOString(),

          sourceFileName: file?.name || '',

          extractedName: ocrData?.studentName || '',

          extractedId: ocrData?.certificateId || '',
        },
      },
    })
  }

  if (loading) {
    return <div className="verify-page">Checking account...</div>
  }

  if (!user || user.role !== 'student') {
    return null
  }

  const isVerified = result?.status === 'verified'

  const failedStatuses = [
    'not_found',
    'tampered',
    'signature_invalid',
    'revoked',
    'not_registered',
    'id_mismatch',
  ]

  const isFailed = failedStatuses.includes(result?.status)

  return (
    <main className="verify-page">
      <div className="verify-container">

        <motion.header
          className="verify-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="verify-heading-icon">
            <Fingerprint size={27} />
          </div>

          <span className="verify-eyebrow">
            AUTHNODE SECURITY
          </span>

          <h1>Certificate Verification</h1>

          <p>
            Verify the authenticity of your academic or
            professional certificate using its official record,
            digital signature and blockchain evidence.
          </p>
        </motion.header>

        <section className="verify-card">

          <div className="verify-step-heading">
            <span>01</span>
            <div>
              <h2>Provide certificate credentials</h2>
              <p>
                Enter the Certificate ID and upload the original
                certificate PDF.
              </p>
            </div>
          </div>

          {stage !== 'result' && stage !== 'scanning' &&
            stage !== 'verifying' && (
            <>
              <div className="verify-field">
                <label htmlFor="certificate-id">
                  Certificate ID
                </label>

                <div className="verify-input-wrapper">
                  <Hash size={18} />

                  <input
                    id="certificate-id"
                    type="text"
                    value={certificateId}
                    onChange={(e) => {
                      setCertificateId(e.target.value)
                      setError('')
                    }}
                    placeholder="e.g. TBI-2026-PTQU-FZ45"
                  />
                </div>

                <small>
                  Enter the unique ID printed on your certificate.
                </small>
              </div>

              <div className="verify-field">
                <label>Certificate document</label>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  hidden
                />

                {!file ? (
                  <button
                    type="button"
                    className="verify-dropzone"
                    onClick={() => inputRef.current?.click()}
                  >
                    <div className="verify-upload-icon">
                      <UploadCloud size={30} />
                    </div>

                    <strong>Upload your certificate</strong>

                    <span>
                      Select your original PDF document
                    </span>

                    <small>PDF format · Maximum 10 MB</small>
                  </button>
                ) : (
                  <div className="verify-selected-file">
                    <div className="verify-file-icon">
                      <FileText size={25} />
                    </div>

                    <div className="verify-file-details">
                      <strong>{file.name}</strong>
                      <span>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <button
                      type="button"
                      className="verify-remove-file"
                      onClick={removeFile}
                      aria-label="Remove certificate"
                    >
                      <X size={19} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="verify-alert">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                className="verify-primary-btn"
                onClick={scanCertificate}
                disabled={!file || !certificateId.trim() || isReading}
              >
                <Search size={18} />
                Scan and read certificate
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {stage === 'scanning' && (
            <div className="verify-progress">
              <LoaderCircle className="verify-spinner" size={38} />

              <h3>Scanning certificate</h3>

              <p>
                OCR is extracting information from your PDF.
                Please keep this page open.
              </p>

              <div className="verify-progress-track">
                <div
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>

              <strong>{ocrProgress}%</strong>
            </div>
          )}

          {stage === 'verifying' && (
            <div className="verify-progress">
              <ShieldCheck size={42} />

              <h3>Authenticating certificate</h3>

              <p>
                Checking the official record, document
                fingerprint and issuer signature.
              </p>

              <LoaderCircle className="verify-spinner" size={28} />
            </div>
          )}

          {stage === 'review' && ocrData && (
            <div className="verify-review">

              <div className="verify-review-success">
                <CheckCircle2 size={21} />
                <div>
                  <strong>OCR extraction completed</strong>
                  <span>
                    Certificate ID matches the entered ID.
                  </span>
                </div>
              </div>

              <h3>Extracted certificate information</h3>

              <div className="verify-extracted-grid">
                <div>
                  <Hash size={18} />
                  <span>Certificate ID</span>
                  <strong>{ocrData.certificateId}</strong>
                </div>

                <div>
                  <User size={18} />
                  <span>Student Name</span>
                  <strong>
                    {ocrData.studentName || 'Not detected'}
                  </strong>
                </div>

                <div>
                  <BookOpen size={18} />
                  <span>Course</span>
                  <strong>
                    {ocrData.course || 'Not detected'}
                  </strong>
                </div>

                <div>
                  <Building2 size={18} />
                  <span>Institution</span>
                  <strong>
                    {ocrData.institution || 'Not detected'}
                  </strong>
                </div>
              </div>

              <div className="verify-review-note">
                OCR information is preliminary. The official
                backend record and RSA signature determine
                whether this certificate is authentic.
              </div>

              <div className="verify-button-row">
                <button
                  type="button"
                  className="verify-secondary-btn"
                  onClick={resetVerification}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="verify-primary-btn"
                  onClick={verifyCertificate}
                  disabled={isVerifying}
                >
                  <ShieldCheck size={18} />
                  Verify authenticity
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {stage === 'result' && result && (
            <AnimatePresence mode="wait">
              <motion.div
                className="verify-result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {isVerified ? (
                  <>
                    <div className="verify-result-icon success">
                      <ShieldCheck size={42} />
                    </div>

                    <span className="verify-result-label">
                      AUTHENTICATION SUCCESSFUL
                    </span>

                    <h2>Certificate Verified</h2>

                    <p>
                      {result.message ||
                        'The official certificate record passed the configured verification checks.'}
                    </p>

                    <div className="verify-result-details">
                      <div>
                        <span>Certificate ID</span>
                        <strong>
                          {result.certificate?.id ||
                            result.certificateId}
                        </strong>
                      </div>

                      <div>
                        <span>Student</span>
                        <strong>
                          {result.certificate?.student_name ||
                            ocrData?.studentName ||
                            'Not available'}
                        </strong>
                      </div>

                      <div>
                        <span>Course</span>
                        <strong>
                          {result.certificate?.course || 'Not available'}
                        </strong>
                      </div>

                      <div>
                        <span>Institution</span>
                        <strong>
                          {result.certificate?.institution ||
                            'Not available'}
                        </strong>
                      </div>

                      <div>
                        <span>RSA / SHA-256 verification</span>
                        <strong>Backend reported VERIFIED</strong>
                      </div>

                      <div>
                        <span>Blockchain registration</span>
                        <strong>
                          {result.blockchainRegistered === true
                            ? 'Registered'
                            : result.blockchainEnabled === false ||
                              result.blockchainRegistered === false
                              ? 'Not registered / unavailable'
                              : 'Not confirmed'}
                        </strong>
                      </div>

                      {result.certificate?.blockchain_tx_hash && (
                        <div>
                          <span>Blockchain transaction</span>
                          <strong className="verify-hash">
                            {result.certificate.blockchain_tx_hash}
                          </strong>
                        </div>
                      )}

                      {result.uploadedPdfSha256 && (
                        <div>
                          <span>Uploaded PDF audit SHA-256</span>
                          <strong className="verify-hash">
                            {result.uploadedPdfSha256}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="verify-result-warning">
                      <CheckCircle2 size={18} />
                      <span>
                        The backend returned a verified certificate
                        record. Blockchain status is shown separately.
                      </span>
                    </div>

                    <button
                      type="button"
                      className="verify-primary-btn"
                      onClick={continueToRecord}
                    >
                      View certificate record
                      <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="verify-result-icon failure">
                      {result.status === 'id_mismatch' ? (
                        <ShieldAlert size={42} />
                      ) : (
                        <ShieldX size={42} />
                      )}
                    </div>

                    <span className="verify-result-label failure">
                      VERIFICATION UNSUCCESSFUL
                    </span>

                    <h2>
                      {result.status === 'id_mismatch'
                        ? 'Certificate ID Mismatch'
                        : result.status === 'not_found'
                          ? 'Certificate Not Found'
                          : result.status === 'tampered'
                            ? 'Document Integrity Failed'
                            : result.status === 'signature_invalid'
                              ? 'Invalid Issuer Signature'
                              : result.status === 'revoked'
                                ? 'Certificate Revoked'
                                : result.status === 'not_registered'
                                  ? 'Blockchain Registration Missing'
                                  : 'Verification Failed'}
                    </h2>

                    <p>
                      {result.message ||
                        'AuthNode could not authenticate this certificate.'}
                    </p>

                    {result.status === 'id_mismatch' && (
                      <div className="verify-result-details">
                        <div>
                          <span>Entered ID</span>
                          <strong>{result.enteredId}</strong>
                        </div>

                        <div>
                          <span>OCR detected ID</span>
                          <strong>{result.detectedId}</strong>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="verify-secondary-btn"
                      onClick={resetVerification}
                    >
                      <RefreshCw size={17} />
                      Try another certificate
                    </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}

        </section>

        <section className="verify-security">
          <div className="verify-security-title">
            <ShieldCheck size={21} />
            <strong>How AuthNode protects certificate authenticity</strong>
          </div>

          <div className="verify-security-grid">
            <div>
              <Search size={20} />
              <strong>OCR extraction</strong>
              <span>Reads the certificate information.</span>
            </div>

            <div>
              <FileText size={20} />
              <strong>Official record</strong>
              <span>Checks the registered certificate.</span>
            </div>

            <div>
              <Fingerprint size={20} />
              <strong>SHA-256 and RSA</strong>
              <span>Checks document integrity and signature.</span>
            </div>

            <div>
              <ShieldCheck size={20} />
              <strong>Blockchain</strong>
              <span>Displays registration evidence separately.</span>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
