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
        studentEmail: '',
        courseName: '',
        issueDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    });

    const mintingSequences = [
        "Uploading Metadata to Decentralized Storage...",
        "Validating Issuer Authority...",
        "Anchoring Credential Hash...",
        "Generating Immutable Proof...",
        "Finalizing Secure Record..."
    ];

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('authnode_current'));
        if (!user) {
            navigate('/login');
        } else {
            setCurrentUser(user);
        }
    }, [navigate]);

    const handleInput = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        setIsMinting(true);
        setMintingStep(0);

        try {
            for (let i = 0; i < mintingSequences.length; i++) {
                await new Promise(res => setTimeout(res, 700));
                setMintingStep(i);
            }

            const fakeTx =
                "0x" +
                Math.random().toString(16).substring(2).padEnd(64, "0");

            setTxHash(fakeTx);
            setIsMinting(false);
            setShowSuccess(true);

        } catch (error) {
            console.error(error);
            setIsMinting(false);
            alert("Issuance failed.");
        }
    };

    const generateLinkedInLink = () => {
        const baseUrl = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME";
        const params =
            `&name=${encodeURIComponent(formData.courseName)}` +
            `&organizationName=AuthNode` +
            `&issueYear=${new Date().getFullYear()}` +
            `&issueMonth=${new Date().getMonth() + 1}` +
            `&certId=${txHash}`;
        return baseUrl + params;
    };

    return (
        <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '50px', border: '1px solid var(--border)' }}>
                <button onClick={() => navigate('/dashboard')} className="nav-link" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>DASHBOARD</button>
                <span style={{ color: 'var(--border)' }}>|</span>
                <button onClick={() => navigate('/verify')} className="nav-link" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>VERIFY PORTAL</button>
            </div>

            <div className="container" style={{ width: '100%', maxWidth: '850px' }}>
                {!showPreview ? (
                    <>
                        <div className="hero-content reveal active" style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <span className="hero-tag">Decentralized Node</span>
                            <h1 className="gradient-text">Issue Digital Credential</h1>
                            <p>Secure academic issuance with immutable verification.</p>
                        </div>

                        <div className="vault-ui reveal active" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            {!showSuccess ? (
                                <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <input id="studentName" placeholder="Recipient Name" className="cyber-input" onChange={handleInput} required />
                                    <input id="courseName" placeholder="Course / Program" className="cyber-input" onChange={handleInput} required />
                                    <button type="submit" className="btn-glow">ISSUE CERTIFICATE</button>
                                </form>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div className="success-pulse" style={{ fontSize: '3rem' }}>✅</div>
                                    <h2 className="gradient-text">Credential Issued</h2>
                                    <code style={{ fontSize: '0.75rem' }}>{txHash}</code>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button className="btn-glow" onClick={() => setShowPreview(true)}>VIEW CERTIFICATE</button>
                                        <a href={generateLinkedInLink()} target="_blank" rel="noreferrer" className="btn-outline">ADD TO LINKEDIN</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="certificate-frame">
                        <h2>{formData.studentName}</h2>
                        <p>{formData.courseName}</p>
                        <QRCodeSVG value={txHash} size={90} />
                        <button className="btn-glow" onClick={() => window.print()}>PRINT / DOWNLOAD</button>
                    </div>
                )}
            </div>

            {isMinting && (
                <div className="minting-overlay">
                    {mintingSequences.map((text, i) => (
                        <p key={i} style={{ opacity: i <= mintingStep ? 1 : 0.3 }}>
                            {text}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Issue;
