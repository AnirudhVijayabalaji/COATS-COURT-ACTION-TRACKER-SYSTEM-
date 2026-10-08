import { useEffect, useState } from "react";
import { listCases } from "../api/judgmentAI";

const CASE_TYPES = [
  ["all", "All Case Types"],
  ["Asset / Property Dispute", "🏛️ Asset / Property"],
  ["Commercial & Arbitration", "📜 Commercial & Arbitration"],
  ["Writ / Mandamus", "⚖️ Writ / Mandamus"],
  ["Service & Pension", "💼 Service & Pension"],
  ["Revenue & Tax", "🏢 Revenue & Tax"],
  ["Environmental / PIL", "🌿 Environmental / PIL"],
  ["Civil Litigation", "📁 Civil Litigation"],
];

export default function CasesScreen({ currentUser, onSelectCase, onNavigate }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const isJudge = currentUser?.role === "legal_reviewer";

  useEffect(() => {
    let active = true;
    async function loadCases() {
      try {
        setLoading(true);
        const data = await listCases();
        if (active) {
          setCases(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load cases", err);
        if (active) {
          setError(err.message || "Failed to retrieve case list");
          setLoading(false);
        }
      }
    }
    loadCases();
    return () => { active = false; };
  }, [currentUser]);

  const filteredCases = cases.filter((c) => {
    const titleMatch = (c.case_title || "").toLowerCase().includes(search.toLowerCase());
    const numMatch = (c.case_number || "").toLowerCase().includes(search.toLowerCase());
    const fileMatch = (c.filename || "").toLowerCase().includes(search.toLowerCase());
    const typeSearch = (c.case_type || "").toLowerCase().includes(search.toLowerCase());
    const matchSearch = titleMatch || numMatch || fileMatch || typeSearch;

    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchType = typeFilter === "all" || (c.case_type || "").toLowerCase().includes(typeFilter.toLowerCase());

    return matchSearch && matchStatus && matchType;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case "uploaded": return "Uploaded";
      case "processing": return "Analyzing";
      case "pending_review": return "Pending Review";
      case "review_draft": return "Review Draft";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      case "failed": return "Failed";
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "uploaded": return "tracked";
      case "processing": return "review";
      case "pending_review": return "required";
      case "review_draft": return "assigned";
      case "approved": return "approved";
      case "rejected": return "danger";
      case "failed": return "muted";
      default: return "neutral";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading review-card" style={{ margin: "4rem auto", textAlign: "center" }}>
        <div className="spinner-ring" style={{ margin: "0 auto 1.5rem" }} />
        <h2>Loading Judicial Docket...</h2>
        <p className="analysis-file">Reading isolated bench logs and case registry database</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error review-card" style={{ margin: "4rem auto", textAlign: "center" }}>
        <h2 style={{ color: "var(--red)" }}>Failed to Load Cases</h2>
        <p className="analysis-file" style={{ margin: "1rem 0 2rem" }}>{error}</p>
        <button className="sample-case-btn" onClick={() => window.location.reload()}>Retry List</button>
      </div>
    );
  }

  return (
    <div className="cases-screen-container">
      {/* Title section */}
      <section className="dashboard-header-row" style={{ marginBottom: "2rem" }}>
        <div>
          <span className="eyebrow">
            {isJudge ? "Personal Judicial Bench" : "Digital Court Files & Logs"}
          </span>
          <h1>{isJudge ? "My Judicial Docket" : "Judgment Registry"}</h1>
          <p className="subtitle">
            {isJudge
              ? `Showing cases uploaded by ${currentUser?.name || "you"}. Dockets are strictly isolated to your bench.`
              : "All ingested court orders, operational status, and compliance workflows"}
          </p>
        </div>
        <button className="sample-case-btn" onClick={() => onNavigate("upload")} style={{ height: "fit-content", display: "flex", gap: "8px", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Ingest Court Judgment
        </button>
      </section>

      {/* Search and Filters panel */}
      <section className="cases-filter-panel">
        <div className="search-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Search by title, reference number, filename, or case type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", margin: 0, padding: "10px 18px" }}
          />
        </div>

        {/* Case Type Filter Chips */}
        <div style={{ marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#8A8480", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "10px" }}>
            Case Type:
          </span>
          <div className="filter-chips-row" style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px" }}>
            {CASE_TYPES.map(([typeVal, label]) => (
              <button
                key={typeVal}
                className={`suggestion-chip ${typeFilter === typeVal ? "active-filter" : ""}`}
                onClick={() => setTypeFilter(typeVal)}
                style={{
                  backgroundColor: typeFilter === typeVal ? "var(--gold)" : "#1E1D1B",
                  color: typeFilter === typeVal ? "#0D0D0C" : "#C8C2B9",
                  border: typeFilter === typeVal ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.1)",
                  fontWeight: typeFilter === typeVal ? "700" : "500",
                  padding: "4px 10px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Chips */}
        <div>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#8A8480", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "10px" }}>
            Status:
          </span>
          <div className="filter-chips-row" style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px" }}>
            {[
              ["all", "All Statuses"],
              ["pending_review", "Pending AI Review"],
              ["review_draft", "Review Drafts"],
              ["approved", "Approved Plans"],
              ["rejected", "Rejected Cases"],
              ["processing", "Processing"],
              ["failed", "Failed Ingestions"]
            ].map(([statusVal, label]) => (
              <button
                key={statusVal}
                className={`suggestion-chip ${statusFilter === statusVal ? "active-filter" : ""}`}
                onClick={() => setStatusFilter(statusVal)}
                style={{
                  backgroundColor: statusFilter === statusVal ? "var(--ink)" : "white",
                  color: statusFilter === statusVal ? "var(--gold-light)" : "var(--ink)",
                  border: statusFilter === statusVal ? "1px solid var(--ink)" : "1px solid var(--paper-border)",
                  fontWeight: statusFilter === statusVal ? "600" : "400",
                  padding: "4px 10px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Case table view */}
      <section className="registry-table-box">
        {filteredCases.length === 0 ? (
          <div className="empty-notice" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <h3>No judgments found</h3>
            <p className="analysis-file">
              {isJudge
                ? "Your docket currently has no cases matching this filter. Upload a judgment PDF to begin."
                : "No judgments match your search or filter. Try adjusting your filters."}
            </p>
            <button className="sample-case-btn" onClick={() => onNavigate("upload")} style={{ margin: "1rem auto 0" }}>
              Ingest Court Judgment
            </button>
          </div>
        ) : (
          <div className="registry-table-scroll">
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Case Title / Source Filename</th>
                  <th>Reference Number</th>
                  <th>Case Type (Allocated)</th>
                  <th>Court / Jurisdiction</th>
                  <th>Status</th>
                  <th>Date Ingested</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.case_id} className="registry-row">
                    <td className="row-title-block">
                      <strong>{c.case_title || c.filename}</strong>
                      <span className="file-subname">{c.filename}</span>
                    </td>
                    <td>
                      <code className="mono-code">{c.case_number || "Pending"}</code>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: (c.case_type || "").includes("Asset") ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.06)",
                        border: (c.case_type || "").includes("Asset") ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(255,255,255,0.1)",
                        color: (c.case_type || "").includes("Asset") ? "var(--gold)" : "#C8C2B9",
                        whiteSpace: "nowrap"
                      }}>
                        {c.case_type || "General / Civil"}
                      </span>
                    </td>
                    <td>
                      <span className="court-label">{c.court || "Not extracted"}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(c.status)}`}>
                        {getStatusLabel(c.status)}
                      </span>
                    </td>
                    <td>
                      <span className="date-label">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Just now"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="ghost-action" style={{ fontSize: "12px", padding: "4px 12px" }} onClick={() => onSelectCase(c.case_id, c.filename)}>
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
