import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from database import Base


def new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    external_id = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="department_officer")
    department = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=new_id)
    filename = Column(String, nullable=False)
    case_title = Column(String, nullable=True)
    case_number = Column(String, nullable=True, index=True)
    court = Column(String, nullable=True)
    department = Column(String, nullable=True, index=True)
    status = Column(String, nullable=False, default="uploaded", index=True)
    error_message = Column(Text, nullable=True)
    pages_indexed = Column(Integer, default=0)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    extraction = relationship("AIExtraction", back_populates="case", uselist=False, cascade="all, delete-orphan")
    verified_plan = relationship("VerifiedActionPlan", back_populates="case", uselist=False, cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=new_id)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    storage_backend = Column(String, nullable=False, default="local")
    storage_path = Column(Text, nullable=False)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="documents")


class AIExtraction(Base):
    __tablename__ = "ai_extractions"

    id = Column(String, primary_key=True, default=new_id)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, unique=True, index=True)
    extracted_json = Column(JSON, nullable=False)
    pages_json = Column(JSON, nullable=False, default=list)
    chunks_json = Column(JSON, nullable=False, default=list)
    confidence = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="pending_review", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case = relationship("Case", back_populates="extraction")


class VerifiedActionPlan(Base):
    __tablename__ = "verified_action_plans"

    id = Column(String, primary_key=True, default=new_id)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, unique=True, index=True)
    final_json = Column(JSON, nullable=False)
    decision = Column(String, nullable=False, default="approved")
    review_notes = Column(Text, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="verified_plan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=new_id)
    case_id = Column(String, nullable=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    details_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(String, primary_key=True, default=new_id)
    case_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources_json = Column(JSON, nullable=False, default=list)
    confidence = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
