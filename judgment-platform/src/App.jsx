import { useState, useEffect } from "react";
import UploadScreen from "./components/UploadScreen";
import WorkflowScreen from "./components/WorkflowScreen";
import LoadingScreen from "./components/LoadingScreen";
import DashboardScreen from "./components/DashboardScreen";
import CasesScreen from "./components/CasesScreen";
import LoginScreen from "./components/LoginScreen";
import ToastContainer from "./components/Toast";
import { getStoredUser, logoutUser } from "./api/judgmentAI";
import "./App.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [screen, setScreen] = useState(() => (getStoredUser()?.role === "admin" ? "dashboard" : "cases"));
  const [caseId, setCaseId] = useState(null);
  const [fileName, setFileName] = useState("");

  const userRole = currentUser?.role || "legal_reviewer";
  const userEmail = currentUser?.email || "reviewer.coats@gov.in";

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCaseId(null);
    setScreen("cases");
  };

  const handleSelectCase = (id, name = "Case Brief") => {
    if (userRole === "admin") return;
    setCaseId(id);
    setFileName(name);
    setScreen("workflow");
  };

  const handleAnalysisComplete = (id, name) => {
    setCaseId(id);
    setFileName(name);
    setScreen("workflow");
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "legal_reviewer": return "Judge / Legal Reviewer";
      case "admin": return "System Administrator";
      case "department_officer": return "Department Officer";
      case "decision_maker": return "Decision Maker / HOD";
      default: return role;
    }
  };

  useEffect(() => {
    // Only dashboard is visible to the system administrator
    if (userRole === "admin") {
      if (screen !== "dashboard") {
        setScreen("dashboard");
      }
    } else if (screen === "dashboard") {
      setScreen("cases");
    }
  }, [screen, userRole]);

  // If user is not logged in, render the Judicial Login Screen
  if (!currentUser) {
    return (
      <div className="app-root">
        <LoginScreen onLoginSuccess={(user) => {
          setCurrentUser(user);
          setScreen(user?.role === "admin" ? "dashboard" : "cases");
        }} />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="app-root">
      {screen === "loading" && <LoadingScreen />}

      {screen !== "loading" && (
        <>
          <header className="app-header">
            <div className="header-inner">
              <div className="brand" onClick={() => { setScreen(userRole === "admin" ? "dashboard" : "cases"); setCaseId(null); }} style={{ cursor: "pointer" }}>
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
                {userRole === "admin" ? (
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
                    System Dashboard
                  </button>
                ) : (
                  <>
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
                      {userRole === "legal_reviewer" ? "My Judicial Docket" : "Judgment Registry"}
                    </button>
                  </>
                )}
              </nav>

              <div className="header-right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#F5F3EF" }}>
                    {currentUser.name || currentUser.username}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--gold)", fontWeight: "600" }}>
                    {getRoleDisplayName(userRole)}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "6px",
                    color: "#C8C2B9",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#C8C2B9"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <main className="app-main">
            {userRole === "admin" ? (
              <DashboardScreen 
                userRole={userRole} 
                userEmail={userEmail} 
                onSelectCase={handleSelectCase}
                onNavigate={(dest) => {
                  if (dest === "dashboard") setScreen("dashboard");
                }}
              />
            ) : (
              <>
                {screen === "upload" && (
                  <UploadScreen onComplete={handleAnalysisComplete} currentUser={currentUser} />
                )}
                {screen === "cases" && (
                  <CasesScreen 
                    currentUser={currentUser}
                    onSelectCase={handleSelectCase} 
                    onNavigate={setScreen}
                  />
                )}
                {screen === "workflow" && (
                  <WorkflowScreen 
                    caseId={caseId} 
                    fileName={fileName} 
                    currentUser={currentUser}
                    userRole={userRole}
                    userEmail={userEmail}
                    onBack={() => setScreen("cases")}
                  />
                )}
              </>
            )}
          </main>
        </>
      )}
      <ToastContainer />
    </div>
  );
}
