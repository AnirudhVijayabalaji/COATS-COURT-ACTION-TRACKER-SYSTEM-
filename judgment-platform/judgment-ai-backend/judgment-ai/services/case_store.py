from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from database import session_scope
from models.db_models import AIExtraction, Case, ChatLog, Document, VerifiedActionPlan


def create_case(
    db: Session,
    case_id: str,
    filename: str,
    document_info: dict | None = None,
    created_by: str | None = None,
) -> Case:
    case = Case(id=case_id, filename=filename, status="uploaded", created_by=created_by)
    db.add(case)
    db.flush()

    if document_info:
        db.add(Document(
            case_id=case_id,
            filename=document_info["filename"],
            storage_backend=document_info["backend"],
            storage_path=document_info["path"],
            content_type=document_info.get("content_type"),
            size_bytes=document_info.get("size_bytes", 0),
        ))

    db.flush()
    return case


def update_status(db: Session, case_id: str, status: str, error_message: str | None = None) -> None:
    case = db.get(Case, case_id)
    if case:
        case.status = status
        case.error_message = error_message
        case.updated_at = datetime.utcnow()
        db.flush()


def save(case_id: str, data: dict) -> None:
    """Compatibility function used by the original AI flow."""
    with session_scope() as db:
        save_processed_case(db, case_id, data)


def save_processed_case(db: Session, case_id: str, data: dict) -> None:
    brief = data.get("brief") or {}
    header = brief.get("header") or {}

    case = db.get(Case, case_id)
    if not case:
        case = Case(id=case_id, filename=data.get("filename", "uploaded.pdf"))
        db.add(case)

    case.case_title = header.get("case_title")
    case.case_number = header.get("case_number")
    case.court = header.get("court")
    case.pages_indexed = header.get("pages_indexed") or len(data.get("pages") or [])
    case.status = "pending_review"
    case.error_message = None
    case.updated_at = datetime.utcnow()

    extraction = db.query(AIExtraction).filter(AIExtraction.case_id == case_id).one_or_none()
    if extraction:
        extraction.extracted_json = brief
        extraction.pages_json = data.get("pages") or []
        extraction.chunks_json = data.get("chunks") or []
        extraction.confidence = (header.get("confidence") if header else None)
        extraction.status = "pending_review"
    else:
        db.add(AIExtraction(
            case_id=case_id,
            extracted_json=brief,
            pages_json=data.get("pages") or [],
            chunks_json=data.get("chunks") or [],
            confidence=(header.get("confidence") if header else None),
            status="pending_review",
        ))
    db.flush()


def get(case_id: str) -> Optional[dict]:
    with session_scope() as db:
        return get_case_payload(db, case_id)


def get_case_payload(db: Session, case_id: str) -> Optional[dict]:
    case = db.get(Case, case_id)
    if not case:
        return None

    extraction = db.query(AIExtraction).filter(AIExtraction.case_id == case_id).one_or_none()
    document = db.query(Document).filter(Document.case_id == case_id).first()
    verified = db.query(VerifiedActionPlan).filter(VerifiedActionPlan.case_id == case_id).one_or_none()

    return {
        "case_id": case.id,
        "filename": case.filename,
        "status": case.status,
        "error_message": case.error_message,
        "document_path": document.storage_path if document else None,
        "pages": extraction.pages_json if extraction else [],
        "chunks": extraction.chunks_json if extraction else [],
        "brief": extraction.extracted_json if extraction else None,
        "verified_brief": verified.final_json if verified else None,
        "case_title": case.case_title,
        "case_number": case.case_number,
        "court": case.court,
        "pages_indexed": case.pages_indexed,
    }


def exists(case_id: str) -> bool:
    with session_scope() as db:
        return db.get(Case, case_id) is not None


def all_cases() -> list[dict]:
    with session_scope() as db:
        return [
            {
                "case_id": c.id,
                "filename": c.filename,
                "case_title": c.case_title,
                "case_number": c.case_number,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in db.query(Case).order_by(Case.created_at.desc()).all()
        ]


def approved_cases(db: Session) -> list[VerifiedActionPlan]:
    return (
        db.query(VerifiedActionPlan)
        .join(Case, Case.id == VerifiedActionPlan.case_id)
        .filter(Case.status == "approved")
        .order_by(VerifiedActionPlan.approved_at.desc())
        .all()
    )


def save_chat_log(
    db: Session,
    case_id: str,
    question: str,
    answer: str,
    sources: list[dict],
    confidence: int,
    user_id: str | None = None,
) -> ChatLog:
    log = ChatLog(
        case_id=case_id,
        user_id=user_id,
        question=question,
        answer=answer,
        sources_json=sources,
        confidence=confidence,
    )
    db.add(log)
    db.flush()
    return log
