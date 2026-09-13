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
  Mail,
} from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { useAuth } from '../../context/AuthContext'
import './Verify.css'

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'
).replace(/\/+$/, '')

const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeId(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function namesMatch(nameA, nameB) {
  const a = normalizeText(nameA)
  const b = normalizeText(nameB)

  if (!a || !b) return false
  if (a === b || a.includes(b) || b.includes(a)) return true

  const aParts = [...new Set(a.split(' ').filter(Boolean))]
  const bParts = [...new Set(b.split(' ').filter(Boolean))]

  if (!aParts.length || !bParts.length) return false

  const common = aParts.filter((part) => bParts.includes(part))

  return common.length >= Math.min(aParts.length, bParts.length) * 0.7
}

function preprocessOcrText(rawText = '') {
  let text = String(rawText || '')

  text = text.replace(
    /([A-Za-z0-9]+-)\s*[\r\n]+\s*([A-Za-z0-9]+)/g,
    '$1$2'
  )

  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '')
}

function extractCertificateId(rawText = '') {
  const text = preprocessOcrText(rawText)

  if (!text) return ''

  const explicitPatterns = [
    /certificate\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+|[A-Za-z0-9]{6,})/i,
    /cert\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+|[A-Za-z0-9]{6,})/i,
    /certificate\s*#\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+|[A-Za-z0-9]{6,})/i,
    /credential\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Za-z0-9_-]{6,40})/i,
    /verification\s*(?:id|no|number|code)\s*[:#-]?\s*([A-Za-z0-9_-]{6,40})/i,
  ]

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      const candidate = match[1]
        .replace(/[|_*]/g, '')
        .trim()

      if (
        candidate.length >= 6 &&
        !/^(intern|details|verification|name|role|click)$/i.test(
          candidate
        )
      ) {
        return candidate
      }
    }
  }

  const multiSegmentMatches = text.match(
    /\b([A-Z0-9]{2,10}(?:-[A-Z0-9]{2,12}){2,5})\b/gi
  )

  if (multiSegmentMatches?.length) {
    for (const candidate of multiSegmentMatches) {
      if (
        !/^(intern|student|employee|user)[-_ ]?id/i.test(
          candidate
        )
      ) {
        return candidate.trim()
      }
    }
  }

  const fallback = text.match(
    /\b([A-Z]{2,10}-[0-9A-Z]{4,20}(?:-[0-9A-Z]{2,20})*)\b/i
  )

  return fallback?.[1]?.trim() || ''
}

function cleanName(value = '') {
  return String(value)
    .replace(/[|*_#]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(
      /\s+(?:for|has|in recognition|on|who|with|at|from|successfully|role|intern|certificate)\b.*$/i,
      ''
    )
    .replace(/[,.:;]+$/, '')
    .trim()
}

function isReasonableName(value = '') {
  const name = cleanName(value)

  if (name.length < 2 || name.length > 80) return false

  const parts = name.split(/\s+/).filter(Boolean)

  if (parts.length < 2) return false

  return parts.every((part) =>
    /^[A-Za-z][A-Za-z'.-]*$/.test(part)
  )
}

function extractStudentName(rawText = '') {
  const text = preprocessOcrText(rawText)

  if (!text) return ''

  const patterns = [
    /(?:intern|student|candidate|recipient|learner|participant)\s*name\s*[:\-]?\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /(?:intern|student|candidate|recipient)\s*[:\-]\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /(?:awarded|presented|conferred|granted|issued)\s+to\s*[:\-]?\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /this\s+(?:is\s+to\s+)?certif(?:y|ies)\s+that\s+([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /\bname\s*[:\-]\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
    /(?:dear|congratulations|hello|hi)\s+([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,5})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      const candidate = cleanName(match[1])

      if (isReasonableName(candidate)) {
        return candidate
      }
    }
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i]

    if (
      /(?:intern|student|candidate|recipient|learner|participant)\s*name/i.test(
        current
      )
    ) {
      const sameLine = cleanName(
        current.replace(
          /.*?(?:intern|student|candidate|recipient|learner|participant)\s*name\s*[:\-]?\s*/i,
          ''
        )
      )

      if (isReasonableName(sameLine)) {
        return sameLine
      }

      const nextLine = cleanName(lines[i + 1] || '')

      if (isReasonableName(nextLine)) {
        return nextLine
      }
    }
  }

  return ''
}

function extractEmail(rawText = '') {
  const match = String(rawText).match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  )

  return match?.[0]?.toLowerCase().trim() || ''
}

function extractCourse(rawText = '') {
  const text = preprocessOcrText(rawText)

  const patterns = [
    /(?:course|program|training|internship|certification)\s*(?:name|title)?\s*[:\-]\s*([^\n]{3,100})/i,
    /(?:completed|successfully completed|completed the)\s+([A-Za-z0-9 .&'/-]{3,100})(?:\s+course|\s+program)?/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      const value = match[1]
        .replace(/\s+/g, ' ')
        .replace(/[|*_]+/g, '')
        .trim()

      if (value.length >= 3 && value.length <= 100) {
        return value
      }
    }
  }

  return ''
}

function extractInstitution(rawText = '') {
  const text = preprocessOcrText(rawText)

  const patterns = [
    /(?:institution|issuer|issued\s+by|organization|university|college)\s*[:\-]\s*([^\n]{3,120})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return match[1]
        .replace(/\s+/g, ' ')
        .replace(/[|*_]+/g, '')
        .trim()
    }
  }

  return ''
}

async function runOcr(file, onProgress) {
  let worker = null

  try {
    worker = await createWorker('eng', 1, {
      logger: (message) => {
        if (
          message.status === 'recognizing text' &&
          typeof message.progress === 'number'
        ) {
          onProgress(Math.round(message.progress * 100))
        }
      },
    })

    await worker.setParameters({
      preserve_interword_spaces: '1',
    })

    const recognition = await worker.recognize(file)

    return recognition?.data?.text || ''
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch {
        // Ignore OCR worker cleanup errors.
      }
    }
  }
}

function parseEmailDocument(text) {
  return {
    studentName: extractStudentName(text),
    studentEmail: extractEmail(text),
    certificateId: extractCertificateId(text),
    course: extractCourse(text),
    institution: extractInstitution(text),
  }
}

function parseCertificateDocument(text) {
  return {
    studentName: extractStudentName(text),
    studentEmail: extractEmail(text),
    certificateId: extractCertificateId(text),
    course: extractCourse(text),
    institution: extractInstitution(text),
  }
}

export default function Verify() {
  const navigate = useNavigate()
  const { id: idFromRoute } = useParams()
  const { user, loading } = useAuth()

  const emailInputRef = useRef(null)
  const certificateInputRef = useRef(null)

  const [stage, setStage] = useState('upload')

  const [emailFile, setEmailFile] = useState(null)
  const [certificateFile, setCertificateFile] = useState(null)

  const [emailPreviewUrl, setEmailPreviewUrl] = useState('')
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState('')

  const [emailOcrText, setEmailOcrText] = useState('')
  const [certificateOcrText, setCertificateOcrText] = useState('')

  const [emailData, setEmailData] = useState(null)
  const [certificateData, setCertificateData] = useState(null)

  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrDocument, setOcrDocument] = useState('')

  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user || user.role !== 'student') {
      navigate('/auth?role=student')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    return () => {
      if (emailPreviewUrl) {
        URL.revokeObjectURL(emailPreviewUrl)
      }

      if (certificatePreviewUrl) {
        URL.revokeObjectURL(certificatePreviewUrl)
      }
    }
  }, [emailPreviewUrl, certificatePreviewUrl])

  function validateImage(file) {
    if (!file) return 'Please select an image.'

    if (!IMAGE_TYPES.includes(file.type)) {
      return 'Please upload PNG, JPG, JPEG or WEBP.'
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'Each image must be smaller than 10 MB.'
    }

    return ''
  }

  function handleEmailSelect(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const validationError = validateImage(file)

    if (validationError) {
      setError(validationError)
      return
    }

    if (emailPreviewUrl) {
      URL.revokeObjectURL(emailPreviewUrl)
    }

    setEmailFile(file)
    setEmailPreviewUrl(URL.createObjectURL(file))

    setEmailOcrText('')
    setEmailData(null)
    setCertificateData(null)
    setResult(null)
    setError('')
    setStage('ready')
  }

  function handleCertificateSelect(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const validationError = validateImage(file)

    if (validationError) {
      setError(validationError)
      return
    }

    if (certificatePreviewUrl) {
      URL.revokeObjectURL(certificatePreviewUrl)
    }

    setCertificateFile(file)
    setCertificatePreviewUrl(URL.createObjectURL(file))

    setCertificateOcrText('')
    setCertificateData(null)
    setResult(null)
    setError('')
    setStage('ready')
  }

  async function readBothDocuments() {
    if (!emailFile || !certificateFile) {
      setError(
        'Please upload both the certificate email image and the certificate image.'
      )
      return
    }

    setError('')
    setResult(null)
    setIsProcessing(true)
    setStage('scanning')
    setOcrProgress(0)

    try {
      setOcrDocument('email')

      const emailText = await runOcr(
        emailFile,
        (progress) => {
          setOcrProgress(Math.round(progress * 0.5))
        }
      )

      const parsedEmail = parseEmailDocument(emailText)

      setEmailOcrText(emailText)
      setEmailData(parsedEmail)

      setOcrDocument('certificate')

      const certificateText = await runOcr(
        certificateFile,
        (progress) => {
          setOcrProgress(50 + Math.round(progress * 0.5))
        }
      )

      const parsedCertificate =
        parseCertificateDocument(certificateText)

      setCertificateOcrText(certificateText)
      setCertificateData(parsedCertificate)

      setOcrProgress(100)

      if (!parsedEmail.certificateId) {
        setResult({
          status: 'ocr_failed',
          message:
            'Certificate ID could not be read from the certificate email image.',
        })
        setStage('result')
        return
      }

      if (!parsedCertificate.certificateId) {
        setResult({
          status: 'ocr_failed',
          message:
            'Certificate ID could not be read from the certificate image.',
        })
        setStage('result')
        return
      }

      if (!parsedEmail.studentName) {
        setResult({
          status: 'ocr_failed',
          message:
            'Student name could not be read from the certificate email image.',
        })
        setStage('result')
        return
      }

      if (!parsedCertificate.studentName) {
        setResult({
          status: 'ocr_failed',
          message:
            'Student name could not be read from the certificate image.',
        })
        setStage('result')
        return
      }

      setStage('review')
    } catch (err) {
      console.error('Two-document OCR failed:', err)

      setResult({
        status: 'ocr_failed',
        message:
          err?.message ||
          'Could not read one or both images. Please upload clearer images.',
      })

      setStage('result')
    } finally {
      setIsProcessing(false)
    }
  }

  async function verifyDocuments() {
    if (!emailData || !certificateData) {
      setError(
        'Please read both uploaded images before verification.'
      )
      return
    }

    if (
      normalizeId(emailData.certificateId) !==
      normalizeId(certificateData.certificateId)
    ) {
      setResult({
        status: 'document_mismatch',
        message:
          'The Certificate ID in the email and certificate image do not match.',
        emailCertificateId: emailData.certificateId,
        certificateId: certificateData.certificateId,
      })
      setStage('result')
      return
    }

    if (
      !namesMatch(
        emailData.studentName,
        certificateData.studentName
      )
    ) {
      setResult({
        status: 'document_mismatch',
        message:
          'The student name in the email and certificate image do not match.',
        emailName: emailData.studentName,
        certificateName: certificateData.studentName,
      })
      setStage('result')
      return
    }

    setError('')
    setResult(null)
    setIsVerifying(true)

    try {
      const response = await fetch(
        `${API_BASE}/certificates/verify-documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: emailData,
            certificate: certificateData,
          }),
        }
      )

      let data = null

      try {
        data = await response.json()
      } catch {
        throw new Error(
          `Verification server returned HTTP ${response.status}.`
        )
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          data?.message ||
          `Verification server returned HTTP ${response.status}.`
        )
      }

      if (data.status === 'verified') {
        if (!data.certificate) {
          throw new Error(
            'The backend verified the certificate but did not return its official record.'
          )
        }

        setResult({
          status: 'verified',
          certificate: data.certificate,
          certificateId:
            data.certificateId || data.certificate.id,
          studentName:
            data.certificate.student_name,
          message:
            data.message ||
            'Certificate verified successfully.',
          checks: data.checks || {},
          emailData,
          certificateData,
        })

        setStage('result')
        return
      }

      setResult({
        status: data.status || 'network_error',
        certificate: data.certificate || null,
        certificateId:
          data.certificateId ||
          certificateData.certificateId,
        message:
          data.message ||
          'The certificate could not be verified.',
        detectedName:
          data.detectedName ||
          certificateData.studentName,
        officialName:
          data.officialName ||
          data.certificate?.student_name,
        emailName: data.emailName,
        certificateName: data.certificateName,
        reason: data.reason,
      })

      setStage('result')
    } catch (err) {
      console.error('Backend document verification failed:', err)

      setResult({
        status: 'network_error',
        certificateId:
          certificateData?.certificateId || '',
        message:
          err?.message ||
          'AuthNode could not connect to the verification server.',
      })

      setStage('result')
    } finally {
      setIsVerifying(false)
    }
  }

  function continueToRecord() {
    if (
      !result ||
      result.status !== 'verified' ||
      !result.certificate
    ) {
      return
    }

    const certificate = result.certificate

    navigate('/certificate-record', {
      state: {
        verifiedCertificate: {
          certificateId:
            certificate.id ||
            result.certificateId,

          studentName:
            certificate.student_name ||
            result.studentName,

          studentEmail:
            certificate.student_email || '',

          courseName:
            certificate.course || '',

          certificateTitle:
            certificate.certificate_title ||
            certificate.course ||
            'Certificate of Completion',

          issuerName:
            certificate.institution ||
            'AuthNode Institution',

          issuerId:
            certificate.institution_id || '',

          issuedAt:
            certificate.issue_date || '',

          certificateHash:
            certificate.hash || '',

          status: 'VERIFIED',

          verificationType:
            'TWO_DOCUMENT_OCR_SHA256_RSA_DATABASE',

          verifiedAt: new Date().toISOString(),

          sourceFileName:
            certificateFile?.name || '',

          emailSourceFileName:
            emailFile?.name || '',

          extractedName:
            certificateData?.studentName || '',

          extractedId:
            certificateData?.certificateId || '',

          emailExtractedName:
            emailData?.studentName || '',

          emailExtractedId:
            emailData?.certificateId || '',

          emailExtractedAddress:
            emailData?.studentEmail || '',
        },
      },
    })
  }

  function resetVerification() {
    if (emailPreviewUrl) {
      URL.revokeObjectURL(emailPreviewUrl)
    }

    if (certificatePreviewUrl) {
      URL.revokeObjectURL(certificatePreviewUrl)
    }

    setStage('upload')

    setEmailFile(null)
    setCertificateFile(null)

    setEmailPreviewUrl('')
    setCertificatePreviewUrl('')

    setEmailOcrText('')
    setCertificateOcrText('')

    setEmailData(null)
    setCertificateData(null)

    setOcrProgress(0)
    setOcrDocument('')

    setError('')
    setResult(null)

    setIsProcessing(false)
    setIsVerifying(false)

    if (emailInputRef.current) {
      emailInputRef.current.value = ''
    }

    if (certificateInputRef.current) {
      certificateInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="dashboard-loading">
            Checking your account...
          </p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'student') {
    return null
  }

  return (
    <div className="page">
      <div className="container">

        <div className="page-header">
          <span className="eyebrow">Verify</span>

          <h1>Verify your certificate</h1>

          <p>
            Upload both the certificate email and the certificate
            image. AuthNode compares both documents, checks the
            official SQLite record, and verifies cryptographic
            integrity before allowing the certificate to continue.
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

                <div className="form-group">
                  <label>Certificate ID (optional)</label>

                  <input
                    value={idFromRoute || ''}
                    readOnly
                    placeholder="Detected automatically from both images"
                  />
                </div>

                <div className="form-group">
                  <label>Student name</label>

                  <input
                    value={
                      certificateData?.studentName ||
                      emailData?.studentName ||
                      ''
                    }
                    readOnly
                    placeholder="Detected automatically from both images"
                  />
                </div>

                <div
                  className="verify-upload-area"
                  onClick={() =>
                    emailInputRef.current?.click()
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {emailPreviewUrl ? (
                    <img
                      src={emailPreviewUrl}
                      alt="Uploaded certificate email"
                      className="verify-image-preview"
                    />
                  ) : (
                    <>
                      <div className="verify-upload-icon">
                        <Mail size={30} />
                      </div>

                      <h3>
                        Upload certificate email
                      </h3>

                      <p>
                        Upload the email/screenshot you received
                        after the certificate was issued.
                      </p>

                      <span>
                        PNG, JPG, JPEG or WEBP · Max 10 MB
                      </span>
                    </>
                  )}
                </div>

                <input
                  ref={emailInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleEmailSelect}
                  hidden
                />

                {emailFile && (
                  <div className="verify-file-info">
                    <FileImage size={18} />

                    <div>
                      <strong>{emailFile.name}</strong>

                      <span>
                        {(emailFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="verify-upload-area"
                  onClick={() =>
                    certificateInputRef.current?.click()
                  }
                  style={{
                    cursor: 'pointer',
                    marginTop: '16px',
                  }}
                >
                  {certificatePreviewUrl ? (
                    <img
                      src={certificatePreviewUrl}
                      alt="Uploaded certificate"
                      className="verify-image-preview"
                    />
                  ) : (
                    <>
                      <div className="verify-upload-icon">
                        <Upload size={30} />
                      </div>

                      <h3>
                        Upload certificate
                      </h3>

                      <p>
                        Upload the actual certificate image that
                        you want AuthNode to verify.
                      </p>

                      <span>
                        PNG, JPG, JPEG or WEBP · Max 10 MB
                      </span>
                    </>
                  )}
                </div>

                <input
                  ref={certificateInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleCertificateSelect}
                  hidden
                />

                {certificateFile && (
                  <div className="verify-file-info">
                    <FileImage size={18} />

                    <div>
                      <strong>
                        {certificateFile.name}
                      </strong>

                      <span>
                        {(certificateFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
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
                  onClick={readBothDocuments}
                  disabled={
                    !emailFile ||
                    !certificateFile ||
                    isProcessing
                  }
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="spin"
                      />

                      Reading documents {ocrProgress}%
                    </>
                  ) : (
                    <>
                      <ScanLine size={18} />

                      Read both documents
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
                  animate={{
                    top: ['10%', '90%', '10%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    ease: 'easeInOut',
                  }}
                />

                <ScanLine size={46} strokeWidth={1.3} />

                <h3>
                  Reading{' '}
                  {ocrDocument === 'email'
                    ? 'certificate email'
                    : 'certificate'}
                </h3>

                <p>
                  AuthNode is extracting information from both
                  uploaded documents.
                </p>

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
                    <h2>
                      Two-document information detected
                    </h2>

                    <p>
                      AuthNode will compare the email and
                      certificate before checking the official
                      database.
                    </p>
                  </div>
                </div>

                <div className="verify-detected-grid">

                  <div className="verify-detected-item">
                    <Mail size={18} />

                    <div>
                      <span>EMAIL</span>
                      <strong>
                        {emailData?.studentEmail ||
                          'Not detected'}
                      </strong>
                    </div>
                  </div>

                  <div className="verify-detected-item">
                    <Hash size={18} />

                    <div>
                      <span>EMAIL CERTIFICATE ID</span>
                      <strong>
                        {emailData?.certificateId ||
                          'Not detected'}
                      </strong>
                    </div>
                  </div>

                  <div className="verify-detected-item">
                    <Hash size={18} />

                    <div>
                      <span>CERTIFICATE ID</span>
                      <strong>
                        {certificateData?.certificateId ||
                          'Not detected'}
                      </strong>
                    </div>
                  </div>

                  <div className="verify-detected-item">
                    <User size={18} />

                    <div>
                      <span>EMAIL NAME</span>
                      <strong>
                        {emailData?.studentName ||
                          'Not detected'}
                      </strong>
                    </div>
                  </div>

                  <div className="verify-detected-item">
                    <User size={18} />

                    <div>
                      <span>CERTIFICATE NAME</span>
                      <strong>
                        {certificateData?.studentName ||
                          'Not detected'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>
                    Final security rule
                  </strong>

                  <p
                    style={{
                      margin: '5px 0 0',
                      opacity: 0.72,
                    }}
                  >
                    Matching the two images is not enough.
                    AuthNode will also verify the official
                    SQLite record, SHA-256 fingerprint and RSA
                    signature. A failed backend check can never
                    become VERIFIED.
                  </p>
                </div>

                {error && (
                  <div className="verify-error">
                    <AlertTriangle size={17} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="verify-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={resetVerification}
                    disabled={isVerifying}
                  >
                    Upload again
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={verifyDocuments}
                    disabled={
                      isVerifying ||
                      !emailData ||
                      !certificateData
                    }
                  >
                    {isVerifying ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="spin"
                        />

                        Checking AuthNode...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={17} />

                        Verify both documents
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
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{ duration: 0.3 }}
              >

                {result.status === 'verified' && (
                  <>
                    <ShieldCheck
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#10b981' }}
                    />

                    <h2>Certificate Verified</h2>

                    <p className="verify-result-sub">
                      {result.message}
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
                        <span>Student Name</span>

                        <strong>
                          {result.certificate?.student_name ||
                            result.studentName}
                        </strong>
                      </div>

                      {result.certificate?.student_email && (
                        <div>
                          <span>Email</span>

                          <strong>
                            {result.certificate.student_email}
                          </strong>
                        </div>
                      )}

                      {result.certificate?.course && (
                        <div>
                          <span>Course</span>

                          <strong>
                            {result.certificate.course}
                          </strong>
                        </div>
                      )}

                      {result.certificate?.institution && (
                        <div>
                          <span>Institution</span>

                          <strong>
                            {result.certificate.institution}
                          </strong>
                        </div>
                      )}

                      {result.certificate?.issue_date && (
                        <div>
                          <span>Issue Date</span>

                          <strong>
                            {result.certificate.issue_date}
                          </strong>
                        </div>
                      )}

                      <div>
                        <span>Verification Status</span>

                        <strong
                          style={{ color: '#10b981' }}
                        >
                          VERIFIED
                        </strong>
                      </div>
                    </div>

                    <div className="verify-success-note">
                      <CheckCircle2 size={17} />

                      <span>
                        Email Matched · Certificate Matched ·
                        Database Matched · SHA-256 Authenticated ·
                        RSA Signature Valid
                      </span>
                    </div>

                    <div
                      className="verify-actions"
                      style={{
                        marginTop: '20px',
                        width: '100%',
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={resetVerification}
                      >
                        Verify another
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary verify-again"
                        onClick={continueToRecord}
                      >
                        Continue to Certificate Record

                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </>
                )}

                {[
                  'document_mismatch',
                  'email_mismatch',
                  'course_mismatch',
                  'institution_mismatch',
                  'name_mismatch',
                  'id_mismatch',
                ].includes(result.status) && (
                  <>
                    <ShieldX
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#f59e0b' }}
                    />

                    <h2>
                      Documents Do Not Match
                    </h2>

                    <p className="verify-result-sub">
                      {result.message}
                    </p>

                    <div className="verify-result-details">
                      {result.emailCertificateId && (
                        <div>
                          <span>Email Certificate ID</span>
                          <strong>
                            {result.emailCertificateId}
                          </strong>
                        </div>
                      )}

                      {result.certificateId && (
                        <div>
                          <span>Certificate ID</span>
                          <strong>
                            {result.certificateId}
                          </strong>
                        </div>
                      )}

                      {result.emailName && (
                        <div>
                          <span>Email Name</span>
                          <strong>
                            {result.emailName}
                          </strong>
                        </div>
                      )}

                      {result.certificateName && (
                        <div>
                          <span>Certificate Name</span>
                          <strong>
                            {result.certificateName}
                          </strong>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost verify-again"
                      onClick={resetVerification}
                      style={{ marginTop: '20px' }}
                    >
                      Upload correct documents
                    </button>
                  </>
                )}

                {result.status === 'not_found' && (
                  <>
                    <ShieldX
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#ef4444' }}
                    />

                    <h2>
                      Certificate Not Found
                    </h2>

                    <p className="verify-result-sub">
                      {result.message}
                    </p>

                    <button
                      type="button"
                      className="btn btn-ghost verify-again"
                      onClick={resetVerification}
                    >
                      Try another certificate
                    </button>
                  </>
                )}

                {result.status === 'tampered' && (
                  <>
                    <ShieldX
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#ef4444' }}
                    />

                    <h2>
                      Certificate Integrity Failed
                    </h2>

                    <p className="verify-result-sub">
                      {result.message}
                    </p>

                    <button
                      type="button"
                      className="btn btn-ghost verify-again"
                      onClick={resetVerification}
                    >
                      Try another certificate
                    </button>
                  </>
                )}

                {result.status === 'revoked' && (
                  <>
                    <ShieldX
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#ef4444' }}
                    />

                    <h2>
                      Certificate Revoked
                    </h2>

                    <p className="verify-result-sub">
                      {result.message}
                    </p>

                    <button
                      type="button"
                      className="btn btn-ghost verify-again"
                      onClick={resetVerification}
                    >
                      Verify another
                    </button>
                  </>
                )}

                {result.status === 'ocr_failed' && (
                  <>
                    <AlertTriangle
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#f59e0b' }}
                    />

                    <h2>
                      Unable to Read Documents
                    </h2>

                    <p className="verify-result-sub">
                      {result.message}
                    </p>

                    <button
                      type="button"
                      className="btn btn-ghost verify-again"
                      onClick={resetVerification}
                    >
                      Upload clearer images
                    </button>
                  </>
                )}

                {result.status === 'network_error' && (
                  <>
                    <AlertTriangle
                      size={58}
                      strokeWidth={1.4}
                      style={{ color: '#ef4444' }}
                    />

                    <h2>
                      Verification Service Unavailable
                    </h2>

                    <p className="verify-result-sub">
                      {result.message}
                    </p>

                    <button
                      type="button"
                      className="btn btn-ghost verify-again"
                      onClick={() => setStage('review')}
                    >
                      Retry verification
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
            <strong>
              How AuthNode verifies your certificate
            </strong>

            <p>
              AuthNode OCRs the certificate email and the
              certificate separately. Their Certificate IDs and
              student identity are compared first. The backend
              then checks the official SQLite record, recomputes
              the SHA-256 certificate fingerprint and verifies the
              institution RSA signature. Only after every required
              check passes is the official certificate record
              allowed to continue to the Certificate Record page.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}