const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const CHAT_BASE =
  import.meta.env.VITE_CHAT_URL ||
  'http://localhost:8000'


// ============================================================
// MAIN API REQUEST FUNCTION
// ============================================================
//
// Authentication is handled through the httpOnly cookie
// created by the FastAPI backend.
//
// No JWT is stored in localStorage.
// No certificate data is stored in localStorage.
//
// credentials: 'include' allows the browser to automatically
// send the secure session cookie with every API request.
//

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
//
// Used for CSV and other binary downloads.
// The browser automatically sends the httpOnly cookie.
//

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


  const blob =
    await response.blob()


  const url =
    URL.createObjectURL(blob)


  const link =
    document.createElement('a')


  link.href = url

  link.download = filename


  document.body.appendChild(
    link
  )


  link.click()


  link.remove()


  URL.revokeObjectURL(
    url
  )
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


  // Current FastAPI session
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


  // Get certificates belonging to the
  // currently logged-in student.
  studentCertificates: () =>
    request(
      '/certificates/student'
    ),


  // Get one certificate by certificate ID.
  getCertificate: (id) =>
    request(
      `/certificates/${encodeURIComponent(id)}`
    ),


  // Cryptographically verify certificate.
  //
  // Backend checks:
  //
  // 1. Certificate exists
  // 2. Certificate is not revoked
  // 3. Certificate data hash matches
  // 4. Institution public key exists
  // 5. RSA signature is valid
  // 6. Blockchain verification can be added later
  //
  verifyCertificate: (id) =>
    request(
      `/certificates/${encodeURIComponent(id)}/verify`
    ),


  // ==========================================================
  // ADMIN
  // ==========================================================
  //
  // These functions are preserved from your original api.js.
  //
  // IMPORTANT:
  // Your FastAPI backend must actually contain these endpoints:
  //
  // /api/admin/users
  // /api/admin/certificates
  // /api/admin/stats
  // /api/admin/audit-logs
  //
  // If those endpoints don't exist yet, these functions will
  // remain unused until we add them to main.py.
  //
  // ==========================================================

  adminUsers: () =>
    request(
      '/admin/users'
    ),


  adminCertificates: (
    risk
  ) =>
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
      `/admin/audit-logs?limit=${
        encodeURIComponent(limit)
      }`
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
  const response =
    await fetch(
      `${CHAT_BASE}/api/health`
    )


  const data =
    await response
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


  const response =
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
        'Chatbot unavailable'

    }


    throw new Error(
      errorMessage
    )
  }


  return data
}