/**
 * judgmentAI.js
 * Drop this file into your Firebase project and import it wherever needed.
 *
 * Usage:
 *   import { uploadJudgment, streamProgress, getBrief, askQuestion } from './judgmentAI'
 *
 * Set BACKEND_URL to your ngrok URL (dev) or deployed backend URL (prod).
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Reads from .env (VITE_BACKEND_URL) — falls back to the Railway deployment.
// To override locally: add VITE_BACKEND_URL=http://localhost:8000 to your .env
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://adaptable-consideration-production-9688.up.railway.app";



// ─── 1. UPLOAD PDF ───────────────────────────────────────────────────────────
/**
 * Upload a PDF file. Returns case_id immediately — processing runs in background.
 *
 * @param {File} file - The PDF File object from the drag-drop / file input
 * @returns {Promise<{case_id: string, filename: string}>}
 *
 * Connect to: your upload drop zone's onDrop / onChange handler
 */
export async function uploadJudgment(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json(); // { case_id, filename, pages_indexed }
}


// ─── 2. STREAM PROGRESS (SSE) ────────────────────────────────────────────────
/**
 * Subscribe to the live processing progress stream.
 * Drives the "Preparing the case brief" screen with animated steps.
 *
 * @param {string} caseId
 * @param {function} onStep  - called with { step, label, done } for each step
 * @param {function} onDone  - called when processing is complete
 * @param {function} onError - called with an error message string
 * @returns {EventSource} - call .close() to stop listening
 *
 * Connect to: your processing/loading screen component
 *
 * Example onStep payload:
 *   { step: "reading",    label: "Reading the document structure...",   done: true  }
 *   { step: "parties",    label: "Locating parties, court...",          done: false }
 *   { step: "directions", label: "Finding directions, dates...",        done: false }
 *   { step: "linking",    label: "Linking each action to a source...", done: false }
 *   { step: "brief",      label: "Preparing the workflow brief...",    done: false }
 *   { step: "complete",   label: "Ready",                              done: true  }
 */
export function streamProgress(caseId, onStep, onDone, onError) {
  const es = new EventSource(`${BACKEND_URL}/stream/${caseId}`);

  es.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.error) {
      onError(data.error);
      es.close();
      return;
    }

    if (data.step === "complete") {
      onDone();
      es.close();
      return;
    }

    onStep(data); // { step, label, done }
  };

  es.onerror = () => {
    onError("Connection to server lost. Is the backend running?");
    es.close();
  };

  return es;
}


// ─── 3. GET CASE BRIEF (DASHBOARD DATA) ──────────────────────────────────────
/**
 * Fetch the full structured brief that populates the dashboard.
 *
 * @param {string} caseId
 * @returns {Promise<CaseBrief>}
 *
 * Connect to: your dashboard / workspace screen on load
 *
 * Returned shape (maps directly to your UI):
 * {
 *   header: {
 *     case_title,     // "State of Telangana v. Union of India"
 *     case_number,    // "WP No. 1234/2024"
 *     court,          // "High Court of Telangana"
 *     pages_indexed,  // 38
 *     confidence      // 94
 *   },
 *   metrics: {
 *     immediate_action,        // "Mandamus Compliance"
 *     workflow_label,          // "Priority workflow generated"
 *     nearest_deadline_days,   // 21
 *     nearest_deadline_label,  // "Fund release compliance"
 *     authorities_mapped,      // 3
 *     authorities_label,       // "Owner desk assignment ready"
 *     financial_exposure,      // "Rs. 847 Cr"
 *     financial_label          // "Central allocation at issue"
 *   },
 *   relief_items: [
 *     { label: "Release of central allocation", outcome: "Granted" }
 *   ],
 *   workflow_steps: [
 *     {
 *       step_number: 1,
 *       title: "Immediate Fund Release",
 *       description: "Mandamus directed to Union of India",
 *       status: "Required",      // badge color
 *       source_page: 22,         // "Page 22" badge
 *       key_extract: "Para 18: Respondents must release Rs. 847 crore within 21 days."
 *     }
 *   ],
 *   evidence_summary,
 *   timeline_summary,
 *   audit_summary
 * }
 */
export async function getBrief(caseId) {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/brief`);

  if (res.status === 202) {
    throw new Error("still_processing"); // handle in UI
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load brief");
  }

  return res.json();
}


// ─── 4. ASK A QUESTION (CHAT PANEL) ─────────────────────────────────────────
/**
 * Ask a source-bound question about a case.
 *
 * @param {string} caseId
 * @param {string} question
 * @returns {Promise<{answer: string, sources: [{page, excerpt}], confidence: number}>}
 *
 * Connect to: the "Ask a source-bound question..." input in the Legal Assistant panel
 *
 * The `sources` array powers the "Page 22" citation chips shown under answers.
 */
export async function askQuestion(caseId, question) {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId, question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Question failed");
  }

  return res.json();
  // { answer: "...", sources: [{page: 22, excerpt: "..."}], confidence: 91 }
}

// ─── 4.5. APPROVE / REJECT CASE (AUTHORIZATION TESTING) ──────────────────────
export async function approveCase(caseId, role) {
  const res = await fetch(`${BACKEND_URL}/review/${caseId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-email": "ui-tester@gov.in",
    },
    body: JSON.stringify({ notes: "Approved from Dashboard UI" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Approval failed. Check your role authorization.");
  }
  return res.json();
}

export async function rejectCase(caseId, role) {
  const res = await fetch(`${BACKEND_URL}/review/${caseId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-email": "ui-tester@gov.in",
    },
    body: JSON.stringify({ reason: "Rejected from Dashboard UI" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Rejection failed. Check your role authorization.");
  }
  return res.json();
}


// ─── 5. QUICK QUESTIONS (pre-filled chips) ───────────────────────────────────
/**
 * Fetch the quick-question chips for the chat panel.
 * Returns the 4 buttons: "What is this case about?", "Who won?", etc.
 *
 * @param {string} caseId
 * @returns {Promise<{questions: string[]}>}
 */
export async function getQuickQuestions(caseId) {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/quick-questions`);
  return res.json();
}


// ─── EXAMPLE USAGE (React) ───────────────────────────────────────────────────
/*
import { uploadJudgment, streamProgress, getBrief, askQuestion } from './judgmentAI'

// On PDF drop:
const { case_id } = await uploadJudgment(file)
navigate(`/processing/${case_id}`)

// On the processing screen:
const es = streamProgress(
  case_id,
  (step) => setSteps(prev => ({ ...prev, [step.step]: step.done })),
  ()     => navigate(`/case/${case_id}`),
  (err)  => setError(err)
)

// On the dashboard screen:
const brief = await getBrief(case_id)
// → brief.header, brief.metrics, brief.relief_items, brief.workflow_steps

// On chat submit:
const { answer, sources } = await askQuestion(case_id, question)
*/
