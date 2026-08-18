const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const CHAT_BASE = import.meta.env.VITE_CHAT_URL || 'http://localhost:8000'

// The JWT itself is the one thing kept in localStorage — this is
// standard practice (it's how the browser remembers "you're signed in"
// across a page refresh) and holds no certificate or personal data.
// Every other piece of app data now lives in SQLite on the backend and
// is fetched fresh over the network; nothing else touches localStorage.
const TOKEN_KEY = 'authnode_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.')
  }

  return data
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),

  issueCertificate: (payload) => request('/certificates/issue', { method: 'POST', body: payload, auth: true }),
  myCertificates: () => request('/certificates/mine', { auth: true }),
  verifyCertificate: (id) => request(`/certificates/verify/${encodeURIComponent(id)}`),

  adminUsers: () => request('/admin/users', { auth: true }),
  adminCertificates: (risk) => request(`/admin/certificates${risk ? `?risk=${risk}` : ''}`, { auth: true }),
  adminStats: () => request('/admin/stats', { auth: true }),
  adminAuditLogs: (limit = 100) => request(`/admin/audit-logs?limit=${limit}`, { auth: true }),

  // CSV download needs the auth header, so it can't be a plain <a href> —
  // fetch as a blob and trigger the browser's save dialog manually.
  async downloadCertificatesReport() {
    const token = getToken()
    const res = await fetch(`${API_BASE}/admin/reports/certificates.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Could not generate report.')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'authnode-certificates-report.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}

export async function getChatbotHealth() {
  const res = await fetch(`${CHAT_BASE}/api/health`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error('Chatbot unavailable')
  }
  return data
}

export async function askChatbot(message, sessionId = null) {
  const body = { message }
  if (sessionId) body.sessionId = sessionId

  const res = await fetch(`${CHAT_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail
    const errMsg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : 'Chatbot unavailable'
    throw new Error(errMsg)
  }
  return data
}