const API_BASE = import.meta.env.VITE_API_URL || '/api'
const CHAT_BASE = import.meta.env.VITE_CHAT_URL || '/chat-api'

const SESSION_TOKEN_KEY = 'authnode_token_v1'

function getToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

function setToken(token) {
  if (token) localStorage.setItem(SESSION_TOKEN_KEY, token)
  else localStorage.removeItem(SESSION_TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }

  if (!res.ok) {
    const message = data?.detail || data?.message || `Request failed (${res.status})`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return data
}

export async function login(name, role) {
  const session = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name, role }),
  })
  setToken(session.token)
  const meta = { name: session.name, role: session.role, loggedInAt: Date.now() }
  localStorage.setItem('authnode_session_meta_v1', JSON.stringify(meta))
  return meta
}

export function logout() {
  const token = getToken()
  setToken(null)
  localStorage.removeItem('authnode_session_meta_v1')
  if (token) {
    fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
}

export function getSession() {
  const token = getToken()
  if (!token) return null

  const cached = localStorage.getItem('authnode_session_meta_v1')
  return cached ? JSON.parse(cached) : null
}

export async function refreshSession() {
  const token = getToken()
  if (!token) return null

  try {
    const session = await request('/auth/session')
    const meta = { name: session.name, role: session.role, loggedInAt: Date.now() }
    localStorage.setItem('authnode_session_meta_v1', JSON.stringify(meta))
    return meta
  } catch {
    setToken(null)
    localStorage.removeItem('authnode_session_meta_v1')
    return null
  }
}

export async function issueCertificate(payload) {
  const entry = await request('/certificates/issue', {
    method: 'POST',
    body: JSON.stringify({
      student_name: payload.studentName,
      course: payload.course,
      issue_date: payload.issueDate,
    }),
  })

  return {
    id: entry.id,
    hash: entry.hash,
    studentName: entry.student_name,
    course: entry.course,
    institution: entry.institution,
    issueDate: entry.issue_date,
    createdAt: entry.created_at,
  }
}

export async function getCertificatesForStudent() {
  const rows = await request('/certificates/student')
  return rows.map(mapCert)
}

export async function verifyCertificate(id) {
  const result = await request(`/certificates/${encodeURIComponent(id)}/verify`)
  return {
    status: result.status,
    entry: result.entry ? mapCert(result.entry) : null,
  }
}

function mapCert(entry) {
  return {
    id: entry.id,
    hash: entry.hash,
    studentName: entry.student_name,
    course: entry.course,
    institution: entry.institution,
    issueDate: entry.issue_date,
    createdAt: entry.created_at,
  }
}

export async function askChatbot(question) {
  const res = await fetch(`${CHAT_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Chatbot unavailable')
  }
  return data
}
