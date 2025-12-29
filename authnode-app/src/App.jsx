import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Verify from './pages/Verify';
import Issue from './pages/Issue';
import Dashboard from './pages/Dashboard';
import VerifySection from './VerifySection';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Landing Page */}
        <Route path="/" element={<Home />} />
        
        {/* Authentication (Login/Signup) */}
        <Route path="/login" element={<Auth />} />
        
        {/* Public Ledger Explorer */}
        <Route path="/verify" element={<Verify />} /> 
        
        {/* Institutional Issuance Portal */}
        <Route path="/issue" element={<Issue />} />
        {/* User Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Verification Section */}
        <Route path="/verify-section" element={<VerifySection />} />
      </Routes>
    </Router>
  );
}
export default App;