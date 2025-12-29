import React, { useState } from 'react';

function VerifySection() {
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startVerification = () => {
    setLogs(["> Initializing Secure Audit..."]);
    
    setTimeout(() => {
      setLogs(prev => [...prev, "> Fetching Block Hash: 0x71c...92f"]);
    }, 500);

    setTimeout(() => {
      setLogs(prev => [...prev, "> Identity Confirmed via Decentralized Node."]);
    }, 1200);

    setTimeout(() => {
      setLogs(prev => [...prev, "VERIFICATION SUCCESSFUL."]);
    }, 1800);
  };

  return (
    <div>
      {/* Button par onClick dalo */}
      <button className="btn-primary" onClick={startVerification}>Verify</button>

      {/* Terminal logs ko map karo */}
      <div className="terminal-logs">
        {logs.map((log, i) => (
          <p key={i} style={{ color: log.includes('SUCCESS') ? '#00f2ff' : '#10b981' }}>{log}</p>
        ))}
      </div>

      {/* Modal toggle handle karo simple boolean se */}
      <div className="help-icon" onClick={() => setIsModalOpen(true)}>?</div>
      
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             {/* Modal Content Here */}
             <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}