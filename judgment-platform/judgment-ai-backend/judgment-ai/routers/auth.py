from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.security import get_current_user
from database import get_db
from models.db_models import User
from services.auth_service import authenticate_user, generate_session_token

router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    name: str | None = None
    role: str = "legal_reviewer"
    department: str | None = "Judicial Branch"


@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    from services.auth_service import register_user
    user, err = register_user(
        db,
        username=req.username,
        email=req.email,
        password=req.password,
        name=req.name,
        role=req.role,
        department=req.department,
    )
    if err:
        raise HTTPException(status_code=400, detail=err)

    token = generate_session_token(user.id, user.role)
    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "department": user.department,
        },
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    token = generate_session_token(user.id, user.role)
    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "department": user.department,
        },
    }


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "department": user.department,
    }


@router.post("/logout")
def logout():
    return {"status": "logged_out"}
