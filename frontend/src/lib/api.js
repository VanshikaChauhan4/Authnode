// All requests use httpOnly cookies for session state — nothing session-related
// is ever written to localStorage/sessionStorage on the client.
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const CHAT_BASE = import.meta.env.VITE_CHAT_URL || '/chat-api'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include', // send/receive the httpOnly session cookie
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

export async function signup(name, role, password) {
  const session = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, role, password }),
  })
  return { name: session.name, role: session.role }
}

export async function login(name, role, password) {
  const session = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name, role, password }),
  })
  return { name: session.name, role: session.role }
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' })
  } catch {
    // even if the network call fails, the caller clears local session state
  }
}

export async function fetchSession() {
  try {
    const session = await request('/auth/session')
    return { name: session.name, role: session.role }
  } catch {
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

  return mapCert(entry)
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
