import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers'; // NEW: Talk to Blockchain
import '../index.css'; 

const Verify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [hashInput, setHashInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [result, setResult] = useState({
        name: '---',
        course: '---',
        time: '---',
        hash: '---',
        success: false,
        aiText: 'Analyzing Ledger...'
    });

    // 1. WEB3 CONFIG (Same as Issue.js)
    const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
    const ABI = [
        "function tokenURI(uint256 tokenId) public view returns (string memory)",
        "function ownerOf(uint256 tokenId) public view returns (address)"
    ];

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.has('hash')) {
            const urlHash = urlParams.get('hash');
            setHashInput(urlHash);
            startAudit(urlHash);
        }
    }, [location]);

    const startAudit = async (input = hashInput) => {
        if (!input.trim()) return alert("System requires a Hash or Token ID for Ledger Lookup");
        
        setIsScanning(true);
        setShowDashboard(false);

        try {
            // 2. CONNECT TO POLYGON (Read-Only)
            // We use a public provider so anyone can verify without needing MetaMask
            const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

            // 3. QUERY THE BLOCKCHAIN
            // Note: In Web3, we usually verify by Token ID
            const tokenId = input.trim(); 
            const metadataURL = await contract.tokenURI(tokenId);
            const owner = await contract.ownerOf(tokenId);

            // 4. FETCH DATA FROM IPFS (Pinata)
            // Convert ipfs:// to an http link
            const httpURL = metadataURL.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            const response = await fetch(httpURL);
            const metadata = await response.json();

            setResult({
                name: metadata.attributes.find(a => a.trait_type === "Student")?.value || "Unknown",
                course: metadata.attributes.find(a => a.trait_type === "Course")?.value || "N/A",
                hash: input,
                time: metadata.attributes.find(a => a.trait_type === "Date")?.value || "Unknown",
                success: true,
                aiText: `✨ AI Insight: Record officially owned by wallet ${owner.slice(0,6)}...${owner.slice(-4)}. Integrity Verified.`
            });

        } catch (error) {
            console.error("Verification Error:", error);
            setResult({
                name: "AUTH_FAILURE",
                course: "VOID_LEDGER",
                hash: input,
                time: "N/A",
                success: false,
                aiText: "⚠️ WARNING: Data mismatch or invalid ID. No blockchain entry found."
            });
        } finally {
            setIsScanning(false);
            setShowDashboard(true);
        }
    };

    return (
        <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* --- NAVIGATION --- */}
            <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000, background: 'rgba(10, 15, 28, 0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70px' }}>
                <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        AUTH<span style={{ color: 'var(--accent)' }}>NODE</span>
                    </div>
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        <button onClick={() => navigate('/dashboard')} className="nav-item-btn">DASHBOARD</button>
                        <button onClick={() => navigate('/issue')} className="nav-item-btn">ISSUE</button>
                        <button onClick={() => navigate('/verify')} className="nav-item-btn active-nav">VERIFY</button>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ width: '100%', maxWidth: '800px', marginTop: '40px' }}>
                <div className="hero-content reveal active" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <span className="hero-tag">On-Chain Explorer</span>
                    <h1 className="gradient-text">Verify Integrity</h1>
                    <p>Scanning the Polygon Ledger for Soulbound Credentials</p>
                </div>

                <div className="vault-ui reveal active" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div className="search-console">
                        <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                            <input 
                                type="text" 
                                className="cyber-input" 
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'white' }}
                                value={hashInput}
                                onChange={(e) => setHashInput(e.target.value)}
                                placeholder="Enter Certificate Token ID..." 
                            />
                            <button className="btn-glow" onClick={() => startAudit()} disabled={isScanning} style={{ padding: '15px' }}>
                                {isScanning ? 'QUERYING POLYGON...' : 'VERIFY ON-CHAIN'}
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
                            <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '4px' }}>VERIFIED HOLDER</p>
                                        <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase' }}>{result.name}</h3>
                                    </div>
                                    <div style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: result.success ? '#10b981' : '#ef4444', border: `1px solid ${result.success ? '#10b981' : '#ef4444'}` }}>
                                        {result.success ? 'AUTHENTIC' : 'INVALID'}
                                    </div>
                                </div>
                                
                                <div style={{ padding: '20px', display: 'grid', gap: '12px' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>PROGRAM: <span style={{ color: 'white' }}>{result.course}</span></p>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ISSUE DATE: <span style={{ color: 'white' }}>{result.time}</span></p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: '8px', fontFamily: 'monospace' }}>TOKEN ID: {result.hash}</p>
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