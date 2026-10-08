import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# On Vercel serverless functions, root filesystem is read-only; use /tmp for SQLite
db_url = settings.database_url
if ("VERCEL" in os.environ or os.environ.get("VERCEL_ENV")) and db_url.startswith("sqlite"):
    db_url = "sqlite:////tmp/judgment_platform.db"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    from models import db_models  # noqa: F401

    Base.metadata.create_all(bind=engine)
