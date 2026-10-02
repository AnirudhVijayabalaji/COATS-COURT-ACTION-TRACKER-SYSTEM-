from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.roles import ADMIN, DECISION_MAKER, DEPARTMENT_OFFICER, LEGAL_REVIEWER
from core.security import require_roles
from database import get_db
from models.db_models import User
from services import dashboard_service

router = APIRouter(prefix="/dashboard")


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, DECISION_MAKER, DEPARTMENT_OFFICER, LEGAL_REVIEWER)),
):
    return dashboard_service.system_overview(db)


@router.get("/approved-actions")
def approved_actions(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, DECISION_MAKER, DEPARTMENT_OFFICER, LEGAL_REVIEWER)),
):
    return {"actions": dashboard_service.approved_actions(db)}


@router.get("/pending-reviews")
def pending_reviews(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, LEGAL_REVIEWER)),
):
    return {"cases": dashboard_service.pending_reviews(db)}


@router.get("/deadlines")
def deadlines(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, DECISION_MAKER, DEPARTMENT_OFFICER, LEGAL_REVIEWER)),
):
    return {"deadlines": dashboard_service.deadline_summary(db)}


@router.get("/departments")
def departments(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN, DECISION_MAKER, DEPARTMENT_OFFICER, LEGAL_REVIEWER)),
):
    return {"departments": dashboard_service.department_summary(db)}
