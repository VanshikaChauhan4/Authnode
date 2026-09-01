const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const CHAT_BASE =
  import.meta.env.VITE_CHAT_URL ||
  'http://localhost:8000'


// ============================================================
// MAIN API REQUEST
// ============================================================

async function request(
  path,
  {
    method = 'GET',
    body,
  } = {}
) {
  let response

  try {
    response = await fetch(
      `${API_BASE}${path}`,
      {
        method,

        headers: {
          'Content-Type': 'application/json',
        },

        // FastAPI httpOnly session cookie
        credentials: 'include',

        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    )
  } catch (error) {
    throw new Error(
      `Backend server is unavailable. Make sure FastAPI is running on ${API_BASE}.`
    )
  }


  // Safely read response
  const contentType =
    response.headers.get('content-type') || ''

  let data = {}

  if (contentType.includes('application/json')) {
    data = await response
      .json()
      .catch(() => ({}))
  } else {
    const text = await response
      .text()
      .catch(() => '')

    data = text
      ? { message: text }
      : {}
  }


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
  let response

  try {
    response = await fetch(
      `${API_BASE}${path}`,
      {
        method: 'GET',

        credentials: 'include',
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

  signup: (payload) =>
    request(
      '/auth/signup',
      {
        method: 'POST',
        body: payload,
      }
    ),


  login: (payload) =>
    request(
      '/auth/login',
      {
        method: 'POST',
        body: payload,
      }
    ),


  logout: () =>
    request(
      '/auth/logout',
      {
        method: 'POST',
      }
    ),


  // Current logged-in user
  session: () =>
    request(
      '/auth/session'
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
          student_name:
            payload.studentName,

          student_email:
            payload.studentEmail,

          course:
            payload.course,

          certificate_title:
            payload.certificateTitle ||
            'Certificate of Completion',

          issue_date:
            payload.issueDate,

          status:
            payload.status ||
            'ACTIVE',

          verification_type:
            payload.verificationType ||
            'BLOCKCHAIN_NATIVE',
        },
      }
    ),


  // ==========================================================
  // STUDENT CERTIFICATES
  // ==========================================================

  /*
   * Primary function.
   *
   * Backend endpoint:
   * GET /api/certificates/student
   */
  studentCertificates: async () => {
    const data =
      await request(
        '/certificates/student'
      )

    /*
     * Expected backend response:
     *
     * {
     *   "certificates": [...]
     * }
     *
     * But this also supports:
     *
     * [...]
     */

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


  /*
   * BACKWARD COMPATIBILITY
   *
   * Dashboard.jsx was calling:
   *
   * api.myCertificates()
   *
   * Therefore keep this function.
   */
  myCertificates: async () => {
    const data =
      await request(
        '/certificates/student'
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
      `/certificates/${encodeURIComponent(id)}`
    ),


  // ==========================================================
  // VERIFY CERTIFICATE
  // ==========================================================

  verifyCertificate: (id) =>
    request(
      `/certificates/${encodeURIComponent(id)}/verify`
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
      typeof detail === 'string'
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