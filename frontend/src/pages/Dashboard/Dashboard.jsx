import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Award } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()

  const { user, loading } = useAuth()

  // Always initialize certificates as an empty array.
  const [certs, setCerts] = useState([])

  const [fetching, setFetching] = useState(true)

  const [copiedId, setCopiedId] = useState(null)

  const [error, setError] = useState('')

  useEffect(() => {
    // AuthContext is still checking the current session.
    if (loading) return

    // User must be logged in as a student.
    if (!user || user.role !== 'student') {
      navigate('/auth?role=student')
      return
    }

    setFetching(true)
    setError('')

    api
      .myCertificates()
      .then((r) => {
        const certificates =
          Array.isArray(r)
            ? r
            : Array.isArray(r?.certificates)
              ? r.certificates
              : []

        setCerts(certificates)
      })
      .catch((error) => {
        console.error(
          'Failed to load certificates:',
          error
        )

        setError(
          error.message ||
          'Failed to load certificates.'
        )

        setCerts([])
      })
      .finally(() => {
        setFetching(false)
      })

  }, [user, loading, navigate])


  // While authentication is loading.
  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="dashboard-loading">
            Checking your account...
          </p>
        </div>
      </div>
    )
  }


  // User is not a student.
  if (!user || user.role !== 'student') {
    return null
  }


  function handleShare(id) {
    const url =
      `${window.location.origin}/verify/${id}`

    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopiedId(id)

        setTimeout(() => {
          setCopiedId(null)
        }, 1600)
      })
      .catch((error) => {
        console.error(
          'Could not copy verification link:',
          error
        )
      })
  }


  return (
    <div className="page">

      <div className="container">

        <div className="page-header">

          <span className="eyebrow">
            {user.name}
          </span>

          <h1>
            Your credentials
          </h1>

          <p>
            Every certificate issued to you,
            each provable with its own fingerprint.
          </p>

        </div>


        {fetching ? (

          <p className="dashboard-loading">
            Loading your credentials...
          </p>

        ) : error ? (

          <div className="card dashboard-empty">

            <Award
              size={32}
              strokeWidth={1.4}
            />

            <p>
              {error}
            </p>

          </div>

        ) : !Array.isArray(certs) ||
          certs.length === 0 ? (

          <div className="card dashboard-empty">

            <Award
              size={32}
              strokeWidth={1.4}
            />

            <p>
              No certificates yet.
              Once an institution issues one
              to your email, it will show up here.
            </p>

          </div>

        ) : (

          <div className="cert-grid">

            {certs.map((c, i) => (

              <motion.div
                className="card cert-card"
                key={c.id}

                initial={{
                  opacity: 0,
                  y: 14
                }}

                animate={{
                  opacity: 1,
                  y: 0
                }}

                transition={{
                  duration: 0.35,
                  delay: i * 0.06
                }}
              >

                <div className="cert-card-qr">

                  <QRCodeSVG
                    value={
                      `${window.location.origin}/verify/${c.id}`
                    }

                    size={104}

                    bgColor="transparent"

                    fgColor="#EDEDE3"
                  />

                </div>


                <h3>
                  {c.certificate_title || c.course}
                </h3>


                <p className="cert-card-institution">
                  {c.institution}
                </p>


                <p className="cert-card-date">
                  {c.issue_date
                    ? new Date(
                        c.issue_date
                      ).toLocaleDateString()
                    : 'Date unavailable'}
                </p>


                <span className="hash-chip">
                  {c.id}
                </span>


                <button
                  className="
                    btn
                    btn-ghost
                    cert-share
                  "

                  onClick={() =>
                    handleShare(c.id)
                  }
                >

                  <Share2 size={15} />

                  {copiedId === c.id
                    ? 'Link copied'
                    : 'Share verification link'
                  }

                </button>

              </motion.div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}