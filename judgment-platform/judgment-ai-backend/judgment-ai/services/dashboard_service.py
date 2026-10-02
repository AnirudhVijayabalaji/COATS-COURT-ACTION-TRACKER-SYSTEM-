from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import AIExtraction, Case, VerifiedActionPlan


def _deadline_days(plan_json: dict) -> int | None:
    return ((plan_json.get("metrics") or {}).get("nearest_deadline_days"))


def approved_actions(db: Session) -> list[dict]:
    rows = (
        db.query(VerifiedActionPlan, Case)
        .join(Case, Case.id == VerifiedActionPlan.case_id)
        .filter(Case.status == "approved", VerifiedActionPlan.decision == "approved")
        .order_by(VerifiedActionPlan.approved_at.desc())
        .all()
    )
    output = []
    for plan, case in rows:
        metrics = (plan.final_json or {}).get("metrics") or {}
        header = (plan.final_json or {}).get("header") or {}
        output.append({
            "case_id": case.id,
            "case_title": header.get("case_title") or case.case_title,
            "case_number": header.get("case_number") or case.case_number,
            "court": header.get("court") or case.court,
            "department": case.department,
            "immediate_action": metrics.get("immediate_action"),
            "nearest_deadline_days": metrics.get("nearest_deadline_days"),
            "nearest_deadline_label": metrics.get("nearest_deadline_label"),
            "approved_at": plan.approved_at.isoformat() if plan.approved_at else None,
        })
    return output


def pending_reviews(db: Session) -> list[dict]:
    rows = (
        db.query(Case, AIExtraction)
        .join(AIExtraction, AIExtraction.case_id == Case.id)
        .filter(Case.status.in_(["pending_review", "review_draft"]))
        .order_by(Case.updated_at.desc())
        .all()
    )
    return [
        {
            "case_id": case.id,
            "filename": case.filename,
            "case_title": case.case_title,
            "case_number": case.case_number,
            "confidence": extraction.confidence,
            "status": case.status,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        }
        for case, extraction in rows
    ]


def deadline_summary(db: Session) -> list[dict]:
    actions = approved_actions(db)
    return sorted(
        [item for item in actions if item.get("nearest_deadline_days") is not None],
        key=lambda item: item["nearest_deadline_days"],
    )


def department_summary(db: Session) -> list[dict]:
    actions = approved_actions(db)
    grouped: dict[str, dict] = {}
    for item in actions:
        department = item.get("department") or "Unassigned"
        grouped.setdefault(department, {"department": department, "approved_actions": 0, "urgent_actions": 0})
        grouped[department]["approved_actions"] += 1
        days = item.get("nearest_deadline_days")
        if days is not None and days <= 7:
            grouped[department]["urgent_actions"] += 1
    return list(grouped.values())


def system_overview(db: Session) -> dict:
    return {
        "total_cases": db.query(Case).count(),
        "pending_review": db.query(Case).filter(Case.status.in_(["pending_review", "review_draft"])).count(),
        "approved": db.query(Case).filter(Case.status == "approved").count(),
        "rejected": db.query(Case).filter(Case.status == "rejected").count(),
        "failed": db.query(Case).filter(Case.status == "failed").count(),
        "generated_at": datetime.utcnow().isoformat(),
    }
