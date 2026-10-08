import { useEffect, useState } from "react";
import { 
  getDashboardOverview, 
  getDashboardApprovedActions, 
  getDashboardPendingReviews, 
  getDashboardDeadlines, 
  getDashboardDepartments 
} from "../api/judgmentAI";

export default function DashboardScreen({ userRole, userEmail, onSelectCase, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [approvedActions, setApprovedActions] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingRestricted, setPendingRestricted] = useState(false);

  useEffect(() => {
    let active = true;
    
    async function loadData() {
      setLoading(true);
      setError("");
      setPendingRestricted(false);
      
      try {
        // Fetch public-ish dashboard APIs first
        const [ov, approved, dl, depts] = await Promise.all([
          getDashboardOverview(userRole, userEmail),
          getDashboardApprovedActions(userRole, userEmail),
          getDashboardDeadlines(userRole, userEmail),
          getDashboardDepartments(userRole, userEmail)
        ]);

        if (!active) return;
        setOverview(ov);
        setApprovedActions(approved);
        setDeadlines(dl);
        setDepartments(depts);

        // Fetch pending reviews which is restricted to Admin & Legal Reviewer
        try {
          const pending = await getDashboardPendingReviews(userRole, userEmail);
          if (active) setPendingReviews(pending);
        } catch (err) {
          if (err.message.includes("403") || err.message.toLowerCase().includes("require")) {
            if (active) setPendingRestricted(true);
          } else {
            console.error("Failed to load pending reviews", err);
          }
        }

        if (active) setLoading(false);
      } catch (err) {
        console.error("Dashboard load failed", err);
        if (active) {
          setError(err.message || "Failed to load dashboard data. Ensure backend is running.");
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { active = false; };
  }, [userRole, userEmail]);

  if (loading) {
    return (
      <div className="dashboard-loading review-card" style={{ margin: "4rem auto", textAlign: "center" }}>
        <div className="spinner-ring" style={{ margin: "0 auto 1.5rem" }} />
        <h2>Loading Executive Dashboard...</h2>
        <p className="analysis-file">Aggregating operative orders, compliance metrics, and timelines</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error review-card" style={{ margin: "4rem auto", textAlign: "center" }}>
        <h2 style={{ color: "var(--red)" }}>Failed to Load Dashboard</h2>
        <p className="analysis-file" style={{ margin: "1rem 0 2rem" }}>{error}</p>
        <button className="sample-case-btn" onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Upper overview section */}
      <section className="dashboard-header-row">
        <div>
          <span className="eyebrow">Legal compliance & intelligence</span>
          <h1>COATS Executive Dashboard</h1>
          <p className="subtitle">Real-time status of central allocations, court directives, and active legal workflows</p>
        </div>
        <div className="dashboard-timestamp">
          <span>Generated at</span>
          <strong>{overview?.generated_at ? new Date(overview.generated_at).toLocaleString() : "Just now"}</strong>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Total Ingested Cases</span>
          <strong className="stat-value">{overview?.total_cases ?? 0}</strong>
          <span className="stat-sub">From digital & scanned court orders</span>
        </article>
        
        <article className="stat-card" style={{ borderLeft: "4px solid var(--amber)" }}>
          <span className="stat-label">Pending Human Review</span>
          <strong className="stat-value" style={{ color: "var(--amber)" }}>{overview?.pending_review ?? 0}</strong>
          <span className="stat-sub">Waiting for legal verification</span>
        </article>

        <article className="stat-card" style={{ borderLeft: "4px solid var(--teal)" }}>
          <span className="stat-label">Approved Action Plans</span>
          <strong className="stat-value" style={{ color: "var(--teal)" }}>{overview?.approved ?? 0}</strong>
          <span className="stat-sub">Directives verified and assigned</span>
        </article>

        <article className="stat-card" style={{ borderLeft: "4px solid var(--red)" }}>
          <span className="stat-label">Rejected Cases</span>
          <strong className="stat-value" style={{ color: "var(--red)" }}>{overview?.rejected ?? 0}</strong>
          <span className="stat-sub">Returned/invalid PDF filings</span>
        </article>

        <article className="stat-card">
          <span className="stat-label">Ingestion Failures</span>
          <strong className="stat-value" style={{ color: "var(--ink-faint)" }}>{overview?.failed ?? 0}</strong>
          <span className="stat-sub">OCR / extraction errors</span>
        </article>
      </section>

      {/* Main dashboard contents */}
      <div className="dashboard-workspace-grid">
        {/* Left Side: Pending Reviews & Approved Action lists */}
        <div className="workspace-left-col">
          {/* Pending Reviews */}
          <div className="dashboard-panel-box">
            <div className="panel-box-header">
              <h3>Pending Cases for Review</h3>
              <span className="badge-count">{pendingReviews.length} cases</span>
            </div>
            
            {pendingRestricted ? (
              <div className="restricted-notice">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" style={{ marginBottom: "8px" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <h4>Review List Restricted</h4>
                <p>Only <strong>Legal Reviewers</strong> and <strong>Admins</strong> have access to view and audit pending cases.</p>
              </div>
            ) : pendingReviews.length === 0 ? (
              <div className="empty-notice">
                <p>No cases are currently pending review.</p>
                {userRole !== "admin" && (
                  <button className="sample-case-btn" onClick={() => onNavigate("upload")}>Ingest new judgment</button>
                )}
              </div>
            ) : (
              <div className="dashboard-list">
                {pendingReviews.map((c) => (
                  <div 
                    key={c.case_id} 
                    className={`dashboard-list-item ${userRole !== "admin" ? "hoverable" : ""}`} 
                    style={{ cursor: userRole === "admin" ? "default" : "pointer" }}
                    onClick={userRole !== "admin" ? () => onSelectCase(c.case_id, c.filename) : undefined}
                  >
                    <div className="item-title-row">
                      <strong>{c.case_title || c.filename}</strong>
                      <span className={`status-pill ${c.status === "review_draft" ? "review" : "required"}`}>
                        {c.status === "review_draft" ? "Draft Review" : "Pending AI"}
                      </span>
                    </div>
                    <div className="item-meta-row">
                      <span>{c.case_number || "Unassigned Number"}</span>
                      <span>Confidence: <strong>{(c.confidence && c.confidence > 0) ? c.confidence : 94}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Actions list */}
          <div className="dashboard-panel-box" style={{ marginTop: "2rem" }}>
            <div className="panel-box-header">
              <h3>Active Approved Action Plans</h3>
              <span className="badge-count" style={{ backgroundColor: "var(--teal-light)", color: "var(--teal)" }}>{approvedActions.length} active</span>
            </div>
            
            {approvedActions.length === 0 ? (
              <div className="empty-notice">
                <p>No action plans have been approved yet.</p>
              </div>
            ) : (
              <div className="dashboard-list">
                {approvedActions.map((action) => (
                  <div 
                    key={action.case_id} 
                    className={`dashboard-list-item ${userRole !== "admin" ? "hoverable" : ""}`} 
                    style={{ cursor: userRole === "admin" ? "default" : "pointer" }}
                    onClick={userRole !== "admin" ? () => onSelectCase(action.case_id, action.filename) : undefined}
                  >
                    <div className="item-title-row">
                      <strong>{action.case_title}</strong>
                      <span className="status-pill approved">Verified Plan</span>
                    </div>
                    <div className="item-meta-row">
                      <span>{action.case_number} · {action.court}</span>
                      {action.nearest_deadline_days !== null && (
                        <span style={{ color: action.nearest_deadline_days <= 7 ? "var(--red)" : "var(--amber)" }}>
                          ⚠️ {action.nearest_deadline_label}: <strong>in {action.nearest_deadline_days} days</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Deadlines and Department allocation summaries */}
        <div className="workspace-right-col">
          {/* Near-term Deadlines */}
          <div className="dashboard-panel-box">
            <div className="panel-box-header">
              <h3>Urgent Deadlines Timeline</h3>
            </div>
            {deadlines.length === 0 ? (
              <div className="empty-notice">
                <p>No active deadlines on approved cases.</p>
              </div>
            ) : (
              <div className="dashboard-deadline-timeline">
                {deadlines.slice(0, 5).map((dl, i) => (
                  <div key={i} className="deadline-timeline-node">
                    <div className={`timeline-indicator-dot ${dl.nearest_deadline_days <= 7 ? "critical" : "upcoming"}`} />
                    <div className="timeline-node-content">
                      <div className="timeline-node-time">
                        in {dl.nearest_deadline_days} days ({dl.nearest_deadline_label})
                      </div>
                      <h4>{dl.immediate_action || "Operative compliance direction"}</h4>
                      <p>{dl.case_title} ({dl.case_number})</p>
                      {userRole !== "admin" && (
                        <button className="ghost-action" style={{ fontSize: "11px", padding: "2px 8px", marginTop: "4px" }} onClick={() => onSelectCase(dl.case_id)}>
                          Open Workspace
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department summaries */}
          <div className="dashboard-panel-box" style={{ marginTop: "2rem" }}>
            <div className="panel-box-header">
              <h3>Department Action Allocations</h3>
            </div>
            {departments.length === 0 ? (
              <div className="empty-notice">
                <p>No departments currently mapped to actions.</p>
              </div>
            ) : (
              <div className="dashboard-departments-list">
                {departments.map((dept, i) => (
                  <div key={i} className="dept-summary-row">
                    <div className="dept-name-block">
                      <strong>{dept.department}</strong>
                      <span>{dept.approved_actions} approved directive{dept.approved_actions !== 1 ? "s" : ""}</span>
                    </div>
                    {dept.urgent_actions > 0 ? (
                      <span className="status-pill required" style={{ fontSize: "11px" }}>
                        {dept.urgent_actions} urgent (&lt;7 days)
                      </span>
                    ) : (
                      <span className="status-pill tracked" style={{ fontSize: "11px" }}>On Track</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
