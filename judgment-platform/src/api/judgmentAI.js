/**
 * judgmentAI.js — Smart API client for the COATS backend
 * Auto-detects active backend domain (Vercel origin or local dev ports)
 */

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

let cachedBaseUrl = import.meta.env.VITE_BACKEND_URL || (isLocal ? "http://127.0.0.1:8001" : (typeof window !== "undefined" ? window.location.origin : ""));

const CANDIDATE_URLS = isLocal
  ? [
      import.meta.env.VITE_BACKEND_URL,
      "http://localhost:8001",
      "http://127.0.0.1:8001",
      "http://localhost:8000",
      "http://127.0.0.1:8000",
      typeof window !== "undefined" ? window.location.origin : "",
    ].filter(Boolean)
  : [
      typeof window !== "undefined" ? window.location.origin : "",
      import.meta.env.VITE_BACKEND_URL,
      "http://localhost:8001",
      "http://127.0.0.1:8001",
      "http://localhost:8000",
      "http://127.0.0.1:8000",
    ].filter(Boolean);

export function getStoredUser() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("coats_user") : null;
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getStoredToken() {
  return typeof window !== "undefined" ? (localStorage.getItem("coats_token") || "") : "";
}

export function setStoredSession(user, token) {
  if (typeof window !== "undefined") {
    if (user) localStorage.setItem("coats_user", JSON.stringify(user));
    if (token) localStorage.setItem("coats_token", token);
  }
}

export function clearStoredSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("coats_user");
    localStorage.removeItem("coats_token");
  }
}

async function smartFetch(path, options = {}) {
  const token = getStoredToken();
  const user = getStoredUser();

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (user?.id && !headers.has("x-user-id")) {
    headers.set("x-user-id", user.id);
  }
  if (user?.role && !headers.has("x-user-role")) {
    headers.set("x-user-role", user.role);
  }
  if (user?.email && !headers.has("x-user-email")) {
    headers.set("x-user-email", user.email);
  }

  const mergedOptions = { ...options, headers };

  // If path is relative and cachedBaseUrl is valid, construct URL
  if (cachedBaseUrl) {
    try {
      const res = await fetch(`${cachedBaseUrl}${path}`, mergedOptions);
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch (err) {
      // Fall through to candidates
    }
  }

  // Auto-detect candidate URL
  let lastError;
  for (const baseUrl of CANDIDATE_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, mergedOptions);
      if (res.ok || res.status < 500) {
        cachedBaseUrl = baseUrl;
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Fallback relative fetch
  return fetch(path, mergedOptions);
}

export const BACKEND_URL = cachedBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");


// ─── 1. UPLOAD PDF ───────────────────────────────────────────────────────────
export async function uploadJudgment(file) {
  const user = getStoredUser();
  if (user?.role === "admin") {
    const errorObj = new Error("System administrators cannot upload judgment PDFs. Case intake is reserved for Judges.");
    errorObj.status = 403;
    throw errorObj;
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await smartFetch("/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorObj = new Error(err.detail || "Upload failed");
    errorObj.status = res.status;
    throw errorObj;
  }

  return res.json();
}


// ─── 1B. ECOURTS & BHARAT-COURTS DISCOVERY ───────────────────────────────────
export async function getECourtsSamples() {
  const res = await smartFetch("/ecourts/samples");
  if (!res.ok) throw new Error("Failed to load eCourts sample cases");
  return res.json();
}

export async function searchECourts(query = "", court = "") {
  const res = await smartFetch("/ecourts/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, court }),
  });
  if (!res.ok) throw new Error("eCourts search request failed");
  return res.json();
}

export async function ingestECourtsCase(cnr) {
  const user = getStoredUser();
  if (user?.role === "admin") {
    const errorObj = new Error("System administrators cannot upload or ingest judgment PDFs. Case intake is reserved for Judges.");
    errorObj.status = 403;
    throw errorObj;
  }

  const res = await smartFetch("/ecourts/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cnr }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorObj = new Error(err.detail || "Failed to ingest case from eCourts");
    errorObj.status = res.status;
    throw errorObj;
  }

  return res.json();
}


// ─── 2. STREAM PROGRESS (SSE) ────────────────────────────────────────────────
export function streamProgress(caseId, onStep, onDone, onError) {
  const base = cachedBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const es = new EventSource(`${base}/stream/${caseId}`);

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

    onStep(data);
  };

  es.onerror = () => {
    onError("Connection to server lost. Is the backend running?");
    es.close();
  };

  return es;
}


// ─── 3. GET CASE BRIEF ───────────────────────────────────────────────────────
export async function getBrief(caseId) {
  const res = await smartFetch(`/cases/${caseId}/brief`);

  if (res.status === 202) {
    throw new Error("still_processing");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load brief");
  }

  return res.json();
}


// ─── 4. ASK A QUESTION (CHAT PANEL) ─────────────────────────────────────────
export async function askQuestion(caseId, question) {
  const res = await smartFetch(`/cases/${caseId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId, question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Question failed");
  }

  return res.json();
}


// ─── 5. APPROVE CASE ─────────────────────────────────────────────────────────
export async function approveCase(caseId, role, finalJson = null, notes = "Approved from Dashboard UI", email = "ui-tester@gov.in") {
  const res = await smartFetch(`/review/${caseId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-email": email,
    },
    body: JSON.stringify({ final_json: finalJson, notes }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Approval failed. Check your role authorization.");
  }
  return res.json();
}


// ─── 6. REJECT CASE ──────────────────────────────────────────────────────────
export async function rejectCase(caseId, role, reason = "Rejected from Dashboard UI", email = "ui-tester@gov.in") {
  const res = await smartFetch(`/review/${caseId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-email": email,
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Rejection failed. Check your role authorization.");
  }
  return res.json();
}


// ─── 7. QUICK QUESTIONS ──────────────────────────────────────────────────────
export async function getQuickQuestions(caseId) {
  const res = await smartFetch(`/cases/${caseId}/quick-questions`);
  return res.json();
}


// ─── 8. LIST ALL CASES ───────────────────────────────────────────────────────
export async function listCases() {
  const res = await smartFetch("/cases");
  if (!res.ok) {
    throw new Error("Failed to fetch cases list");
  }
  const data = await res.json();
  return data.cases || [];
}


// ─── 9. DASHBOARD APIS ───────────────────────────────────────────────────────
export async function getDashboardOverview(role, email = "ui-tester@gov.in") {
  const res = await smartFetch("/dashboard/overview", {
    headers: {
      "x-user-role": role,
      "x-user-email": email,
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch dashboard overview");
  }
  return res.json();
}

export async function getDashboardApprovedActions(role, email = "ui-tester@gov.in") {
  const res = await smartFetch("/dashboard/approved-actions", {
    headers: {
      "x-user-role": role,
      "x-user-email": email,
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch approved actions");
  }
  const data = await res.json();
  return data.actions || [];
}

export async function getDashboardPendingReviews(role, email = "ui-tester@gov.in") {
  const res = await smartFetch("/dashboard/pending-reviews", {
    headers: {
      "x-user-role": role,
      "x-user-email": email,
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch pending reviews");
  }
  const data = await res.json();
  return data.cases || [];
}

export async function getDashboardDeadlines(role, email = "ui-tester@gov.in") {
  const res = await smartFetch("/dashboard/deadlines", {
    headers: {
      "x-user-role": role,
      "x-user-email": email,
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch deadlines");
  }
  const data = await res.json();
  return data.deadlines || [];
}

export async function getDashboardDepartments(role, email = "ui-tester@gov.in") {
  const res = await smartFetch("/dashboard/departments", {
    headers: {
      "x-user-role": role,
      "x-user-email": email,
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch department summaries");
  }
  const data = await res.json();
  return data.departments || [];
}


// ─── 10. REVIEW APIS ──────────────────────────────────────────────────────────
export async function getReviewPayload(caseId, role, email = "ui-tester@gov.in") {
  const res = await smartFetch(`/review/${caseId}`, {
    headers: {
      "x-user-role": role,
      "x-user-email": email,
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch review payload");
  }
  return res.json();
}

export async function saveReviewDraft(caseId, role, editedJson, notes = "Saved draft review", email = "ui-tester@gov.in") {
  const res = await smartFetch(`/review/${caseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-email": email,
    },
    body: JSON.stringify({ edited_json: editedJson, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save draft review");
  }
  return res.json();
}


// ─── 11. AUTH APIS ────────────────────────────────────────────────────────────
export async function signupUser({ username, email, password, name, role = "legal_reviewer", department = "Judicial Branch" }) {
  const res = await smartFetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, name, role, department }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed. Please check your information.");
  }
  const data = await res.json();
  setStoredSession(data.user, data.token);
  return data;
}

export async function loginUser(username, password) {
  const res = await smartFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid username/email or password");
  }
  const data = await res.json();
  setStoredSession(data.user, data.token);
  return data;
}

export async function logoutUser() {
  try {
    await smartFetch("/auth/logout", { method: "POST" });
  } catch (e) {
    // Ignore network error on logout
  }
  clearStoredSession();
}

export async function getAuthProfile() {
  const res = await smartFetch("/auth/me");
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}
