from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.roles import ADMIN, LEGAL_REVIEWER
from core.security import require_roles
from database import get_db
from models.db_models import User
from services import review_service

router = APIRouter(prefix="/review")


class ReviewUpdate(BaseModel):
    edited_json: dict
    notes: str | None = None


class ApproveRequest(BaseModel):
    final_json: dict | None = None
    notes: str | None = None


class RejectRequest(BaseModel):
    reason: str


@router.get("/{case_id}")
def get_review_case(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, LEGAL_REVIEWER)),
):
    return review_service.get_review_payload(db, case_id)


@router.put("/{case_id}")
def save_review_draft(
    case_id: str,
    req: ReviewUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, LEGAL_REVIEWER)),
):
    result = review_service.save_review_draft(db, case_id, req.edited_json, user.id, req.notes)
    db.commit()
    return result


@router.post("/{case_id}/approve")
def approve_case(
    case_id: str,
    req: ApproveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, LEGAL_REVIEWER)),
):
    result = review_service.approve_case(db, case_id, req.final_json, user.id, req.notes)
    db.commit()
    return result


@router.post("/{case_id}/reject")
def reject_case(
    case_id: str,
    req: RejectRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, LEGAL_REVIEWER)),
):
    result = review_service.reject_case(db, case_id, user.id, req.reason)
    db.commit()
    return result
