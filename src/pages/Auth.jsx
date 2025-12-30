import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [role, setRole] = useState(null); 
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        setTimeout(() => {
            const userKey = `authnode_user_${formData.email}`;
            const storedData = JSON.parse(localStorage.getItem(userKey));

            if (isLoginMode) {
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
        </div>
    );
};
export default Auth;