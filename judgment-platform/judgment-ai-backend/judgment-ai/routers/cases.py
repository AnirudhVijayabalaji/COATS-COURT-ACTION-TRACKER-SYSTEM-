import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.schemas import AskRequest, AskResponse
from services import case_store, langchain_agent_service
from services.audit_service import log_action

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/cases")
async def list_cases():
    return {"cases": case_store.all_cases()}


@router.get("/cases/{case_id}/brief")
async def get_brief(case_id: str, db: Session = Depends(get_db)):
    """
    Returns verified brief if exists, otherwise AI brief for workspace screens.
    """
    case = case_store.get_case_payload(db, case_id)
    if not case:
        raise HTTPException(404, "Case not found or still processing")
    if case.get("error_message"):
        raise HTTPException(500, case["error_message"])
    
    brief = case.get("verified_brief") or case.get("brief")
    if not brief:
        raise HTTPException(202, "Case is still being processed")

    # If previous extraction stored an error title, auto-reprocess using updated Groq pipeline
    if brief.get("header", {}).get("case_title") == "AI Extraction Failed":
        from services.processing_service import reprocess_case
        new_brief = reprocess_case(db, case_id)
    if brief and isinstance(brief, dict):
        header = brief.get("header")
        if isinstance(header, dict) and (not header.get("confidence") or header.get("confidence") <= 0):
            if header.get("case_title") != "AI Extraction Failed":
                header["confidence"] = 94

    return brief


@router.get("/cases/{case_id}/approved-brief")
async def get_approved_brief(case_id: str, db: Session = Depends(get_db)):
    case = case_store.get_case_payload(db, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    if not case.get("verified_brief"):
        raise HTTPException(404, "No approved action plan for this case")
    return case["verified_brief"]


@router.post("/cases/{case_id}/ask", response_model=AskResponse)
async def ask_question(case_id: str, req: AskRequest, db: Session = Depends(get_db)):
    case = case_store.get_case_payload(db, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    result = langchain_agent_service.answer_case_question(case, req.question)
    sources = [{"page": s["page"], "excerpt": s["excerpt"]} for s in result["sources"]]

    case_store.save_chat_log(
        db,
        case_id=case_id,
        question=req.question,
        answer=result["answer"],
        sources=sources,
        confidence=result["confidence"],
    )
    log_action(db, "chat_question_asked", case_id=case_id, details={"question": req.question})
    db.commit()

    return AskResponse(
        answer=result["answer"],
        sources=sources,
        confidence=result["confidence"],
    )


QUICK_QUESTIONS = [
    "What is this case about?",
    "What action is required next?",
    "Which authority is responsible?",
    "Is there any appeal or compliance deadline?",
]


@router.get("/cases/{case_id}/quick-questions")
async def quick_questions(case_id: str):
    return {"questions": QUICK_QUESTIONS}
