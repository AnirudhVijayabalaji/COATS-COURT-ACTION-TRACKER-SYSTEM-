import logging
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.roles import ADMIN
from core.security import get_current_user
from database import get_db
from models.db_models import User
from services import case_store, storage_service
from services.audit_service import log_action
from services.ecourts_service import fetch_case_by_cnr, get_sample_cases, search_ecourts_cases
from services.nemo_guardrail_service import validate_document_with_guardrail
from services.pdf_service import extract_pages
from services.processing_service import process_case
from services.processing_state import initialize

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ecourts", tags=["eCourts"])


class IngestCNRRequest(BaseModel):
    cnr: str


class SearchECourtsRequest(BaseModel):
    query: Optional[str] = ""
    court: Optional[str] = ""


@router.get("/samples")
def list_sample_cases():
    """Returns curated landmark and high-frequency Indian court cases."""
    return get_sample_cases()


@router.post("/search")
def search_cases(req: SearchECourtsRequest):
    """Search cases by party name, court hall, or keyword."""
    return search_ecourts_cases(query=req.query or "", court=req.court or "")


@router.post("/ingest")
def ingest_by_cnr(
    req: IngestCNRRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingests a court judgment by its 16-character CNR number or sample ID.
    Fetches official case record & PDF, validates with NVIDIA NeMo Guardrails,
    and initiates the full legal brief & RAG indexing pipeline.
    """
    if user.role == ADMIN:
        raise HTTPException(
            status_code=403,
            detail="System administrators cannot upload or ingest judgment PDFs. Case intake is reserved for Judges.",
        )
    cnr = req.cnr.strip().upper()
    if not cnr or len(cnr) < 6:
        raise HTTPException(400, "Please provide a valid Indian Court CNR number or case reference.")

    try:
        case_bundle = fetch_case_by_cnr(cnr)
    except Exception as err:
        logger.error(f"Error resolving CNR {cnr}: {err}")
        raise HTTPException(502, f"Failed to retrieve case records for CNR {cnr} from eCourts gateway.")

    metadata = case_bundle["metadata"]
    pdf_bytes = case_bundle["pdf_bytes"]
    filename = case_bundle["filename"]

    case_id = str(uuid.uuid4())
    initialize(case_id)

    # 1. Save PDF bytes to storage
    document_info = storage_service.save_bytes(case_id, filename, pdf_bytes, "application/pdf")

    # 2. Extract pages & Run NVIDIA NeMo Guardrails
    pages = extract_pages(pdf_bytes)
    guardrail_result = validate_document_with_guardrail(pages)

    if not guardrail_result.get("passed"):
        storage_service.delete_case_files(case_id)
        logger.warning(f"[NeMo Guardrail] CNR {cnr} rejected: {guardrail_result.get('reason')}")
        raise HTTPException(
            status_code=422,
            detail="Not a valid court judgment PDF. Automated intake halted by NeMo Guardrails."
        )

    # 3. Create Case record in Database
    case_store.create_case(db, case_id, filename, document_info, created_by=user.id)
    log_action(db, "ecourts_ingested", case_id=case_id, user_id=user.id, details={
        "cnr": cnr,
        "court": metadata.get("court"),
        "case_title": metadata.get("title"),
        "filename": filename,
        "size_bytes": len(pdf_bytes),
        "source": case_bundle.get("source"),
        "guardrail": "NVIDIA NeMo Guardrails (Passed)",
        "uploaded_by": user.username or user.email,
    })
    db.commit()

    # 4. Trigger synchronous case processing (OCR, ChromaDB Vectorizing, Brief Generation)
    process_case(case_id, pdf_bytes=pdf_bytes, filename=filename, pages=pages)

    return {
        "case_id": case_id,
        "filename": filename,
        "cnr": cnr,
        "title": metadata.get("title"),
        "court": metadata.get("court"),
        "pages_indexed": len(pages),
        "status": "ready"
    }
