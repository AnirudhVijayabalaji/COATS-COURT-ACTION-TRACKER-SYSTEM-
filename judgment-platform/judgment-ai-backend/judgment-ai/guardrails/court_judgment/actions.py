import re
from typing import Dict, Any
from nemoguardrails.actions import action


@action(name="check_judgment_document")
def check_judgment_document(text: str = "") -> bool:
    """
    NeMo Guardrails Action: Validates that input text belongs to an authentic
    Indian court order or judgment and contains mandatory judicial hallmarks.
    """
    if not text or len(text.strip()) < 50:
        return False

    text_lower = text.lower()

    # Reject non-judicial documents
    negative_markers = [
        "curriculum vitae", "resume", "work experience", "skills:",
        "invoice no", "billing address", "tax invoice", "subtotal", "amount due"
    ]
    if any(m in text_lower for m in negative_markers):
        return False

    # Must contain judicial markers
    forum_patterns = [
        r"\bhigh court\b", r"\bsupreme court\b", r"\bdistrict court\b",
        r"\bsessions court\b", r"\btribunal\b", r"\bcoram\b", r"\bbench\b",
        r"\bhon'ble\b", r"\bjustice\b"
    ]
    has_forum = any(re.search(p, text_lower) for p in forum_patterns)

    case_patterns = [
        r"\bw\.?p\.?", r"\bwrit petition\b", r"\bcivil appeal\b",
        r"\bcriminal appeal\b", r"\bcase no\b", r"\bpetition\b", r"\bversus\b", r"\bvs\.?\b"
    ]
    has_case_marker = any(re.search(p, text_lower) for p in case_patterns)

    return bool(has_forum and has_case_marker)
