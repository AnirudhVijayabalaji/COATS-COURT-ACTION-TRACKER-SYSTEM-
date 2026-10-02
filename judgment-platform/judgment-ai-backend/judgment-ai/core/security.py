from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from core.roles import ALL_ROLES
from models.db_models import User


def _get_or_create_dev_user(
    db: Session,
    email: str,
    role: str,
    name: str | None = None,
    department: str | None = None,
) -> User:
    if role not in ALL_ROLES:
        raise HTTPException(403, f"Invalid role '{role}'")

    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        user = User(email=email, name=name or email, role=role, department=department)
        db.add(user)
    else:
        user.role = role
        user.department = department or user.department
    db.flush()
    return user


def get_current_user(
    db: Session = Depends(get_db),
    x_user_email: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    x_user_name: str | None = Header(default=None),
    x_user_department: str | None = Header(default=None),
) -> User:
    """
    Development auth that works immediately.
    Production should replace this with Clerk/NextAuth JWT verification and map JWT claims to users.
    """
    if settings.dev_auth_enabled:
        return _get_or_create_dev_user(
            db,
            email=x_user_email or "demo.reviewer@gov.in",
            role=x_user_role or "legal_reviewer",
            name=x_user_name,
            department=x_user_department,
        )

    raise HTTPException(401, "Production JWT verification is not configured")


def require_roles(*roles: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, f"Requires one of: {', '.join(roles)}")
        return user

    return dependency
