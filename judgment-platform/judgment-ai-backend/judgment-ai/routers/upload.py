import logging
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from models.schemas import UploadResponse
from services import case_store, storage_service
from services.audit_service import log_action
from services.processing_service import process_case
from services.processing_state import initialize

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    case_id = str(uuid.uuid4())
    initialize(case_id)

    document_info = await storage_service.save_upload(case_id, file)
    if document_info["size_bytes"] > 50 * 1024 * 1024:
        storage_service.delete_case_files(case_id)
        raise HTTPException(413, "PDF too large (max 50 MB)")

    pdf_bytes = storage_service.read_bytes(document_info["path"])

    # NVIDIA NeMo Guardrail: ensure only authentic court judgment PDFs are accepted
    from services import nemo_guardrail_service, pdf_service
    pages = pdf_service.extract_pages(pdf_bytes)
    guardrail_result = nemo_guardrail_service.validate_document_with_guardrail(pages)

    if not guardrail_result.get("passed"):
        storage_service.delete_case_files(case_id)
        logger.warning(f"[NeMo Guardrail] Upload rejected: {guardrail_result.get('reason')}")
        raise HTTPException(
            status_code=422,
            detail="Not a valid court judgment PDF. Please upload an official court order or judgment."
        )

    case_store.create_case(db, case_id, file.filename, document_info)
    log_action(db, "pdf_uploaded", case_id=case_id, details={
        "filename": file.filename,
        "size_bytes": document_info["size_bytes"],
        "storage_backend": document_info["backend"],
        "guardrail": "NVIDIA NeMo Guardrails (Passed)",
    })
    db.commit()

    if settings.use_celery:
        from tasks import process_case_task

        process_case_task.delay(case_id)
    else:
        # Run processing synchronously so both local and Vercel serverless finish cleanly
        process_case(case_id, pdf_bytes=pdf_bytes, filename=file.filename, pages=pages)

    return UploadResponse(
        case_id=case_id,
        filename=file.filename,
        pages_indexed=0,
    )
