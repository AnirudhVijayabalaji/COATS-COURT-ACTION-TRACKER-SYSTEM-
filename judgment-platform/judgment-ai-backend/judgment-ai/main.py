import logging
import os
import sys

# Ensure backend directory is in Python sys.path for Vercel serverless execution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from routers import auth, cases, dashboard, ecourts, review, stream, upload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Judgment Platform Backend",
    description="PDF ingestion, OCR, RAG, action-plan extraction, verification, dashboard, and audit APIs",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = [o.strip() for o in settings.allowed_origins.split(",")]
_is_wildcard = _raw_origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_raw_origins,
    allow_credentials=not _is_wildcard,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, tags=["Auth"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(stream.router, tags=["Stream"])
app.include_router(cases.router, tags=["Cases"])
app.include_router(ecourts.router, tags=["eCourts"])
app.include_router(review.router, tags=["Review"])
app.include_router(dashboard.router, tags=["Dashboard"])


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "database": "configured",
        "guardrail": "NVIDIA NeMo Guardrails (Active)",
        "api_key_set": bool(settings.groq_api_key),
        "groq_model": settings.groq_model,
        "ocr_enabled": settings.ocr_enabled,
        "storage_backend": settings.storage_backend,
        "use_celery": settings.use_celery,
        "dev_auth_enabled": settings.dev_auth_enabled,
    }


@app.on_event("startup")
async def startup_log():
    init_db()
    log = logging.getLogger("startup")
    log.info("=" * 70)
    log.info("Judgment Platform Backend is running")
    log.info("  POST /upload                        upload PDF and start processing")
    log.info("  GET  /stream/{case_id}              SSE processing progress")
    log.info("  GET  /cases/{case_id}/brief         AI brief for review")
    log.info("  POST /cases/{case_id}/ask           source-bound RAG Q&A")
    log.info("  GET  /review/{case_id}              human verification payload")
    log.info("  POST /review/{case_id}/approve      approve final action plan")
    log.info("  GET  /dashboard/approved-actions    trusted dashboard data")
    log.info("  GET  /docs                          Swagger UI")
    log.info("=" * 70)
