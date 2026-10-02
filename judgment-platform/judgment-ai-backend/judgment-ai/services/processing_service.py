import logging
from database import session_scope
from services import ai_service, case_store, pdf_service, vector_service, guardrail_service
from services.audit_service import log_action
from services.processing_state import set_done, set_error, set_step
from services.storage_service import read_bytes

logger = logging.getLogger(__name__)


def process_case(case_id: str, pdf_bytes: bytes | None = None, filename: str | None = None, pages: list[dict] | None = None) -> None:
    """Run the full RAG preparation and AI action-plan extraction pipeline."""
    try:
        with session_scope() as db:
            case_store.update_status(db, case_id, "processing")
            log_action(db, "processing_started", case_id=case_id)
            payload = case_store.get_case_payload(db, case_id)

        if pdf_bytes is None and pages is None:
            document_path = payload.get("document_path") if payload else None
            if not document_path:
                raise ValueError("No stored PDF found for this case")
            pdf_bytes = read_bytes(document_path)

        filename = filename or (payload.get("filename") if payload else "uploaded.pdf")

        set_step(case_id, "reading", False)
        if not pages:
            pages = pdf_service.extract_pages(pdf_bytes)
        set_step(case_id, "reading", True)

        if not pages:
            raise ValueError("Could not extract text from PDF")

        set_step(case_id, "parties", False)
        chunks = pdf_service.chunk_pages(pages)
        set_step(case_id, "parties", True)

        set_step(case_id, "directions", False)
        vector_service.index_chunks(case_id, chunks)
        set_step(case_id, "directions", True)

        set_step(case_id, "linking", False)
        brief = ai_service.generate_case_brief(pages)
        brief = guardrail_service.apply_guardrail_to_brief(brief, pages)
        set_step(case_id, "linking", True)

        set_step(case_id, "brief", False)
        with session_scope() as db:
            case_store.save_processed_case(db, case_id, {
                "filename": filename,
                "pages": pages,
                "chunks": chunks,
                "brief": brief,
            })
            log_action(
                db,
                "ai_extraction_completed",
                case_id=case_id,
                details={"pages_indexed": len(pages), "confidence": brief.get("header", {}).get("confidence")},
            )
        set_step(case_id, "brief", True)
        set_done(case_id)

    except Exception as exc:
        logger.exception("Processing failed for %s", case_id)
        set_error(case_id, str(exc))
        with session_scope() as db:
            case_store.update_status(db, case_id, "failed", str(exc))
            log_action(db, "processing_failed", case_id=case_id, details={"error": str(exc)})


def reprocess_case(db, case_id: str) -> dict | None:
    """Re-runs AI action-plan extraction for an existing case."""
    try:
        payload = case_store.get_case_payload(db, case_id)
        if not payload:
            return None
        pages = payload.get("pages")
        if not pages:
            document_path = payload.get("document_path")
            if document_path:
                pdf_bytes = read_bytes(document_path)
                pages = pdf_service.extract_pages(pdf_bytes)
        if not pages:
            return None

        brief = ai_service.generate_case_brief(pages)
        if brief and brief.get("header", {}).get("case_title") != "AI Extraction Failed":
            case_store.save_processed_case(db, case_id, {
                "filename": payload.get("filename", "case.pdf"),
                "pages": pages,
                "chunks": payload.get("chunks", []),
                "brief": brief,
            })
            return brief
    except Exception as e:
        logger.error(f"Reprocessing failed for {case_id}: {e}")
    return None
