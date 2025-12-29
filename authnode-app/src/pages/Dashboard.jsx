import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // 1. Initial Auth Check
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('authnode_current'));
        if (!storedUser) {
            navigate('/auth'); 
        } else {
            setUser(storedUser);
        }
    }, [navigate]);

    // 2. Identity Export Logic
    const exportIdentity = () => {
        if (!user) return;
        
        const identityNode = {
            ...user,
            node_status: "VERIFIED",
            public_key: `0x${Math.random().toString(16).substr(2, 40)}`,
            issuance_date: new Date().toISOString(),
            network: "AuthNode_Mainnet_Simulated"
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identityNode, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `identity_node_${user.name.toLowerCase().replace(/\s/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    if (!user) return null;

    const isStudent = user.role === 'student';

    return (
        <div className="dash-container">
            <div className="bg-glow"></div>

            <nav className="dash-nav">
                <div className="logo">AUTHNODE // {user.role.toUpperCase()}</div>
                <button className="logout-btn" onClick={() => {
                    localStorage.removeItem('authnode_current');
                    navigate('/auth');
                }}>TERMINATE_SESSION</button>
            </nav>

            <main className="dash-content">
                <header className="welcome-header">
                    <h1>WELCOME, {user.name.toUpperCase()}</h1>
                    <p className="node-id">NODE_ADDRESS: did:auth:{user.email.split('@')[0]}:hash_{Math.random().toString(36).substr(2, 6)}</p>
                    
                    {/* Identity Export Button */}
                    <button className="export-id-btn" onClick={exportIdentity}>
                        ⬇ DOWNLOAD_IDENTITY_MANIFEST
                    </button>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="label">NETWORK_STATUS</span>
                        <span className="value status">ENCRYPTED_ONLINE</span>
                    </div>
                    <div className="stat-card">
                        <span className="label">{isStudent ? 'CREDENTIAL_COUNT' : 'ISSUED_TOKENS'}</span>
                        <span className="value">0</span>
                    </div>
                    <div className="stat-card">
                        <span className="label">REPUTATION_SCORE</span>
                        <span className="value">1.00</span>
                    </div>
                </div>

                <div className="action-area">
                    <div className="glass-panel main-panel">
                        <h3>{isStudent ? "VERIFIED_VAULT" : "ISSUANCE_CONTROL"}</h3>
                        <div className="empty-state">
                            <div className="ghost-icon">∅</div>
                            <p>No transactions found on local ledger.</p>
                            <button className="action-btn">
                                {isStudent ? "SCAN FOR CREDENTIALS" : "INITIALIZE NEW MINT"}
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel side-panel">
                        <h3>RECENT_LOGS</h3>
                        <div className="log-list">
                            <div className="log-item"> {'>'} Identity Anchored</div>
                            <div className="log-item"> {'>'} Keypair Generated</div>
                            <div className="log-item"> {'>'} Node Synchronized</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;