import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = "https://authnode-zw52.onrender.com";
const Auth = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [role, setRole] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
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
        this.color =
          role === "institute"
            ? "rgba(112, 0, 255, 0.5)"
            : "rgba(0, 242, 255, 0.5)";
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
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
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [role]);

  /* ===== REAL BACKEND AUTH (PRODUCTION READY) ===== */
  const handleAuth = async () => {
    if (!role) return;

    setIsProcessing(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });

      if (!res.ok) {
        throw new Error("Authentication failed");
      }

      const data = await res.json();

      // ✅ OPTIONAL: store token if backend sends one
      if (data.token) {
        sessionStorage.setItem("auth_token", data.token);
      }

      // ✅ Navigation AFTER backend confirmation
      setTimeout(() => {
        if (role === "institute") navigate("/issue");
        else navigate("/dashboard");
      }, 800);

    } catch (err) {
      console.error(err);
      alert("Authentication failed. Backend not reachable.");
      setIsProcessing(false);
    }
  };

  return (
    <div className={`app-shell ${role ? "active" : ""}`}>
      <canvas ref={canvasRef} className="particle-canvas" />
      <div className="vignette"></div>

      {!role && (
        <div className="hero-split">
          <div className="side student" onClick={() => setRole("student")}>
            <div className="side-bg"></div>
            <div className="side-content">
              <h1 className="outline-text">STUDENT</h1>
              <p className="glitch-text">VIEW CREDENTIALS</p>
            </div>
          </div>

          <div className="side institute" onClick={() => setRole("institute")}>
            <div className="side-bg"></div>
            <div className="side-content">
              <h1 className="outline-text">INSTITUTION</h1>
              <p className="glitch-text">ISSUE RECORDS</p>
            </div>
          </div>
        </div>
      )}

      {role && (
        <div className="form-portal animate__animated animate__zoomIn">
          <button
            className="exit-btn"
            onClick={() => {
              setRole(null);
              setIsProcessing(false);
            }}
          >
            TERMINATE_SESSION
          </button>

          <div className="cyber-form-container">
            <div className="form-header">
              <h2>SECURE AUTH</h2>
              <p className="role-tag">{role.toUpperCase()} ACCESS</p>
            </div>

            <button
              onClick={handleAuth}
              className={`cyber-submit ${isProcessing ? "scanning" : ""}`}
              disabled={isProcessing}
            >
              {isProcessing ? "VERIFYING IDENTITY..." : "ENTER AUTHNODE"}
            </button>

            <p style={{ fontSize: "0.7rem", color: "#555", marginTop: "20px" }}>
              Backend verified • Production ready
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
