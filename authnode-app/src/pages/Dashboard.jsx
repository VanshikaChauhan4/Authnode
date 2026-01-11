import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===== Fetch User + Certificates (REAL BACKEND) ===== */
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = sessionStorage.getItem("auth_token");

        if (!token) {
          navigate("/login");
          return;
        }

        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!userRes.ok) throw new Error("Not authenticated");

        const userData = await userRes.json();
        setUser(userData);

        const certRes = await fetch(`${API_URL}/api/certificates/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!certRes.ok) throw new Error("Failed to load certificates");

        const certData = await certRes.json();
        setCertificates(certData || []);

      } catch (err) {
        console.error(err);
        sessionStorage.removeItem("auth_token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  /* ===== Logout (REAL) ===== */
  const logout = async () => {
    try {
      const token = sessionStorage.getItem("auth_token");

      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      sessionStorage.removeItem("auth_token");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: "#0a0a0a",
          color: "#00ff00",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace"
        }}
      >
        {">"} LOADING_SECURE_LEDGER...
      </div>
    );
  }

  return (
    <div className="dash-container theme-dark">
      <nav className="dash-nav">
        <div className="logo">
          AUTHNODE // <span className="role-tag">{user.role.toUpperCase()}</span>
        </div>
        <button className="logout-btn" onClick={logout}>
          TERMINATE_SESSION
        </button>
      </nav>

      <main className="dash-content">
        <header className="welcome-header">
          <div className="user-profile">
            <div className="profile-img">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt="avatar"
              />
            </div>
            <div>
              <h1>SYSTEM_ACCESS: {user.name.toUpperCase()}</h1>
              <p className="node-id">DID: authnode:{user.id}</p>
            </div>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="label">NETWORK_STATUS</span>
            <span className="value status-online">LEDGER_ACTIVE</span>
          </div>
          <div className="stat-card">
            <span className="label">RECORDS_FOUND</span>
            <span className="value">{certificates.length}</span>
          </div>
        </div>

        <div className="action-area">
          <div className="glass-panel main-panel">
            <h3>
              {user.role === "student"
                ? "MY_CERTIFICATES"
                : "ISSUED_CERTIFICATES"}
            </h3>

            {certificates.length > 0 ? (
              certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="cert-row"
                  onClick={() => setSelectedCert(cert)}
                >
                  <div className="cert-icon">📜</div>
                  <div>
                    <strong>{cert.course}</strong>
                    <span>{cert.institution}</span>
                  </div>
                  <div className="cert-status-badge">VERIFIED</div>
                </div>
              ))
            ) : (
              <p>No records found.</p>
            )}
          </div>

          {selectedCert && (
            <div className="glass-panel side-panel">
              <h3>VERIFY_RECORD</h3>
              <img src={selectedCert.qrCode} alt="QR" />
              <p>{selectedCert.course}</p>
              <p className="status-text">STATUS: VERIFIED</p>
              <button onClick={() => setSelectedCert(null)}>CLOSE</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
