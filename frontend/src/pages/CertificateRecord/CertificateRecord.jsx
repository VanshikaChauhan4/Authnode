import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  Hash,
  LoaderCircle,
  Mail,
  Network,
  ShieldCheck,
  User,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

const certificatePageStyles = `
.certificate-record-page {
  min-height: 100vh;
  padding: 110px 0 90px;
  background:
    radial-gradient(circle at 50% 0%, rgba(201, 162, 39, 0.10), transparent 32%),
    radial-gradient(circle at 85% 30%, rgba(63, 174, 106, 0.05), transparent 24%),
    #080d18;
  color: #ededed;
}

.certificate-record-page * {
  box-sizing: border-box;
}

.certificate-record-container {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
}

.certificate-record-hero {
  max-width: 760px;
  margin-bottom: 42px;
}

.certificate-record-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #e8c158;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 15px;
}

.certificate-record-eyebrow::before {
  content: "";
  width: 24px;
  height: 1px;
  background: #c9a227;
}

.certificate-record-hero h1 {
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 4rem);
  font-weight: 600;
  line-height: 1.08;
  color: #ededed;
}

.certificate-record-hero h1 span {
  color: #e8c158;
}

.certificate-record-hero p {
  max-width: 690px;
  color: #b7b8ae;
  font-size: 1rem;
  line-height: 1.75;
}

.certificate-record-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, 0.9fr);
  gap: 24px;
  align-items: start;
}

.certificate-record-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(201, 162, 39, 0.17);
  border-radius: 20px;
  background:
    linear-gradient(
      180deg,
      rgba(237, 237, 227, 0.055),
      rgba(237, 237, 227, 0.018)
    );
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(14px);
}

.certificate-record-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      120deg,
      transparent 35%,
      rgba(232, 193, 88, 0.045),
      transparent 65%
    );
}

.certificate-form-card {
  padding: 34px;
}

.certificate-card-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
}

.certificate-card-heading-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: #e8c158;
  background: rgba(201, 162, 39, 0.10);
  border: 1px solid rgba(201, 162, 39, 0.2);
}

.certificate-card-heading h2 {
  margin: 0 0 4px;
  color: #ededed;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 600;
}

.certificate-card-heading p {
  margin: 0;
  color: #8f9189;
  font-size: 0.88rem;
}

.certificate-form-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.certificate-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.certificate-form-field.full {
  grid-column: 1 / -1;
}

.certificate-form-field label {
  color: #c7c8bf;
  font-size: 0.82rem;
  font-weight: 600;
}

.certificate-input-wrap {
  position: relative;
}

.certificate-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #8c8f88;
  pointer-events: none;
}

.certificate-form-field input,
.certificate-form-field select {
  width: 100%;
  height: 52px;
  padding: 0 16px 0 44px;
  border: 1px solid rgba(237, 237, 227, 0.10);
  border-radius: 11px;
  outline: none;
  background: rgba(4, 7, 13, 0.48);
  color: #ededed;
  font-size: 0.92rem;
  transition: 0.2s ease;
}

.certificate-form-field select {
  padding-left: 16px;
}

.certificate-form-field input::placeholder {
  color: #666b70;
}

.certificate-form-field input:focus,
.certificate-form-field select:focus {
  border-color: rgba(232, 193, 88, 0.72);
  box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.08);
}

.certificate-form-divider {
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 28px 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(201, 162, 39, 0.25),
    transparent
  );
}

.certificate-form-section-label {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
  color: #e8c158;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.certificate-submit-button {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 54px;
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: linear-gradient(120deg, #e8c158, #c9a227);
  color: #05070d;
  font-weight: 700;
  font-size: 0.94rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.certificate-submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(201, 162, 39, 0.24);
}

.certificate-submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.certificate-error {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  color: #ff9999;
  background: rgba(209, 67, 67, 0.08);
  border: 1px solid rgba(209, 67, 67, 0.25);
  font-size: 0.85rem;
}

.certificate-preview-card {
  padding: 28px;
  position: sticky;
  top: 92px;
}

.certificate-preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.certificate-preview-top h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: #ededed;
}

.certificate-preview-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border-radius: 999px;
  color: #e8c158;
  background: rgba(201, 162, 39, 0.09);
  border: 1px solid rgba(201, 162, 39, 0.18);
  font-size: 0.73rem;
  font-weight: 700;
}

.certificate-preview-document {
  position: relative;
  padding: 28px;
  border-radius: 17px;
  background:
    radial-gradient(circle at top right, rgba(201, 162, 39, 0.08), transparent 30%),
    linear-gradient(145deg, #111827, #090d16);
  border: 1px solid rgba(201, 162, 39, 0.18);
}

.certificate-preview-document::after {
  content: "";
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(201, 162, 39, 0.14);
  border-radius: 12px;
  pointer-events: none;
}

.certificate-preview-logo {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  color: #e8c158;
}

.certificate-preview-title {
  position: relative;
  z-index: 1;
  text-align: center;
}

.certificate-preview-title span {
  display: block;
  color: #8e9188;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.certificate-preview-title h2 {
  margin: 9px 0;
  color: #ededed;
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 500;
}

.certificate-preview-title p {
  margin: 0;
  color: #a9aaa3;
  font-size: 0.88rem;
}

.certificate-preview-name {
  position: relative;
  z-index: 1;
  margin: 26px 0 8px;
  text-align: center;
  color: #e8c158;
  font-family: var(--font-display);
  font-size: 1.55rem;
}

.certificate-preview-course {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  max-width: 290px;
  text-align: center;
  color: #b7b8ae;
  font-size: 0.86rem;
  line-height: 1.6;
}

.certificate-preview-meta {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 28px;
}

.certificate-preview-meta-item {
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.025);
}

.certificate-preview-meta-item span {
  display: block;
  margin-bottom: 5px;
  color: #777b75;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.certificate-preview-meta-item strong {
  color: #d8d8cf;
  font-size: 0.78rem;
  font-weight: 600;
  word-break: break-word;
}

.certificate-backend-note {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(63, 174, 106, 0.06);
  border: 1px solid rgba(63, 174, 106, 0.16);
}

.certificate-backend-note svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #3fae6a;
}

.certificate-backend-note strong {
  display: block;
  margin-bottom: 4px;
  color: #d7ddd8;
  font-size: 0.82rem;
}

.certificate-backend-note p {
  margin: 0;
  color: #929b94;
  font-size: 0.76rem;
  line-height: 1.6;
}

.certificate-result-card {
  margin-top: 24px;
  padding: 28px;
}

.certificate-result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #3fae6a;
  margin-bottom: 22px;
}

.certificate-result-header h3 {
  margin: 0;
  font-family: var(--font-display);
  color: #ededed;
}

.certificate-result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.certificate-result-item {
  padding: 13px;
  border-radius: 10px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.045);
}

.certificate-result-item.full {
  grid-column: 1 / -1;
}

.certificate-result-item span {
  display: block;
  color: #777b75;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.certificate-result-item strong {
  color: #deded6;
  font-size: 0.82rem;
  word-break: break-all;
}

.certificate-copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.certificate-copy-button {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #e8c158;
  border: 1px solid rgba(201,162,39,0.18);
  background: rgba(201,162,39,0.06);
}

@media (max-width: 900px) {
  .certificate-record-layout {
    grid-template-columns: 1fr;
  }

  .certificate-preview-card {
    position: static;
  }
}

@media (max-width: 650px) {
  .certificate-record-page {
    padding-top: 90px;
  }

  .certificate-record-container {
    width: min(100% - 28px, 1160px);
  }

  .certificate-form-card,
  .certificate-preview-card {
    padding: 22px;
  }

  .certificate-form-grid,
  .certificate-result-grid {
    grid-template-columns: 1fr;
  }

  .certificate-form-field.full,
  .certificate-result-item.full {
    grid-column: auto;
  }

  .certificate-preview-meta {
    grid-template-columns: 1fr;
  }
}
`

const initialForm = {
  studentName: '',
  studentEmail: '',
  courseName: '',
  certificateTitle: 'Certificate of Completion',
  issuedAt: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE',
  verificationType: 'BLOCKCHAIN_NATIVE',
}

export default function CertificateRecord() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [issuedCertificate, setIssuedCertificate] = useState(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'institution')) {
      navigate('/auth?role=institution')
    }
  }, [user, loading, navigate])

  if (loading || !user || user.role !== 'institution') {
    return null
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    setError('')

    try {
      const response = await api.issueCertificate({
        studentName: form.studentName,
        studentEmail: form.studentEmail,
        course: form.courseName,
        certificateTitle: form.certificateTitle,
        issueDate: form.issuedAt,
        status: form.status,
        verificationType: form.verificationType,
      })

      setIssuedCertificate(response.certificate)
    } catch (err) {
      setError(err.message || 'Unable to create certificate record.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyValue(value) {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard permission can fail in some browsers.
    }
  }

  return (
    <div className="certificate-record-page">
      <style>{certificatePageStyles}</style>

      <div className="certificate-record-container">
        <section className="certificate-record-hero">
          <div className="certificate-record-eyebrow">
            <ShieldCheck size={15} />
            AuthNode Issuer Console
          </div>

          <h1>
            Create a certificate
            <br />
            <span>record of truth.</span>
          </h1>

          <p>
            Every credential begins as a structured record. AuthNode sends the
            certificate to the backend, where its identity, issuer, fingerprint,
            verification data, and future blockchain proof are managed securely.
          </p>
        </section>

        <div className="certificate-record-layout">
          <form
            className="certificate-record-card certificate-form-card"
            onSubmit={handleSubmit}
          >
            <div className="certificate-card-heading">
              <div className="certificate-card-heading-icon">
                <FileCheck2 size={22} />
              </div>

              <div>
                <h2>Certificate information</h2>
                <p>Enter the credential details that will become the permanent record.</p>
              </div>
            </div>

            <div className="certificate-form-grid">
              <div className="certificate-form-field">
                <label>Student name</label>

                <div className="certificate-input-wrap">
                  <User size={17} className="certificate-input-icon" />

                  <input
                    value={form.studentName}
                    onChange={(e) =>
                      updateField('studentName', e.target.value)
                    }
                    placeholder="e.g. Vanshika Chauhan"
                    required
                  />
                </div>
              </div>

              <div className="certificate-form-field">
                <label>Student email</label>

                <div className="certificate-input-wrap">
                  <Mail size={17} className="certificate-input-icon" />

                  <input
                    type="email"
                    value={form.studentEmail}
                    onChange={(e) =>
                      updateField('studentEmail', e.target.value)
                    }
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              <div className="certificate-form-field full">
                <label>Certificate title</label>

                <div className="certificate-input-wrap">
                  <Award size={17} className="certificate-input-icon" />

                  <input
                    value={form.certificateTitle}
                    onChange={(e) =>
                      updateField('certificateTitle', e.target.value)
                    }
                    placeholder="Certificate of Completion"
                    required
                  />
                </div>
              </div>

              <div className="certificate-form-field full">
                <label>Course / credential name</label>

                <div className="certificate-input-wrap">
                  <GraduationCap
                    size={17}
                    className="certificate-input-icon"
                  />

                  <input
                    value={form.courseName}
                    onChange={(e) =>
                      updateField('courseName', e.target.value)
                    }
                    placeholder="e.g. Blockchain Development"
                    required
                  />
                </div>
              </div>

              <div className="certificate-form-field">
                <label>Issue date</label>

                <div className="certificate-input-wrap">
                  <CalendarDays
                    size={17}
                    className="certificate-input-icon"
                  />

                  <input
                    type="date"
                    value={form.issuedAt}
                    onChange={(e) =>
                      updateField('issuedAt', e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="certificate-form-field">
                <label>Certificate status</label>

                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
            </div>

            <div className="certificate-form-divider" />

            <div className="certificate-form-section-label">
              <Network size={15} />
              Verification layer
            </div>

            <div className="certificate-form-grid">
              <div className="certificate-form-field full">
                <label>Verification type</label>

                <select
                  value={form.verificationType}
                  onChange={(e) =>
                    updateField('verificationType', e.target.value)
                  }
                >
                  <option value="BLOCKCHAIN_NATIVE">
                    Blockchain Native
                  </option>

                  <option value="EXTERNAL_VERIFIED">
                    External Verified
                  </option>

                  <option value="EXTERNAL_PENDING">
                    External Pending
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className="certificate-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="certificate-submit-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  Creating secure record...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Create certificate record
                </>
              )}
            </button>
          </form>

          <aside className="certificate-record-card certificate-preview-card">
            <div className="certificate-preview-top">
              <h3>Live preview</h3>

              <div className="certificate-preview-status">
                <CheckCircle2 size={14} />
                Ready
              </div>
            </div>

            <div className="certificate-preview-document">
              <div className="certificate-preview-logo">
                <ShieldCheck size={38} />
              </div>

              <div className="certificate-preview-title">
                <span>{user.name}</span>

                <h2>{form.certificateTitle}</h2>

                <p>This certifies that</p>
              </div>

              <div className="certificate-preview-name">
                {form.studentName || 'Student Name'}
              </div>

              <p className="certificate-preview-course">
                has successfully completed{' '}
                <strong>{form.courseName || 'the selected credential'}</strong>
              </p>

              <div className="certificate-preview-meta">
                <div className="certificate-preview-meta-item">
                  <span>Issued by</span>
                  <strong>{user.name}</strong>
                </div>

                <div className="certificate-preview-meta-item">
                  <span>Issue date</span>
                  <strong>{form.issuedAt || 'Not selected'}</strong>
                </div>

                <div className="certificate-preview-meta-item">
                  <span>Status</span>
                  <strong>{form.status}</strong>
                </div>

                <div className="certificate-preview-meta-item">
                  <span>Verification</span>
                  <strong>
                    {form.verificationType.replaceAll('_', ' ')}
                  </strong>
                </div>
              </div>
            </div>

            <div className="certificate-backend-note">
              <Fingerprint size={19} />

              <div>
                <strong>Backend-generated proof</strong>

                <p>
                  Certificate ID, issuer identity, certificate hash and blockchain
                  transaction details must come from your backend. Nothing is stored
                  in localStorage.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {issuedCertificate && (
          <section className="certificate-record-card certificate-result-card">
            <div className="certificate-result-header">
              <CheckCircle2 size={22} />

              <h3>Certificate record created</h3>
            </div>

            <div className="certificate-result-grid">
              <div className="certificate-result-item">
                <span>Certificate ID</span>

                <div className="certificate-copy-row">
                  <strong>{issuedCertificate.id}</strong>

                  <button
                    type="button"
                    className="certificate-copy-button"
                    onClick={() => copyValue(issuedCertificate.id)}
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              <div className="certificate-result-item">
                <span>Issuer</span>
                <strong>{issuedCertificate.institution}</strong>
              </div>

              <div className="certificate-result-item">
                <span>Student</span>
                <strong>{issuedCertificate.student_name}</strong>
              </div>

              <div className="certificate-result-item">
                <span>Issued on</span>
                <strong>{issuedCertificate.issue_date}</strong>
              </div>

              <div className="certificate-result-item full">
                <span>
                  <Hash size={12} /> Certificate fingerprint
                </span>

                <div className="certificate-copy-row">
                  <strong>{issuedCertificate.hash}</strong>

                  <button
                    type="button"
                    className="certificate-copy-button"
                    onClick={() => copyValue(issuedCertificate.hash)}
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}