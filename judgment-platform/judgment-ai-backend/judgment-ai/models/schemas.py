from pydantic import BaseModel
from typing import Optional


# ── Upload response ─────────────────────────────────────────────────────────
class UploadResponse(BaseModel):
    case_id: str
    filename: str
    pages_indexed: int


# ── Processing status (SSE stream item) ─────────────────────────────────────
class ProcessingStep(BaseModel):
    step: str          # "reading" | "parties" | "directions" | "linking" | "brief"
    label: str         # human label shown in the UI progress screen
    done: bool


# ── Dashboard header ─────────────────────────────────────────────────────────
class CaseHeader(BaseModel):
    case_title: str            # "State of Telangana v. Union of India"
    case_number: str           # "WP No. 1234/2024"
    court: str                 # "High Court of Telangana"
    pages_indexed: int
    confidence: int            # 0-100  (shown as "94%")


# ── Top metric cards ─────────────────────────────────────────────────────────
class MetricCards(BaseModel):
    immediate_action: str      # "Mandamus Compliance"
    workflow_label: str        # "Priority workflow generated"
    nearest_deadline_days: Optional[int]
    nearest_deadline_label: str
    authorities_mapped: int
    authorities_label: str
    financial_exposure: Optional[str]   # "Rs. 847 Cr"
    financial_label: str


# ── Workflow step ─────────────────────────────────────────────────────────────
class WorkflowStep(BaseModel):
    step_number: int
    title: str                 # "Immediate Fund Release"
    description: str           # "Mandamus directed to Union of India"
    status: str                # "Required" | "Review" | "Tracked" | "Assigned"
    source_page: Optional[int]           # page number for the "Page 22" badge
    key_extract: Optional[str]           # the para quote shown under the step


# ── Left panel relief items ───────────────────────────────────────────────────
class ReliefItem(BaseModel):
    label: str        # "Release of central allocation"
    outcome: str      # "Granted" | "Not granted"


# ── Full case brief (everything needed to render the dashboard) ───────────────
class CaseBrief(BaseModel):
    header: CaseHeader
    metrics: MetricCards
    relief_items: list[ReliefItem]
    workflow_steps: list[WorkflowStep]
    # Tab data placeholders (Evidence / Timeline / Audit)
    evidence_summary: str
    timeline_summary: str
    audit_summary: str


# ── Q&A ───────────────────────────────────────────────────────────────────────
class AskRequest(BaseModel):
    case_id: str
    question: str


class Source(BaseModel):
    page: int
    excerpt: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
    confidence: int   # 0-100
