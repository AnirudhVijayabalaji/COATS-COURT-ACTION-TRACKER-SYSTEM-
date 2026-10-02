import { useEffect, useRef, useState } from "react";
import { streamProgress, uploadJudgment, ingestECourtsCase } from "../api/judgmentAI";
import CaseDiscoveryModal from "./CaseDiscoveryModal";


const STEPS = [
  "🛡️ NVIDIA NeMo Guardrails: Verifying court judgment...",
  "Reading the document structure...",
  "Locating parties, court, and operative order...",
  "Finding directions, dates, and responsible offices...",
  "Linking each action to a source page...",
  "Preparing the workflow brief...",
];

const DEMO_CHIPS = [
  {
    label: "⚡ Mandamus Fund Release (Telangana HC)",
    cnr: "TSHC010012342024",
    title: "Apex Infra vs. State of Telangana & MoHUA (WP 1234/2024)",
  },
  {
    label: "⚡ Commercial Arbitration (Delhi HC)",
    cnr: "DLHC010056782023",
    title: "Bharat Construction vs. NHAI (ARB.P. 882/2023)",
  },
  {
    label: "⚡ River Pollution PIL (Bombay HC)",
    cnr: "BOMH010098762024",
    title: "Jan Hit Manch vs. MPCB (PIL 45/2024)",
  },
  {
    label: "⚡ Pension Arrears Mandamus (Karnataka HC)",
    cnr: "KAHC010034562024",
    title: "Ramesh Kumar vs. State of Karnataka (WP 6712/2024)",
  },
];

export default function UploadScreen({ onComplete }) {
  const [phase, setPhase] = useState("idle");
  const [steps, setSteps] = useState(STEPS.map((label) => ({ label, done: false })));
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isGuardrailReject, setIsGuardrailReject] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickCnr, setQuickCnr] = useState("");
  const [quickCnrErr, setQuickCnrErr] = useState("");
  const inputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => streamRef.current?.close();
  }, []);

  const startAnalysis = async (file) => {
    setFileName(file.name);
    setPhase("analyzing");
    setError("");
    setIsGuardrailReject(false);
    // Mark first step as active
    setSteps(STEPS.map((label, idx) => ({ label, done: false })));

    try {
      const { case_id } = await uploadJudgment(file);
      streamRef.current?.close();
      // Mark all steps complete
      setSteps(STEPS.map((label) => ({ label, done: true })));
      // Short 300ms pause to show completed checkmarks before navigating
      setTimeout(() => {
        onComplete(case_id, file.name);
      }, 400);
    } catch (err) {
      const is422 = err.status === 422 || (err.message && err.message.toLowerCase().includes("not a valid court judgment"));
      setIsGuardrailReject(is422);
      setError(err.message || "Upload failed");
      setPhase("error");
    }
  };

  const startECourtsAnalysis = async (cnr, title) => {
    setModalOpen(false);
    setFileName(title || `eCourts Case (CNR: ${cnr})`);
    setPhase("analyzing");
    setError("");
    setIsGuardrailReject(false);
    setSteps(STEPS.map((label) => ({ label, done: false })));

    try {
      const { case_id, filename } = await ingestECourtsCase(cnr);
      streamRef.current?.close();
      setSteps(STEPS.map((label) => ({ label, done: true })));
      setTimeout(() => {
        onComplete(case_id, filename || title);
      }, 400);
    } catch (err) {
      const is422 = err.status === 422 || (err.message && err.message.toLowerCase().includes("not a valid court judgment"));
      setIsGuardrailReject(is422);
      setError(err.message || "eCourts ingestion failed");
      setPhase("error");
    }
  };

  const handleFile = (file) => {
    if (file) startAnalysis(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  };

  if (phase === "error" && isGuardrailReject) {
    return (
      <div className="upload-screen">
        <div 
          className="analyzing-state review-card guardrail-reject-card"
          style={{
            maxWidth: "620px",
            margin: "3.5rem auto",
            textAlign: "center",
            padding: "2.5rem 2rem",
            background: "#1C1414",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "14px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.5)"
          }}
        >
          <div 
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#F87171",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.05em",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              marginBottom: "1.5rem"
            }}
          >
            🛡️ NVIDIA NEMO GUARDRAILS
          </div>

          <h2 style={{ color: "#EF4444", fontSize: "24px", fontWeight: "700", margin: "0 0 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>❌</span> Reject: HTTP 422
          </h2>

          <h3 style={{ color: "#FAF8F4", fontSize: "19px", fontWeight: "600", margin: "0 0 1.2rem", letterSpacing: "-0.01em" }}>
            'Not a valid court judgment PDF'
          </h3>

          <p style={{ color: "#C8C2B9", fontSize: "14px", lineHeight: "1.6", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
            The uploaded file <strong style={{ color: "#F5F3EF" }}>"{fileName}"</strong> was inspected by the input guardrail. It does not contain an official court order, bench header, or judicial directions.
          </p>

          <div 
            style={{
              background: "rgba(0,0,0,0.4)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "1.8rem",
              fontSize: "13px",
              color: "#FCA5A5",
              borderLeft: "3px solid #EF4444",
              textAlign: "left"
            }}
          >
            <strong>Guardrail Trigger:</strong> Non-judicial document type detected (e.g. Resume, Bill/Invoice, Article, or general text). RAG indexing and extraction halted to protect system integrity.
          </div>

          <button 
            className="sample-case-btn" 
            onClick={() => { setPhase("idle"); setError(""); setIsGuardrailReject(false); }}
            style={{
              background: "var(--gold)",
              color: "#1A1814",
              fontWeight: "700",
              padding: "12px 28px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              cursor: "pointer",
              transition: "transform 0.15s ease"
            }}
          >
            Upload a Valid Court Judgment PDF
          </button>
        </div>
      </div>
    );
  }

  if (phase === "analyzing" || phase === "error") {
    const activeIndex = steps.findIndex((step) => !step.done);

    return (
      <div className="upload-screen">
        <div className="analyzing-state review-card">
          {phase === "analyzing" && <div className="spinner-ring" />}
          <h2>{phase === "error" ? "Upload needs attention" : "Preparing the case brief"}</h2>
          <p className="analysis-file">{fileName}</p>
          {error && <p className="analysis-file" style={{ color: "#EF4444" }}>{error}</p>}
          <ul className="analyzing-steps">
            {steps.map((step, index) => (
              <li
                key={step.key || step.label}
                className={step.done ? "done" : index === activeIndex ? "active" : ""}
              >
                <span className="step-dot" />
                {step.label}
              </li>
            ))}
          </ul>
          {phase === "error" && (
            <button className="sample-case-btn" onClick={() => setPhase("idle")}>
              Try another PDF
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="upload-screen" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Top Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <span className="eyebrow" style={{ display: "inline-block", marginBottom: "0.5rem" }}>Case Intake & Ingestion</span>
        <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: "800", color: "var(--ink, #1A1814)", margin: "0 0 0.75rem" }}>
          Choose your intake method.
        </h1>
        <p style={{ color: "var(--ink-muted, #5A5550)", fontSize: "16px", maxWidth: "680px", margin: "0 auto", lineHeight: 1.6 }}>
          Upload an authentic court order PDF or fetch verified records directly from Indian eCourts (High Courts & District Courts).
        </p>
      </div>

      {/* Dual Space Container: 2 equal, clean cards side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "2rem", alignItems: "stretch" }}>
        
        {/* SPACE 1: MANUAL FILE UPLOAD */}
        <div
          style={{
            background: "rgba(255, 255, 252, 0.95)",
            border: "1px solid rgba(232, 224, 208, 0.95)",
            borderRadius: "14px",
            boxShadow: "0 12px 36px rgba(26, 24, 20, 0.05)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "20px" }}>📄</span>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--olive, #5F6F52)" }}>
                Method 1 · Local PDF Upload
              </span>
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "800", margin: "0 0 0.5rem", color: "var(--ink, #1A1814)" }}>
              Upload Court Judgment PDF
            </h3>
            <p style={{ fontSize: "13.5px", color: "var(--ink-muted, #666)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
              Upload any authentic court order, bail order, or judgment PDF. Our AI extracts operative directives, deadlines, and source citations.
            </p>

            {/* Dropzone */}
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              style={{
                minHeight: "220px",
                border: "2px dashed rgba(95, 111, 82, 0.25)",
                borderRadius: "10px",
                padding: "2rem 1.5rem",
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: dragOver ? "rgba(95, 111, 82, 0.05)" : "transparent",
                transition: "all 0.15s ease",
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(event) => handleFile(event.target.files[0])}
              />
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "10px",
                  background: "var(--sage, #EAEFE9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--olive, #5F6F52)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                  <path d="M14 2v5h5" />
                  <path d="M8 13h8" />
                  <path d="M8 17h5" />
                </svg>
              </div>
              <strong style={{ fontSize: "15px", color: "var(--ink, #1A1814)", marginBottom: "4px" }}>
                Drag & drop judgment PDF here
              </strong>
              <span style={{ fontSize: "13px", color: "var(--ink-muted, #777)", marginBottom: "12px" }}>
                or click to browse from files
              </span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--olive, #5F6F52)", background: "rgba(95, 111, 82, 0.1)", padding: "4px 10px", borderRadius: "12px" }}>
                PDF Files · Scanned or Digital
              </span>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--olive, #5F6F52)", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
              🛡️ NVIDIA NeMo Guardrails Active
            </span>
            <span style={{ fontSize: "12px", color: "#8A8480" }}>Max size: 50 MB</span>
          </div>
        </div>

        {/* SPACE 2: BHARAT ECOURTS GATEWAY */}
        <div
          style={{
            background: "rgba(255, 255, 252, 0.95)",
            border: "1px solid rgba(232, 224, 208, 0.95)",
            borderRadius: "14px",
            boxShadow: "0 12px 36px rgba(26, 24, 20, 0.05)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>🏛️</span>
                <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gold, #C5A059)" }}>
                  Method 2 · Bharat eCourts Gateway
                </span>
              </div>
              <span style={{ fontSize: "11px", background: "rgba(197, 160, 89, 0.15)", color: "#8A6D2B", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
                bharat-courts
              </span>
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "800", margin: "0 0 0.5rem", color: "var(--ink, #1A1814)" }}>
              Retrieve by CNR or Landmark Demo
            </h3>
            <p style={{ fontSize: "13.5px", color: "var(--ink-muted, #666)", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
              Fetch certified court records directly from Indian High Courts & District Courts. No local PDF file required.
            </p>

            {/* Quick CNR Entry Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = quickCnr.trim().toUpperCase();
                if (clean.length < 6) {
                  setQuickCnrErr("Please enter a valid CNR code (e.g. TSHC010012342024)");
                  return;
                }
                setQuickCnrErr("");
                startECourtsAnalysis(clean, `eCourts Case (${clean})`);
              }}
              style={{ marginBottom: "1.25rem" }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter 16-character CNR (e.g. TSHC010012342024)"
                  value={quickCnr}
                  onChange={(e) => {
                    setQuickCnr(e.target.value.toUpperCase());
                    if (quickCnrErr) setQuickCnrErr("");
                  }}
                  maxLength={16}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: quickCnrErr ? "1px solid #EF4444" : "1px solid rgba(197, 160, 89, 0.5)",
                    background: "#FFFFFF",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                    color: "var(--ink, #1A1814)",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "var(--gold, #C5A059)",
                    color: "#141312",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  Fetch & Analyze
                </button>
              </div>
              {quickCnrErr && (
                <div style={{ color: "#EF4444", fontSize: "11.5px", marginTop: "4px" }}>{quickCnrErr}</div>
              )}
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "1rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A8480" }}>
                Or 1-Click Landmark Judgments
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
            </div>

            {/* 4 Demo Chips styled cleanly with matching card theme */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {DEMO_CHIPS.map((chip) => (
                <button
                  key={chip.cnr}
                  onClick={() => startECourtsAnalysis(chip.cnr, chip.title)}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(232, 224, 208, 0.95)",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold, #C5A059)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(197, 160, 89, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(232, 224, 208, 0.95)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6D2B" }}>{chip.label}</span>
                  <span style={{ fontSize: "11px", color: "var(--ink-muted, #777)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chip.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "#8A8480" }}>
              Don't know the CNR number?
            </span>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--gold, #C5A059)",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer",
                padding: "2px 6px",
                textDecoration: "underline",
              }}
            >
              Search by Court & Party Name →
            </button>
          </div>
        </div>

      </div>

      <CaseDiscoveryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelectCase={startECourtsAnalysis}
      />
    </div>
  );
}
