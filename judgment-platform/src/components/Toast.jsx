import React, { useState, useEffect } from "react";

let toastEmitter = null;

export function showToast(message, type = "info", duration = 3500) {
  if (toastEmitter) {
    toastEmitter(message, type, duration);
  } else {
    // Fallback if toast container isn't mounted yet
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastEmitter = (message, type, duration) => {
      const id = Date.now() + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    return () => {
      toastEmitter = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        let borderColor = "var(--gold, #C5A059)";
        let icon = "ℹ️";
        let bg = "rgba(26, 24, 20, 0.95)";

        if (t.type === "success") {
          borderColor = "#10B981";
          icon = "✅";
        } else if (t.type === "error") {
          borderColor = "#EF4444";
          icon = "❌";
        } else if (t.type === "warning") {
          borderColor = "#F59E0B";
          icon = "⚠️";
        }

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              minWidth: "320px",
              maxWidth: "460px",
              background: bg,
              color: "#F5F3EF",
              border: `1px solid ${borderColor}`,
              borderLeft: `5px solid ${borderColor}`,
              borderRadius: "8px",
              padding: "14px 18px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              fontSize: "13.5px",
              lineHeight: 1.45,
              animation: "slideIn 0.25s ease-out forwards",
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: "16px", marginTop: "1px" }}>{icon}</span>
            <div style={{ flex: 1, wordBreak: "break-word" }}>{t.message}</div>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
