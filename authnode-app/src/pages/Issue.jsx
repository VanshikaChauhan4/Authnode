import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; 
import '../index.css'; 

const Issue = () => {
    const navigate = useNavigate();
    
    // UI State
    const [isMinting, setIsMinting] = useState(false);
    const [mintingStep, setMintingStep] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [txHash, setTxHash] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        studentName: '',
        courseName: '',
        issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });

    // Blockchain Simulation steps
    const mintingSequences = [
        "Initializing AuthNode Secure Gateway...",
        "Generating SHA-256 Data Fingerprint...",
        "Broadcasting Hash to Peer Nodes...",
        "Awaiting Network Confirmation...",
        "Finalizing Immutable Anchor..."
    ];

    // Security & Demo Bypass
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('authnode_user'));
        if (!user) {
            localStorage.setItem('authnode_user', JSON.stringify({ role: 'institute', name: 'AuthNode University' }));
        }
    }, []);

    const handleInput = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // LinkedIn Link Generator
    const generateLinkedInLink = () => {
        const baseUrl = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME";
        const params = `&name=${encodeURIComponent(formData.courseName)}&organizationName=AuthNode&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent(window.location.origin + '/verify?hash=' + txHash)}&certId=${txHash}`;
        return baseUrl + params;
    };

    const handleIssue = (e) => {
        e.preventDefault();
        setIsMinting(true);
        setMintingStep(0);

        // Terminal animation logic
        const interval = setInterval(() => {
            setMintingStep(prev => {
                if (prev < mintingSequences.length - 1) return prev + 1;
                clearInterval(interval);
                return prev;
            });
        }, 700);

        // Finalize Minting
        setTimeout(() => {
            const newHash = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
            setTxHash(newHash);

            const newRecord = {
                name: formData.studentName,
                course: formData.courseName,
                date: formData.issueDate,
                txHash: newHash,
                timestamp: new Date().getTime()
            };

            const existingLedger = JSON.parse(localStorage.getItem('ledgerHistory')) || [];
            localStorage.setItem('ledgerHistory', JSON.stringify([newRecord, ...existingLedger]));

            setIsMinting(false);
            setShowSuccess(true);
        }, 4000); 
    };

    return (
        <div className="landing-page" style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '850px' }}>
                
                {!showPreview ? (
                    <>
                        <div className="hero-content reveal active" style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <span className="hero-tag">Institutional Node</span>
                            <h1 className="gradient-text">Mint Credential</h1>
                            <p>Anchor academic achievements to the immutable AuthNode Ledger.</p>
                        </div>

                        <div className="vault-ui reveal active" style={{ position: 'relative' }}>
                            {!showSuccess ? (
                                <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="input-group">
                                        <label className="m-stat" style={{ color: 'var(--accent)', marginBottom: '8px', display: 'block' }}>RECIPIENT NAME</label>
                                        <input type="text" id="studentName" className="cyber-input" placeholder="Full legal name" onChange={handleInput} required style={{width: '100%'}} />
                                    </div>
                                    <div className="input-group">
                                        <label className="m-stat" style={{ color: 'var(--accent)', marginBottom: '8px', display: 'block' }}>ACADEMIC PROGRAM</label>
                                        <input type="text" id="courseName" className="cyber-input" placeholder="e.g. B.Sc in Computer Science" onChange={handleInput} required style={{width: '100%'}} />
                                    </div>
                                    <button type="submit" className="btn-glow" style={{ marginTop: '10px' }}>AUTHORIZE & MINT</button>
                                </form>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div className="success-pulse" style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                                    <h2 className="gradient-text">Deployment Successful</h2>
                                    <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>Record anchored with 256-bit encryption.</p>
                                    
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px dashed var(--accent)' }}>
                                        <code style={{ fontSize: '0.8rem', color: '#00f2ff', wordBreak: 'break-all' }}>{txHash}</code>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-glow" style={{ flex: 1 }} onClick={() => setShowPreview(true)}>VIEW CERTIFICATE</button>
                                        <a href={generateLinkedInLink()} target="_blank" rel="noreferrer" className="nav-link" style={{ flex: 1, border: '1px solid #0a66c2', color: '#0a66c2', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                                            ADD TO LINKEDIN
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* DIGITAL CERTIFICATE GENERATOR */
                    <div className="reveal active">
                        <button onClick={() => setShowPreview(false)} className="nav-link" style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Dashboard</button>
                        
                        <div className="certificate-frame">
                            <div className="cert-inner">
                                <div className="cert-header">
                                    <div className="logo" style={{ fontSize: '1.2rem', color: '#0f172a' }}>AUTHNODE<span>.</span></div>
                                    <div className="cert-id">OFFICIAL BLOCKCHAIN RECORD</div>
                                </div>
                                
                                <div className="cert-body">
                                    <h4 style={{ letterSpacing: '3px', color: '#64748b' }}>CERTIFICATE OF ACHIEVEMENT</h4>
                                    <p style={{ margin: '10px 0' }}>This is to certify that</p>
                                    <h1 className="student-name">{formData.studentName}</h1>
                                    <p>has successfully completed the requirements for</p>
                                    <h2 className="course-title" style={{ color: '#0284c7' }}>{formData.courseName}</h2>
                                    <p className="issue-date" style={{ marginTop: '20px', fontWeight: 'bold' }}>Issued on {formData.issueDate}</p>
                                </div>

                                <div className="cert-footer">
                                    <div className="footer-item" style={{ maxWidth: '70%' }}>
                                        <span className="label">VERIFICATION HASH</span>
                                        <span className="value">{txHash}</span>
                                    </div>
                                    
                                    <div className="qr-container" style={{ textAlign: 'center' }}>
                                        <QRCodeSVG value={`${window.location.origin}/verify?hash=${txHash}`} size={65} />
                                        <p style={{ fontSize: '7px', marginTop: '5px', color: '#0f172a' }}>SCAN TO VERIFY</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button className="btn-glow" style={{ width: '100%', marginTop: '30px' }} onClick={() => window.print()}>PRINT / DOWNLOAD PDF</button>
                    </div>
                )}
            </div>

            {/* BLOCKCHAIN TERMINAL ANIMATION OVERLAY */}
            {isMinting && (
                <div className="minting-overlay">
                    <div className="scanner-container">
                        <div className="scan-line"></div>
                        <div className="spinner"></div>
                    </div>
                    <div className="terminal-text">
                        {mintingSequences.map((text, i) => (
                            <p key={i} style={{ 
                                opacity: i === mintingStep ? 1 : i < mintingStep ? 0.4 : 0,
                                color: i === mintingStep ? 'var(--accent)' : 'white',
                                transition: 'all 0.3s ease',
                                fontSize: '0.85rem',
                                margin: '8px 0',
                                fontFamily: 'monospace'
                            }}>
                                {i < mintingStep ? '●' : i === mintingStep ? '▹' : '○'} {text}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .certificate-frame {
                    background: #fff; padding: 30px; border-radius: 4px; color: #0f172a;
                    box-shadow: 0 0 50px rgba(0,0,0,0.5); border: 12px solid #1e293b;
                }
                .cert-inner { border: 2px solid #e2e8f0; padding: 40px; text-align: center; }
                .cert-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
                .cert-id { font-size: 0.6rem; font-weight: 800; color: #64748b; border: 1px solid #64748b; padding: 3px 7px; }
                .cert-body { padding: 50px 0; }
                .student-name { font-size: 2.8rem; font-family: serif; margin: 15px 0; color: #1e293b; }
                .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; text-align: left; }
                .label { font-size: 0.55rem; font-weight: 800; color: #64748b; display: block; }
                .value { font-size: 0.55rem; color: #0f172a; word-break: break-all; font-family: monospace; }
                
                .minting-overlay { 
                    position: fixed; inset: 0; background: rgba(2,6,23,0.96); z-index: 10000; 
                    display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); 
                }
                .scanner-container { 
                    position: relative; width: 80px; height: 80px; border: 1px solid var(--accent); 
                    border-radius: 15px; margin-bottom: 30px; overflow: hidden; display: flex; align-items: center; justify-content: center;
                }
                .scan-line { position: absolute; width: 100%; height: 2px; background: var(--accent); animation: scan 2s linear infinite; }
                .spinner { width: 30px; height: 30px; border: 3px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
                .terminal-text { min-width: 320px; background: rgba(0,0,0,0.4); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
                
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
                .success-pulse { animation: pulse 2s infinite; }

                @media print {
                    body * { visibility: hidden; }
                    .certificate-frame, .certificate-frame * { visibility: visible; }
                    .certificate-frame { position: absolute; left: 0; top: 0; width: 100%; border: 2px solid #000; box-shadow: none; }
                }
            `}</style>
        </div>
    );
};

export default Issue;