import { forwardRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ShieldCheck } from 'lucide-react'
import './CertificateTemplate.css'

// Rendered off-screen at fixed pixel dimensions, captured by html2canvas for
// PDF export. Kept in the live DOM (not display:none) so html2canvas can
// measure and paint it correctly.
const CertificateTemplate = forwardRef(function CertificateTemplate({ cert }, ref) {
  if (!cert) return null

  const verifyUrl = `${window.location.origin}/verify/${cert.id}`
  const formattedDate = cert.issueDate
    ? new Date(cert.issueDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div className="cert-print-wrap" aria-hidden="true">
      <div className="cert-print" ref={ref}>
        <div className="cert-print-border">
          <div className="cert-print-inner">
            <div className="cert-print-seal">
              <ShieldCheck size={34} strokeWidth={1.5} />
            </div>

            <span className="cert-print-eyebrow">Certificate of Achievement</span>
            <h1 className="cert-print-name">{cert.studentName}</h1>
            <p className="cert-print-sub">has successfully completed</p>
            <h2 className="cert-print-course">{cert.course}</h2>

            <div className="cert-print-meta">
              <div>
                <span className="cert-print-meta-label">Issued by</span>
                <span className="cert-print-meta-value">{cert.institution}</span>
              </div>
              <div>
                <span className="cert-print-meta-label">Date</span>
                <span className="cert-print-meta-value">{formattedDate}</span>
              </div>
            </div>

            <div className="cert-print-footer">
              <div className="cert-print-qr">
                <QRCodeCanvas value={verifyUrl} size={84} bgColor="#ffffff" fgColor="#0B1220" />
              </div>
              <div className="cert-print-hash">
                <span className="cert-print-meta-label">Certificate ID</span>
                <span className="cert-print-mono">{cert.id}</span>
                <span className="cert-print-mono cert-print-fingerprint">
                  fingerprint {cert.hash?.slice(0, 24)}…
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default CertificateTemplate
