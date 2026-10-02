import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


class Settings:
    app_name = "Judgment Platform Backend"
    allowed_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "https://judgement-platform.web.app,https://judgement-platform.firebaseapp.com,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5173,http://localhost:3000,*"
    )


    _database_url = os.getenv("DATABASE_URL", "").strip()
    if not _database_url:
        if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
            database_url = "sqlite:////tmp/judgment_platform.db"
        else:
            database_url = f"sqlite:///{(BASE_DIR / 'judgment_platform.db').as_posix()}"
    else:
        database_url = _database_url

    storage_backend = os.getenv("STORAGE_BACKEND", "local").lower()
    if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        upload_dir = Path("/tmp/uploads")
    else:
        upload_dir = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    ocr_enabled = os.getenv("OCR_ENABLED", "true").lower() == "true"

    google_adk_model = os.getenv("GOOGLE_ADK_MODEL", "gemini-2.0-flash-lite")
    
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    celery_broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    celery_result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
    use_celery = os.getenv("USE_CELERY", "false").lower() == "true"

    dev_auth_enabled = os.getenv("DEV_AUTH_ENABLED", "true").lower() == "true"
    clerk_jwks_url = os.getenv("CLERK_JWKS_URL", "")
    nextauth_secret = os.getenv("NEXTAUTH_SECRET", "")


settings = Settings()
