// CertificateRecord.jsx

import React from "react";

const CertificateRecord = ({
  certificate = null,
  onBack,
  onVerify,
}) => {
  /*
    Expected certificate structure:

    {
      certificateId,
      studentName,
      studentEmail,
      issuerId,
      issuerName,
      courseName,
      certificateTitle,
      issuedAt,
      certificateHash,
      blockchainTxHash,
      blockchainNetwork,
      blockchainTimestamp,
      status,
      verificationType
    }
  */

  const formatDate = (date) => {
    if (!date) return "Not available";

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return "Not available";
    if (hash.length <= 30) return hash;

    return `${hash.slice(0, 15)}...${hash.slice(-12)}`;
  };

  const handleVerify = () => {
    if (onVerify) {
      onVerify(certificate);
    }
  };

  /*
   ============================================================
   EMPTY STATE
  ============================================================
  */

  if (!certificate) {
    return (
      <>
        <div className="certificate-record-page">
          <div className="certificate-empty-state">
            <div className="certificate-empty-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M15 12H9" />
                <path d="M12 9v6" />
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 4V2" />
                <path d="M16 4V2" />
              </svg>
            </div>

            <span className="certificate-empty-label">
              CERTIFICATE RECORD
            </span>

            <h2>No Certificate Found</h2>

            <p>
              There is currently no certificate record available to display.
              Once a certificate is issued and recorded, its verification
              details will appear here.
            </p>

            {onBack && (
              <button
                type="button"
                className="certificate-submit-button"
                onClick={onBack}
              >
                <span>Back to Certificates</span>

                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <style>{certificateRecordStyles}</style>
      </>
    );
  }

  /*
   ============================================================
   VERIFIED STATE
  ============================================================
  */

  const isVerified =
    certificate.status?.toLowerCase() === "verified" ||
    certificate.status?.toLowerCase() === "active" ||
    Boolean(certificate.blockchainTxHash);

  return (
    <>
      <div className="certificate-record-page">
        <div className="certificate-record-container">

          {/* ====================================================
              TOP NAVIGATION
          ==================================================== */}

          <div className="certificate-record-topbar">
            {onBack && (
              <button
                type="button"
                className="certificate-back-button"
                onClick={onBack}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>

                <span>Back</span>
              </button>
            )}

            <div className="certificate-record-label">
              <span className="certificate-record-dot" />
              CERTIFICATE RECORD
            </div>
          </div>

          {/* ====================================================
              VERIFIED BANNER
          ==================================================== */}

          <div
            className={`certificate-verified-banner ${
              isVerified
                ? "certificate-banner-success"
                : "certificate-banner-pending"
            }`}
          >
            <div className="certificate-verified-icon">
              {isVerified ? (
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              )}
            </div>

            <div className="certificate-verified-content">
              <strong>
                {isVerified
                  ? "Certificate Successfully Verified"
                  : "Certificate Verification Pending"}
              </strong>

              <p>
                {isVerified
                  ? "This certificate record has been authenticated and anchored to the blockchain."
                  : "This certificate record has been created but blockchain verification is still pending."}
              </p>
            </div>

            <div
              className={`certificate-status-pill ${
                isVerified ? "status-verified" : "status-pending"
              }`}
            >
              <span />
              {isVerified ? "VERIFIED" : "PENDING"}
            </div>
          </div>

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="certificate-result-header">
            <div className="certificate-header-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
                <path d="M8 15h5" />
              </svg>
            </div>

            <div>
              <h1>Certificate Details</h1>

              <p>
                Immutable record and verification information
              </p>
            </div>
          </div>

          {/* ====================================================
              CERTIFICATE HERO
          ==================================================== */}

          <div className="certificate-hero-card">
            <div className="certificate-hero-content">
              <span className="certificate-section-label">
                CERTIFICATE TITLE
              </span>

              <h2>
                {certificate.certificateTitle ||
                  certificate.courseName ||
                  "Academic Certificate"}
              </h2>

              <p className="certificate-course-name">
                {certificate.courseName || "Course information unavailable"}
              </p>

              <div className="certificate-meta-row">
                <div>
                  <span>Certificate ID</span>
                  <strong>{certificate.certificateId || "N/A"}</strong>
                </div>

                <div>
                  <span>Issued On</span>
                  <strong>
                    {formatDate(certificate.issuedAt)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="certificate-hero-seal">
              <div className="certificate-seal-ring">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path d="M12 3l2.2 2.2 3.1-.1.9 3 2.4 2-1.5 2.7.7 3-2.8 1.3-1.3 2.8-3-.7-2.7 1.5-2-2.4-3-.9.1-3.1L3 12l2.2-2.2-.1-3.1 3-.9 2-2.4Z" />
                  <path d="M8.5 12l2.2 2.2 4.8-4.8" />
                </svg>
              </div>

              <span>AUTHENTIC</span>
            </div>
          </div>

          {/* ====================================================
              INFORMATION GRID
          ==================================================== */}

          <div className="certificate-info-grid">

            {/* Student */}
            <div className="certificate-info-card">
              <div className="certificate-card-heading">
                <div className="certificate-card-icon">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c.7-4.1 3.4-6 8-6s7.3 1.9 8 6" />
                  </svg>
                </div>

                <div>
                  <span>RECIPIENT</span>
                  <h3>Student Information</h3>
                </div>
              </div>

              <div className="certificate-field">
                <span>Full Name</span>
                <strong>
                  {certificate.studentName || "Not available"}
                </strong>
              </div>

              <div className="certificate-field">
                <span>Email Address</span>
                <strong>
                  {certificate.studentEmail || "Not available"}
                </strong>
              </div>
            </div>

            {/* Issuer */}
            <div className="certificate-info-card">
              <div className="certificate-card-heading">
                <div className="certificate-card-icon">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V8l7-5 7 5v13" />
                    <path d="M9 21v-5h6v5" />
                    <path d="M9 10h.01" />
                    <path d="M12 10h.01" />
                    <path d="M15 10h.01" />
                  </svg>
                </div>

                <div>
                  <span>ISSUER</span>
                  <h3>Institution Details</h3>
                </div>
              </div>

              <div className="certificate-field">
                <span>Institution</span>
                <strong>
                  {certificate.issuerName || "Not available"}
                </strong>
              </div>

              <div className="certificate-field">
                <span>Issuer ID</span>
                <strong>
                  {certificate.issuerId || "Not available"}
                </strong>
              </div>
            </div>
          </div>

          {/* ====================================================
              BLOCKCHAIN RECORD
          ==================================================== */}

          <div className="certificate-blockchain-card">
            <div className="certificate-blockchain-header">
              <div className="certificate-card-heading">
                <div className="certificate-blockchain-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M7 7h4v4H7z" />
                    <path d="M13 13h4v4h-4z" />
                    <path d="M13 7h4v4h-4z" />
                    <path d="M7 13h4v4H7z" />
                    <path d="M11 9h2" />
                    <path d="M9 11v2" />
                    <path d="M15 11v2" />
                    <path d="M11 15h2" />
                  </svg>
                </div>

                <div>
                  <span>BLOCKCHAIN RECORD</span>
                  <h3>On-Chain Verification</h3>
                </div>
              </div>

              <span className="blockchain-live-badge">
                <span />
                ON-CHAIN
              </span>
            </div>

            <div className="blockchain-details-grid">

              <div className="blockchain-detail">
                <span>Network</span>
                <strong>
                  {certificate.blockchainNetwork || "Not available"}
                </strong>
              </div>

              <div className="blockchain-detail">
                <span>Verification Type</span>
                <strong>
                  {certificate.verificationType || "Blockchain"}
                </strong>
              </div>

              <div className="blockchain-detail blockchain-full">
                <span>Certificate Hash</span>

                <div className="hash-value">
                  <code>
                    {truncateHash(certificate.certificateHash)}
                  </code>
                </div>
              </div>

              <div className="blockchain-detail blockchain-full">
                <span>Transaction Hash</span>

                <div className="hash-value">
                  <code>
                    {truncateHash(certificate.blockchainTxHash)}
                  </code>
                </div>
              </div>

              <div className="blockchain-detail">
                <span>Blockchain Timestamp</span>
                <strong>
                  {formatDate(certificate.blockchainTimestamp)}
                </strong>
              </div>

              <div className="blockchain-detail">
                <span>Status</span>

                <strong className="blockchain-status">
                  <span />
                  {certificate.status || "Verified"}
                </strong>
              </div>
            </div>
          </div>

          {/* ====================================================
              VERIFY BUTTON
          ==================================================== */}

          {onVerify && (
            <div className="certificate-action-area">
              <button
                type="button"
                className="certificate-submit-button"
                onClick={handleVerify}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 3l2.2 2.2 3.1-.1.9 3 2.4 2-1.5 2.7.7 3-2.8 1.3-1.3 2.8-3-.7-2.7 1.5-2-2.4-3-.9.1-3.1L3 12l2.2-2.2-.1-3.1 3-.9 2-2.4Z" />
                  <path d="M8.5 12l2.2 2.2 4.8-4.8" />
                </svg>

                <span>Verify Certificate</span>
              </button>
            </div>
          )}

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="certificate-record-footer">
            <div>
              <span className="footer-security-dot" />
              <span>SECURED BY CRYPTOGRAPHIC VERIFICATION</span>
            </div>

            <p>
              Certificate records are tamper-evident and independently
              verifiable.
            </p>
          </div>
        </div>
      </div>

      <style>{certificateRecordStyles}</style>
    </>
  );
};


/*
============================================================
   CERTIFICATE RECORD STYLES
============================================================
*/

const certificateRecordStyles = `

.certificate-record-page {
  width: 100%;
  min-height: 100vh;
  padding: 38px 24px 70px;
  box-sizing: border-box;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(63, 174, 106, 0.055),
      transparent 32%
    ),
    #0b0d0c;
  color: #ededed;
}

.certificate-record-container {
  width: min(1080px, 100%);
  margin: 0 auto;
}


/* ============================================================
   TOP BAR
============================================================ */

.certificate-record-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26px;
}

.certificate-back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px;
  background: rgba(255,255,255,0.025);
  color: #9ca49e;
  cursor: pointer;
  font-size: 0.76rem;
  transition: 0.2s ease;
}

.certificate-back-button:hover {
  color: #e7ebe8;
  border-color: rgba(63,174,106,0.3);
  background: rgba(63,174,106,0.05);
}

.certificate-record-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #737a75;
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  font-weight: 600;
}

.certificate-record-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3fae6a;
  box-shadow: 0 0 10px rgba(63,174,106,0.6);
}


/* ============================================================
   VERIFIED BANNER
============================================================ */

.certificate-verified-banner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 30px;
  padding: 17px 19px;
  border-radius: 14px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.certificate-verified-banner::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(63,174,106,0.035),
    transparent 60%
  );
}

.certificate-banner-success {
  background: rgba(63,174,106,0.055);
  border: 1px solid rgba(63,174,106,0.19);
}

.certificate-banner-pending {
  background: rgba(232,193,88,0.045);
  border: 1px solid rgba(232,193,88,0.16);
}

.certificate-verified-icon {
  position: relative;
  z-index: 1;
  width: 43px;
  height: 43px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 11px;
}

.certificate-banner-success .certificate-verified-icon {
  color: #3fae6a;
  background: rgba(63,174,106,0.09);
}

.certificate-banner-pending .certificate-verified-icon {
  color: #e8c158;
  background: rgba(232,193,88,0.08);
}

.certificate-verified-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.certificate-verified-banner strong {
  display: block;
  margin-bottom: 3px;
  color: #dce2dd;
  font-size: 0.84rem;
  font-weight: 600;
}

.certificate-verified-banner p {
  margin: 0;
  color: #89918a;
  font-size: 0.75rem;
  line-height: 1.5;
}

.certificate-status-pill {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.certificate-status-pill span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.status-verified {
  color: #4fc67b;
  background: rgba(63,174,106,0.08);
}

.status-verified span {
  background: #3fae6a;
  box-shadow: 0 0 8px rgba(63,174,106,0.7);
}

.status-pending {
  color: #e8c158;
  background: rgba(232,193,88,0.07);
}

.status-pending span {
  background: #e8c158;
}


/* ============================================================
   RESULT HEADER
============================================================ */

.certificate-result-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.certificate-header-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 11px;
  color: #aaa;
  background: rgba(255,255,255,0.025);
}

.certificate-result-header > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.certificate-result-header h1 {
  margin: 0;
  color: #ededed;
  font-family: var(--font-display, inherit);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.certificate-result-header p {
  margin: 0;
  color: #888f89;
  font-size: 0.77rem;
}


/* ============================================================
   HERO CARD
============================================================ */

.certificate-hero-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  min-height: 210px;
  margin-bottom: 17px;
  padding: 32px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.075);
  border-radius: 17px;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.035),
      rgba(255,255,255,0.012)
    );
  box-shadow: 0 18px 55px rgba(0,0,0,0.18);
}

.certificate-hero-card::after {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;
  right: -100px;
  top: -130px;
  border-radius: 50%;
  background: rgba(63,174,106,0.035);
  pointer-events: none;
}

.certificate-hero-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.certificate-section-label {
  color: #727a74;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  font-weight: 700;
}

.certificate-hero-content h2 {
  max-width: 700px;
  margin: 9px 0 5px;
  color: #f1f3f1;
  font-family: var(--font-display, inherit);
  font-size: clamp(1.65rem, 4vw, 2.45rem);
  line-height: 1.12;
  letter-spacing: -0.035em;
}

.certificate-course-name {
  margin: 0;
  color: #888f89;
  font-size: 0.82rem;
}

.certificate-meta-row {
  display: flex;
  gap: 45px;
  margin-top: 26px;
}

.certificate-meta-row div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.certificate-meta-row span {
  color: #676e69;
  font-size: 0.58rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.certificate-meta-row strong {
  color: #bfc6c1;
  font-size: 0.72rem;
  font-weight: 500;
}

.certificate-hero-seal {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.certificate-seal-ring {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(63,174,106,0.25);
  border-radius: 50%;
  color: #3fae6a;
  background: rgba(63,174,106,0.045);
  box-shadow:
    inset 0 0 0 7px rgba(63,174,106,0.018),
    0 0 30px rgba(63,174,106,0.045);
}

.certificate-hero-seal span {
  color: #5e876c;
  font-size: 0.52rem;
  letter-spacing: 0.13em;
  font-weight: 700;
}


/* ============================================================
   INFORMATION CARDS
============================================================ */

.certificate-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 17px;
}

.certificate-info-card {
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.065);
  border-radius: 15px;
  background: rgba(255,255,255,0.018);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.certificate-info-card:hover {
  transform: translateY(-2px);
  border-color: rgba(63,174,106,0.15);
  background: rgba(255,255,255,0.024);
}

.certificate-card-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 22px;
}

.certificate-card-heading > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.certificate-card-heading span {
  color: #626963;
  font-size: 0.55rem;
  letter-spacing: 0.13em;
  font-weight: 700;
}

.certificate-card-heading h3 {
  margin: 0;
  color: #cbd0cc;
  font-size: 0.82rem;
  font-weight: 600;
}

.certificate-card-icon,
.certificate-blockchain-icon {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  color: #969e98;
  background: rgba(255,255,255,0.025);
}

.certificate-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.045);
}

.certificate-field span {
  color: #626963;
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.certificate-field strong {
  color: #bfc5c0;
  font-size: 0.74rem;
  font-weight: 500;
  overflow-wrap: anywhere;
}


/* ============================================================
   BLOCKCHAIN CARD
============================================================ */

.certificate-blockchain-card {
  margin-bottom: 20px;
  padding: 25px;
  border: 1px solid rgba(63,174,106,0.11);
  border-radius: 15px;
  background:
    linear-gradient(
      145deg,
      rgba(63,174,106,0.025),
      rgba(255,255,255,0.012)
    );
}

.certificate-blockchain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.certificate-blockchain-icon {
  color: #3fae6a;
  border-color: rgba(63,174,106,0.12);
  background: rgba(63,174,106,0.045);
}

.blockchain-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border-radius: 999px;
  color: #4fc67b;
  background: rgba(63,174,106,0.065);
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.blockchain-live-badge span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3fae6a;
  box-shadow: 0 0 7px rgba(63,174,106,0.7);
}

.blockchain-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 25px;
}

.blockchain-detail {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.045);
}

.blockchain-detail span {
  color: #626963;
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.blockchain-detail strong {
  color: #bfc6c1;
  font-size: 0.72rem;
  font-weight: 500;
}

.blockchain-full {
  grid-column: 1 / -1;
}

.hash-value {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.055);
  border-radius: 8px;
  background: rgba(0,0,0,0.16);
}

.hash-value code {
  display: block;
  overflow: hidden;
  color: #7f9e88;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.65rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blockchain-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #4fc67b !important;
}

.blockchain-status span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3fae6a;
  box-shadow: 0 0 7px rgba(63,174,106,0.65);
}


/* ============================================================
   ACTION BUTTON
============================================================ */

.certificate-action-area {
  display: flex;
  justify-content: center;
  margin: 25px 0;
}

.certificate-submit-button {
  width: 100%;
  max-width: 300px;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 18px;
  border: 1px solid rgba(63,174,106,0.3);
  border-radius: 10px;
  color: #dce9df;
  background: rgba(63,174,106,0.08);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.certificate-submit-button:hover {
  transform: translateY(-1px);
  border-color: rgba(63,174,106,0.48);
  background: rgba(63,174,106,0.13);
}

.certificate-submit-button:active {
  transform: translateY(0);
}


/* ============================================================
   FOOTER
============================================================ */

.certificate-record-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 21px;
  border-top: 1px solid rgba(255,255,255,0.045);
}

.certificate-record-footer div {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #59615b;
  font-size: 0.54rem;
  letter-spacing: 0.08em;
}

.footer-security-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3fae6a;
}

.certificate-record-footer p {
  margin: 0;
  color: #505751;
  font-size: 0.62rem;
}


/* ============================================================
   EMPTY STATE
============================================================ */

.certificate-empty-state {
  max-width: 620px;
  margin: 100px auto;
  padding: 55px 45px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(232,193,88,0.035),
      transparent 45%
    ),
    rgba(255,255,255,0.015);
  box-shadow: 0 25px 70px rgba(0,0,0,0.2);
}

.certificate-empty-icon {
  width: 76px;
  height: 76px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid rgba(232,193,88,0.15);
  border-radius: 19px;
  color: #e8c158;
  background: rgba(232,193,88,0.045);
}

.certificate-empty-label {
  display: block;
  margin-top: 22px;
  color: #706b58;
  font-size: 0.57rem;
  letter-spacing: 0.16em;
  font-weight: 700;
}

.certificate-empty-state h2 {
  margin: 12px 0 10px;
  color: #ededed;
  font-family: var(--font-display, inherit);
  font-size: 1.4rem;
}

.certificate-empty-state p {
  margin: 0 auto 27px;
  max-width: 470px;
  color: #92968f;
  line-height: 1.65;
  font-size: 0.77rem;
}

.certificate-empty-state .certificate-submit-button {
  max-width: 300px;
  margin: 0 auto;
}


/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 700px) {

  .certificate-record-page {
    padding: 25px 15px 50px;
  }

  .certificate-verified-banner {
    align-items: flex-start;
  }

  .certificate-status-pill {
    display: none;
  }

  .certificate-hero-card {
    align-items: flex-start;
    padding: 25px 21px;
  }

  .certificate-hero-seal {
    display: none;
  }

  .certificate-meta-row {
    flex-direction: column;
    gap: 14px;
  }

  .certificate-info-grid,
  .blockchain-details-grid {
    grid-template-columns: 1fr;
  }

  .blockchain-full {
    grid-column: auto;
  }

  .certificate-info-card,
  .certificate-blockchain-card {
    padding: 20px;
  }

  .certificate-record-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .certificate-empty-state {
    margin: 60px auto;
    padding: 35px 20px;
  }
}

@media (max-width: 450px) {

  .certificate-record-topbar {
    margin-bottom: 20px;
  }

  .certificate-record-label {
    font-size: 0.55rem;
  }

  .certificate-back-button span {
    display: none;
  }

  .certificate-verified-banner {
    padding: 14px;
  }

  .certificate-verified-icon {
    width: 38px;
    height: 38px;
  }

  .certificate-verified-banner strong {
    font-size: 0.77rem;
  }

  .certificate-verified-banner p {
    font-size: 0.68rem;
  }

  .certificate-result-header h1 {
    font-size: 1.15rem;
  }

  .certificate-hero-content h2 {
    font-size: 1.5rem;
  }

  .certificate-meta-row {
    margin-top: 20px;
  }

  .certificate-blockchain-header {
    align-items: flex-start;
  }

  .blockchain-live-badge {
    font-size: 0.48rem;
  }

  .hash-value code {
    font-size: 0.58rem;
  }
}

`;

export default CertificateRecord;