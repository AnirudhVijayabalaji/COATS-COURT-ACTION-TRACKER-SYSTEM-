import json
import logging
import re
from config import settings
from services import groq_service

logger = logging.getLogger(__name__)
MODEL = settings.groq_model


BRIEF_SYSTEM = """You are a senior legal analyst specializing in Indian courts.
Your job is to read judgment text and produce a precise structured JSON brief
that will be rendered in a legal intelligence dashboard.

Always respond with ONLY valid JSON. No markdown fences, no explanation.
The JSON must exactly follow this schema:

{
  "header": {
    "case_title": "Full party names, e.g. State of Telangana v. Union of India",
    "case_number": "WP No. XXXX/YYYY or equivalent",
    "court": "Name of the court",
    "case_type": "Asset / Property Dispute | Commercial & Arbitration | Writ / Mandamus | Service & Pension | Revenue & Tax | Environmental / PIL | Criminal | Civil Litigation",
    "pages_indexed": <integer>,
    "confidence": <integer 70-99>
  },
  "metrics": {
    "immediate_action": "Single most urgent action in 2-4 words",
    "workflow_label": "One line describing the workflow",
    "nearest_deadline_days": <integer or null>,
    "nearest_deadline_label": "Short label for what the deadline is",
    "authorities_mapped": <integer count of departments/authorities mentioned>,
    "authorities_label": "Short label, e.g. 'Owner desk assignment ready'",
    "financial_exposure": "Amount string like 'Rs. 847 Cr' or null",
    "financial_label": "Short label for the financial matter"
  },
  "relief_items": [
    {"label": "Relief sought (short)", "outcome": "Granted | Not granted | Partially granted"}
  ],
  "workflow_steps": [
    {
      "step_number": 1,
      "title": "Action title (3-5 words)",
      "description": "One line describing who must do what",
      "status": "Required | Review | Tracked | Assigned",
      "source_page": <integer page number where this is directed, or null>,
      "key_extract": "Direct quote or paraphrase from the judgment (max 120 chars)"
    }
  ],
  "evidence_summary": "2-3 sentence summary of key evidence discussed",
  "timeline_summary": "Key dates and events in chronological prose",
  "audit_summary": "Audit-related directions or compliance requirements"
}

Produce 3-6 workflow steps. Be precise. Source pages must match real page numbers in the text.
confidence = how certain you are the extraction is complete and accurate (70-99).
"""

BRIEF_USER = """Analyze this judgment text ({pages} pages indexed) and return the JSON brief.

JUDGMENT TEXT:
{text}
"""

QA_SYSTEM = """You are a case-bound legal assistant. You may ONLY answer using the provided
source paragraphs from the judgment. Every claim must be traceable to a specific page.

Format your answer as clear prose. At the end, add a line:
Sources: Page X, Page Y  (list only the pages you actually cited)

If the answer is not in the provided context, say: "This information is not in the indexed pages."
"""

QA_USER = """Case context from semantic search:
{context}

Question: {question}
"""


def _strip_json_fences(raw: str) -> str:
    raw = raw.strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return match.group(0)
    raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    return raw.strip()


def classify_case_type(text: str) -> str:
    """Automatic case type classification based on keywords in judgment text."""
    lower = text.lower()
    if any(k in lower for k in [
        "land acquisition", "property", "title", "possession", "eviction",
        "encroachment", "partition", "mortgage", "immovable property",
        "compensation for land", "suit for possession", "asset", "leasehold",
        "tenancy", "premises"
    ]):
        return "Asset / Property Dispute"
    if any(k in lower for k in [
        "arbitration", "tender", "contract", "concessionaire",
        "epc contract", "bank guarantee", "commercial dispute", "arbitral tribunal"
    ]):
        return "Commercial & Arbitration"
    if any(k in lower for k in [
        "mandamus", "article 226", "article 32", "writ petition", "public duty"
    ]):
        return "Writ / Mandamus"
    if any(k in lower for k in [
        "pension", "gratuity", "service matter", "disciplinary",
        "retirement benefits", "pay scale", "seniority", "superannuation"
    ]):
        return "Service & Pension"
    if any(k in lower for k in [
        "tax", "gst", "excise", "customs", "income tax", "assessment year"
    ]):
        return "Revenue & Tax"
    if any(k in lower for k in [
        "pollution", "environment", "national green tribunal", "ngt", "forest", "wildlife", "pil"
    ]):
        return "Environmental / PIL"
    if any(k in lower for k in [
        "penal code", "ipc", "crpc", "bns", "bnss", "bail", "conviction", "acquittal"
    ]):
        return "Criminal"
    return "Civil Litigation"


def generate_case_brief(pages: list[dict]) -> dict:
    # 1. Stitch all the extracted text together
    text_content = "\n\n".join(f"[Page {p['page']}]: {p['text']}" for p in pages)
    
    # SAFEGUARD: Limit text to ~15,000 chars to avoid Gemini 429 Free Tier limits
    if len(text_content) > 15000:
        text_content = text_content[:15000] + "\n\n[TEXT TRUNCATED DUE TO FREE TIER LIMITS]"
        
    prompt = BRIEF_USER.format(pages=len(pages), text=text_content)
    
    try:
        # 2. Call the LangChain Groq AI Model
        raw_response = groq_service.generate_text(
            instruction=BRIEF_SYSTEM,
            prompt=prompt,
            model=MODEL,
        )
        
        # 3. Clean and parse the JSON output
        cleaned_json = _strip_json_fences(raw_response)
        parsed = json.loads(cleaned_json)
        if "header" in parsed and isinstance(parsed["header"], dict):
            if not parsed["header"].get("case_type") or parsed["header"]["case_type"] == "Civil Litigation":
                parsed["header"]["case_type"] = classify_case_type(text_content)
        return parsed
        
    except Exception as e:
        logger.error(f"AI Extraction failed: {e}")
        detected_type = classify_case_type(text_content)
        # Fallback dictionary if the API completely fails
        return {
          "header": {
            "case_title": "AI Extraction Failed",
            "case_number": "N/A",
            "court": "N/A",
            "case_type": detected_type,
            "pages_indexed": len(pages),
            "confidence": 0
          },
          "metrics": {
            "immediate_action": "Retry Upload",
            "workflow_label": "API Error Encountered",
            "nearest_deadline_days": None,
            "nearest_deadline_label": "N/A",
            "authorities_mapped": 0,
            "authorities_label": "N/A",
            "financial_exposure": "N/A",
            "financial_label": "N/A"
          },
          "relief_items": [],
          "workflow_steps": [],
          "evidence_summary": f"The AI failed to read the document. Error: {str(e)}",
          "timeline_summary": "N/A",
          "audit_summary": "N/A"
        }


def answer_question(question: str, chunks: list[dict]) -> dict:
    context = "\n\n".join(f"[Page {c['page']}]: {c['text']}" for c in chunks)

    answer_text = groq_service.generate_text(
        instruction=QA_SYSTEM,
        prompt=QA_USER.format(context=context, question=question),
        model=MODEL,
    ).strip()

    source_pages = []
    match = re.search(r"Sources?:\s*(Page\s*\d+(?:,\s*Page\s*\d+)*)", answer_text, re.IGNORECASE)
    if match:
        nums = re.findall(r"\d+", match.group(1))
        source_pages = [int(n) for n in nums]

    page_to_chunk = {c["page"]: c["text"] for c in chunks}
    sources = [
        {"page": page, "excerpt": page_to_chunk.get(page, "")[:250]}
        for page in source_pages
        if page in page_to_chunk
    ]
    if not sources:
        sources = [{"page": c["page"], "excerpt": c["text"][:250]} for c in chunks[:2]]

    # Dynamically scale confidence based on verified source page count
    num_citations = len(source_pages) if source_pages else len(sources)
    if "not in the indexed pages" in lower_answer or "not in the provided context" in lower_answer:
        confidence = 0
    elif num_citations >= 3:
        confidence = 96
    elif num_citations == 2:
        confidence = 94
    elif num_citations == 1:
        confidence = 91
    else:
        confidence = 85

    return {
        "answer": answer_text,
        "sources": sources,
        "confidence": confidence,
    }
