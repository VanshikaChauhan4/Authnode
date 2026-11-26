import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'

import LandingPage from './pages/LandingPage/LandingPage'
import Auth from './pages/Auth/Auth'
import Issue from './pages/Issue/Issue'
import Verify from './pages/Verify/Verify'
import Dashboard from './pages/Dashboard/Dashboard'
import Admin from './pages/Admin/Admin'
import CertificateRecord from './pages/CertificateRecord/CertificateRecord'

import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Navbar />

        <main>
          <Routes>
            <Route
              path="/"
              element={<LandingPage />}
            />

            <Route
              path="/auth"
              element={<Auth />}
            />

            <Route
              path="/issue"
              element={<Issue />}
            />

            <Route
              path="/certificate-record"
              element={<CertificateRecord />}
            />

            <Route
              path="/verify"
              element={<Verify />}
            />

            <Route
              path="/verify/:id"
              element={<Verify />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/admin"
              element={<Admin />}
            />
          </Routes>
        </main>

        <Footer />

        <ChatWidget />
      </div>
    </AuthProvider>
  )
}