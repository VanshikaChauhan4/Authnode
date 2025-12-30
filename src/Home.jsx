import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    useEffect(() => {
        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        const handleScroll = () => {
            const nav = document.querySelector('nav');
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="landing-page">
            <nav>
                <div style={{fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: '1.6rem', letterSpacing: '2px'}}>AUTHNODE</div>
                <div style={{display: 'flex', gap: '20px'}}>
                    <Link to="/verify" className="btn btn-outline">Explorer</Link>
                    <Link to="/login" className="btn btn-primary">Enter App</Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 20px'}}>
                <h1 className="animate__animated animate__zoomIn" style={{fontSize: 'clamp(3rem, 10vw, 6rem)', lineHeight: 1, fontFamily: "'Space Grotesk'"}}>
                    TRANSPARENT.<br />
                    <span style={{color: 'var(--accent)'}}>IMMUTABLE.</span>
                </h1>
                <p className="animate__animated animate__fadeInUp animate__delay-1s" style={{color: 'var(--text-dim)', fontSize: '1.25rem', marginTop: '30px', maxWidth: '700px'}}>
                    Redefining academic trust through decentralized ledger technology. 
                    Institutional integrity, anchored forever.
                </p>
                <div className="animate__animated animate__fadeInUp animate__delay-2s" style={{marginTop: '40px', display: 'flex', gap: '20px'}}>
                    <Link to="/issue" className="btn btn-primary" style={{padding: '18px 40px'}}>Start Issuing</Link>
                    <Link to="/verify" className="btn btn-outline" style={{padding: '18px 40px'}}>Verify Now</Link>
                </div>
            </section>

            {/* FEATURES SECTION (Staggered Reveal) */}
            <section style={{padding: '100px 10%'}}>
                <h2 className="section-title reveal">The Protocol Core</h2>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px'}}>
                    <div className="card reveal" style={{transitionDelay: '0.1s'}}>
                        <div style={{fontSize: '2.5rem', marginBottom: '20px'}}>💎</div>
                        <h3 style={{fontSize: '1.5rem', marginBottom: '15px'}}>Cryptographic Proof</h3>
                        <p style={{color: 'var(--text-dim)'}}>Every certificate is converted into a unique SHA-256 hash anchored to our distributed ledger.</p>
                    </div>
                    <div className="card reveal" style={{transitionDelay: '0.3s'}}>
                        <div style={{fontSize: '2.5rem', marginBottom: '20px'}}>🛡️</div>
                        <h3 style={{fontSize: '1.5rem', marginBottom: '15px'}}>Tamper Resistance</h3>
                        <p style={{color: 'var(--text-dim)'}}>Once written, data cannot be modified by any entity, ensuring a permanent record of achievement.</p>
                    </div>
                    <div className="card reveal" style={{transitionDelay: '0.5s'}}>
                        <div style={{fontSize: '2.5rem', marginBottom: '20px'}}>⚡</div>
                        <h3 style={{fontSize: '1.5rem', marginBottom: '15px'}}>Zero Lag</h3>
                        <p style={{color: 'var(--text-dim)'}}>Instant verification for employers and institutions worldwide without manual background checks.</p>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="reveal" style={{padding: '100px 10%'}}>
                <div style={{background: 'rgba(99, 102, 241, 0.05)', padding: '60px', borderRadius: '40px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '40px'}}>
                    <div style={{textAlign: 'center'}}>
                        <h4 style={{fontSize: '3.5rem', color: '#fff', fontFamily: "'Space Grotesk'"}}>1.2M</h4>
                        <p style={{color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px'}}>HASHES ANCHORED</p>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <h4 style={{fontSize: '3.5rem', color: '#fff', fontFamily: "'Space Grotesk'"}}>100%</h4>
                        <p style={{color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px'}}>UPTIME HISTORY</p>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <h4 style={{fontSize: '3.5rem', color: '#fff', fontFamily: "'Space Grotesk'"}}>0.0s</h4>
                        <p style={{color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px'}}>VERIFICATION DELAY</p>
                    </div>
                </div>
            </section>

            <footer>
                <div style={{fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: '2rem', marginBottom: '20px', opacity: 0.3}}>AUTHNODE</div>
                <p>© 2025 AuthNode Protocol | Distributed Academic Ledger</p>
                <p style={{fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '10px'}}>Secure • Private • Immutable</p>
            </footer>
        </div>
    );
};

export default Home;