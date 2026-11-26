import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, FileText, ScrollText, Download, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import './Admin.css'

const RISK_COLORS = { low: '#3FAE6A', medium: '#C9A227', high: '#D14343' }
const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'certificates', label: 'Certificates', icon: FileText },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'audit', label: 'Audit Logs', icon: ScrollText },
]

export default function Admin() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const [stats, setStats] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [riskFilter, setRiskFilter] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user || user.role !== 'admin') {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    api.adminStats().then(setStats)
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    if (tab === 'certificates') {
      setBusy(true)
      api.adminCertificates(riskFilter).then((r) => setCertificates(r.certificates)).finally(() => setBusy(false))
    } else if (tab === 'users') {
      setBusy(true)
      api.adminUsers().then((r) => setUsers(r.users)).finally(() => setBusy(false))
    } else if (tab === 'audit') {
      setBusy(true)
      api.adminAuditLogs(150).then((r) => setLogs(r.logs)).finally(() => setBusy(false))
    }
  }, [tab, riskFilter, user])

  if (loading || !user || user.role !== 'admin') return null

  const riskData = stats?.certsByRisk.map((r) => ({ name: r.fraud_risk, value: r.count })) || []
  const verificationData = stats?.verificationsByStatus.map((v) => ({ name: v.status, count: v.count })) || []

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Admin Panel</span>
          <h1>Platform overview</h1>
          <p>Verification dashboard, certificate registry, user accounts, and audit history \u2014 all in one place.</p>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'admin-tab-active' : ''} onClick={() => setTab(t.key)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <motion.div className="admin-overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="stat-cards">
              <div className="card stat-card">
                <span className="stat-value">{stats.totals.users}</span>
                <span className="stat-label">Total users</span>
              </div>
              <div className="card stat-card">
                <span className="stat-value">{stats.totals.certificates}</span>
                <span className="stat-label">Certificates issued</span>
              </div>
              <div className="card stat-card">
                <span className="stat-value">{stats.totals.verificationAttempts}</span>
                <span className="stat-label">Verification attempts</span>
              </div>
            </div>

            <div className="chart-row">
              <div className="card chart-card">
                <h4>Certificates by fraud risk</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {riskData.map((entry, i) => (
                        <Cell key={i} fill={RISK_COLORS[entry.name] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141B2E', border: '1px solid #2A3654', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {riskData.map((d) => (
                    <span key={d.name}><i style={{ background: RISK_COLORS[d.name] }} /> {d.name} ({d.value})</span>
                  ))}
                </div>
              </div>

              <div className="card chart-card">
                <h4>Verification outcomes</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={verificationData}>
                    <XAxis dataKey="name" stroke="#B7B8AE" fontSize={12} />
                    <YAxis stroke="#B7B8AE" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#141B2E', border: '1px solid #2A3654', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#C9A227" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => api.downloadCertificatesReport()}>
              <Download size={16} /> Download full certificate report (CSV)
            </button>
          </motion.div>
        )}

        {tab === 'certificates' && (
          <div>
            <div className="admin-filter-row">
              <label>Filter by risk:</label>
              {['', 'low', 'medium', 'high'].map((r) => (
                <button
                  key={r || 'all'}
                  className={riskFilter === r ? 'filter-chip filter-chip-active' : 'filter-chip'}
                  onClick={() => setRiskFilter(r)}
                >
                  {r || 'All'}
                </button>
              ))}
            </div>
            {busy ? (
              <p className="admin-loading">Loading\u2026</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Student</th><th>Course</th><th>Institution</th><th>Risk</th><th>Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.id}</td>
                        <td>{c.student_name}</td>
                        <td>{c.course}</td>
                        <td>{c.institution}</td>
                        <td><span className={`risk-pill risk-pill-${c.fraud_risk}`}>{c.fraud_risk}</span></td>
                        <td className="mono small">{c.fraud_flags.join(', ') || '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-table-wrap">
            {busy ? (
              <p className="admin-loading">Loading\u2026</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`risk-pill risk-pill-${u.role === 'admin' ? 'high' : 'low'}`}>{u.role}</span></td>
                      <td className="mono small">{u.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div className="admin-table-wrap">
            {busy ? (
              <p className="admin-loading">Loading\u2026</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Event</th><th>Actor</th><th>Certificate</th><th>Detail</th><th>When</th></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td>{l.event_type}</td>
                      <td>{l.actor_label}</td>
                      <td className="mono small">{l.target_cert_id || '\u2014'}</td>
                      <td>{l.detail || '\u2014'}</td>
                      <td className="mono small">{l.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
