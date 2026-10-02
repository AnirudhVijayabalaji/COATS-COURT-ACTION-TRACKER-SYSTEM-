import React, { useState, useEffect } from "react";
import { getECourtsSamples, searchECourts } from "../api/judgmentAI";

const SAMPLE_FALLBACK = [
  {
    cnr: "TSHC010012342024",
    case_number: "WP No. 1234/2024",
    court: "High Court for the State of Telangana at Hyderabad",
    title: "M/s Apex Infrastructure Ltd. vs. State of Telangana & Union of India (MoHUA)",
    disputed_amount: "₹847 Crore",
    deadline_days: 21,
    category: "Mandamus / Fund Allocation",
    summary: "Mandamus directing Ministry of Housing and Urban Affairs (MoHUA) to release statutory central allocations of ₹847 Crore within 21 days.",
    tags: ["PMAY-U", "Mandamus", "Central Allocation"],
  },
  {
    cnr: "DLHC010056782023",
    case_number: "ARB.P. 882/2023",
    court: "High Court of Delhi at New Delhi",
    title: "Bharat Construction Consortium vs. National Highways Authority of India (NHAI)",
    disputed_amount: "₹142 Crore",
    deadline_days: 30,
    category: "Commercial Arbitration",
    summary: "Application under Section 11 of the Arbitration & Conciliation Act, 1996 for appointment of Sole Arbitrator for highway EPC claims.",
    tags: ["Arbitration", "NHAI", "Section 11"],
  },
  {
    cnr: "BOMH010098762024",
    case_number: "PIL No. 45/2024",
    court: "High Court of Judicature at Bombay",
    title: "Jan Hit Manch vs. State of Maharashtra & Maharashtra Pollution Control Board",
    disputed_amount: "₹50 Lakh Fine",
    deadline_days: 14,
    category: "Public Interest / Environmental",
    summary: "PIL against industrial river pollution. Court directed MPCB to issue closure orders to defaulting units within 14 days under contempt notice.",
    tags: ["Environment", "PIL", "Contempt Risk"],
  },
  {
    cnr: "KAHC010034562024",
    case_number: "WP No. 6712/2024",
    court: "High Court of Karnataka at Bengaluru",
    title: "Ramesh Kumar & Ors. vs. State of Karnataka & Dept of Higher Education",
    disputed_amount: "₹18.4 Crore",
    deadline_days: 60,
    category: "Service Law / Pension Arrears",
    summary: "Writ of Mandamus for disbursement of revised UGC 7th Pay Commission arrears and retiral benefits with interest within 60 days.",
    tags: ["Service Law", "Pension", "Mandamus"],
  },
];

const COURTS = [
  "All High Courts & Tribunals",
  "High Court for the State of Telangana",
  "High Court of Delhi",
  "High Court of Judicature at Bombay",
  "High Court of Karnataka",
  "High Court of Judicature at Allahabad",
  "Supreme Court of India",
];

export default function CaseDiscoveryModal({ isOpen, onClose, onSelectCase }) {
  const [tab, setTab] = useState("samples"); // 'samples' | 'search' | 'cnr'
  const [samples, setSamples] = useState(SAMPLE_FALLBACK);
  const [loading, setLoading] = useState(false);

  // Search tab state
  const [courtQuery, setCourtQuery] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Direct CNR tab state
  const [cnrInput, setCnrInput] = useState("");
  const [cnrError, setCnrError] = useState("");

  useEffect(() => {
    if (isOpen) {
      getECourtsSamples()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setSamples(data);
        })
        .catch(() => {
          // Keep fallback if backend is unreachable
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!partyQuery.trim() && !courtQuery) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchECourts(partyQuery, courtQuery === "All High Courts & Tribunals" ? "" : courtQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCnrSubmit = (e) => {
    e.preventDefault();
    const clean = cnrInput.trim().toUpperCase();
    if (clean.length < 6) {
      setCnrError("Please enter a valid CNR number (minimum 6 characters, e.g. TSHC010012342024)");
      return;
    }
    setCnrError("");
    onSelectCase(clean, `Case (CNR: ${clean})`);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 9, 8, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#1A1815",
          border: "1px solid rgba(197, 160, 89, 0.35)",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "840px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          color: "#F5F3EF",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#1E1C18",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(197, 160, 89, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(197, 160, 89, 0.3)",
              }}
            >
              🏛️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#F5F3EF" }}>
                eCourts Case Discovery & Gateway
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8A8480" }}>
                Powered by <code>bharat-courts</code> · High Courts, District Courts & Supreme Court
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8A8480",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "#161512",
            padding: "0 24px",
          }}
        >
          {[
            { id: "samples", label: "⚡ Landmark Demo Judgments" },
            { id: "search", label: "🏛️ Search by Court & Party" },
            { id: "cnr", label: "🔢 Direct CNR Entry" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                padding: "14px 18px",
                fontSize: "13px",
                fontWeight: "600",
                color: tab === t.id ? "var(--gold, #C5A059)" : "#8A8480",
                borderBottom: tab === t.id ? "2px solid var(--gold, #C5A059)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {/* TAB 1: SAMPLES */}
          {tab === "samples" && (
            <div>
              <div
                style={{
                  background: "rgba(197, 160, 89, 0.08)",
                  border: "1px solid rgba(197, 160, 89, 0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "12.5px",
                  color: "#D4AF37",
                  marginBottom: "20px",
                }}
              >
                💡 <strong>1-Click Instant Test:</strong> Select any authentic Indian High Court judgment below. The PDF will be downloaded, passed through NeMo Guardrails, and rendered into your workflow brief with zero disk uploads required.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {samples.map((c) => (
                  <div
                    key={c.cnr}
                    style={{
                      background: "#22201C",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: "700",
                            background: "rgba(197, 160, 89, 0.15)",
                            color: "#D4AF37",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {c.category || "Court Order"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8A8480", fontFamily: "monospace" }}>
                          {c.cnr}
                        </span>
                      </div>
                      <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700", color: "#F5F3EF", lineHeight: 1.35 }}>
                        {c.title}
                      </h4>
                      <div style={{ fontSize: "11px", color: "#A8A29E", marginBottom: "10px" }}>
                        {c.court} · {c.case_number}
                      </div>
                      <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#8A8480", lineHeight: 1.45 }}>
                        {c.summary}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "600" }}>
                        ⏱️ Due in {c.deadline_days || 21} days
                      </span>
                      <button
                        onClick={() => onSelectCase(c.cnr, c.title)}
                        style={{
                          background: "var(--gold, #C5A059)",
                          color: "#141312",
                          border: "none",
                          borderRadius: "6px",
                          padding: "7px 14px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        ⚡ Load & Analyze
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH */}
          {tab === "search" && (
            <div>
              <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <select
                  value={courtQuery}
                  onChange={(e) => setCourtQuery(e.target.value)}
                  style={{
                    flex: "0 0 240px",
                    background: "#22201C",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "6px",
                    color: "#F5F3EF",
                    padding: "10px 14px",
                    fontSize: "12.5px",
                  }}
                >
                  {COURTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Enter petitioner or respondent name (e.g. Apex, NHAI, Ramesh)..."
                  value={partyQuery}
                  onChange={(e) => setPartyQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "#22201C",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "6px",
                    color: "#F5F3EF",
                    padding: "10px 14px",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "var(--gold, #C5A059)",
                    color: "#141312",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Searching..." : "Search eCourts"}
                </button>
              </form>

              {hasSearched && (
                <div>
                  <div style={{ fontSize: "12px", color: "#8A8480", marginBottom: "12px" }}>
                    Showing {searchResults.length} matching case(s) found in registry:
                  </div>

                  {searchResults.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", background: "#22201C", borderRadius: "8px", color: "#8A8480" }}>
                      No matching cases found. Try searching for "Apex", "NHAI", or "Ramesh".
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {searchResults.map((r) => (
                        <div
                          key={r.cnr}
                          style={{
                            background: "#22201C",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            padding: "14px 18px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#F5F3EF" }}>{r.title}</div>
                            <div style={{ fontSize: "11px", color: "#8A8480", marginTop: "3px" }}>
                              {r.court} · {r.case_number} · CNR: <span style={{ fontFamily: "monospace" }}>{r.cnr}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => onSelectCase(r.cnr, r.title)}
                            style={{
                              background: "var(--gold, #C5A059)",
                              color: "#141312",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            Import Case
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT CNR */}
          {tab === "cnr" && (
            <div style={{ maxWidth: "560px", margin: "10px auto" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#F5F3EF" }}>
                  Direct Case Number Record (CNR) Lookup
                </h3>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#8A8480", lineHeight: 1.4 }}>
                  Enter the 16-character CNR code from your eCourts receipt or filing slip. The official judgment PDF will be resolved and imported.
                </p>
              </div>

              <form onSubmit={handleCnrSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <input
                    type="text"
                    placeholder="e.g. TSHC010012342024 or DLHC010056782023"
                    value={cnrInput}
                    onChange={(e) => setCnrInput(e.target.value.toUpperCase())}
                    maxLength={16}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "#22201C",
                      border: "1px solid rgba(197, 160, 89, 0.4)",
                      borderRadius: "8px",
                      color: "#F5F3EF",
                      fontSize: "15px",
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  />
                  {cnrError && (
                    <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "6px", textAlign: "center" }}>
                      {cnrError}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    background: "var(--gold, #C5A059)",
                    color: "#141312",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    letterSpacing: "0.03em",
                  }}
                >
                  Resolve & Import Judgment PDF
                </button>
              </form>

              <div
                style={{
                  marginTop: "24px",
                  padding: "14px 18px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "11.5px",
                  color: "#8A8480",
                  lineHeight: 1.5,
                }}
              >
                <strong>Format Guide:</strong> The first 4 characters indicate the court (e.g. <code>TSHC</code> = Telangana High Court, <code>DLHC</code> = Delhi High Court, <code>BOMH</code> = Bombay High Court).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
