from sqlalchemy.orm import Session
from models.db_models import AuditLog


def log_action(
    db: Session,
    action: str,
    case_id: str | None = None,
    user_id: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        case_id=case_id,
        user_id=user_id,
        action=action,
        details_json=details or {},
    )
    db.add(entry)
    db.flush()
    return entry
