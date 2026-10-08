# Backend Run Guide

## Best database choice

Use **Supabase PostgreSQL** for hosted projects. It is PostgreSQL, but Supabase gives you hosting, dashboard, backups, and optional auth/storage later.

For local testing, leave `DATABASE_URL` empty and the backend uses SQLite automatically.
For Supabase, use the SQLAlchemy v3 driver format:

```txt
postgresql+psycopg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

## Local demo

```powershell
cd "C:\Users\aniph\OneDrive\Desktop\PROJECTS\AI Bharat\judgment-platform\judgment-ai-backend\judgment-ai"
copy .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Use Python 3.11 if possible because OCR/vector packages are more reliable there.

Open:

```txt
http://localhost:8000/docs
```

Before running, put your Google key in `.env`:

```txt
GOOGLE_API_KEY=your-key
GOOGLE_ADK_MODEL=gemini-2.0-flash
```

## Production-style with Redis/Celery

Set in `.env`:

```txt
USE_CELERY=true
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

Run:

```powershell
docker compose up --build
```

## Important endpoints

```txt
POST /upload
GET  /stream/{case_id}
GET  /cases/{case_id}/brief
POST /cases/{case_id}/ask
GET  /review/{case_id}
PUT  /review/{case_id}
POST /review/{case_id}/approve
POST /review/{case_id}/reject
GET  /dashboard/approved-actions
GET  /dashboard/pending-reviews
GET  /dashboard/deadlines
GET  /auth/me
```

## AI/RAG architecture

```txt
PDF/OCR layer:      pdfplumber + pytesseract
Vector storage:    ChromaDB
RAG retrieval:     LlamaIndex wrapper over ChromaDB
Agent workflow:    LangChain agent prompt/chain
LLM/agent runtime: Google ADK with Gemini
Fallback path:     Custom Chroma + Google ADK RAG if LangChain/LlamaIndex is unavailable
```

In plain English:

```txt
LlamaIndex finds the relevant judgment paragraphs.
LangChain decides how to answer using verified action-plan data plus those paragraphs.
The dashboard still shows only human-approved records.
```

## Dev role headers

During demo, send headers:

```txt
x-user-email: reviewer@gov.in
x-user-role: legal_reviewer
x-user-department: Revenue
```

Roles:

```txt
admin
legal_reviewer
department_officer
decision_maker
```
