import hashlib
import hmac
import os
import secrets
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.db_models import User, Case

logger = logging.getLogger(__name__)

# Secret key for HMAC token signing
AUTH_SECRET = os.getenv("AUTH_SECRET", "coats-judicial-portal-secret-key-2026")


def hash_password(password: str, salt: str | None = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 (standard library)."""
    if salt is None:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, stored_hash: str | None) -> bool:
    """Verify password against stored salt$hash."""
    if not stored_hash or "$" not in stored_hash:
        return False
    salt, expected_hex = stored_hash.split("$", 1)
    key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return hmac.compare_digest(key.hex(), expected_hex)


def generate_session_token(user_id: str, role: str) -> str:
    """Generate a tamper-evident session token."""
    random_part = secrets.token_hex(16)
    payload = f"{user_id}:{role}:{random_part}"
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"


def parse_session_token(token: str) -> tuple[str, str] | None:
    """Validate and extract (user_id, role) from a session token."""
    if not token or token.count(":") != 3:
        return None
    user_id, role, random_part, signature = token.split(":")
    payload = f"{user_id}:{role}:{random_part}"
    expected_sig = hmac.new(AUTH_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if hmac.compare_digest(signature, expected_sig):
        return user_id, role
    return None


def run_database_migrations(db: Session):
    """Safely add missing columns to SQLite database without touching existing data."""
    try:
        # Check users table columns
        cols = [r[1] for r in db.execute(text("PRAGMA table_info(users)")).fetchall()]
        if "username" not in cols:
            logger.info("Migrating DB: adding column username to users")
            db.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR"))
        if "password_hash" not in cols:
            logger.info("Migrating DB: adding column password_hash to users")
            db.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

        # Check cases table columns
        case_cols = [r[1] for r in db.execute(text("PRAGMA table_info(cases)")).fetchall()]
        if "case_type" not in case_cols:
            logger.info("Migrating DB: adding column case_type to cases")
            db.execute(text("ALTER TABLE cases ADD COLUMN case_type VARCHAR"))

        db.commit()
    except Exception as e:
        logger.warning(f"Database migration note: {e}")
        db.rollback()


def seed_default_users(db: Session):
    """Seed standard accounts for the 4 platform roles and assign legacy cases to Sharma."""
    default_users = [
        {
            "username": "judge.sharma",
            "email": "sharma.coats@gov.in",
            "name": "Hon'ble Justice A. K. Sharma",
            "role": "legal_reviewer",
            "password": "Judge@123",
            "department": "Judicial Branch",
        },
        {
            "username": "judge.verma",
            "email": "verma.coats@gov.in",
            "name": "Hon'ble Justice R. S. Verma",
            "role": "legal_reviewer",
            "password": "Judge@123",
            "department": "Judicial Branch",
        },
        {
            "username": "admin",
            "email": "admin.coats@gov.in",
            "name": "System Administrator",
            "role": "admin",
            "password": "Admin@123",
            "department": "Court Administration",
        },
        {
            "username": "officer.pwd",
            "email": "officer.coats@gov.in",
            "name": "Executive Officer (PWD)",
            "role": "department_officer",
            "password": "Officer@123",
            "department": "Public Works & Infrastructure",
        },
        {
            "username": "hod.finance",
            "email": "director.coats@gov.in",
            "name": "Principal Secretary (Finance)",
            "role": "decision_maker",
            "password": "Director@123",
            "department": "Department of Expenditure",
        },
    ]

    sharma_id = None
    for u in default_users:
        user = db.query(User).filter((User.username == u["username"]) | (User.email == u["email"])).first()
        if not user:
            user = User(
                username=u["username"],
                email=u["email"],
                name=u["name"],
                role=u["role"],
                department=u["department"],
                password_hash=hash_password(u["password"]),
            )
            db.add(user)
            db.flush()
        else:
            user.username = u["username"]
            user.name = u["name"]
            user.role = u["role"]
            user.department = u["department"]
            user.password_hash = hash_password(u["password"])
            db.flush()

        if u["username"] == "judge.sharma":
            sharma_id = user.id

    # Attribute any unassigned legacy cases to Justice Sharma so Sharma has baseline cases
    # and Justice Verma starts with a clean slate for testing isolation
    if sharma_id:
        db.query(Case).filter(Case.created_by.is_(None)).update({"created_by": sharma_id}, synchronize_session=False)

    db.commit()


def authenticate_user(db: Session, identifier: str, password: str) -> User | None:
    """Authenticate user by username or email and plain password."""
    clean_id = (identifier or "").strip().lower()
    user = (
        db.query(User)
        .filter((User.username == clean_id) | (User.email == clean_id))
        .first()
    )
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def register_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    name: str | None = None,
    role: str = "legal_reviewer",
    department: str | None = "Judicial Branch",
) -> tuple[User | None, str | None]:
    """Register a new user, returning (user, error_message)."""
    clean_username = (username or "").strip().lower()
    clean_email = (email or "").strip().lower()

    if not clean_username:
        return None, "Username is required"
    if not clean_email or "@" not in clean_email:
        return None, "Valid email is required"
    if not password or len(password) < 4:
        return None, "Password must be at least 4 characters"

    existing_user = db.query(User).filter(User.username == clean_username).first()
    if existing_user:
        return None, "Username is already taken"

    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        return None, "Email is already registered"

    user = User(
        username=clean_username,
        email=clean_email,
        name=name or clean_username,
        role=role or "legal_reviewer",
        department=department or "Judicial Branch",
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, None
