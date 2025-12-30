import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const Home = () => {
    const [scrolled, setScrolled] = useState(false);
    const [qrScanned, setQrScanned] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const steps = [
        { id: "01", title: "Connect Identity", desc: "Institutional login via secure AuthNode gateway." },
        { id: "02", title: "Generate Hash", desc: "Data is converted into a unique SHA-256 fingerprint." },
        { id: "03", title: "On-Chain Anchor", desc: "The hash is timestamped and written to the ledger." },
        { id: "04", title: "Instant Access", desc: "Students receive a permanent, shareable link." }
    ];
    const studentCerts = [
        { name: "Bachelor of Technology", issuer: "IIT Bombay", date: "June 2024", status: "Verified" },
        { name: "Cloud Architecture", issuer: "AWS Certified", date: "Dec 2024", status: "Verified" },
        { name: "Full Stack Mastery", issuer: "AuthNode Academy", date: "Jan 2025", status: "Verified" }
    ];
    return (
        <div className="landing-page">
            <nav className={scrolled ? 'scrolled' : ''}>
                <div className="logo">AUTHNODE<span>.</span></div>
                <div className="nav-actions">
                    <Link to="/Dashboard" className="btn-glow">Dashboard</Link>
                    <Link to="/login" className="btn-glow">Profile</Link>
                </div>
            </nav>
            <section className="hero-section">
                <div className="hero-content reveal">
                    <span className="hero-tag">V1.0 Mainnet Live</span>
                    <h1>The Global Ledger of <span className="gradient-text">Academic Truth.</span></h1>
                    <p>AuthNode eliminates credential fraud by anchoring institutional records to an immutable decentralized network. Transparent. Instant. Eternal.</p>
                    <div className="hero-btns">
                        <button className="btn-primary" onClick={() => navigate('/Issue')} style={{ cursor: 'pointer' }}>Issue Certificate</button>
                        <button className="btn-secondary" onClick={() => navigate('/Verify')} style={{ cursor: 'pointer' }}> Verify Now</button>
                    </div>
                </div>
            </section>
            <section className="steps-section container">
                <h2 className="section-label reveal">The Protocol</h2>
                <h3 className="section-title reveal">How to Access Your Records</h3>
                <div className="steps-grid">
                    {steps.map((s, i) => (
                        <div key={i} className="step-card reveal">
                            <div className="step-num">{s.id}</div>
                            <h4>{s.title}</h4>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="container reveal">
                <h2 className="section-label">Global Trust Network</h2>
                <h3 className="section-title">A Decentralized Mesh of <span className="gradient-text">Validator Nodes.</span></h3>
                <div className="map-container">
                    <div className="map-overlay">
                        <div className="node pulse" style={{top: '20%', left: '15%'}} data-name="Stanford University"></div>
                        <div className="node pulse" style={{top: '40%', left: '75%'}} data-name="IIT Delhi"></div>
                        <div className="node pulse" style={{top: '30%', left: '45%'}} data-name="Oxford University"></div>
                        <div className="node pulse" style={{top: '60%', left: '25%'}} data-name="MIT Node"></div>
                        <div className="node pulse" style={{top: '70%', left: '85%'}} data-name="National Univ. Singapore"></div>
                        <div className="map-stats">
                            <div className="m-stat"><span>Active Validators:</span> 1,204</div>
                            <div className="m-stat"><span>Network Status:</span> Secure</div>
                        </div>
                    </div>
                    <p className="map-caption">Our ledger is verified by established institutions globally, ensuring no single point of failure.</p>
                </div>
            </section>
            <section className="container qr-section">
                <div className="split-view">
                    <div className="qr-visual reveal" onMouseEnter={() => setQrScanned(true)} onMouseLeave={() => setQrScanned(false)}>
                        <div className="phone-mockup">
                            <div className="camera-view">
                                <div className="scan-line"></div>
                                <div className="qr-code-target"></div>
                                {qrScanned && (
                                    <div className="scan-result">
                                        <div className="check-icon">✓</div>
                                        <p>Record Verified</p>
                                        <span className="tx-id">TX: 0x82...f92</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="paper-cert">
                            <div className="qr-code-printed"></div>
                            <p style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Official Degree #8821</p>
                            <div style={{height: '4px', background: '#eee', width: '100%', marginTop: '10px'}}></div>
                            <div style={{height: '4px', background: '#eee', width: '70%', marginTop: '5px'}}></div>
                        </div>
                    </div>
                    <div className="text-side reveal">
                        <h2 className="section-title">Instant <br/><span className="gradient-text">Verification UX.</span></h2>
                        <p>Employers don't need a blockchain wallet. Just a simple scan of the printed QR code instantly pulls the cryptographic proof from the AuthNode ledger.</p>
                        <div className="benefit-pill">0.4s Verification Speed</div>
                        <div className="benefit-pill">Zero Manual Documentation</div>
                    </div>
                </div>
            </section>
            <section className="dashboard-preview container">
                <div className="split-view">
                    <div className="text-side reveal">
                        <h3 className="section-title">Your Digital <br/><span className="gradient-text">History Vault.</span></h3>
                        <p>Every student gets a private dashboard to manage their lifetime of achievements. No more carrying physical folders or waiting for university emails.</p>
                    </div>
                    <div className="vault-ui reveal">
                        <div className="vault-header">Academic History</div>
                        {studentCerts.map((cert, i) => (
                            <div key={i} className="cert-item">
                                <div className="cert-info">
                                    <div className="cert-name">{cert.name}</div>
                                    <div className="cert-meta">{cert.issuer} • {cert.date}</div>
                                </div>
                                <div className="cert-status">{cert.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="storage-info container reveal">
                <div className="card-full glass">
                    <h3>Where is my data stored?</h3>
                    <p>We use a hybrid approach: Metadata lives on <strong>IPFS</strong>, while the Cryptographic Proof is anchored on the <strong>AuthNode Ledger</strong>.</p>
                    <div className="terminal">
                        <code>$ authnode-cli status --network mainnet</code><br/>
                        <code>[SUCCESS] Node sync: 100% | Latency: 14ms</code><br/>
                        <code>[INFO] 1.2M Certificates Anchored successfully.</code>
                    </div>
                </div>
            </section>
            <footer>
                <div className="footer-grid container">
                    <div className="footer-brand">
                        <div className="logo">AUTHNODE<span>.</span></div>
                        <p>Revolutionizing academic trust through blockchain technology.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Platform</h4>
                        <a href="#">Explorer</a>
                        <a href="#">Documentation</a>
                    </div>
                    <div className="footer-links">
                        <h4>Support</h4>
                        <a href="#">Security</a>
                        <a href="#">Status</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; 2025 AuthNode Protocol. All achievement, secured.
                </div>
            </footer>
            <div className="help-icon" onClick={() => setShowAbout(true)} style={{cursor:'pointer'}}>?</div>
            {showAbout && (
                <div className="modal-overlay" onClick={() => setShowAbout(false)} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{background:'#0a0a0a', padding:'30px', border:'1px solid #00f2ff', maxWidth:'500px', width:'90%'}}>
                        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3 style={{color:'#00f2ff', margin:0}}>PROTOCOL_OVERVIEW</h3>
                            <button className="close-modal" onClick={() => setShowAbout(false)} style={{background:'none', border:'none', color:'#fff', fontSize:'24px', cursor:'pointer'}}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <section style={{marginBottom:'15px'}}>
                                <h4 style={{color:'#00f2ff', margin:'0 0 5px 0'}}>1. Role-Based Identity Siloing</h4>
                                <p style={{color:'#ccc', fontSize:'14px', margin:0}}>Separates Institutional and Student data into distinct cryptographic nodes.</p>
                            </section>
                            <section style={{marginBottom:'15px'}}>
                                <h4 style={{color:'#00f2ff', margin:'0 0 5px 0'}}>2. Self-Sovereign Identity (SSI)</h4>
                                <p style={{color:'#ccc', fontSize:'14px', margin:0}}>Users own their identity hashes and carry verified status across any network.</p>
                            </section>
                            <section>
                                <h4 style={{color:'#00f2ff', margin:'0 0 5px 0'}}>3. Immutable Anchoring</h4>
                                <p style={{color:'#ccc', fontSize:'14px', margin:0}}>Every session mimics a blockchain handshake for local ledger verification.</p>
                            </section>
                        </div>
                        <div className="modal-footer" style={{marginTop:'20px', display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#444'}}>
                            <span>v1.0.4-beta</span>
                            <span>NETWORK_LIVE</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Home;