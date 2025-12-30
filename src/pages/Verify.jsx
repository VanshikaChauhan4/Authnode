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
            // Auto start audit if hash is in URL
            setIsScanning(true);
            setTimeout(() => {
                setIsScanning(false);
                performAudit(urlHash);
            }, 1500);
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
        // --- FIXED KEY NAMES HERE ---
        const localLedger = JSON.parse(localStorage.getItem('authnode_certificates')) || [];
        // Check both old and new keys to be safe
        const legacyLedger = JSON.parse(localStorage.getItem('ledgerHistory')) || [];
        const combinedLedger = [...localLedger, ...legacyLedger];

        const foundInLedger = combinedLedger.find(item => item.id === inputHash || item.txHash === inputHash);
        
        if (foundInLedger) {
            setResult({
                name: foundInLedger.studentName || foundInLedger.name,
                course: foundInLedger.courseName || foundInLedger.course,
                hash: inputHash,
                time: new Date().toUTCString(),
                score: "100%",
                success: true,
                aiText: "✨ AI Insight: Verified Record. High integrity match found."
            });
        } else if (inputHash === "0x8671B231EC532E09ACC6681BE896E8437BC8838E") {
            // Mock Satoshi Data for Demo
            setResult({
                name: "Satoshi Nakamoto",
                course: "Blockchain Architecture",
                hash: inputHash,
                time: new Date().toUTCString(),
                score: "100%",
                success: true,
                aiText: "✨ AI Insight: Genesis Block Record Verified."
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
        <div className="landing-page" style={{ minHeight: '100vh', paddingTop: '80px' }}>
            <div className="container">
                <div className="hero-content reveal active" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <span className="hero-tag">Ledger Explorer 2.0</span>
                    <h1 className="gradient-text">Verify Integrity</h1>
                    <p>Institutional Credentials on the Immutable Web</p>
                </div>

                <div className="step-card" style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(15, 23, 42, 0.8)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div className="search-console">
                        <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                            <input 
                                type="text" 
                                className="cyber-input" 
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'white' }}
                                value={hashInput}
                                onChange={(e) => setHashInput(e.target.value)}
                                placeholder="Enter Transaction ID or Certificate Hash..." 
                            />
                            <button className="btn-glow" onClick={startAudit} disabled={isScanning}>
                                {isScanning ? 'SCANNING LEDGER...' : 'SCAN LEDGER'}
                            </button>
                        </div>
                    </div>

                    {isScanning && (
                        <div className="qr-visual" style={{ height: '6px', position: 'relative', overflow: 'hidden', marginTop: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                            <div className="scan-line" style={{ height: '100%', background: 'var(--accent)', width: '40%', position: 'absolute', animation: 'scan 1.5s infinite linear' }}></div>
                        </div>
                    )}

                    {showDashboard && (
                        <div className="reveal active" style={{ marginTop: '40px' }}>
                            <div className="vault-ui" style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '4px' }}>HOLDER</p>
                                        <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase' }}>{result.name}</h3>
                                    </div>
                                    <div style={{ 
                                        padding: '6px 16px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                        color: result.success ? '#10b981' : '#ef4444',
                                        border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`
                                    }}>
                                        {result.success ? 'PASSED' : 'FAILED'}
                                    </div>
                                </div>
                                
                                <div style={{ padding: '20px', display: 'grid', gap: '12px' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>COURSE: <span style={{ color: 'white' }}>{result.course}</span></p>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>TIMESTAMP: <span style={{ color: 'white' }}>{result.time}</span></p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: '8px', fontFamily: 'monospace' }}>HASH: {result.hash}</p>
                                </div>

                                <div style={{ padding: '15px', background: result.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', textAlign: 'center', fontSize: '0.85rem', color: result.success ? '#10b981' : '#f87171', borderTop: '1px solid var(--border)' }}>
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