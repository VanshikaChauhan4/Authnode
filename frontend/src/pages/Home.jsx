import { useRef, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line } from '@react-three/drei'
import * as THREE from 'three'
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
import './LandingPage.css'

/* ============================================================
   3D — HERO GLOBE
   A wireframe globe wrapped in a lattice of "verification" arcs,
   standing in for AuthNode's distributed ledger of institutions.
   ============================================================ */

function GlobeMesh() {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const dotsRef = useRef(null)

  useFrame((_, delta) => {
    if (outerRef.current) outerRef.current.rotation.y += delta * 0.09
    if (innerRef.current) innerRef.current.rotation.y -= delta * 0.06
    if (dotsRef.current) dotsRef.current.rotation.y += delta * 0.09
  })

  // Fixed set of node points scattered on the globe's surface —
  // stand-ins for issuing institutions on the network.
  const nodes = useRef(
    Array.from({ length: 22 }, (_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 22)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      return new THREE.Vector3(
        1.62 * Math.sin(phi) * Math.cos(theta),
        1.62 * Math.sin(phi) * Math.sin(theta),
        1.62 * Math.cos(phi)
      )
    })
  ).current

  return (
    <group>
      <group ref={outerRef}>
        <mesh>
          <sphereGeometry args={[1.6, 28, 28]} />
          <meshBasicMaterial color="#C9A227" wireframe transparent opacity={0.16} />
        </mesh>
      </group>

      <group ref={innerRef}>
        <mesh>
          <icosahedronGeometry args={[1.15, 1]} />
          <meshBasicMaterial color="#EDEDE3" wireframe transparent opacity={0.14} />
        </mesh>
      </group>

      <group ref={dotsRef}>
        {nodes.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#E8C158" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function HeroGlobeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.75]}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 4, 6]} intensity={0.5} color="#E8C158" />
      <GlobeMesh />
    </Canvas>
  )
}

/* ============================================================
   3D — CERTIFICATE MEDALLION
   A floating card + seal ring standing in for a single credential
   anchored to the ledger: the "artifact" the whole product protects.
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
        {/* card body */}
        <mesh>
          <boxGeometry args={[2.1, 1.44, 0.045]} />
          <meshStandardMaterial color="#141B2E" roughness={0.6} metalness={0.25} />
        </mesh>

        {/* gold border line */}
        <Line points={cardEdges} color="#C9A227" lineWidth={1.4} transparent opacity={0.8} />

        {/* engraved rule lines standing in for certificate text */}
        {[0.32, 0.1, -0.12].map((y, i) => (
          <mesh key={i} position={[i === 0 ? -0.12 : 0, y, 0.026]}>
            <boxGeometry args={[i === 0 ? 1.1 : 1.35, 0.035, 0.01]} />
            <meshBasicMaterial color="#B7B8AE" transparent opacity={0.35} />
          </mesh>
        ))}

        {/* seal ring */}
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
   ============================================================ */

const features = [
  {
    icon: Fingerprint,
    title: 'Cryptographic fingerprinting',
    desc: 'Every certificate is hashed the moment it\u2019s issued. Change a single character in the underlying record and the fingerprint changes completely, so silent edits are mathematically obvious rather than a matter of trust.',
  },
  {
    icon: Link2,
    title: 'Blockchain-anchored ledger',
    desc: 'Fingerprints are committed to an append-only, distributed ledger the moment a certificate is issued. No one, including AuthNode, can quietly edit or delete a record after the fact.',
  },
  {
    icon: ScanSearch,
    title: 'One-scan verification',
    desc: 'Anyone can scan a certificate\u2019s QR code and get a real-time match or mismatch. No calls to a registrar\u2019s office, no multi-day email chains, no benefit of the doubt.',
  },
  {
    icon: Building2,
    title: 'Issuance console for institutions',
    desc: 'An institution submits a record once. AuthNode generates the certificate, its fingerprint, and its QR code automatically, ready to hand to the student in seconds instead of weeks.',
  },
  {
    icon: GraduationCap,
    title: 'A wallet for every credential',
    desc: 'Every certificate a student earns lives in one dashboard \u2014 downloadable as a PDF, shareable by link or QR, with the cryptographic proof already built in, not bolted on afterward.',
  },
  {
    icon: ShieldCheck,
    title: 'Tamper-evident by design',
    desc: 'The certificate\u2019s visual layout and its underlying fingerprint are tied together, so an edited PDF and an edited hash always tell the same story \u2014 there\u2019s nowhere for a forgery to hide.',
  },
  {
    icon: History,
    title: 'A full audit trail',
    desc: 'Every issuance and every verification is logged with a timestamp, giving institutions a transparent record of exactly who checked a credential, and when they did it.',
  },
  {
    icon: KeyRound,
    title: 'Role-based access',
    desc: 'Institutions, students, and employers each see exactly what their role needs and nothing more, keeping sensitive academic records compartmentalized by default.',
  },
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
    desc: 'The fingerprint is anchored to the ledger and can never be quietly edited. From this point on, the certificate carries proof of its own authenticity.',
  },
  {
    n: '03',
    icon: QrCode,
    title: 'Verify',
    desc: 'Anyone can scan the certificate\u2019s QR code. AuthNode recomputes the fingerprint and confirms, instantly, whether it still matches.',
  },
]

const roles = [
  {
    key: 'institution',
    icon: Building2,
    title: 'Institution',
    desc: 'Issue tamper-evident certificates to your students in seconds, and retire manual verification requests for good.',
    action: '/auth?role=institution',
  },
  {
    key: 'student',
    icon: GraduationCap,
    title: 'Student',
    desc: 'Hold every credential you\u2019ve earned in one place, shareable by QR whenever an employer needs to see it.',
    action: '/auth?role=student',
  },
  {
    key: 'employer',
    icon: ScanSearch,
    title: 'Employer',
    desc: 'Confirm a certificate is real in one scan \u2014 no calls, no waiting on someone else\u2019s office hours.',
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
      {/* ---------------- HERO ---------------- */}
      <section className="landing-hero guilloche-bg">
        <div className="landing-hero-canvas" aria-hidden="true">
          <HeroGlobeCanvas />
        </div>

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
                className="btn btn-primary"
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
                className="landing-feature-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.07 }}
                whileHover={{ y: -5 }}
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
                className="landing-step-row"
                key={s.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
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

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="landing-cta guilloche-bg">
        <div className="container landing-cta-inner">
          <span className="eyebrow">Get started</span>
          <h2>Ready to make trust provable?</h2>
          <p>Issue your first certificate or verify one that already exists \u2014 both take less than a minute.</p>
          <div className="landing-cta-actions">
            <motion.button
              className="btn btn-primary"
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
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="landing-footer-brand">
            <ShieldCheck size={18} strokeWidth={2.2} />
            <span>AuthNode</span>
          </div>
          <p className="landing-footer-tagline">Certificates verified, not just certified.</p>
          <p className="landing-footer-copy">&copy; {new Date().getFullYear()} AuthNode.</p>
        </div>
      </footer>
    </div>
  )
}