import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null); 

    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('authnode_current'));
            
            if (!storedUser || !storedUser.name) {
                console.log("No user found, redirecting to login...");
                navigate('/login'); 
            } else {
                setUser(storedUser);
               const allStoredCerts = JSON.parse(localStorage.getItem('authnode_certificates')) || [];
               const userCerts = allStoredCerts.filter(cert => 
                    cert.studentEmail === storedUser.email || cert.issuerEmail === storedUser.email
                );
                setCertificates(userCerts);
            }
        } catch (error) {
            console.error("Dashboard Load Error:", error);
            navigate('/login');
        }
    }, [navigate]);

    const exportIdentity = () => {
        if (!user) return;
        const identityNode = {
            ...user,
            node_status: "VERIFIED",
            public_key: `0x${Math.random().toString(16).substr(2, 40)}`,
            issuance_date: new Date().toISOString(),
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identityNode, null, 2));
        const link = document.createElement('a');
        link.setAttribute("href", dataStr);
        link.setAttribute("download", `identity_${user.name}.json`);
        link.click();
    };

    // Agar user null hai toh blank screen ki jagah loading dikhayein
    if (!user) {
        return (
            <div style={{ background: '#0a0a0a', color: '#00ff00', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                {'>'} INITIALIZING_SECURE_NODE...
            </div>
        );
    }

    return (
        <div className="dash-container theme-dark">
            <div className="cyber-grid"></div>
            <div className="bg-glow"></div>
            
            <nav className="dash-nav">
                <div className="logo">AUTHNODE // <span className="role-tag">{(user.role || 'GUEST').toUpperCase()}</span></div>
                <div className="nav-right">
                    <button className="logout-btn" onClick={() => {
                        localStorage.removeItem('authnode_current');
                        navigate('/login');
                    }}>TERMINATE_SESSION</button>
                </div>
            </nav>

            <main className="dash-content">
                <header className="welcome-header">
                    <div className="user-profile">
                        <div className="profile-img">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                        </div>
                        <div className="header-text">
                            <h1>SYSTEM_ACCESS: {(user.name || 'UNKNOWN').toUpperCase()}</h1>
                            <p className="node-id">DID: auth:node:{user.email?.split('@')[0] || 'internal'}</p>
                        </div>
                    </div>
                    <button className="export-id-btn" onClick={exportIdentity}>
                        DOWNLOAD_MANIFEST
                    </button>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-info">
                            <span className="label">NETWORK_STATUS</span>
                            <span className="value status-online">MAINNET_SECURE</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <span className="label">RECORDS_FOUND</span>
                            <span className="value">{certificates.length}</span>
                        </div>
                    </div>
                </div>

                <div className="action-area">
                    <div className="glass-panel main-panel">
                        <div className="panel-header">
                            <h3>{user.role === 'student' ? "LEDGER_CERTIFICATES" : "ISSUANCE_LOGS"}</h3>
                        </div>
                        <div className="cert-list">
                            {certificates.length > 0 ? (
                                certificates.map((cert) => (
                                    <div key={cert.id} className="cert-row" onClick={() => setSelectedCert(cert)}>
                                        <div className="cert-icon">📜</div>
                                        <div className="cert-details">
                                            <strong>{cert.name}</strong>
                                            <span>{cert.issuer} • {cert.date}</span>
                                        </div>
                                        <div className="cert-status-badge">{cert.status}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>No active records found in current node.</p>
                                    <button className="action-btn">INITIALIZE_SCAN</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel side-panel">
                        <div className="panel-header">
                            <h3>SYSTEM_LOGS</h3>
                        </div>
                        <div className="log-list">
                            <div className="log-item"> {'>'} Handshake success </div>
                            <div className="log-item"> {'>'} Node_Encrypted_Active </div>
                            <div className="log-item"> {'>'} Session_Verified </div>
                        </div>

                        {selectedCert && (
                            <div className="verify-preview success-pulse">
                                <div className="preview-header">
                                    <span>VERIFY_CREDENTIAL</span>
                                    <button onClick={() => setSelectedCert(null)}>×</button>
                                </div>
                                <div className="qr-box">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedCert.id}`} alt="QR" />
                                </div>
                                <div className="preview-details">
                                    <p><strong>{selectedCert.id}</strong></p>
                                    <p>{selectedCert.name}</p>
                                    <p className="status-text">STATUS: ONLINE</p>
                                </div>
                                <button className="action-btn" onClick={() => window.print()}>PRINT_OFFICIAL</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;