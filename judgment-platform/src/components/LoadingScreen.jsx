import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#141311',
      color: '#F5F3EF',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* COATS Logo Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.2)'
        }}>
          <img src="/logo.png" alt="COATS" style={{ width: "32px", height: "32px" }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '2px', color: '#F5F3EF' }}>
            COATS
          </div>
          <div style={{ fontSize: '11px', color: '#8A8480', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Court Order Action & Tracking
          </div>
        </div>
      </div>

      {/* Gold Loading Spinner */}
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid rgba(212, 175, 55, 0.2)',
        borderTop: '3px solid #D4AF37',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '16px'
      }} />

      <div style={{ fontSize: '13px', color: '#8A8480' }}>
        Initializing workspace...
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
