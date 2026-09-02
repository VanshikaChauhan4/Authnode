const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const CHAT_BASE = import.meta.env.VITE_CHAT_URL || 'http://localhost:8000'
const AUTH_TOKEN_KEY = 'authnode_token'

export function getToken() {
  try { return localStorage.getItem(AUTH_TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  if (!token) return
  try { localStorage.setItem(AUTH_TOKEN_KEY, token) } catch {}
}
export function clearToken() {
  try { localStorage.removeItem(AUTH_TOKEN_KEY) } catch {}
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    // AuthNode uses JWT Bearer authentication, not a cookie session.
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(`Backend server is unavailable. Make sure AuthNode backend is running on ${API_BASE}.`)
  }

  const contentType = response.headers.get('content-type') || ''
  let data = {}
  if (contentType.includes('application/json')) data = await response.json().catch(() => ({}))
  else {
    const text = await response.text().catch(() => '')
    data = text ? { message: text } : {}
  }

  if (!response.ok) {
    throw new Error(data.detail || data.error || data.message || `Request failed with status ${response.status}`)
  }
  return data
}

async function downloadRequest(path, filename) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || data.error || data.message || 'Could not generate report.')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  signup: async (payload) => {
    const data = await request('/auth/signup', { method: 'POST', body: payload, auth: false })
    setToken(data.token)
    return data
  },

  login: async (payload) => {
    const data = await request('/auth/login', { method: 'POST', body: payload, auth: false })
    setToken(data.token)
    return data
  },

  logout: async () => {
    clearToken()
    return { ok: true }
  },

  session: () => request('/auth/me'),

  issueCertificate: (payload) => request('/certificates/issue', {
    method: 'POST',
    body: {
      studentName: payload.studentName,
      studentEmail: payload.studentEmail,
      course: payload.course,
      issueDate: payload.issueDate,
    },
  }),

  studentCertificates: async () => {
    const data = await request('/certificates/mine')
    return { ...data, certificates: Array.isArray(data?.certificates) ? data.certificates : [] }
  },

  myCertificates: async () => {
    const data = await request('/certificates/mine')
    return { ...data, certificates: Array.isArray(data?.certificates) ? data.certificates : [] }
  },

  // Public certificate verification. A verifier never needs to log in.
  getCertificate: (id) => request(`/certificates/verify/${encodeURIComponent(id)}`, { auth: false }),
  verifyCertificate: (id) => request(`/certificates/verify/${encodeURIComponent(id)}`, { auth: false }),

  adminUsers: () => request('/admin/users'),
  adminCertificates: (risk) => request(`/admin/certificates${risk ? `?risk=${encodeURIComponent(risk)}` : ''}`),
  adminStats: () => request('/admin/stats'),
  adminAuditLogs: (limit = 100) => request(`/admin/audit-logs?limit=${encodeURIComponent(limit)}`),
  downloadCertificatesReport: () => downloadRequest('/admin/reports/certificates.csv', 'authnode-certificates-report.csv'),
}

export async function getChatbotHealth() {
  let response
  try { response = await fetch(`${CHAT_BASE}/api/health`) }
  catch { throw new Error(`Chatbot service is unavailable. Make sure it is running on ${CHAT_BASE}.`) }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || data.error || data.message || 'Chatbot unavailable')
  return data
}

export async function askChatbot(message, sessionId = null) {
  const body = { message }
  if (sessionId) body.sessionId = sessionId
  let response
  try {
    response = await fetch(`${CHAT_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch { throw new Error(`Chatbot service is unavailable. Make sure it is running on ${CHAT_BASE}.`) }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    const messageText = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((item) => item.msg || 'Invalid request').join(', ') : data.error || data.message || 'Chatbot unavailable'
    throw new Error(messageText)
  }
  return data
}
