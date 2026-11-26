<<<<<<< HEAD

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '')

const CHAT_BASE = (
  import.meta.env.VITE_CHAT_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

const AUTH_TOKEN_KEY = 'authnode_token'

// ============================================================
// TOKEN HELPERS
=======
const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const CHAT_BASE =
  import.meta.env.VITE_CHAT_URL ||
  'http://localhost:8000'

const AUTH_TOKEN_KEY = 'authnode_token'


// ============================================================
// AUTH TOKEN HELPERS
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
// ============================================================

export function getToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
<<<<<<< HEAD
  if (!token || typeof token !== 'string') return

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Could not save AuthNode token:', error)
=======
  if (!token) return

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // Ignore localStorage errors
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
<<<<<<< HEAD
  } catch (error) {
    console.error('Could not clear AuthNode token:', error)
  }
}

export function authHeaders() {
  const token = getToken()

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function getErrorMessage(data, fallback) {
  const detail = data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item

        return item?.msg || item?.message || 'Invalid request'
      })
      .join(', ')
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  return fallback
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}))
  }

  const text = await response.text().catch(() => '')

  return text ? { message: text } : {}
}

function createApiError(data, response, fallback) {
  const error = new Error(
    getErrorMessage(
      data,
      fallback || `Request failed with status ${response.status}`
    )
  )

  error.status = response.status
  error.data = data

  return error
}
=======
  } catch {
    // Ignore localStorage errors
  }
}

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8

// ============================================================
// MAIN API REQUEST
// ============================================================

async function request(
  path,
  {
    method = 'GET',
    body,
    auth = true,
<<<<<<< HEAD
    headers: customHeaders = {},
    signal,
  } = {}
) {
  const headers = {
    Accept: 'application/json',
    ...customHeaders,
  }

  // Attach JWT for protected endpoints.
  if (auth) {
    Object.assign(headers, authHeaders())
  }

  let requestBody

  if (body !== undefined) {
    // Never manually set Content-Type for FormData.
    // Browser must generate the multipart boundary.
    if (
      typeof FormData !== 'undefined' &&
      body instanceof FormData
    ) {
      requestBody = body
    } else if (
      typeof body === 'string' ||
      body instanceof Blob
    ) {
      requestBody = body
    } else {
      headers['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
=======
  } = {}
) {
  const headers = {
    'Content-Type': 'application/json',
  }

  // AuthNode backend uses JWT Bearer authentication.
  const token = auth ? getToken() : null

  if (token) {
    headers.Authorization = `Bearer ${token}`
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
  }

  let response

  try {
<<<<<<< HEAD
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: requestBody,
      credentials: 'include',
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new Error(
      `Backend server is unavailable. Make sure AuthNode backend is running at ${API_BASE}.`
    )
  }

  const data = await readResponse(response)

  if (!response.ok) {
    throw createApiError(data, response)
=======
    response = await fetch(
      `${API_BASE}${path}`,
      {
        method,
        headers,
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    )
  } catch {
    throw new Error(
      `Backend server is unavailable. Make sure AuthNode backend is running on ${API_BASE}.`
    )
  }


  // ==========================================================
  // SAFELY READ RESPONSE
  // ==========================================================

  const contentType =
    response.headers.get('content-type') || ''

  let data = {}

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    data = await response
      .json()
      .catch(() => ({}))
  } else {
    const text =
      await response
        .text()
        .catch(() => '')

    data = text
      ? { message: text }
      : {}
  }


  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.error ||
      data.message ||
      `Request failed with status ${response.status}`
    )
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
  }

  return data
}

<<<<<<< HEAD
// ============================================================
// DOWNLOAD REQUEST
// ============================================================

async function downloadRequest(path, filename) {
  let response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, application/octet-stream, application/json',
        ...authHeaders(),
      },
      credentials: 'include',
    })
  } catch {
    throw new Error('Backend server is unavailable.')
  }

  if (!response.ok) {
    const data = await readResponse(response)

    throw createApiError(
      data,
      response,
=======

// ============================================================
// DOWNLOAD FILE REQUEST
// ============================================================

async function downloadRequest(
  path,
  filename
) {
  const token = getToken()

  const headers = {}

  if (token) {
    headers.Authorization =
      `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(
      `${API_BASE}${path}`,
      {
        method: 'GET',
        headers,
      }
    )
  } catch {
    throw new Error(
      'Backend server is unavailable.'
    )
  }


  if (!response.ok) {
    let data = {}

    try {
      data = await response.json()
    } catch {
      data = {}
    }

    throw new Error(
      data.detail ||
      data.error ||
      data.message ||
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
      'Could not generate report.'
    )
  }

<<<<<<< HEAD
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoke after the browser has started the download.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 1000)
}

// ============================================================
// CERTIFICATE RESPONSE NORMALIZER
// ============================================================

function normalizeCertificatesResponse(data) {
  if (Array.isArray(data)) {
    return {
      certificates: data,
    }
  }

  return {
    ...data,
    certificates: Array.isArray(data?.certificates)
      ? data.certificates
      : [],
  }
}
=======

  const blob =
    await response.blob()

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)

  link.click()

  link.remove()

  URL.revokeObjectURL(url)
}

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8

// ============================================================
// AUTHNODE API
// ============================================================

export const api = {

<<<<<<< HEAD
  // ----------------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------------

  signup: async (payload) => {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: payload,
      auth: false,
    })

=======
  // ==========================================================
  // CERTIFICATE BLOCKCHAIN HELPERS
  // ==========================================================

  certificateStatus: async (certificateId) => request(`/certificates/${encodeURIComponent(certificateId)}/status`),
  revokeCertificate: async (certificateId) => request(`/certificates/${encodeURIComponent(certificateId)}/revoke`, { method: 'POST' }),
  verifyCertificatePdf: async (certificateId, file) => {
    const form = new FormData()
    form.append('cert_id', certificateId)
    form.append('file', file)
    const response = await fetch(`${API_BASE}/certificates/verify`, { method: 'POST', credentials: 'include', body: form })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.detail || `Verification failed (${response.status})`)
    return data
  },

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  signup: async (payload) => {
    const data =
      await request(
        '/auth/signup',
        {
          method: 'POST',
          body: payload,
          auth: false,
        }
      )

    // IMPORTANT:
    // Save JWT immediately after signup.
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
    if (data?.token) {
      setToken(data.token)
    }

    return data
  },

<<<<<<< HEAD
  login: async (payload) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    })

=======

  login: async (payload) => {
    const data =
      await request(
        '/auth/login',
        {
          method: 'POST',
          body: payload,
          auth: false,
        }
      )

    // IMPORTANT:
    // Save JWT immediately after login.
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
    if (data?.token) {
      setToken(data.token)
    }

    return data
  },

<<<<<<< HEAD
  logout: async () => {
    let serverRevoked = false
    let warning = null

    try {
      await request('/auth/logout', {
        method: 'POST',
      })

      serverRevoked = true
    } catch (error) {
      // Local logout should still work if the backend
      // is temporarily unavailable.
      warning = error.message
    } finally {
      clearToken()
    }

    return {
      ok: true,
      serverRevoked,
      warning,
    }
  },

  session: () => request('/auth/me'),

  refreshSession: () => request('/auth/session'),

  // ----------------------------------------------------------
  // CERTIFICATE ISSUE
  // ----------------------------------------------------------

  issueCertificate: (payload) => {
    if (!payload) {
      throw new Error('Certificate details are required.')
    }

    return request('/certificates/issue', {
      method: 'POST',
      body: {
        studentName: payload.studentName,
        studentEmail: payload.studentEmail,
        course: payload.course,
        issueDate: payload.issueDate,
        certificateTitle:
          payload.certificateTitle || 'Certificate of Completion',
        status: payload.status || 'ACTIVE',
        verification_type:
          payload.verification_type || 'BLOCKCHAIN_NATIVE',
      },
    })
  },

  // ----------------------------------------------------------
  // STUDENT CERTIFICATES / DASHBOARD
  // ----------------------------------------------------------

  studentCertificates: async () => {
    const data = await request('/certificates/mine')

    return normalizeCertificatesResponse(data)
  },

  myCertificates: async () => {
    const data = await request('/certificates/mine')

    return normalizeCertificatesResponse(data)
  },

  // ----------------------------------------------------------
  // CERTIFICATE LOOKUP
  // ----------------------------------------------------------

  getCertificate: (id) => {
    if (!id) {
      throw new Error('Certificate ID is required.')
    }

    return request(
      `/certificates/verify/${encodeURIComponent(id)}`,
      { auth: false }
    )
  },

  // ----------------------------------------------------------
  // PUBLIC CERTIFICATE VERIFICATION
  // ----------------------------------------------------------

  verifyCertificate: (id) => {
    if (!id) {
      throw new Error('Certificate ID is required.')
    }

    return request(
      `/certificates/verify/${encodeURIComponent(id)}`,
      { auth: false }
    )
  },

  // ----------------------------------------------------------
  // UPLOADED CERTIFICATE PDF / JPEG VERIFICATION
  // ----------------------------------------------------------

  verifyCertificatePdf: (certificateId, file) => {
    if (!certificateId) {
      throw new Error('Certificate ID is required.')
    }

    if (!file) {
      throw new Error('Please select a certificate file.')
    }

    const form = new FormData()

    form.append('cert_id', certificateId)
    form.append('file', file)

    return request('/certificates/verify', {
      method: 'POST',
      body: form,
      auth: true,
    })
  },

  // ----------------------------------------------------------
  // CERTIFICATE STATUS AND BLOCKCHAIN
  // ----------------------------------------------------------

  certificateStatus: (certificateId) => {
    if (!certificateId) {
      throw new Error('Certificate ID is required.')
    }

    return request(
      `/certificates/${encodeURIComponent(certificateId)}/status`
    )
  },

  revokeCertificate: (certificateId) => {
    if (!certificateId) {
      throw new Error('Certificate ID is required.')
    }

    return request(
      `/certificates/${encodeURIComponent(certificateId)}/revoke`,
      {
        method: 'POST',
      }
    )
  },

  // ----------------------------------------------------------
  // TWO-DOCUMENT VERIFICATION
  // Certificate OCR data + Email OCR data
  // ----------------------------------------------------------

  verifyDocuments: (certificate, email) => {
    if (!certificate || !email) {
      throw new Error(
        'Both certificate and email data are required.'
      )
    }

    return request('/certificates/verify-documents', {
      method: 'POST',
      body: {
        certificate,
        email,
      },
    })
  },

  // ----------------------------------------------------------
  // VERIFICATION HISTORY
  // ----------------------------------------------------------

  verificationHistory: async () => {
    const data = await request('/verifications/history')

    return {
      ...data,
      items: Array.isArray(data?.items) ? data.items : [],
    }
  },

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  adminUsers: () => request('/admin/users'),

  adminCertificates: (risk) => {
    const query = risk
      ? `?risk=${encodeURIComponent(risk)}`
      : ''

    return request(`/admin/certificates${query}`)
  },

  adminStats: () => request('/admin/stats'),

  adminAuditLogs: (limit = 100) => {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 100, 1),
      500
    )

    return request(
      `/admin/audit-logs?limit=${encodeURIComponent(safeLimit)}`
    )
  },

  // ----------------------------------------------------------
  // ADMIN CSV REPORT
  // ----------------------------------------------------------

  downloadCertificatesReport: () => {
    return downloadRequest(
      '/admin/reports/certificates.csv',
      'authnode-certificates-report.csv'
    )
  },
}

=======

  logout: async () => {
    // JWT authentication is stateless.
    // There is no need to call a backend logout endpoint.
    clearToken()

    return {
      ok: true,
    }
  },


  // ==========================================================
  // CURRENT LOGGED-IN USER
  // ==========================================================

  // Backend endpoint:
  // GET /api/auth/me
  session: () =>
    request(
      '/auth/me'
    ),


  // ==========================================================
  // CERTIFICATE ISSUE
  // ==========================================================

  issueCertificate: (payload) =>
    request(
      '/certificates/issue',
      {
        method: 'POST',

        body: {
          studentName:
            payload.studentName,

          studentEmail:
            payload.studentEmail,

          course:
            payload.course,

          issueDate:
            payload.issueDate,
        },
      }
    ),


  // ==========================================================
  // STUDENT CERTIFICATES
  // ==========================================================

  studentCertificates: async () => {
    const data =
      await request(
        '/certificates/mine'
      )

    if (Array.isArray(data)) {
      return {
        certificates: data,
      }
    }

    return {
      ...data,

      certificates:
        Array.isArray(
          data?.certificates
        )
          ? data.certificates
          : [],
    }
  },


  // ==========================================================
  // BACKWARD COMPATIBILITY
  // Dashboard may use api.myCertificates()
  // ==========================================================

  myCertificates: async () => {
    const data =
      await request(
        '/certificates/mine'
      )

    if (Array.isArray(data)) {
      return {
        certificates: data,
      }
    }

    return {
      ...data,

      certificates:
        Array.isArray(
          data?.certificates
        )
          ? data.certificates
          : [],
    }
  },


  // ==========================================================
  // SINGLE CERTIFICATE
  // ==========================================================

  getCertificate: (id) =>
    request(
      `/certificates/verify/${encodeURIComponent(id)}`,
      {
        auth: false,
      }
    ),


  // ==========================================================
  // VERIFY CERTIFICATE
  // ==========================================================

  // Certificate verification is PUBLIC.
  // A person scanning a certificate QR code
  // should NOT have to log in.
  verifyCertificate: (id) =>
    request(
      `/certificates/verify/${encodeURIComponent(id)}`,
      {
        auth: false,
      }
    ),


  // ==========================================================
  // ADMIN
  // ==========================================================

  adminUsers: () =>
    request(
      '/admin/users'
    ),


  adminCertificates: (risk) =>
    request(
      `/admin/certificates${
        risk
          ? `?risk=${encodeURIComponent(risk)}`
          : ''
      }`
    ),


  adminStats: () =>
    request(
      '/admin/stats'
    ),


  adminAuditLogs: (
    limit = 100
  ) =>
    request(
      `/admin/audit-logs?limit=${encodeURIComponent(limit)}`
    ),


  // ==========================================================
  // ADMIN CSV REPORT
  // ==========================================================

  downloadCertificatesReport: () =>
    downloadRequest(
      '/admin/reports/certificates.csv',
      'authnode-certificates-report.csv'
    ),
}


>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
// ============================================================
// CHATBOT HEALTH CHECK
// ============================================================

export async function getChatbotHealth() {
  let response

  try {
<<<<<<< HEAD
    response = await fetch(`${CHAT_BASE}/api/health`, {
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new Error(
      `Chatbot service is unavailable. Make sure it is running at ${CHAT_BASE}.`
    )
  }

  const data = await readResponse(response)

  if (!response.ok) {
    throw createApiError(
      data,
      response,
=======
    response =
      await fetch(
        `${CHAT_BASE}/api/health`
      )
  } catch {
    throw new Error(
      `Chatbot service is unavailable. Make sure it is running on ${CHAT_BASE}.`
    )
  }


  const data =
    await response
      .json()
      .catch(() => ({}))


  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.error ||
      data.message ||
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
      'Chatbot unavailable'
    )
  }

<<<<<<< HEAD
  return data
}

=======

  return data
}


>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
// ============================================================
// CHATBOT MESSAGE
// ============================================================

<<<<<<< HEAD
export async function askChatbot(message, sessionId = null) {
  if (!message || !String(message).trim()) {
    throw new Error('Please enter a message.')
  }

  const body = {
    message: String(message).trim(),
  }

  if (sessionId) {
    body.sessionId = sessionId
  }

  let response

  try {
    response = await fetch(`${CHAT_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      `Chatbot service is unavailable. Make sure it is running at ${CHAT_BASE}.`
    )
  }

  const data = await readResponse(response)

  if (!response.ok) {
    throw createApiError(
      data,
      response,
      'Chatbot unavailable'
    )
  }

  return data
}
=======
export async function askChatbot(
  message,
  sessionId = null
) {
  const body = {
    message,
  }

  if (sessionId) {
    body.sessionId =
      sessionId
  }


  let response

  try {
    response =
      await fetch(
        `${CHAT_BASE}/api/chat`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(body),
        }
      )
  } catch {
    throw new Error(
      `Chatbot service is unavailable. Make sure it is running on ${CHAT_BASE}.`
    )
  }


  const data =
    await response
      .json()
      .catch(() => ({}))


  if (!response.ok) {
    const detail =
      data.detail

    let errorMessage

    if (
      typeof detail ===
      'string'
    ) {
      errorMessage =
        detail
    } else if (
      Array.isArray(detail)
    ) {
      errorMessage =
        detail
          .map(
            (item) =>
              item.msg ||
              'Invalid request'
          )
          .join(', ')
    } else {
      errorMessage =
        data.error ||
        data.message ||
        'Chatbot unavailable'
    }

    throw new Error(
      errorMessage
    )
  }


  return data
}
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
