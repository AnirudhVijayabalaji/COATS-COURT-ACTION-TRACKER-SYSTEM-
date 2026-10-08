import { useState } from "react";
import { loginUser, signupUser } from "../api/judgmentAI";

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  
  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRole, setSignupRole] = useState("legal_reviewer");
  const [signupPassword, setSignupPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await loginUser(username.trim(), password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Login failed. Please verify your credentials.");
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setError("Please fill in username, email, and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await signupUser({
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        name: signupName.trim() || signupUsername.trim(),
        role: signupRole,
        department: signupRole === "legal_reviewer" ? "Judicial Branch" : "Civil Administration",
      });
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Registration failed. Please check your information.");
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setMode("login");
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div className="login-root" style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 20%, #1c1b18 0%, #0d0d0c 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#F5F3EF"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "#161513",
        border: "1px solid rgba(212, 175, 55, 0.2)",
        borderRadius: "14px",
        padding: "36px 32px",
        boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)"
      }}>
        {/* Emblem & Branding */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 16px",
            background: "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)",
            border: "1px solid var(--gold, #D4AF37)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #D4AF37)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18M3 9l9-6 9 6M3 9l4 9M21 9l-4 9"/>
              <circle cx="7" cy="18" r="3"/>
              <circle cx="17" cy="18" r="3"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "0.02em", margin: "0 0 6px 0", color: "#F5F3EF" }}>
            COATS Judicial Portal
          </h1>
          <p style={{ fontSize: "13px", color: "#8A8480", margin: 0 }}>
            Court Order Action & Tracking System · Single Sign-On
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "4px",
          marginBottom: "20px"
        }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              padding: "8px",
              background: mode === "login" ? "var(--gold, #D4AF37)" : "transparent",
              color: mode === "login" ? "#0D0D0C" : "#C8C2B9",
              border: "none",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            style={{
              padding: "8px",
              background: mode === "signup" ? "var(--gold, #D4AF37)" : "transparent",
              color: mode === "signup" ? "#0D0D0C" : "#C8C2B9",
              border: "none",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Create New Account
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "20px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "8px" }}>
                Username or Official Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. judge.sharma or sharma.coats@gov.in"
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#0D0D0C",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#F5F3EF",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "8px" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#0D0D0C",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#F5F3EF",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#0D0D0C",
                fontSize: "14px",
                fontWeight: "700",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.25)"
              }}
            >
              {loading ? "Authenticating Docket..." : "Sign In to Docket"}
            </button>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {mode === "signup" && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "6px" }}>
                Official Name / Title
              </label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Hon'ble Justice P. R. Rao"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#0D0D0C",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#F5F3EF",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "6px" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="e.g. judge.rao"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0D0D0C",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#F5F3EF",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "6px" }}>
                  Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0D0D0C",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#F5F3EF",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer"
                  }}
                >
                  <option value="legal_reviewer">Judge / Legal Reviewer</option>
                  <option value="admin">System Administrator</option>
                  <option value="department_officer">Department Officer</option>
                  <option value="decision_maker">Decision Maker / HOD</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "6px" }}>
                Official Email
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="e.g. rao.coats@gov.in"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#0D0D0C",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#F5F3EF",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#C8C2B9", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="At least 4 characters"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#0D0D0C",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#F5F3EF",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#0D0D0C",
                fontSize: "14px",
                fontWeight: "700",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.25)"
              }}
            >
              {loading ? "Registering Account..." : "Create Account & Enter Portal"}
            </button>
          </form>
        )}

        {/* Quick Demo Access Pills */}
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#8A8480", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", textAlign: "center" }}>
            Demo Accounts (Click to Fill & Sign In)
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("judge.sharma", "Judge@123")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "6px",
                color: "#F5F3EF",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span>⚖️ <strong>Justice Sharma</strong> (Judge)</span>
              <span style={{ color: "var(--gold, #D4AF37)", fontSize: "11px" }}>judge.sharma</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("judge.verma", "Judge@123")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "6px",
                color: "#F5F3EF",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span>⚖️ <strong>Justice Verma</strong> (Judge)</span>
              <span style={{ color: "var(--gold, #D4AF37)", fontSize: "11px" }}>judge.verma</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("admin", "Admin@123")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "#C8C2B9",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span>🛡️ <strong>System Administrator</strong></span>
              <span style={{ color: "#8A8480", fontSize: "11px" }}>admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
