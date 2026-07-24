import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Building2, ScanSearch, Fingerprint, UploadCloud, QrCode, DatabaseZap, Bot, ShieldCheck } from 'lucide-react'
import './Home.css'

const HEX = '0123456789ABCDEF'
function randomHash(len = 40) {
  return Array.from({ length: len }, () => HEX[Math.floor(Math.random() * 16)]).join('')
}
const RING_CHARS = randomHash(48)

function HeroSeal() {
  return (
    <div className="hero-seal" aria-hidden="true">
      <motion.div
        className="seal-ring"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
      >
        {RING_CHARS.split('').map((char, i) => {
          const angle = (i / RING_CHARS.length) * 360
          return (
            <span
              key={i}
              className="seal-char"
              style={{ '--angle': `${angle}deg` }}
            >
              {char}
            </span>
          )
        })}
      </motion.div>

      <motion.div
        className="seal-core"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Fingerprint size={40} strokeWidth={1.5} />
      </motion.div>

    </div>
  )
}

const roles = [
  {
    key: 'institution',
    icon: Building2,
    title: 'Institution',
    desc: 'Issue tamper-evident certificates to your students in seconds.',
    action: '/auth?role=institution',
  },
  {
    key: 'student',
    icon: GraduationCap,
    title: 'Student',
    desc: 'Hold every credential you\u2019ve earned in one place, shareable by QR.',
    action: '/auth?role=student',
  },
  {
    key: 'employer',
    icon: ScanSearch,
    title: 'Employer',
    desc: 'Confirm a certificate is real in one scan \u2014 no calls, no waiting.',
    action: '/verify',
  },
]


const proofPoints = [
  { icon: ShieldCheck, title: 'Signed at the source', desc: 'Only institution accounts can issue records, and each certificate is signed before it is saved.' },
  { icon: DatabaseZap, title: 'Backend persistence', desc: 'Accounts, sessions, certificates, hashes, and signatures live in the API database — no browser local storage.' },
  { icon: Bot, title: 'RAG assistant', desc: 'The chat helper retrieves AuthNode documentation first, then uses LangChain to answer with grounded context.' },
]

const steps = [
  {
    n: '01',
    icon: UploadCloud,
    title: 'Issue',
    desc: 'An institution submits a record. AuthNode generates a unique cryptographic fingerprint for it \u2014 change one letter, and the fingerprint changes completely.',
  },
  {
    n: '02',
    icon: Fingerprint,
    title: 'Secure',
    desc: 'The fingerprint is stored permanently and can never be quietly edited. The certificate now carries proof of its own authenticity.',
  },
  {
    n: '03',
    icon: QrCode,
    title: 'Verify',
    desc: 'Anyone can scan the certificate\u2019s QR code. AuthNode recomputes the fingerprint and confirms, instantly, whether it matches.',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <section className="hero guilloche-bg">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Credential verification, made provable</span>
            <h1>
              A certificate that can<br />prove itself.
            </h1>
            <p>
              AuthNode gives every academic and professional certificate a unique
              digital fingerprint. If it's real, it verifies instantly. If it's
              been altered, that shows too.
            </p>
            <div className="trust-callout">
              <strong>How trust works:</strong> Every certificate gets a unique fingerprint.
              Change even one letter, and the fingerprint changes — that&apos;s how we catch fakes.
            </div>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                Get started
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/verify')}>
                Verify a certificate
              </button>
            </div>
          </div>

          <HeroSeal />
        </div>
      </section>

      <section className="page">
        <div className="container">
          <div className="page-header">
            <span className="eyebrow">Choose your role</span>
            <h1>Built for three kinds of trust</h1>
            <p>AuthNode adapts to what you need it for \u2014 pick where you fit in.</p>
          </div>

          <div className="role-grid">
            {roles.map((r, i) => (
              <motion.button
                key={r.key}
                className="role-card"
                onClick={() => navigate(r.action)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <r.icon size={26} strokeWidth={1.6} />
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="page steps-section">
        <div className="container">
          <div className="page-header">
            <span className="eyebrow">How it works</span>
            <h1>Three steps, no manual verification</h1>
          </div>

          <div className="steps-list">
            {steps.map((s, i) => (
              <motion.div
                className="step-row"
                key={s.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <span className="step-n">{s.n}</span>
                <div className="step-icon">
                  <s.icon size={20} strokeWidth={1.7} />
                </div>
                <div className="step-copy">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="page about-section" id="about">
        <div className="container about-grid">
          <div className="about-copy">
            <span className="eyebrow">About AuthNode</span>
            <h1>Designed for real credential workflows.</h1>
            <p>
              AuthNode connects a polished React interface to a FastAPI backend and a
              LangChain-powered RAG assistant. Institutions create trusted records,
              students share QR verification links, and employers can confirm authenticity
              without phone calls or spreadsheets.
            </p>
          </div>
          <div className="proof-grid">
            {proofPoints.map((p) => (
              <div className="proof-card" key={p.title}>
                <p.icon size={22} strokeWidth={1.7} />
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>AuthNode</strong>
            <p>Credential verification with signed records and grounded AI support.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => navigate('/auth?role=institution')}>Issue</button>
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/verify')}>Verify</button>
          </div>
        </div>
      </footer>

    </div>
  )
}
