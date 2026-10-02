import React, { useState } from "react";

// --- NEW COMPONENT: Verdict Scorecard ---
function VerdictScorecard({ verdict }) {
  return (
    <div className="verdict-card">
      <div className="verdict-header">Verdict Summary</div>
      <div className="verdict-grid">
        {verdict.map((item, i) => (
          <div key={i} className={`verdict-item ${item.granted ? "granted" : "denied"}`}>
            <span className="verdict-icon">{item.granted ? "✓" : "✕"}</span>
            <div className="verdict-info">
              <div className="verdict-label">{item.label}</div>
              <div className="verdict-status">{item.granted ? "Granted" : "Denied"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- NEW COMPONENT: Interactive Timeline ---
function CaseTimeline({ deadlines }) {
  return (
    <div className="timeline-container">
      {deadlines.map((dl, i) => (
        <div key={i} className="timeline-item">
          <div className="timeline-date">
            <span className="day">{dl.date.split(' ')[0]}</span>
            <span className="month">{dl.date.split(' ')[1]}</span>
          </div>
          <div className={`timeline-dot ${dl.urgent ? 'urgent' : ''}`} />
          <div className="timeline-content">
            <h4>{dl.event}</h4>
            <p>{dl.desc}</p>
            <span className="timeline-tag">{dl.owner}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowStep({ step }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="wf-step">
      <div className="wf-step-header" onClick={() => setOpen(!open)}>
        <div className={`wf-step-num ${step.type}`}>
          {step.type === "compliance" && "C"}
          {step.type === "appeal" && "A"}
          {step.type === "deadline" && "D"}
          {step.type === "authority" && "R"}
        </div>
        <div className="wf-step-title">
          <strong>{step.title}</strong>
          <span>{step.subtitle}</span>
        </div>
        <span className={`status-pill ${step.status}`}>
          {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
        </span>
      </div>
      {open && (
        <div className="wf-step-body">
          <div style={{ whiteSpace: "pre-line", marginBottom: 10 }}>{step.body}</div>
          <button className="source-ref">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {step.source}
          </button>
        </div>
      )}
    </div>
  );
}

function ExtractedDataPanel({ data }) {
  return (
    <div className="extracted-grid">
      {data.map((block, i) => (
        <div key={i} className="extract-block">
          <div className="extract-block-title">{block.title}</div>
          <div className="extract-block-body">
            <div>{block.body}</div>
            {block.quote && <div className="quote">"{block.quote}"</div>}
            {block.tags && (
              <div style={{ marginTop: 8 }}>
                {block.tags.map((t) => (
                  <span key={t} className="extract-tag">{t}</span>
                ))}
              </div>
            )}
            {block.page && (
              <div style={{ marginTop: 8 }}>
                <button className="source-ref">Page {block.page}</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTrail({ trail }) {
  return (
    <div className="audit-list">
      {trail.map((e, i) => (
        <div key={i} className="audit-entry">
          <span className="audit-time">{e.time}</span>
          <span className="audit-actor">{e.actor}</span>
          <span className="audit-action">— {e.action}</span>
        </div>
      ))}
    </div>
  );
}

// --- MAIN SCREEN ---
export default function WorkflowScreen({ caseData = SAMPLE_CASE_DATA }) {
  const [leftTab, setLeftTab] = useState("workflow");
  const { meta, summary, workflowSteps, extractedData, auditTrail, chatSuggestions, verdict, timelineDeadlines } = caseData;

  return (
    <div className="workflow-screen">
      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-card money">
          <span className="sc-label">Disputed Amount</span>
          <span className="sc-value">₹847 Crore</span>
          <span className="sc-sub">Central Allocation</span>
        </div>
        <div className="summary-card urgent">
          <span className="sc-label">Action Required</span>
          <span className="sc-value">{summary.actionRequired}</span>
          <span className="sc-sub">High priority</span>
        </div>
        <div className="summary-card warning">
          <span className="sc-label">Nearest Deadline</span>
          <span className="sc-value">{summary.deadlineDays} days</span>
          <span className="sc-sub">Fund release due</span>
        </div>
        <div className="summary-card">
          <span className="sc-label">Case Reference</span>
          <span className="sc-value" style={{ fontSize: 15 }}>{meta.caseNumber}</span>
          <span className="sc-sub">{meta.court} · {meta.pages} pgs</span>
        </div>
      </div>

      {/* Left Column */}
      <div className="panel">
        <div className="panel-header">
          <div className="tab-bar">
            {[
              ["workflow", "Workflow"],
              ["extracted", "Evidence"],
              ["timeline", "Timeline"],
              ["audit", "History"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`tab-btn ${leftTab === key ? "active" : ""}`}
                onClick={() => setLeftTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          {leftTab === "workflow" && (
            <div className="workflow-steps">
              <VerdictScorecard verdict={verdict} />
              {workflowSteps.map((step) => (
                <WorkflowStep key={step.id} step={step} />
              ))}
            </div>
          )}
          {leftTab === "extracted" && <ExtractedDataPanel data={extractedData} />}
          {leftTab === "timeline" && <CaseTimeline deadlines={timelineDeadlines} />}
          {leftTab === "audit" && <AuditTrail trail={auditTrail} />}
        </div>
      </div>

      {/* Right Column — Assistant (Simplified for brevity) */}
      <div className="panel">
        <div className="panel-header">
          <h2>Agentic Assistant</h2>
          <span className="ai-badge">Source-verified</span>
        </div>
        <div className="chat-container">
          <div className="chat-welcome">
            <h3>How can I help with this case?</h3>
            <p>I have indexed 38 pages of the judgment and identified 3 critical deadlines.</p>
          </div>
          <div className="chat-suggestions">
            {chatSuggestions.map((s, i) => (
              <button key={i} className="suggestion-chip">{s}</button>
            ))}
          </div>
          <div className="chat-input-area">
            <input placeholder="Ask about fund release or SLP grounds..." className="chat-input" />
            <button className="chat-send-btn">↑</button>
          </div>
        </div>
      </div>

      <style>{`
        /* --- NEW STYLES --- */
        .verdict-card {
            background: var(--ink);
            color: white;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .verdict-header { font-family: 'Playfair Display'; font-size: 14px; color: var(--gold); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;}
        .verdict-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .verdict-item { background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px; border-left: 3px solid transparent;}
        .verdict-item.granted { border-left-color: var(--teal); }
        .verdict-item.denied { border-left-color: var(--red); opacity: 0.7; }
        .verdict-icon { font-size: 14px; font-weight: bold; }
        .verdict-label { font-size: 12px; font-weight: 500; }
        .verdict-status { font-size: 10px; text-transform: uppercase; opacity: 0.6; }

        .timeline-container { position: relative; padding-left: 20px; border-left: 2px solid var(--paper-border); margin-left: 10px; }
        .timeline-item { position: relative; margin-bottom: 30px; }
        .timeline-dot { position: absolute; left: -27px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: var(--gold); border: 3px solid white; box-shadow: 0 0 0 2px var(--gold-light); }
        .timeline-dot.urgent { background: var(--red); box-shadow: 0 0 0 2px var(--red-light); }
        .timeline-date { position: absolute; left: -80px; text-align: right; width: 45px; }
        .timeline-date .day { display: block; font-weight: 600; font-size: 16px; }
        .timeline-date .month { font-size: 10px; text-transform: uppercase; color: var(--ink-faint); }
        .timeline-content { background: white; padding: 14px; border-radius: 10px; border: 1px solid var(--paper-border); }
        .timeline-content h4 { margin: 0 0 4px; font-size: 14px; }
        .timeline-content p { margin: 0 0 8px; font-size: 12px; color: var(--ink-muted); }
        .timeline-tag { font-size: 10px; background: var(--paper-warm); padding: 2px 8px; border-radius: 4px; font-family: 'IBM Plex Mono'; }

        .summary-card.money { border-bottom: 3px solid var(--gold); }
        .ai-badge { font-size: 10px; background: var(--teal-light); color: var(--teal); padding: 4px 12px; border-radius: 20px; font-weight: 600; }
        
        .chat-container { display: flex; flex-direction: column; height: 100%; justify-content: flex-end; padding: 20px; }
        .chat-welcome { margin-bottom: auto; text-align: center; padding-top: 40px; }
        .chat-welcome h3 { font-family: 'Playfair Display'; }
        .chat-welcome p { color: var(--ink-muted); font-size: 13px; }
        .chat-input-area { display: flex; gap: 10px; margin-top: 20px; }
        .chat-input { flex: 1; padding: 12px 18px; border-radius: 25px; border: 1px solid var(--paper-border); background: var(--paper-warm); }

        /* Legacy styles compatibility */
        .workflow-screen { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; padding: 20px; background: #FAF8F4; min-height: 100vh; }
        .summary-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .summary-card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .sc-label { font-size: 10px; color: #888; text-transform: uppercase; display: block; }
        .sc-value { font-size: 20px; font-family: 'Playfair Display'; display: block; margin: 4px 0; }
        .sc-sub { font-size: 11px; color: #666; }
        .panel { background: white; border-radius: 16px; border: 1px solid #E8E0D0; display: flex; flex-direction: column; height: calc(100vh - 200px); }
        .panel-header { padding: 15px; border-bottom: 1px solid #EEE; display: flex; justify-content: space-between; align-items: center; }
        .panel-body { padding: 20px; overflow-y: auto; }
        .tab-bar { display: flex; gap: 10px; }
        .tab-btn { padding: 6px 15px; border-radius: 8px; border: none; background: transparent; cursor: pointer; color: #888; font-weight: 500; transition: 0.2s; }
        .tab-btn.active { background: #1A1814; color: #C8A96E; }
        .wf-step { border: 1px solid #EEE; border-radius: 10px; margin-bottom: 10px; }
        .wf-step-header { padding: 12px; display: flex; align-items: center; cursor: pointer; }
        .wf-step-num { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; }
        .wf-step-num.compliance { background: #E8F4F1; color: #2A7A6A; }
        .wf-step-title { flex: 1; }
        .wf-step-title strong { display: block; font-size: 13px; }
        .wf-step-title span { font-size: 11px; color: #777; }
        .status-pill { font-size: 10px; padding: 3px 8px; border-radius: 10px; }
        .status-pill.required { background: #FDECEA; color: #C0392B; }
        .suggestion-chip { background: white; border: 1px solid #DDD; padding: 6px 12px; border-radius: 15px; font-size: 11px; cursor: pointer; margin: 4px; }
      `}</style>
    </div>
  );
}

// --- UPDATED DATA WITH NEW FEATURES ---
export const SAMPLE_CASE_DATA = {
  meta: {
    caseNumber: "WP No. 1234/2024",
    court: "High Court of Telangana",
    pages: 38,
    docType: "Digital PDF",
  },
  summary: {
    actionRequired: "Mandamus Compliance",
    deadlineDays: 21,
    departmentsInvolved: 3,
  },
  // NEW: Breakdown of the judgment outcome
  verdict: [
    { label: "Release of ₹847Cr Funds", granted: true },
    { label: "Payment of ₹50k Costs", granted: true },
    { label: "Quashing of Audit Report", granted: false },
    { label: "Stay on Future Audits", granted: false },
  ],
  // NEW: Structured Timeline
  timelineDeadlines: [
    { date: "14 Mar", event: "Judgment Pronounced", desc: "Order issued by Justice Kiran Kumar", owner: "Court", urgent: false },
    { date: "04 Apr", event: "Fund Release Deadline", desc: "Union must transfer ₹847Cr to State", owner: "MoHUA", urgent: true },
    { date: "13 Apr", event: "SLP Filing Window", desc: "Last date to challenge in SC", owner: "Law Ministry", urgent: false },
    { date: "28 Apr", event: "Utilization Certificate", desc: "Submit via PMAY-U MIS Portal", owner: "State Housing", urgent: false },
  ],
  workflowSteps: [
    {
      id: "compliance",
      type: "compliance",
      title: "Immediate Fund Release",
      subtitle: "Mandamus directed to Union of India",
      status: "required",
      body: `Para 18: Respondents must release ₹847 crore within 21 days.`,
      source: "Page 22",
    },
  ],
  extractedData: [
    {
      title: "Key Holding",
      body: "Withholding funds based on administrative audit discrepancies is arbitrary.",
      quote: "The federal principles of the Constitution do not permit withholding of allocated funds as a punitive measure.",
      page: 14,
    }
  ],
  auditTrail: [
    { time: "09:41 AM", actor: "AI Engine", action: "Case ingested & Timeline extracted." },
    { time: "09:43 AM", actor: "You", action: "Workflow review initiated." },
  ],
  chatSuggestions: [
    "What are the grounds for SLP?",
    "Show fund release paragraph",
    "List all responsible officers",
  ],
};