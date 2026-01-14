import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../index.css";

const API_URL = "https://authnode-zw52.onrender.com";
const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [hashInput, setHashInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [result, setResult] = useState({
    name: "---",
    course: "---",
    time: "---",
    hash: "---",
    success: false,
    aiText: "Analyzing Ledger..."
  });

  /* ===== AUTO VERIFY FROM URL ===== */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("hash")) {
      const h = params.get("hash");
      setHashInput(h);
      startAudit(h);
    }
  }, [location]);

  /* ===== BACKEND VERIFICATION ===== */
  const startAudit = async (input = hashInput) => {
    if (!input.trim())
      return alert("System requires a Hash or Token ID for Ledger Lookup");

    setIsScanning(true);
    setShowDashboard(false);

    try {
      const res = await fetch(`${API_URL}/api/verify/${input.trim()}`);

      if (!res.ok) throw new Error("Invalid certificate");

      const data = await res.json();

      setResult({
        name: data.studentName,
        course: data.course,
        time: new Date(data.issueDate).toDateString(),
        hash: data.txHash || input,
        success: true,
        aiText:
          "✨ AI Insight: Record exists in AuthNode ledger. Integrity verified via backend consensus."
      });
    } catch (error) {
      console.error(error);
      setResult({
        name: "AUTH_FAILURE",
        course: "VOID_LEDGER",
        time: "N/A",
        hash: input,
        success: false,
        aiText:
          "⚠️ WARNING: No matching record found in AuthNode ledger. Verification failed."
      });
    } finally {
      setIsScanning(false);
      setShowDashboard(true);
    }
  };

  return (
    <div
      className="landing-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* --- NAVIGATION --- */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          background: "rgba(10, 15, 28, 0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70px"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 40px"
          }}
        >
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "900",
              letterSpacing: "2px",
              color: "white",
              cursor: "pointer"
            }}
            onClick={() => navigate("/")}
          >
            AUTH<span style={{ color: "var(--accent)" }}>NODE</span>
          </div>
          <div style={{ display: "flex", gap: "30px" }}>
            <button onClick={() => navigate("/dashboard")} className="nav-item-btn">
              DASHBOARD
            </button>
            <button onClick={() => navigate("/issue")} className="nav-item-btn">
              ISSUE
            </button>
            <button
              onClick={() => navigate("/verify")}
              className="nav-item-btn active-nav"
            >
              VERIFY
            </button>
          </div>
        </div>
      </nav>

      <div
        className="container"
        style={{ width: "100%", maxWidth: "800px", marginTop: "40px" }}
      >
        <div
          className="hero-content reveal active"
          style={{ textAlign: "center", marginBottom: "40px" }}
        >
          <span className="hero-tag">On-Chain Explorer</span>
          <h1 className="gradient-text">Verify Integrity</h1>
          <p>Scanning AuthNode Ledger for Issued Credentials</p>
        </div>

        <div
          className="vault-ui reveal active"
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            padding: "40px",
            borderRadius: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}
        >
          <input
            className="cyber-input"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="Enter Certificate Hash..."
          />

          <button
            className="btn-glow"
            onClick={() => startAudit()}
            disabled={isScanning}
            style={{ marginTop: "20px" }}
          >
            {isScanning ? "VERIFYING..." : "VERIFY RECORD"}
          </button>

          {showDashboard && (
            <div className="reveal active" style={{ marginTop: "40px" }}>
              <h3 style={{ color: "white" }}>{result.name}</h3>
              <p style={{ color: "#94a3b8" }}>{result.course}</p>
              <p style={{ color: "#94a3b8" }}>{result.time}</p>
              <p style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                HASH: {result.hash}
              </p>
              <p
                style={{
                  marginTop: "10px",
                  color: result.success ? "#10b981" : "#ef4444"
                }}
              >
                {result.aiText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
