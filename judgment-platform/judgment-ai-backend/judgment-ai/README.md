# Judgment Platform — AI/ML Backend
## Complete Setup Guide (for any laptop)

---

## What this does

This Python backend attaches to your existing Firebase frontend **without changing any frontend code**.
It adds:
- PDF reading (digital + scanned via OCR)
- Structured extraction (parties, court, relief items, deadlines)
- Action plan generation with paragraph-level source linking
- Vector search for source-bound Q&A
- SSE stream that drives the animated processing screen

---

## Folder structure

```
judgment-ai/
├── main.py                  ← FastAPI app entry point
├── requirements.txt
├── .env                     ← YOU CREATE THIS (see Step 3)
├── .env.example
├── judgmentAI.js            ← drop into your Firebase project
├── models/
│   └── schemas.py           ← Pydantic data models
├── routers/
│   ├── upload.py            ← POST /upload
│   ├── stream.py            ← GET  /stream/{case_id}  (SSE)
│   └── cases.py             ← GET  /cases/{id}/brief  + POST /ask
└── services/
    ├── pdf_service.py       ← PDF extraction + OCR
    ├── vector_service.py    ← ChromaDB vector search
    ├── ai_service.py        ← Google ADK / Gemini calls
    └── case_store.py        ← in-memory case registry
```

---

## Step-by-step setup

### Step 1 — System requirements

Install these on the laptop before anything else.

**macOS:**
```bash
brew install python@3.11 tesseract poppler
```

**Windows:**
1. Install Python 3.11 from https://python.org
2. Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
   - During install, note the path (usually `C:\Program Files\Tesseract-OCR\tesseract.exe`)
   - Add it to PATH or set in code
3. Install poppler: https://github.com/oschwartz10612/poppler-windows/releases
   - Extract and add `bin/` folder to PATH

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv tesseract-ocr poppler-utils
```

---

### Step 2 — Set up the project

```bash
# Copy the judgment-ai folder to the laptop, then:
cd judgment-ai

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
venv\Scripts\activate             # Windows PowerShell

# Install all dependencies
pip install -r requirements.txt
```

This will take 3-5 minutes (sentence-transformers downloads a model).

---

### Step 3 — Create your .env file

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_ADK_MODEL=gemini-2.0-flash
OCR_ENABLED=true
ALLOWED_ORIGINS=*
```

Use the Google API key already configured for your Google ADK/Gemini setup.

---

### Step 4 — Start the backend

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
Judgment Platform AI backend is running
  POST  /upload
  GET   /stream/{case_id}
  GET   /cases/{case_id}/brief
  POST  /cases/{case_id}/ask
  ...
```

Test it: open http://localhost:8000/docs in a browser → Swagger UI with all endpoints.
Test health: http://localhost:8000/health

---

### Step 5 — Expose to Firebase (ngrok)

Your Firebase app is hosted on the internet but the backend runs on localhost.
ngrok creates a secure tunnel.

```bash
# Install ngrok: https://ngrok.com/download
# Then:
ngrok http 8000
```

You'll see something like:
```
Forwarding  https://a1b2c3d4.ngrok-free.app  →  http://localhost:8000
```

Copy that `https://....ngrok-free.app` URL.

---

### Step 6 — Connect your Firebase frontend

1. Copy `judgmentAI.js` into your Firebase project's `src/` folder.
2. Open it and change line 14:
   ```js
   export const BACKEND_URL = "https://a1b2c3d4.ngrok-free.app";
   //                          ↑ paste your ngrok URL here
   ```
3. Import and use in your components (see examples at bottom of `judgmentAI.js`).

---

## API endpoints at a glance

| Endpoint | Method | Purpose | Called when |
|---|---|---|---|
| `/upload` | POST | Upload PDF, get case_id | User drops PDF |
| `/stream/{case_id}` | GET (SSE) | Live progress steps | Processing screen |
| `/cases/{id}/brief` | GET | Full dashboard JSON | Dashboard loads |
| `/cases/{id}/ask` | POST | Source-bound Q&A | User types in chat |
| `/cases/{id}/quick-questions` | GET | Chat chip questions | Chat panel opens |
| `/cases` | GET | List all cases | Optional case list |
| `/health` | GET | Server status check | Any time |

---

## Response shapes (what your frontend receives)

### `/cases/{id}/brief` → powers the entire dashboard

```json
{
  "header": {
    "case_title": "State of Telangana v. Union of India",
    "case_number": "WP No. 1234/2024",
    "court": "High Court of Telangana",
    "pages_indexed": 38,
    "confidence": 94
  },
  "metrics": {
    "immediate_action": "Mandamus Compliance",
    "workflow_label": "Priority workflow generated",
    "nearest_deadline_days": 21,
    "nearest_deadline_label": "Fund release compliance",
    "authorities_mapped": 3,
    "authorities_label": "Owner desk assignment ready",
    "financial_exposure": "Rs. 847 Cr",
    "financial_label": "Central allocation at issue"
  },
  "relief_items": [
    { "label": "Release of central allocation", "outcome": "Granted" }
  ],
  "workflow_steps": [
    {
      "step_number": 1,
      "title": "Immediate Fund Release",
      "description": "Mandamus directed to Union of India",
      "status": "Required",
      "source_page": 22,
      "key_extract": "Para 18: Respondents must release Rs. 847 crore within 21 days."
    }
  ],
  "evidence_summary": "...",
  "timeline_summary": "...",
  "audit_summary": "..."
}
```

### `/cases/{id}/ask` → powers the chat panel

```json
{
  "answer": "The court granted a writ of mandamus directing...",
  "sources": [
    { "page": 22, "excerpt": "Para 18: Respondents must release..." },
    { "page": 31, "excerpt": "The relief sought under Article 226..." }
  ],
  "confidence": 91
}
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: pdfplumber` | Run `pip install -r requirements.txt` again inside the venv |
| `tesseract not found` | Check tesseract is installed and in PATH |
| `GOOGLE_API_KEY not set` | Check your `.env` file is in the `judgment-ai/` root |
| CORS error in browser | Make sure `ALLOWED_ORIGINS=*` is set in `.env` |
| ngrok URL rejected | Restart ngrok, get new URL, update `BACKEND_URL` in `judgmentAI.js` |
| `pip install` fails on Windows | Run PowerShell as Administrator |
| OCR very slow | Set `OCR_ENABLED=false` if PDFs are digital (not scanned) |

---

## For production (not ngrok)

Deploy the backend to any server that runs Python:
- **Railway**: `railway up` (free tier available)
- **Render**: connect GitHub repo, set env vars in dashboard
- **Google Cloud Run**: `gcloud run deploy`

Set `ALLOWED_ORIGINS=https://judgement-platform.web.app` in production.
