from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.roles import ADMIN
from core.security import require_roles
from database import get_db
from models.db_models import User
from services import dashboard_service

router = APIRouter(prefix="/dashboard")


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN)),
):
    return dashboard_service.system_overview(db)


@router.get("/approved-actions")
def approved_actions(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN)),
):
    return {"actions": dashboard_service.approved_actions(db)}


@router.get("/pending-reviews")
def pending_reviews(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN)),
):
    return {"cases": dashboard_service.pending_reviews(db)}


@router.get("/deadlines")
def deadlines(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN)),
):
    return {"deadlines": dashboard_service.deadline_summary(db)}


@router.get("/departments")
def departments(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ADMIN)),
):
    return {"departments": dashboard_service.department_summary(db)}
