import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../index.css'; 

const Verify = () => {
    const [hashInput, setHashInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [result, setResult] = useState({
        name: '---',
        course: '---',
        time: '---',
        hash: '---',
        score: '0%',
        success: false,
        aiText: 'Analyzing...'
    });

    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.has('hash')) {
            const urlHash = urlParams.get('hash');
            setHashInput(urlHash);
            performAudit(urlHash);
        }
    }, [location]);

    const startAudit = () => {
        if (!hashInput.trim()) return alert("System requires a Hash for Ledger Lookup");
        setIsScanning(true);
        setShowDashboard(false);
        setTimeout(() => {
            setIsScanning(false);
            performAudit(hashInput.trim());
        }, 1500);
    };

    const performAudit = (inputHash) => {
        const localLedger = JSON.parse(localStorage.getItem('ledgerHistory')) || [];
        const foundInLedger = localLedger.find(item => item.txHash === inputHash);
        
        let finalData = foundInLedger;
        if (!finalData && inputHash === "0x8671B231EC532E09ACC6681BE896E8437BC8838E") {
            finalData = { name: "Satoshi Nakamoto", course: "Blockchain Architecture", txHash: inputHash };
        }

        if (finalData) {
            setResult({
                name: finalData.name,
                course: finalData.course,
                hash: finalData.txHash,
                time: new Date().toUTCString(),
                score: "100%",
                success: true,
                aiText: "✨ AI Insight: Verified Record. High integrity match found."
            });
        } else {
            setResult({
                name: "AUTH_FAILURE",
                course: "VOID_LEDGER",
                hash: inputHash,
                time: "N/A",
                score: "0%",
                success: false,
                aiText: "⚠️ WARNING: Data mismatch. No ledger entry found."
            });
        }
        setShowDashboard(true);
    };

    return (
        <div className="landing-page" style={{ minHeight: '100vh' }}>
            <div className="container">
                <div className="hero-content reveal active" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <span className="hero-tag">Ledger Explorer 2.0</span>
                    <h1 className="gradient-text">Verify Integrity</h1>
                    <p>Institutional Credentials on the Immutable Web</p>
                </div>

                <div className="step-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="search-console">
                        <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                            <input 
                                type="text" 
                                className="nav-link" 
                                style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', color: 'white' }}
                                value={hashInput}
                                onChange={(e) => setHashInput(e.target.value)}
                                placeholder="Enter Transaction ID or Certificate Hash..." 
                            />
                            <button className="btn-glow" onClick={startAudit}>
                                {isScanning ? 'Scanning Ledger...' : 'Scan Ledger'}
                            </button>
                        </div>
                    </div>

                    {isScanning && (
                        <div className="qr-visual" style={{ height: '100px', position: 'relative', overflow: 'hidden', marginTop: '20px' }}>
                            <div className="scan-line"></div>
                        </div>
                    )}

                    {showDashboard && (
                        <div className="reveal active" style={{ marginTop: '40px' }}>
                            <div className="vault-ui">
                                <div className="cert-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                                    <div>
                                        <p className="m-stat" style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>HOLDER</p>
                                        <h3 style={{ color: 'white', margin: '5px 0' }}>{result.name}</h3>
                                    </div>
                                    <div className="cert-status" style={{ 
                                        padding: '5px 15px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                        color: result.success ? '#10b981' : '#ef4444',
                                        border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`
                                    }}>
                                        {result.success ? 'VERIFIED' : 'FAILED'}
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>COURSE: <span style={{ color: 'white' }}>{result.course}</span></p>
                                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>TIMESTAMP: <span style={{ color: 'white' }}>{result.time}</span></p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: '10px' }}>HASH: {result.hash}</p>
                                </div>

                                <div className="benefit-pill" style={{ width: '100%', marginTop: '20px', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                    {result.aiText}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Verify;