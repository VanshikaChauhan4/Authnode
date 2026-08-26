const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const CHAT_BASE =
  import.meta.env.VITE_CHAT_URL ||
  'http://localhost:8000'


// ============================================================
// MAIN API REQUEST FUNCTION
// ============================================================

async function request(
  path,
  {
    method = 'GET',
    body,
  } = {}
) {
  const headers = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      headers,
      credentials: 'include',
      body: body
        ? JSON.stringify(body)
        : undefined,
    }
  )

  const data = await response
    .json()
    .catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.error ||
      'Something went wrong. Please try again.'
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
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )

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
      'Could not generate report.'
    )
  }

  const blob = await response.blob()

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


  // Get current logged-in user session
  session: () =>
    request(
      '/auth/session'
    ),


  // ==========================================================
  // CERTIFICATES
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

  studentCertificates: () =>
    request(
      '/certificates/student'
    ),


  // IMPORTANT:
  // Dashboard.jsx is currently calling:
  //
  // api.myCertificates()
  //
  // Therefore we provide this alias so the
  // existing Dashboard does not crash.

  myCertificates: () =>
    request(
      '/certificates/student'
    ),


  // ==========================================================
  // GET SINGLE CERTIFICATE
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

  const response = await fetch(
    `${CHAT_BASE}/api/health`
  )

  const data = await response
    .json()
    .catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.error ||
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


  const response = await fetch(
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


  const data = await response
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
        'Chatbot unavailable'

    }


    throw new Error(
      errorMessage
    )
  }


  return data
}