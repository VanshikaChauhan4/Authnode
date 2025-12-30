import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; 
import '../index.css'; 

const Issue = () => {
    const navigate = useNavigate();
    const [isMinting, setIsMinting] = useState(false);
    const [mintingStep, setMintingStep] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    
    const [formData, setFormData] = useState({
        studentName: '',
        studentEmail: '', // Added this for Dashboard filtering
        courseName: '',
        issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });

    const mintingSequences = [
        "Initializing AuthNode Secure Gateway...",
        "Generating SHA-256 Data Fingerprint...",
        "Broadcasting Hash to Peer Nodes...",
        "Awaiting Network Confirmation...",
        "Finalizing Immutable Anchor..."
    ];

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('authnode_current')); // Consistent key name
        if (!user) {
            navigate('/login');
        } else {
            setCurrentUser(user);
        }
    }, [navigate]);

    const handleInput = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleIssueSubmit = (e) => {
        e.preventDefault();
        setIsMinting(true);
        setMintingStep(0);

        // Sequence Animation
        const interval = setInterval(() => {
            setMintingStep(prev => {
                if (prev < mintingSequences.length - 1) return prev + 1;
                clearInterval(interval);
                return prev;
            });
        }, 700);

        // Actual Logic Simulation
        setTimeout(() => {
            const newHash = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
            setTxHash(newHash);

            // Save to Global Ledger for Dashboard
            const existingCerts = JSON.parse(localStorage.getItem('authnode_certificates')) || [];
            const newCert = {
                id: newHash,
                name: formData.courseName,
                studentName: formData.studentName,
                studentEmail: formData.studentEmail,
                issuer: currentUser?.name || 'AuthNode University',
                issuerEmail: currentUser?.email,
                date: formData.issueDate,
                status: 'CONFIRMED'
            };

            localStorage.setItem('authnode_certificates', JSON.stringify([newCert, ...existingCerts]));

            setIsMinting(false);
            setShowSuccess(true);
        }, 4000); 
    };

    const generateLinkedInLink = () => {
        const baseUrl = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME";
        const params = `&name=${encodeURIComponent(formData.courseName)}&organizationName=AuthNode&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent(window.location.origin + '/verify?hash=' + txHash)}&certId=${txHash}`;
        return baseUrl + params;
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
                                <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="input-group">
                                        <label className="m-stat" style={{ color: 'var(--accent)', marginBottom: '8px', display: 'block' }}>RECIPIENT NAME</label>
                                        <input type="text" id="studentName" className="cyber-input" placeholder="Full legal name" onChange={handleInput} required style={{width: '100%'}} />
                                    </div>
                                    <div className="input-group">
                                        <label className="m-stat" style={{ color: 'var(--accent)', marginBottom: '8px', display: 'block' }}>RECIPIENT EMAIL (For Dashboard Sync)</label>
                                        <input type="email" id="studentEmail" className="cyber-input" placeholder="student@example.com" onChange={handleInput} required style={{width: '100%'}} />
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
                    <div className="reveal active">
                        <button onClick={() => setShowPreview(false)} className="nav-link" style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>← Back to Minting</button>
                        <div className="certificate-frame">
                            <div className="cert-inner">
                                <div className="cert-header">
                                    <div className="logo" style={{ fontSize: '1.2rem', color: '#0f172a' }}>AUTHNODE<span>.</span></div>
                                    <div className="cert-id">OFFICIAL BLOCKCHAIN RECORD</div>
                                </div>
                                <div className="cert-body" style={{textAlign: 'center', padding: '20px'}}>
                                    <h4 style={{ letterSpacing: '3px', color: '#64748b' }}>CERTIFICATE OF ACHIEVEMENT</h4>
                                    <p style={{ margin: '10px 0' }}>This is to certify that</p>
                                    <h1 className="student-name" style={{color: '#0f172a'}}>{formData.studentName}</h1>
                                    <p>has successfully completed the requirements for</p>
                                    <h2 className="course-title" style={{ color: '#0284c7' }}>{formData.courseName}</h2>
                                    <p className="issue-date" style={{ marginTop: '20px', fontWeight: 'bold' }}>Issued on {formData.issueDate}</p>
                                </div>
                                <div className="cert-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderTop: '1px solid #e2e8f0'}}>
                                    <div className="footer-item" style={{ maxWidth: '70%', textAlign: 'left' }}>
                                        <span className="label" style={{display: 'block', fontSize: '0.6rem', color: '#64748b'}}>VERIFICATION HASH</span>
                                        <span className="value" style={{fontSize: '0.7rem', wordBreak: 'break-all', color: '#0f172a'}}>{txHash}</span>
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

            {isMinting && (
                <div className="minting-overlay" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="scanner-container">
                        <div className="scan-line"></div>
                        <div className="spinner"></div>
                    </div>
                    <div className="terminal-text" style={{marginTop: '20px'}}>
                        {mintingSequences.map((text, i) => (
                            <p key={i} style={{ 
                                opacity: i === mintingStep ? 1 : i < mintingStep ? 0.4 : 0,
                                color: i === mintingStep ? '#00f2ff' : 'white',
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
        </div>
    );
};

export default Issue;