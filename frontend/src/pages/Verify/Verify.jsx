import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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

import { useAuth } from '../../context/AuthContext'

import './Verify.css'


/* ============================================================
   HELPERS
============================================================ */

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}


function normalizeId(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}


function extractCertificateId(text) {
  if (!text) return ''

  const patterns = [
    /certificate\s*(?:id|no|number)\s*[:#-]?\s*([a-z0-9-]{6,})/i,
    /cert(?:ificate)?\s*id\s*[:#-]?\s*([a-z0-9-]{6,})/i,
    /\bid\s*[:#-]\s*([a-z0-9-]{6,})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return ''
}


function extractStudentName(text) {
  if (!text) return ''

  const patterns = [
    /student\s*name\s*[:\-]\s*([^\n]+)/i,
    /recipient\s*[:\-]\s*([^\n]+)/i,
    /awarded\s*to\s*[:\-]?\s*([^\n]+)/i,
    /presented\s*to\s*[:\-]?\s*([^\n]+)/i,
    /certificate\s*(?:is\s*)?(?:awarded|issued)\s*to\s*[:\-]?\s*([^\n]+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return match[1]
        .replace(/[|]/g, '')
        .trim()
    }
  }

  return ''
}


/* ============================================================
   COMPONENT
============================================================ */

export default function Verify() {
  const navigate = useNavigate()
  const { id: idFromRoute } = useParams()
  const location = useLocation()

  const fileInputRef = useRef(null)

  const { user, loading } = useAuth()

  const [stage, setStage] = useState('upload')

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const [ocrText, setOcrText] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)

  const [extractedId, setExtractedId] = useState('')
  const [extractedName, setExtractedName] = useState('')

  const [certificateId, setCertificateId] = useState(
    idFromRoute || ''
  )

  const [studentName, setStudentName] = useState(
    user?.name || ''
  )

  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [isProcessing, setIsProcessing] = useState(false)


  /* ============================================================
     AUTH
  ============================================================ */

  useEffect(() => {
    if (loading) return

    if (!user || user.role !== 'student') {
      navigate('/auth?role=student')
    }
  }, [user, loading, navigate])


  /* ============================================================
     ROUTE CERTIFICATE ID
  ============================================================ */

  useEffect(() => {
    if (idFromRoute) {
      setCertificateId(idFromRoute)
    }
  }, [idFromRoute])


  /* ============================================================
     USER NAME
  ============================================================ */

  useEffect(() => {
    if (user?.name && !studentName) {
      setStudentName(user.name)
    }
  }, [user, studentName])


  /* ============================================================
     FILE CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])


  /* ============================================================
     FILE SELECT
  ============================================================ */

  function handleFileSelect(event) {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setResult(null)
    setOcrText('')
    setExtractedId('')
    setExtractedName('')

    if (!file.type.startsWith('image/')) {
      setError(
        'Please upload an image file such as PNG, JPG, JPEG or WEBP.'
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        'Image size must be less than 10 MB.'
      )
      return
    }

    setSelectedFile(file)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    setStage('ready')
  }


  /* ============================================================
     OCR
  ============================================================ */

  async function readCertificateImage() {
    if (!selectedFile) {
      setError('Please upload your certificate email image first.')
      return
    }

    setError('')
    setResult(null)
    setStage('scanning')
    setIsProcessing(true)
    setOcrProgress(0)

    let worker = null

    try {
      worker = await createWorker('eng')

      await worker.setParameters({
        preserve_interword_spaces: '1',
      })

      const recognition = await worker.recognize(
        selectedFile,
        {
          logger: (message) => {
            if (
              message.status === 'recognizing text' &&
              typeof message.progress === 'number'
            ) {
              setOcrProgress(
                Math.round(message.progress * 100)
              )
            }
          },
        }
      )

      const text = recognition?.data?.text || ''

      setOcrText(text)

      const detectedId = extractCertificateId(text)
      const detectedName = extractStudentName(text)

      setExtractedId(detectedId)
      setExtractedName(detectedName)

      setStage('review')

    } catch (err) {
      console.error(
        'OCR failed:',
        err
      )

      setError(
        'Could not read this image. Please upload a clearer screenshot of the certificate email.'
      )

      setStage('ready')

    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch {
          // Worker cleanup failed silently.
        }
      }

      setIsProcessing(false)
    }
  }


  /* ============================================================
     VERIFY OCR DATA
  ============================================================ */

  function verifyExtractedCertificate() {
    setError('')

    const enteredId = normalizeId(
      certificateId
    )

    const detectedId = normalizeId(
      extractedId
    )

    const enteredName = normalizeText(
      studentName
    )

    const detectedName = normalizeText(
      extractedName
    )


    /* ----------------------------------------------------------
       CERTIFICATE ID CHECK
    ---------------------------------------------------------- */

    if (!detectedId) {
      setError(
        'We could not find a Certificate ID in the uploaded image. Please upload a clearer image where the Certificate ID is visible.'
      )

      return
    }


    if (!enteredId) {
      setError(
        'Please enter the Certificate ID shown in the certificate email.'
      )

      return
    }


    if (detectedId !== enteredId) {
      setResult({
        status: 'tampered',
        message:
          'The Certificate ID read from the uploaded image does not match the Certificate ID you entered.',
      })

      setStage('result')

      return
    }


    /* ----------------------------------------------------------
       NAME CHECK
    ---------------------------------------------------------- */

    if (
      detectedName &&
      enteredName &&
      !namesMatch(
        detectedName,
        enteredName
      )
    ) {
      setResult({
        status: 'name_mismatch',
        message:
          'The student name read from the uploaded email does not match the student name entered for verification.',
      })

      setStage('result')

      return
    }


    /* ----------------------------------------------------------
       SUCCESS
    ---------------------------------------------------------- */

    setResult({
      status: 'verified',
      certificateId: enteredId,
      studentName:
        extractedName || studentName,
      extractedName,
      extractedId,
      message:
        'The certificate image contains the Certificate ID you provided.',
    })

    setStage('result')
  }


  function namesMatch(nameA, nameB) {
    const a = normalizeText(nameA)
    const b = normalizeText(nameB)

    if (!a || !b) return true

    if (a === b) return true

    const aParts = a.split(' ')
    const bParts = b.split(' ')

    const commonWords = aParts.filter(
      (part) => bParts.includes(part)
    )

    return (
      commonWords.length >=
      Math.min(aParts.length, bParts.length) * 0.7
    )
  }


  /* ============================================================
     CONTINUE TO CERTIFICATE RECORD
  ============================================================ */

  function continueToRecord() {
    if (
      !result ||
      result.status !== 'verified'
    ) {
      return
    }

    navigate(
      '/certificate-record',
      {
        state: {
          verifiedCertificate: {
            certificateId:
              result.certificateId,

            studentName:
              result.studentName,

            extractedName:
              result.extractedName,

            extractedId:
              result.extractedId,

            verificationMethod:
              'EMAIL_IMAGE_OCR',

            verifiedAt:
              new Date().toISOString(),

            sourceFileName:
              selectedFile?.name || '',
          },
        },
      }
    )
  }


  /* ============================================================
     RESET
  ============================================================ */

  function resetVerification() {
    setStage('upload')
    setSelectedFile(null)
    setPreviewUrl('')
    setOcrText('')
    setOcrProgress(0)
    setExtractedId('')
    setExtractedName('')
    setResult(null)
    setError('')
    setCertificateId(idFromRoute || '')
    setStudentName(user?.name || '')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  /* ============================================================
     LOADING AUTH
  ============================================================ */

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


  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="page">

      <div className="container">

        <div className="page-header">

          <span className="eyebrow">
            Verify
          </span>

          <h1>
            Verify your certificate
          </h1>

          <p>
            Upload the certificate email image you received.
            AuthNode will read the Certificate ID and student
            name from the image before allowing you to create
            your certificate record.
          </p>

        </div>


        <div className="verify-layout">

          <AnimatePresence mode="wait">


            {/* ==================================================
                UPLOAD
            ================================================== */}

            {(stage === 'upload' ||
              stage === 'ready') && (

              <motion.div
                key="upload"
                className="card verify-form"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
              >

                <div className="form-group">

                  <label>
                    Certificate ID
                  </label>

                  <input
                    value={certificateId}
                    onChange={(e) =>
                      setCertificateId(
                        e.target.value
                      )
                    }
                    placeholder="e.g. CERT-9F3A21B4"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Student name
                  </label>

                  <input
                    value={studentName}
                    onChange={(e) =>
                      setStudentName(
                        e.target.value
                      )
                    }
                    placeholder="Enter the name shown on the certificate"
                  />

                </div>


                <div
                  className="verify-upload-area"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >

                  {previewUrl ? (

                    <img
                      src={previewUrl}
                      alt="Uploaded certificate email"
                      className="verify-image-preview"
                    />

                  ) : (

                    <>

                      <div className="verify-upload-icon">
                        <Upload size={30} />
                      </div>

                      <h3>
                        Upload certificate email
                      </h3>

                      <p>
                        Click here to select the image
                        received after certificate completion.
                      </p>

                      <span>
                        PNG, JPG, JPEG or WEBP · Max 10 MB
                      </span>

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

                      <strong>
                        {selectedFile.name}
                      </strong>

                      <span>
                        {(
                          selectedFile.size /
                          1024 /
                          1024
                        ).toFixed(2)}{' '}
                        MB
                      </span>

                    </div>

                  </div>

                )}


                {error && (

                  <div className="verify-error">

                    <AlertTriangle size={17} />

                    <span>
                      {error}
                    </span>

                  </div>

                )}


                <button
                  type="button"
                  className="btn btn-primary verify-submit"
                  onClick={readCertificateImage}
                  disabled={
                    !selectedFile ||
                    isProcessing
                  }
                >

                  {isProcessing ? (

                    <>
                      <LoaderCircle
                        size={18}
                        className="spin"
                      />

                      Reading image {ocrProgress}%
                    </>

                  ) : (

                    <>
                      <ScanLine size={18} />

                      Read certificate image
                    </>

                  )}

                </button>

              </motion.div>

            )}


            {/* ==================================================
                SCANNING
            ================================================== */}

            {stage === 'scanning' && (

              <motion.div
                key="scanning"
                className="card verify-scanning"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
              >

                <motion.div
                  className="scan-line"
                  animate={{
                    top: [
                      '10%',
                      '90%',
                      '10%',
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    ease: 'easeInOut',
                  }}
                />

                <ScanLine
                  size={46}
                  strokeWidth={1.3}
                />

                <h3>
                  Reading certificate email
                </h3>

                <p>
                  OCR is looking for the student name
                  and Certificate ID.
                </p>

                <strong>
                  {ocrProgress}%
                </strong>

              </motion.div>

            )}


            {/* ==================================================
                REVIEW
            ================================================== */}

            {stage === 'review' && (

              <motion.div
                key="review"
                className="card verify-review"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
              >

                <div className="verify-review-header">

                  <FileImage size={24} />

                  <div>

                    <h2>
                      Information detected
                    </h2>

                    <p>
                      Review what AuthNode read from
                      your uploaded image.
                    </p>

                  </div>

                </div>


                <div className="verify-detected-grid">

                  <div className="verify-detected-item">

                    <Hash size={18} />

                    <div>

                      <span>
                        Certificate ID
                      </span>

                      <strong>
                        {extractedId ||
                          'Not detected'}
                      </strong>

                    </div>

                  </div>


                  <div className="verify-detected-item">

                    <User size={18} />

                    <div>

                      <span>
                        Student name
                      </span>

                      <strong>
                        {extractedName ||
                          'Not detected'}
                      </strong>

                    </div>

                  </div>

                </div>


                {!extractedId && (

                  <div className="verify-warning">

                    <AlertTriangle size={17} />

                    <span>
                      Certificate ID was not detected.
                      Upload a clearer image where the
                      Certificate ID is visible.
                    </span>

                  </div>

                )}


                {error && (

                  <div className="verify-error">

                    <AlertTriangle size={17} />

                    <span>
                      {error}
                    </span>

                  </div>

                )}


                <div className="verify-actions">

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={resetVerification}
                  >
                    Upload another image
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={verifyExtractedCertificate}
                  >

                    <ShieldCheck size={17} />

                    Verify information

                  </button>

                </div>

              </motion.div>

            )}


            {/* ==================================================
                RESULT
            ================================================== */}

            {stage === 'result' &&
              result && (

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
                  transition={{
                    duration: 0.3,
                  }}
                >


                  {result.status ===
                    'verified' && (

                    <>

                      <ShieldCheck
                        size={58}
                        strokeWidth={1.4}
                      />

                      <h2>
                        Certificate information verified
                      </h2>

                      <p className="verify-result-sub">
                        The Certificate ID extracted
                        from your uploaded email matches
                        the Certificate ID you provided.
                      </p>


                      <div className="verify-result-details">

                        <div>
                          <span>
                            Certificate ID
                          </span>

                          <strong>
                            {result.certificateId}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Student
                          </span>

                          <strong>
                            {result.studentName}
                          </strong>
                        </div>

                      </div>


                      <div className="verify-success-note">

                        <CheckCircle2 size={17} />

                        <span>
                          You can now create your
                          Certificate Record.
                        </span>

                      </div>


                      <button
                        type="button"
                        className="btn btn-primary verify-again"
                        onClick={continueToRecord}
                      >

                        Continue to Certificate Record

                        <ArrowRight size={17} />

                      </button>

                    </>

                  )}


                  {result.status ===
                    'tampered' && (

                    <>

                      <ShieldX
                        size={58}
                        strokeWidth={1.4}
                      />

                      <h2>
                        Certificate ID does not match
                      </h2>

                      <p className="verify-result-sub">
                        The Certificate ID detected
                        inside the uploaded image is
                        different from the ID you entered.
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


                  {result.status ===
                    'name_mismatch' && (

                    <>

                      <ShieldX
                        size={58}
                        strokeWidth={1.4}
                      />

                      <h2>
                        Name does not match
                      </h2>

                      <p className="verify-result-sub">
                        The student name detected in the
                        uploaded email does not match
                        the name entered for verification.
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

                </motion.div>

              )}

          </AnimatePresence>

        </div>


        {/* ======================================================
            SECURITY INFORMATION
        ====================================================== */}

        <div className="verify-security-note">

          <ShieldQuestion size={20} />

          <div>

            <strong>
              How this verification works
            </strong>

            <p>
              AuthNode reads the uploaded certificate
              email image using OCR and extracts the
              Certificate ID and student name. In the
              backend phase, these values will also be
              checked against the official certificate
              database and blockchain proof.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}