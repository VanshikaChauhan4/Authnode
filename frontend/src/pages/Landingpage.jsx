import { Suspense, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line } from '@react-three/drei'
import {
  Fingerprint,
  Link2,
  ScanSearch,
  Building2,
  GraduationCap,
  ShieldCheck,
  History,
  KeyRound,
  UploadCloud,
  QrCode,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'
import { NetSection } from './NetBackground'
import FAQSection from './FAQSection'
import Footer from './Footer'

/* ============================================================
   EMBEDDED STYLES (Combined LandingPage.css)
   ============================================================ */
const landingPageStyles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

/* ============================================================
   DESIGN TOKENS
   Certificate / ledger aesthetic: deep navy ink, gold seal
   accents, ivory paper tone, a quiet verified-green for trust
   states. Fraunces (a warm, slightly engraved display serif)
   for headings reads like something stamped, not generated;
   Inter carries the body copy.
   ============================================================ */

.landing {
  --color-ink: #05070d;
  --color-ink-soft: #0b0f1a;
  --color-panel: #141b2e;
  --color-panel-soft: #1a2338;
  --color-ivory: #ededed;
  --color-muted: #b7b8ae;
  --color-gold-bright: #e8c158;
  --color-gold-soft: #c9a227;
  --color-verified: #3fae6a;
  --color-border: rgba(201, 162, 39, 0.16);

  --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-pill: 999px;

  --shadow-soft: 0 20px 60px -30px rgba(0, 0, 0, 0.65);
  --shadow-gold: 0 16px 40px -20px rgba(201, 162, 39, 0.5);

  position: relative;
  background: radial-gradient(120% 60% at 50% 0%, #0e1424 0%, var(--color-ink) 55%, var(--color-ink) 100%);
  color: var(--color-ivory);
  font-family: var(--font-body);
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.landing h1,
.landing h2,
.landing h3,
.landing h4 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-ivory);
  margin: 0;
}

.landing p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
}

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 32px;
}

.page {
  padding: 112px 0;
}

.page-header {
  max-width: 620px;
  margin: 0 auto 56px;
  text-align: center;
}

.page-header h2 {
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  margin: 10px 0 14px;
}

.page-header p {
  font-size: 1.02rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-gold-bright);
}

.eyebrow::before {
  content: '';
  width: 16px;
  height: 1px;
  background: var(--color-gold-soft);
}

/* ---------------- Reusable surfaces ---------------- */

.glass-card {
  background: linear-gradient(180deg, rgba(237, 237, 227, 0.045), rgba(237, 237, 227, 0.015));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: var(--shadow-soft);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, transform 0.3s ease;
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 40%, rgba(232, 193, 88, 0.08) 50%, transparent 60%);
  transform: translateX(-140%);
  transition: transform 0.7s ease;
  pointer-events: none;
}

.glass-card:hover::before {
  transform: translateX(140%);
}

.glass-card:hover {
  border-color: rgba(201, 162, 39, 0.4);
  box-shadow: var(--shadow-gold);
}

.float-card {
  animation: card-float 7s ease-in-out infinite;
}
.float-card:nth-child(2n) { animation-delay: -1.6s; }
.float-card:nth-child(3n) { animation-delay: -3.2s; }
.float-card:nth-child(4n) { animation-delay: -4.8s; }

@keyframes card-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .float-card { animation: none; }
}

.hash-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.78rem;
  color: var(--color-gold-bright);
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: rgba(201, 162, 39, 0.08);
  border: 1px solid var(--color-border);
  animation: hash-glow 3.2s ease-in-out infinite;
}

@keyframes hash-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(232, 193, 88, 0.0); }
  50%      { box-shadow: 0 0 18px 1px rgba(232, 193, 88, 0.25); }
}

/* ---------------- Buttons ---------------- */

.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 14px 26px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
}

.btn-primary {
  color: var(--color-ink);
  background: linear-gradient(120deg, var(--color-gold-bright), var(--color-gold-soft));
  background-size: 180% 180%;
  animation: gold-shift 6s ease infinite;
}

@keyframes gold-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.btn-glow {
  box-shadow: 0 0 0 0 rgba(232, 193, 88, 0.55);
}

.btn-glow:hover {
  box-shadow: 0 0 32px 4px rgba(232, 193, 88, 0.45);
}

/* Ripple sweep on hover */
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.6s ease;
}

.btn:hover::after {
  transform: translateX(120%);
}

.btn-ghost {
  color: var(--color-ivory);
  background: rgba(237, 237, 227, 0.04);
  border-color: var(--color-border);
  backdrop-filter: blur(8px);
}

.btn-ghost:hover {
  border-color: var(--color-gold-soft);
  background: rgba(201, 162, 39, 0.08);
}

/* ============================================================
   HERO — clean, no ambient canvas
   ============================================================ */

.landing-hero {
  position: relative;
  padding: 168px 0 96px;
  overflow: hidden;
}

.landing-hero-vignette {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(60% 45% at 50% 0%, rgba(201, 162, 39, 0.14), transparent 70%),
    radial-gradient(40% 30% at 85% 15%, rgba(63, 174, 106, 0.06), transparent 70%);
  animation: vignette-breathe 8s ease-in-out infinite;
}

@keyframes vignette-breathe {
  0%, 100% { opacity: 0.85; }
  50%      { opacity: 1; }
}

.landing-hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 40px;
}

.landing-badge {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 18px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(201, 162, 39, 0.06);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-gold-bright);
  margin: 0 auto 28px;
}

.landing-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-verified);
  box-shadow: 0 0 0 4px rgba(63, 174, 106, 0.18);
  animation: badge-pulse 2.2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.35); }
}

.landing-h1 {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: clamp(2.6rem, 6.2vw, 4.6rem);
  line-height: 1.06;
}

.landing-h1-light {
  color: var(--color-ivory);
}

.landing-h1-gold {
  position: relative;
  display: inline-block;
  width: fit-content;
  margin: 0 auto;
  background: linear-gradient(100deg, var(--color-gold-bright), #f4e0a3 45%, var(--color-gold-soft));
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gold-text-shimmer 5s ease-in-out infinite;
}

@keyframes gold-text-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

.landing-h1-underline {
  position: absolute;
  left: 0;
  bottom: -6px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--color-gold-soft), var(--color-gold-bright));
}

.landing-hero-sub {
  max-width: 640px;
  margin: 0 auto;
  font-size: 1.12rem;
  line-height: 1.7;
  color: var(--color-muted);
}

.trust-callout {
  max-width: 620px;
  margin: 0 auto;
  padding: 16px 22px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(237, 237, 227, 0.03);
  backdrop-filter: blur(10px);
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-muted);
  text-align: left;
}

.trust-callout strong {
  color: var(--color-gold-bright);
  font-weight: 600;
}

.landing-hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.landing-scroll-cue {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 24px;
  font-size: 0.78rem;
  color: var(--color-muted);
  text-decoration: none;
  animation: scroll-cue-bob 2.4s ease-in-out infinite;
}

@keyframes scroll-cue-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(5px); }
}

@media (prefers-reduced-motion: reduce) {
  .landing-badge-dot,
  .btn-primary,
  .landing-scroll-cue,
  .landing-h1-gold,
  .landing-hero-vignette,
  .hash-chip,
  .landing-feature-icon,
  .glass-card::before {
    animation: none;
  }
}

/* ============================================================
   ABOUT
   ============================================================ */

.landing-about-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 64px;
  align-items: center;
}

.landing-about-copy h2 {
  font-size: clamp(1.9rem, 3.2vw, 2.5rem);
  margin: 12px 0 20px;
}

.landing-about-copy p {
  margin-bottom: 14px;
  font-size: 1rem;
}

.landing-pillars {
  list-style: none;
  margin: 26px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.landing-pillars li {
  padding-left: 18px;
  position: relative;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.landing-pillars li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-gold-bright);
}

.landing-pillars span {
  color: var(--color-ivory);
  font-weight: 600;
}

.landing-about-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.landing-cert-canvas {
  width: 100%;
  height: 280px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: radial-gradient(60% 60% at 50% 40%, rgba(201, 162, 39, 0.08), transparent 70%);
}

.landing-cert-caption {
  font-size: 0.85rem;
  color: var(--color-muted);
}

/* ============================================================
   FEATURES
   ============================================================ */

.landing-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.landing-feature-card {
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: default;
}

.landing-feature-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  color: var(--color-gold-bright);
  background: rgba(201, 162, 39, 0.1);
  border: 1px solid var(--color-border);
  transition: transform 0.3s ease, background 0.3s ease;
  animation: icon-breathe 4.5s ease-in-out infinite;
}

@keyframes icon-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.07); }
}

.landing-feature-card:nth-child(2n) .landing-feature-icon { animation-delay: -1.1s; }
.landing-feature-card:nth-child(3n) .landing-feature-icon { animation-delay: -2.2s; }
.landing-feature-card:nth-child(4n) .landing-feature-icon { animation-delay: -3.3s; }

.landing-feature-card:hover .landing-feature-icon {
  transform: rotate(-8deg) scale(1.14);
  background: rgba(201, 162, 39, 0.2);
}

.landing-feature-card h3 {
  font-size: 1.05rem;
}

.landing-feature-card p {
  font-size: 0.9rem;
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */

.landing-steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 780px;
  margin: 0 auto;
}

.landing-step-row {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 22px 26px;
  cursor: default;
}

.landing-step-n {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--color-gold-soft);
  opacity: 0.65;
  width: 32px;
  flex-shrink: 0;
}

.landing-step-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--color-gold-bright);
  background: rgba(201, 162, 39, 0.1);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.landing-step-row:hover .landing-step-icon {
  transform: scale(1.12);
  box-shadow: 0 0 0 6px rgba(201, 162, 39, 0.1);
}

.landing-step-copy h4 {
  font-size: 1.02rem;
  margin-bottom: 4px;
}

.landing-step-copy p {
  font-size: 0.9rem;
}

/* ============================================================
   ROLES
   ============================================================ */

.role-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.role-card {
  padding: 32px 26px;
  text-align: left;
  color: var(--color-ivory);
  font-family: var(--font-body);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card svg {
  color: var(--color-gold-bright);
  margin-bottom: 4px;
  transition: transform 0.35s ease;
}

.role-card:hover svg {
  transform: rotate(-10deg) scale(1.12);
}

.role-card h3 {
  font-size: 1.15rem;
}

.role-card p {
  font-size: 0.9rem;
}

/* ============================================================
   FINAL CTA
   ============================================================ */

.landing-cta {
  padding: 32px 0 112px;
}

.landing-cta-inner {
  padding: 64px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.landing-cta-inner h2 {
  font-size: clamp(1.9rem, 3.4vw, 2.5rem);
}

.landing-cta-inner p {
  max-width: 480px;
  font-size: 1rem;
  margin-bottom: 8px;
}

.landing-cta-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 900px) {
  .landing-about-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .landing-feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .role-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .landing-hero {
    padding: 128px 0 72px;
  }
  .page {
    padding: 76px 0;
  }
  .container {
    padding: 0 20px;
  }
  .landing-feature-grid {
    grid-template-columns: 1fr;
  }
  .landing-step-row {
    flex-wrap: wrap;
    gap: 14px;
  }
  .landing-cta-inner {
    padding: 44px 24px;
  }
}
`

/* ============================================================
   3D — CERTIFICATE MEDALLION
   The one 3D signature piece left on the page: a floating
   certificate card with a seal ring, standing in for the single
   credential the whole product protects. Everything ambient (the
   old hero globe / lattice) has moved to the lightweight CSS net
   behind the sections below — this stays because it's a specific
   artifact, not atmosphere, and it earns its GPU budget.
   ============================================================ */

function CertificateMesh() {
  const sealRef = useRef(null)

  useFrame((_, delta) => {
    if (sealRef.current) sealRef.current.rotation.z += delta * 0.35
  })

  const cardEdges = [
    [-1.05, -0.72, 0.03], [1.05, -0.72, 0.03],
    [1.05, -0.72, 0.03], [1.05, 0.72, 0.03],
    [1.05, 0.72, 0.03], [-1.05, 0.72, 0.03],
    [-1.05, 0.72, 0.03], [-1.05, -0.72, 0.03],
  ]

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.7}>
      <group rotation={[0.18, -0.45, 0]}>
        <mesh>
          <boxGeometry args={[2.1, 1.44, 0.045]} />
          <meshStandardMaterial color="#141B2E" roughness={0.6} metalness={0.25} />
        </mesh>

        <Line points={cardEdges} color="#C9A227" lineWidth={1.4} transparent opacity={0.8} />

        {[0.32, 0.1, -0.12].map((y, i) => (
          <mesh key={i} position={[i === 0 ? -0.12 : 0, y, 0.026]}>
            <boxGeometry args={[i === 0 ? 1.1 : 1.35, 0.035, 0.01]} />
            <meshBasicMaterial color="#B7B8AE" transparent opacity={0.35} />
          </mesh>
        ))}

        <group ref={sealRef} position={[0.62, -0.34, 0.08]}>
          <mesh>
            <torusGeometry args={[0.26, 0.045, 16, 48]} />
            <meshStandardMaterial color="#E8C158" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#C9A227" roughness={0.35} metalness={0.6} />
          </mesh>
        </group>
      </group>
    </Float>
  )
}

function CertificateCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 3.4], fov: 42 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.75]}>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 3, 4]} intensity={0.9} color="#E8C158" />
      <pointLight position={[-3, -2, 2]} intensity={0.3} color="#3FAE6A" />
      <Suspense fallback={null}>
        <CertificateMesh />
      </Suspense>
    </Canvas>
  )
}

/* ============================================================
   CONTENT
   Card copy trimmed to one punchy line each — the icon and
   title already carry the category, so the description only
   needs to land the one thing that matters.
   ============================================================ */

const features = [
  {
    icon: Fingerprint,
    title: 'Cryptographic fingerprinting',
    desc: 'Change one character, and the fingerprint changes completely.',
  },
  {
    icon: Link2,
    title: 'Blockchain-anchored ledger',
    desc: 'Anchored on issue. No one can quietly edit it after.',
  },
  {
    icon: ScanSearch,
    title: 'One-scan verification',
    desc: 'Scan the QR code, get a match or mismatch \u2014 instantly.',
  },
  {
    icon: Building2,
    title: 'Issuance console',
    desc: 'Submit a record once. Certificate, fingerprint, and QR in seconds.',
  },
  {
    icon: GraduationCap,
    title: 'A wallet for every credential',
    desc: 'Every certificate you\u2019ve earned, in one shareable dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Tamper-evident by design',
    desc: 'Edit the file, break the hash. Nowhere for a forgery to hide.',
  },
  {
    icon: History,
    title: 'A full audit trail',
    desc: 'Every issuance and verification, logged and timestamped.',
  },
  {
    icon: KeyRound,
    title: 'Role-based access',
    desc: 'Everyone sees exactly what their role needs. Nothing more.',
  },
]

const steps = [
  {
    n: '01',
    icon: UploadCloud,
    title: 'Issue',
    desc: 'An institution submits a record and gets a unique fingerprint back.',
  },
  {
    n: '02',
    icon: Fingerprint,
    title: 'Secure',
    desc: 'The fingerprint is anchored to the ledger \u2014 permanently.',
  },
  {
    n: '03',
    icon: QrCode,
    title: 'Verify',
    desc: 'Scan the QR code. AuthNode confirms the match, instantly.',
  },
]

const roles = [
  {
    key: 'institution',
    icon: Building2,
    title: 'Institution',
    desc: 'Issue tamper-evident certificates in seconds, not weeks.',
    action: '/auth?role=institution',
  },
  {
    key: 'student',
    icon: GraduationCap,
    title: 'Student',
    desc: 'Every credential you\u2019ve earned, shareable by QR.',
    action: '/auth?role=student',
  },
  {
    key: 'employer',
    icon: ScanSearch,
    title: 'Employer',
    desc: 'Confirm a certificate is real in one scan.',
    action: '/verify',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Inject style tag containing all LandingPage.css code */}
      <style>{landingPageStyles}</style>

      {/* ---------------- HERO (clean, no ambient canvas) ---------------- */}
      <section className="landing-hero">
        <div className="landing-hero-vignette" aria-hidden="true" />

        <div className="container landing-hero-inner">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.div className="landing-badge" variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="landing-badge-dot" />
              Blockchain-verified credentials
            </motion.div>

            <motion.h1 className="landing-h1" variants={fadeUp} transition={{ duration: 0.6 }}>
              <span className="landing-h1-light">A certificate</span>
              <span className="landing-h1-gold">
                that proves itself.
                <motion.span
                  className="landing-h1-underline"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.1, delay: 0.9, ease: 'easeOut' }}
                />
              </span>
            </motion.h1>

            <motion.p className="landing-hero-sub" variants={fadeUp} transition={{ duration: 0.6 }}>
              AuthNode gives every academic and professional certificate a permanent
              cryptographic fingerprint, anchored to a tamper-evident ledger. Real
              credentials verify in seconds. Altered ones don&apos;t.
            </motion.p>

            <motion.div className="trust-callout landing-trust" variants={fadeUp} transition={{ duration: 0.6 }}>
              <strong>How trust works:</strong> every certificate gets a unique fingerprint.
              Change even one character in the record, and the fingerprint changes completely
              \u2014 that&apos;s how forged documents get caught.
            </motion.div>

            <motion.div className="landing-hero-actions" variants={fadeUp} transition={{ duration: 0.6 }}>
              <motion.button
                className="btn btn-primary btn-glow"
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Get started
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'inline-flex' }}
                >
                  <ArrowRight size={17} strokeWidth={2.2} />
                </motion.span>
              </motion.button>
              <motion.button
                className="btn btn-ghost"
                onClick={() => navigate('/verify')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Verify a certificate
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.a
            href="#about"
            className="landing-scroll-cue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
          >
            See how it works
            <ChevronDown size={16} />
          </motion.a>
        </div>
      </section>

      {/* -------- Everything below the hero shares the ambient net -------- */}
      <NetSection>
        {/* ---------------- ABOUT ---------------- */}
        <section className="page landing-about" id="about">
          <div className="container landing-about-grid">
            <motion.div
              className="landing-about-copy"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="eyebrow">What AuthNode is</span>
              <h2>Paper credentials can be forged. Math can&apos;t.</h2>
              <p>
                A diploma is just a PDF once it leaves the registrar&apos;s office \u2014
                easy to edit, easy to fake, and slow for anyone else to confirm.
                Verifying one the old way means a phone call, an email, and a wait
                that can run into weeks.
              </p>
              <p>
                AuthNode sits between institutions, students, and employers as a
                provable record layer. Every certificate is issued with a unique
                cryptographic fingerprint, anchored to a tamper-evident ledger the
                moment it&apos;s created. From then on, the certificate can answer one
                question instantly and honestly: is this exactly what was issued?
              </p>
              <ul className="landing-pillars">
                <li><span>Issued</span> once, by the institution of record.</li>
                <li><span>Hashed</span> forever, the instant it&apos;s created.</li>
                <li><span>Verified</span> anywhere, in under two seconds.</li>
              </ul>
            </motion.div>

            <motion.div
              className="landing-about-visual"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="landing-cert-canvas">
                <CertificateCanvas />
              </div>
              <div className="hash-chip landing-cert-hash">SHA-256 &middot; 9F3A1C7B4E2D8091&hellip;C4B7</div>
              <span className="landing-cert-caption">Every certificate carries its own proof.</span>
            </motion.div>
          </div>
        </section>

        {/* ---------------- FEATURES ---------------- */}
        <section className="page landing-features">
          <div className="container">
            <div className="page-header">
              <span className="eyebrow">What&apos;s inside</span>
              <h2>Everything trust requires, built in.</h2>
              <p>Each layer below exists to answer the same question faster: is this credential real?</p>
            </div>

            <div className="landing-feature-grid">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="landing-feature-card glass-card float-card"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: (i % 4) * 0.08 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="landing-feature-icon">
                    <f.icon size={22} strokeWidth={1.7} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section className="page landing-steps">
          <div className="container">
            <div className="page-header">
              <span className="eyebrow">How it works</span>
              <h2>Three steps, no manual verification.</h2>
            </div>

            <div className="landing-steps-list">
              {steps.map((s, i) => (
                <motion.div
                  className="landing-step-row glass-card"
                  key={s.n}
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <span className="landing-step-n">{s.n}</span>
                  <div className="landing-step-icon">
                    <s.icon size={20} strokeWidth={1.7} />
                  </div>
                  <div className="landing-step-copy">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- ROLES ---------------- */}
        <section className="page landing-roles">
          <div className="container">
            <div className="page-header">
              <span className="eyebrow">Built for three kinds of trust</span>
              <h2>Wherever you sit in the process, AuthNode fits.</h2>
            </div>

            <div className="role-grid">
              {roles.map((r, i) => (
                <motion.button
                  key={r.key}
                  className="role-card glass-card float-card"
                  onClick={() => navigate(r.action)}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <r.icon size={26} strokeWidth={1.6} />
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <FAQSection />

        {/* ---------------- FINAL CTA ---------------- */}
        <section className="landing-cta">
          <div className="container landing-cta-inner glass-card">
            <span className="eyebrow">Get started</span>
            <h2>Ready to make trust provable?</h2>
            <p>Issue your first certificate or verify one that already exists \u2014 both take less than a minute.</p>
            <div className="landing-cta-actions">
              <motion.button
                className="btn btn-primary btn-glow"
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Get started
                <ArrowRight size={17} strokeWidth={2.2} />
              </motion.button>
              <motion.button
                className="btn btn-ghost"
                onClick={() => navigate('/verify')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Verify a certificate
              </motion.button>
            </div>
          </div>
        </section>

        {/* ---------------- FOOTER ---------------- */}
        <Footer />
      </NetSection>
    </div>
  )
}