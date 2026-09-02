const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const CHAT_BASE =
  import.meta.env.VITE_CHAT_URL ||
  'http://localhost:8000'

const AUTH_TOKEN_KEY = 'authnode_token'


// ============================================================
// AUTH TOKEN HELPERS
// ============================================================

export function getToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  if (!token) return

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // Ignore localStorage errors
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Ignore localStorage errors
  }
}


// ============================================================
// MAIN API REQUEST
// ============================================================

async function request(
  path,
  {
    method = 'GET',
    body,
    auth = true,
  } = {}
) {
  const headers = {
    'Content-Type': 'application/json',
  }

  // AuthNode backend uses JWT Bearer authentication.
  const token = auth ? getToken() : null

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
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
  }

  return data
}


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
      'Could not generate report.'
    )
  }


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


// ============================================================
// AUTHNODE API
// ============================================================

export const api = {

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
    if (data?.token) {
      setToken(data.token)
    }

    return data
  },


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
    if (data?.token) {
      setToken(data.token)
    }

    return data
  },


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


// ============================================================
// CHATBOT HEALTH CHECK
// ============================================================

export async function getChatbotHealth() {
  let response

  try {
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
      'Chatbot unavailable'
    )
  }


  return data
}


// ============================================================
// CHATBOT MESSAGE
// ============================================================

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