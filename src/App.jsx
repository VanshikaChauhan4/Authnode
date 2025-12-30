import { BrowserRouter as Router, Routes, Route, HashRouter } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Verify from './pages/Verify';
import Issue from './pages/Issue';
import Dashboard from './pages/Dashboard';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
    <Router> {/* BrowserRouter ki jagah HashRouter use karein */}
      <Routes>
        {/* Aapke routes */}
      </Routes>
    </Router>
  );
}
import './index.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/verify" element={<Verify />} /> 
        <Route path="/issue" element={<Issue />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <HashRouter basename="/Authnode"><Routes>
      <Route path="/" element={<Home />} />
   </Routes></HashRouter>
      </Routes>
    </Router>
  );
}
export default App;