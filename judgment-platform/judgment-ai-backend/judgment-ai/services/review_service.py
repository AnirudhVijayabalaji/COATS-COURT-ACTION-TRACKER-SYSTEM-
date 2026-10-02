from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.db_models import AIExtraction, Case, VerifiedActionPlan
from services.audit_service import log_action


def get_review_payload(db: Session, case_id: str) -> dict:
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    extraction = db.query(AIExtraction).filter(AIExtraction.case_id == case_id).one_or_none()
    if not extraction:
        raise HTTPException(404, "AI extraction not ready")

    verified = db.query(VerifiedActionPlan).filter(VerifiedActionPlan.case_id == case_id).one_or_none()

    return {
        "case_id": case.id,
        "status": case.status,
        "filename": case.filename,
        "ai_extraction": extraction.extracted_json,
        "confidence": extraction.confidence,
        "verified_action_plan": verified.final_json if verified else None,
        "review_notes": verified.review_notes if verified else None,
    }


def save_review_draft(db: Session, case_id: str, edited_json: dict, user_id: str, notes: str | None = None) -> dict:
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    # Set confidence to 100 inside the draft JSON header
    if "header" in edited_json:
        if isinstance(edited_json["header"], dict):
            edited_json["header"]["confidence"] = 100

    extraction = db.query(AIExtraction).filter(AIExtraction.case_id == case_id).one_or_none()
    if extraction:
        extraction.confidence = 100

    plan = db.query(VerifiedActionPlan).filter(VerifiedActionPlan.case_id == case_id).one_or_none()
    if not plan:
        plan = VerifiedActionPlan(
            case_id=case_id,
            final_json=edited_json,
            decision="draft",
            review_notes=notes,
            approved_by=user_id,
            approved_at=None,
        )
        db.add(plan)
    else:
        plan.final_json = edited_json
        plan.decision = "draft"
        plan.review_notes = notes
        plan.approved_by = user_id
        plan.approved_at = None

    case.status = "review_draft"
    log_action(db, "review_draft_saved", case_id=case_id, user_id=user_id, details={"notes": notes})
    db.flush()
    return {"case_id": case_id, "status": case.status}


def approve_case(db: Session, case_id: str, final_json: dict | None, user_id: str, notes: str | None = None) -> dict:
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    extraction = db.query(AIExtraction).filter(AIExtraction.case_id == case_id).one_or_none()
    if not extraction:
        raise HTTPException(404, "AI extraction not ready")

    approved_json = final_json or extraction.extracted_json
    
    # Set confidence to 100 inside the approved JSON header
    if "header" in approved_json:
        if isinstance(approved_json["header"], dict):
            approved_json["header"]["confidence"] = 100

    extraction.confidence = 100

    plan = db.query(VerifiedActionPlan).filter(VerifiedActionPlan.case_id == case_id).one_or_none()
    if not plan:
        plan = VerifiedActionPlan(case_id=case_id, final_json=approved_json)
        db.add(plan)

    plan.final_json = approved_json
    plan.decision = "approved"
    plan.review_notes = notes
    plan.approved_by = user_id
    plan.approved_at = datetime.utcnow()

    case.status = "approved"
    extraction.status = "approved"
    log_action(db, "case_approved", case_id=case_id, user_id=user_id, details={"notes": notes})
    db.flush()
    return {"case_id": case_id, "status": "approved"}


def reject_case(db: Session, case_id: str, user_id: str, reason: str) -> dict:
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    extraction = db.query(AIExtraction).filter(AIExtraction.case_id == case_id).one_or_none()
    if extraction:
        extraction.status = "rejected"

    case.status = "rejected"
    log_action(db, "case_rejected", case_id=case_id, user_id=user_id, details={"reason": reason})
    db.flush()
    return {"case_id": case_id, "status": "rejected", "reason": reason}
