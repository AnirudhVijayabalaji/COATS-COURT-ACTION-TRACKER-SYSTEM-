import { useState, useEffect } from "react";
import UploadScreen from "./components/UploadScreen";
import WorkflowScreen from "./components/WorkflowScreen";
import LoadingScreen from "./components/LoadingScreen";
import DashboardScreen from "./components/DashboardScreen";
import CasesScreen from "./components/CasesScreen";
import ToastContainer from "./components/Toast";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("upload");
  const [caseId, setCaseId] = useState(null);
  const [fileName, setFileName] = useState("");

  // Simulated identity state
  const [userRole, setUserRole] = useState("legal_reviewer");
  const [userEmail, setUserEmail] = useState("reviewer.coats@gov.in");

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setUserRole(role);
    if (role === "admin") setUserEmail("admin.coats@gov.in");
    else if (role === "legal_reviewer") setUserEmail("reviewer.coats@gov.in");
    else if (role === "department_officer") setUserEmail("officer.coats@gov.in");
    else if (role === "decision_maker") setUserEmail("director.coats@gov.in");
  };

  const handleSelectCase = (id, name = "Case Brief") => {
    setCaseId(id);
    setFileName(name);
    setScreen("workflow");
  };

  const handleAnalysisComplete = (id, name) => {
    setCaseId(id);
    setFileName(name);
    setScreen("workflow");
  };

  return (
    <div className="app-root">
      {screen === "loading" && <LoadingScreen />}

      {screen !== "loading" && (
        <>
          <header className="app-header">
            <div className="header-inner">
              <div className="brand" onClick={() => { setScreen("dashboard"); setCaseId(null); }} style={{ cursor: "pointer" }}>
                <div className="brand-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v18M3 9l9-6 9 6M3 9l4 9M21 9l-4 9"/>
                    <circle cx="7" cy="18" r="3"/>
                    <circle cx="17" cy="18" r="3"/>
                  </svg>
                </div>
                <div>
                  <span className="brand-name">COATS</span>
                  <span className="brand-tagline">Court Order Action & Tracking</span>
                </div>
              </div>
              
              <nav className="header-nav" style={{ display: "flex", gap: "1rem" }}>
                <button 
                  className={`nav-link ${screen === "dashboard" ? "active" : ""}`} 
                  onClick={() => { setScreen("dashboard"); setCaseId(null); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: screen === "dashboard" ? "var(--gold)" : "#8A8480",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderBottom: screen === "dashboard" ? "2px solid var(--gold)" : "2px solid transparent"
                  }}
                >
                  Dashboard
                </button>
                <button 
                  className={`nav-link ${screen === "upload" ? "active" : ""}`} 
                  onClick={() => { setScreen("upload"); setCaseId(null); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: screen === "upload" ? "var(--gold)" : "#8A8480",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderBottom: screen === "upload" ? "2px solid var(--gold)" : "2px solid transparent"
                  }}
                >
                  Case Intake
                </button>
                <button 
                  className={`nav-link ${screen === "cases" ? "active" : ""}`} 
                  onClick={() => { setScreen("cases"); setCaseId(null); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: screen === "cases" ? "var(--gold)" : "#8A8480",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderBottom: screen === "cases" ? "2px solid var(--gold)" : "2px solid transparent"
                  }}
                >
                  Judgment Registry
                </button>
              </nav>

              <div className="header-right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <label style={{ fontSize: "11px", color: "#8A8480", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role Switcher:</label>
                  <select 
                    value={userRole} 
                    onChange={handleRoleChange}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "#1E1D1B",
                      color: "#F5F3EF",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <option value="legal_reviewer">Legal Reviewer</option>
                    <option value="department_officer">Department Officer</option>
                    <option value="decision_maker">Decision Maker / HOD</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <div className="user-badge" style={{ fontSize: "12px", padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", color: "#C8C2B9" }}>
                  {userEmail}
                </div>
              </div>
            </div>
          </header>

          <main className="app-main">
            {screen === "dashboard" && (
              <DashboardScreen 
                userRole={userRole} 
                userEmail={userEmail} 
                onSelectCase={handleSelectCase}
                onNavigate={setScreen}
              />
            )}
            {screen === "upload" && (
              <UploadScreen onComplete={handleAnalysisComplete} />
            )}
            {screen === "cases" && (
              <CasesScreen 
                onSelectCase={handleSelectCase} 
                onNavigate={setScreen}
              />
            )}
            {screen === "workflow" && (
              <WorkflowScreen 
                caseId={caseId} 
                fileName={fileName} 
                userRole={userRole}
                userEmail={userEmail}
                onBack={() => setScreen("cases")}
              />
            )}
          </main>
        </>
      )}
      <ToastContainer />
    </div>
  );
}
