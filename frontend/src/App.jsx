import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import ChatWidget from './components/ChatWidget'
import Home from './pages/Home/Home'
import Auth from './pages/Auth/Auth'
import Issue from './pages/Issue/Issue'
import Verify from './pages/Verify/Verify'
import Dashboard from './pages/Dashboard/Dashboard'
import { refreshSession } from './lib/ledger'
import './App.css'

export default function App() {
  useEffect(() => {
    refreshSession()
  }, [])

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:id" element={<Verify />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <ChatWidget />
    </div>
  )
}
