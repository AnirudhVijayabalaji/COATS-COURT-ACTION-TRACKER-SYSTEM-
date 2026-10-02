from fastapi import APIRouter, Depends
from core.security import get_current_user
from models.db_models import User

router = APIRouter(prefix="/auth")


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "department": user.department,
    }
