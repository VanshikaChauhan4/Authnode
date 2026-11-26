import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
import { ShieldCheck, ShieldAlert, ShieldX, UploadCloud, FileImage, LoaderCircle, RefreshCw, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Verify.css'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const MAX_SIZE = 10 * 1024 * 1024

function pick(text, patterns) {
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m?.[1]) return m[1].replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[,.]$/, '')
  }
  return ''
}
function parseDocument(text) {
  const clean = String(text || '').replace(/\r/g, '\n')
  return {
    certificateId: pick(clean, [/(?:certificate|credential|verification)\s*(?:id|no\.?|number|code)\s*[:#-]?\s*([A-Z0-9][A-Z0-9_-]{4,40})/i, /\b((?:CERT|TBI|AUTH)[-_][A-Z0-9_-]{4,35})\b/i]),
    studentName: pick(clean, [/(?:student|recipient|candidate|intern)\s*name\s*[:\-]?\s*([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,5})/i, /(?:awarded|presented|issued|granted)\s+to\s+([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,5})/i, /this\s+is\s+to\s+certify\s+that\s+([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,5})/i]),
    studentEmail: (clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0].toLowerCase(),
    course: pick(clean, [/(?:course|program|training|internship|certification)\s*(?:name|title)?\s*[:\-]\s*([^\n]{3,100})/i]),
    institution: pick(clean, [/(?:institution|issuer|issued\s+by|organization|university|college)\s*[:\-]\s*([^\n]{3,120})/i]),
  }
}
function isSupported(file) { return file && (/\.pdf$/i.test(file.name) || /\.(png|jpe?g|webp)$/i.test(file.name) || /^(application\/pdf|image\/)/i.test(file.type)) }

export default function Verify() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [certificate, setCertificate] = useState(null)
  const [emailShot, setEmailShot] = useState(null)
  const [certFields, setCertFields] = useState(null)
  const [emailFields, setEmailFields] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  useEffect(() => { if (!loading && user?.role === 'institution') { const token = localStorage.getItem('authnode_token'); fetch(`${API}/verifications/history`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.ok ? r.json() : null).then(d => { if (d?.items) setHistory(d.items) }).catch(() => {}) } }, [loading, user])

  const checks = useMemo(() => result?.checks || {}, [result])
  useEffect(() => { if (!loading && (!user || user.role !== 'institution')) navigate('/auth?role=institution') }, [loading, user, navigate])
  if (loading || !user || user.role !== 'institution') return <main className="verify-page"><div className="verify-container">Loading teacher workspace…</div></main>

  function choose(setter, file) {
    setError(''); setResult(null)
    if (!file) return
    if (!isSupported(file)) { setError('Upload a PDF, JPG, PNG or WEBP file.'); return }
    if (file.size > MAX_SIZE) { setError('Each file must be 10 MB or smaller.'); return }
    setter(file)
    if (setter === setCertificate) setCertFields(null)
    if (setter === setEmailShot) setEmailFields(null)
  }

  async function readFile(file) {
    const worker = await createWorker('eng')
    try {
      let text = ''
      if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
        const task = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
        const pdf = await task.promise
        if (pdf.numPages > 5) throw new Error('Please upload a PDF with no more than 5 pages.')
        const chunks = []
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n); const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height
          const ctx = canvas.getContext('2d'); await page.render({ canvasContext: ctx, viewport }).promise
          const { data } = await worker.recognize(canvas); chunks.push(data.text); canvas.width = 0; canvas.height = 0
        }
        text = chunks.join('\n')
        await task.destroy()
      } else {
        const { data } = await worker.recognize(file); text = data.text
      }
      return { text, confidence: 0, fields: parseDocument(text) }
    } finally { await worker.terminate() }
  }

  async function verify() {
    if (!certificate || !emailShot) { setError('Upload both the certificate image and the email screenshot.'); return }
    setBusy(true); setError(''); setResult(null)
    try {
      setProgress('Reading certificate image…')
      const cert = await readFile(certificate)
      setCertFields(cert)
      setProgress('Reading email screenshot…')
      const email = await readFile(emailShot)
      setEmailFields(email)
      setProgress('Comparing both documents with the official issuer record…')
      const token = localStorage.getItem('authnode_token')
      const response = await fetch(`${API}/certificates/verify-documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ certificate: cert.fields, email: email.fields }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || `Verification request failed (${response.status})`)
      setResult({ ...data, certConfidence: cert.confidence, emailConfidence: email.confidence })
    } catch (e) { setError(e.message || 'Could not complete verification.') }
    finally { setBusy(false); setProgress('') }
  }

  const status = result?.status || ''
  const verified = status === 'verified' && (checks.blockchainRegistered || checks.rsaSignatureValid)
  const title = verified ? 'Verification passed' : ['document_mismatch','name_mismatch','email_mismatch','course_mismatch','institution_mismatch','tampered','signature_invalid','revoked'].includes(status) ? 'Verification failed' : result ? 'Manual review required' : ''
  const fields = [
    ['Student name', 'studentName', certFields?.fields.studentName, emailFields?.fields.studentName],
    ['Certificate ID', 'certificateId', certFields?.fields.certificateId, emailFields?.fields.certificateId],
    ['Student email', 'studentEmail', certFields?.fields.studentEmail, emailFields?.fields.studentEmail],
    ['Course / programme', 'course', certFields?.fields.course, emailFields?.fields.course],
    ['Institution', 'institution', certFields?.fields.institution, emailFields?.fields.institution],
  ]
  const fieldStatus = (key) => key === 'studentName' ? checks.emailCertificateNameMatch : key === 'certificateId' ? checks.emailCertificateIdMatch : null

  return <main className="verify-page"><div className="verify-container">
    <header className="verify-heading"><div className="verify-heading-icon"><ShieldCheck size={27}/></div><span className="verify-eyebrow">TEACHER WORKSPACE</span><h1>Verify a student's certificate</h1><p>Compare the certificate against the student's email screenshot, then check the official issuer record and cryptographic proof.</p></header>
    <section className="verify-upload-grid">
      <UploadCard title="1. Certificate image" hint="Upload the certificate (PDF, JPG or PNG)" file={certificate} onChange={f=>choose(setCertificate,f)} />
      <UploadCard title="2. Email screenshot" hint="Upload the email confirming the award" file={emailShot} onChange={f=>choose(setEmailShot,f)} />
    </section>
    {error && <div className="verify-error" role="alert">{error}</div>}
    <button className="verify-primary" disabled={busy || !certificate || !emailShot} onClick={verify}>{busy ? <><LoaderCircle className="spin" size={18}/>{progress || 'Checking…'}</> : <><ShieldCheck size={18}/> Compare & verify documents</>}</button>
    {result && <section className="verify-result-panel">
      <div className="verify-result-heading">{verified ? <ShieldCheck size={30}/> : status.includes('mismatch') || status === 'tampered' || status === 'revoked' ? <ShieldX size={30}/> : <ShieldAlert size={30}/>}<div><h2>{title}</h2><p>{result.message}</p><small>Reference: {result.certificateId || 'Not identified'} · Saved to verification history: {result.saved ? 'Yes' : 'No (sign in to save)'}</small></div></div>
      <h3>Evidence breakdown</h3><div className="verify-comparison-table"><div className="verify-comparison-row verify-comparison-head"><span>Credential</span><span>Certificate</span><span>Email screenshot</span><span>Result</span></div>{fields.map(([label,key,a,b])=>{const same = a && b && a.toLowerCase().replace(/[^a-z0-9]/g,'') === b.toLowerCase().replace(/[^a-z0-9]/g,''); const check=fieldStatus(key); return <div className="verify-comparison-row" key={key}><b>{label}</b><span>{a || 'Not detected'}</span><span>{b || 'Not detected'}</span><span>{check === true || same ? <em className="match"><CheckCircle2 size={15}/> Match</em> : check === false || (a && b && !same) ? <em className="mismatch"><XCircle size={15}/> Mismatch</em> : <em><HelpCircle size={15}/> Not confirmed</em>}</span></div>})}</div>
      <h3>Authenticity checks</h3><div className="verify-check-list">{[
        ['Certificate ID agrees across both documents', checks.emailCertificateIdMatch],['Student name agrees across both documents', checks.emailCertificateNameMatch],['Official issuer record found', checks.databaseCertificateIdMatch],['Student identity matches official record', checks.databaseStudentMatch],['Student email matches official record', checks.databaseEmailMatch],['Course matches official record', checks.databaseCourseMatch],['Institution matches official record', checks.databaseInstitutionMatch],['SHA-256 fingerprint matches', checks.sha256Match],['Issuer RSA signature valid', checks.rsaSignatureValid],['Blockchain registration enabled', checks.blockchainEnabled],['Certificate registered on blockchain', checks.blockchainRegistered],['Blockchain hash and revocation checks passed', checks.blockchainHashMatch && !checks.blockchainRevoked],
      ].map(([label,ok])=><div key={label}><span>{label}</span>{ok === true ? <em className="match"><CheckCircle2 size={15}/> Passed</em> : ok === false ? <em className="mismatch"><XCircle size={15}/> Failed / unavailable</em> : <em><HelpCircle size={15}/> Not checked</em>}</div>)}</div>
      {!checks.blockchainEnabled && <p className="verify-warning">Blockchain is not configured on this server. This result is local database + SHA-256/RSA verification, not an on-chain verification. The email screenshot is a visual comparison only; it does not authenticate the sender or prove the email was actually sent.</p>}
      {verified && <div className="verify-stamp"><ShieldCheck size={18}/> Checked against the issuer record · {checks.blockchainRegistered ? 'Blockchain-backed' : 'Cryptographically checked (local)'}</div>}
    </section>}
    {history.length > 0 && <section className="verify-result-panel"><h3>Recent verification history</h3><div className="verify-check-list">{history.slice(0,8).map((item, i)=><div key={`${item.verified_at}-${i}`}><span>{item.certificate_id || 'Certificate ID unavailable'} · {item.message || item.status}</span><b>{item.status}</b></div>)}</div></section>}
    <button className="verify-reset" onClick={()=>{setCertificate(null);setEmailShot(null);setCertFields(null);setEmailFields(null);setResult(null);setError('')}}><RefreshCw size={16}/> Start another verification</button>
  </div></main>
}

function UploadCard({title,hint,file,onChange}) { const preview = useMemo(() => file && file.type.startsWith('image/') ? URL.createObjectURL(file) : '', [file]); useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview]); return <label className="teacher-upload-card"><span className="teacher-upload-icon"><FileImage size={25}/></span><strong>{title}</strong><small>{hint}</small><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf" onChange={e=>onChange(e.target.files?.[0])}/><span className="teacher-file-name">{file ? file.name : <><UploadCloud size={16}/> Choose file</>}</span>{file && (preview ? <img className="teacher-preview" src={preview} alt="Uploaded document preview"/> : <small>PDF selected · up to 5 pages will be read</small>)}</label> }
