# ── Stage 1: Build Frontend (React 19 + Vite) ────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY judgment-platform/package*.json ./
RUN npm install

COPY judgment-platform/ ./
RUN npm run build

# ── Stage 2: Python Backend with OS Binaries & Heavy ML ──────
FROM python:3.11-slim

# Install system C++ packages for Tesseract OCR & Poppler
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Disable telemetry & configure environment
ENV NEMO_GUARDRAILS_NO_USAGE_STATS=1
ENV DO_NOT_TRACK=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install Python backend dependencies (including nemoguardrails)
COPY judgment-platform/judgment-ai-backend/judgment-ai/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application files & guardrail configurations
COPY judgment-platform/judgment-ai-backend/judgment-ai/ /app/

# Copy built frontend assets into static directory for FastAPI SPA serving
COPY --from=frontend-builder /app/frontend/dist /app/static

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
