import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [role, setRole] = useState(null); 
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    // --- Particle Background Logic (Kept as requested) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = role === 'institute' ? 'rgba(112, 0, 255, 0.5)' : 'rgba(0, 242, 255, 0.5)';
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            for (let i = 0; i < 150; i++) particles.push(new Particle());
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.strokeStyle = role === 'institute' ? 'rgba(112, 0, 255, 0.1)' : 'rgba(0, 242, 255, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        init();
        animate();
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, [role]);

    // --- Strict Auth Logic ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        setTimeout(() => {
            // We use a unique key for each email to avoid cross-user overwrite, 
            // but we also check the role inside the object.
            const userKey = `authnode_user_${formData.email}`;
            const storedData = JSON.parse(localStorage.getItem(userKey));

            if (isLoginMode) {
                // 1. Check if user exists
                // 2. Check if password matches
                // 3. CRITICAL: Check if the role matches the portal they are currently in
                if (storedData && 
                    storedData.password === formData.password && 
                    storedData.role === role) {
                    
                    localStorage.setItem('authnode_current', JSON.stringify(storedData));
                    navigate(role === 'student' ? '/' : '/issue');
                } else if (storedData && storedData.role !== role) {
                    alert(`ACCESS DENIED: This account is registered as a ${storedData.role.toUpperCase()}. Please use the correct portal.`);
                    setIsProcessing(false);
                } else {
                    alert("IDENTITY REJECTED: Invalid Credentials or Node Mismatch");
                    setIsProcessing(false);
                }
            } else {
                // REGISTRATION MODE
                const newUser = { ...formData, role, timestamp: Date.now() };
                localStorage.setItem(userKey, JSON.stringify(newUser));
                localStorage.setItem('authnode_current', JSON.stringify(newUser));
                navigate(role === 'student' ? '/' : '/issue');
            }
        }, 2000);
    };

    return (
        <div className={`app-shell ${role ? 'active' : ''}`}>
            <canvas ref={canvasRef} className="particle-canvas" />
            <div className="vignette"></div>

            {!role && (
                <div className="hero-split">
                    <div className="side student" onClick={() => { setRole('student'); setIsLoginMode(false); }}>
                        <div className="side-bg"></div>
                        <div className="side-content">
                            <h1 className="outline-text">STUDENT</h1>
                            <p className="glitch-text" data-text="ACCESS LEDGER">ACCESS LEDGER</p>
                            <div className="cyber-line"></div>
                        </div>
                    </div>
                    <div className="side institute" onClick={() => { setRole('institute'); setIsLoginMode(false); }}>
                        <div className="side-bg"></div>
                        <div className="side-content">
                            <h1 className="outline-text">INSTITUTION</h1>
                            <p className="glitch-text" data-text="AUTH NODE">AUTH NODE</p>
                            <div className="cyber-line"></div>
                        </div>
                    </div>
                </div>
            )}

            {role && (
                <div className="form-portal animate__animated animate__zoomIn">
                    <button className="exit-btn" onClick={() => { setRole(null); setIsLoginMode(false); setFormData({name:'', email:'', password:''}); }}>
                        TERMINATE_SESSION
                    </button>

                    <div className="cyber-form-container">
                        <div className="form-header">
                            <div className="status-dot"></div>
                            <h2>{isLoginMode ? 'SYNC_IDENTITY' : 'INIT_IDENTITY'}</h2>
                            <p className="role-tag">{role} protocol active</p>
                        </div>

                        <form onSubmit={handleSubmit} className={isProcessing ? 'scanning' : ''}>
                            {!isLoginMode && (
                                <div className="input-box">
                                    <input type="text" placeholder="LEGAL IDENTIFIER" required 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                    <div className="bar"></div>
                                </div>
                            )}
                            <div className="input-box">
                                <input type="email" placeholder="NETWORK EMAIL" required 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                <div className="bar"></div>
                            </div>
                            <div className="input-box">
                                <input type="password" placeholder="ENCRYPTION KEY" required 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})} />
                                <div className="bar"></div>
                            </div>

                            <button type="submit" className="cyber-submit" disabled={isProcessing}>
                                {isProcessing ? (
                                    <span className="processing-text">VERIFYING HASH...</span>
                                ) : (
                                    <span>{isLoginMode ? 'AUTHORIZE' : 'ANCHOR IDENTITY'}</span>
                                )}
                            </button>
                        </form>

                        <p className="toggle-mode" onClick={() => setIsLoginMode(!isLoginMode)}>
                            {isLoginMode ? "» REGISTER NEW NODE?" : "» ALREADY ANCHORED?"}
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Space+Grotesk:wght@300;500&display=swap');

                .app-shell {
                    background: #030303;
                    width: 100vw; height: 100vh;
                    color: white;
                    font-family: 'Space Grotesk', sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                .particle-canvas {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                }

                .vignette {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 100%);
                    pointer-events: none;
                    z-index: 2;
                }

                .hero-split {
                    display: flex;
                    width: 100%; height: 100%;
                    z-index: 3;
                    position: relative;
                }
                .side {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }
                .side:hover { flex: 1.5; }
                .side-bg {
                    position: absolute;
                    inset: 0;
                    opacity: 0.1;
                    transition: 0.5s;
                }
                .student:hover .side-bg { background: #00f2ff; opacity: 0.05; }
                .institute:hover .side-bg { background: #7000ff; opacity: 0.05; }

                .outline-text {
                    font-family: 'Syncopate', sans-serif;
                    font-size: 3.5rem;
                    -webkit-text-stroke: 1px rgba(255,255,255,0.3);
                    color: transparent;
                    transition: 0.5s;
                }
                .side:hover .outline-text {
                    color: white;
                    -webkit-text-stroke: 1px transparent;
                    text-shadow: 0 0 20px rgba(255,255,255,0.5);
                }

                .cyber-line {
                    width: 0; height: 2px;
                    background: white;
                    margin-top: 10px;
                    transition: 0.5s;
                }
                .side:hover .cyber-line { width: 100%; }

                .form-portal {
                    position: absolute;
                    inset: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(15px);
                }
                .cyber-form-container {
                    width: 450px;
                    padding: 60px;
                    background: rgba(5, 5, 5, 0.95);
                    border: 1px solid rgba(255,255,255,0.1);
                    position: relative;
                    box-shadow: 0 0 50px rgba(0,0,0,1);
                }
                .cyber-form-container::before {
                    content: '';
                    position: absolute;
                    top: -1px; left: -1px;
                    width: 20px; height: 20px;
                    border-top: 2px solid #00f2ff;
                    border-left: 2px solid #00f2ff;
                }

                .input-box {
                    margin-bottom: 30px;
                    position: relative;
                }
                .input-box input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding: 10px 0;
                    color: white;
                    font-size: 1rem;
                    letter-spacing: 1px;
                }
                .input-box input:focus { outline: none; }
                .input-box .bar {
                    position: absolute;
                    bottom: 0; left: 0;
                    width: 0; height: 1px;
                    background: #00f2ff;
                    transition: 0.4s;
                }
                .input-box input:focus ~ .bar { width: 100%; }

                .cyber-submit {
                    width: 100%;
                    padding: 18px;
                    background: white;
                    color: black;
                    border: none;
                    font-family: 'Syncopate', sans-serif;
                    font-weight: bold;
                    cursor: pointer;
                    transition: 0.3s;
                    clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
                }
                .cyber-submit:hover {
                    background: #00f2ff;
                    box-shadow: 0 0 20px #00f2ff;
                }

                .exit-btn {
                    position: absolute;
                    top: 40px; right: 40px;
                    background: transparent;
                    color: #ff4d4d;
                    border: 1px solid #ff4d4d;
                    padding: 8px 15px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    font-family: 'Syncopate';
                    letter-spacing: 1px;
                }

                .processing-text { animation: pulse 1s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

                .toggle-mode {
                    margin-top: 20px;
                    font-size: 0.8rem;
                    color: #555;
                    cursor: pointer;
                    text-align: center;
                    letter-spacing: 1px;
                }
                .toggle-mode:hover { color: #00f2ff; }
            `}</style>
        </div>
    );
};

export default Auth;