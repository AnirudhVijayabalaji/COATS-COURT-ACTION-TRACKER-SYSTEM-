"""
pdf_service.py
Extracts text from PDFs (digital or scanned).
Returns a list of {page, text} dicts.
"""
import io
import os
import logging

logger = logging.getLogger(__name__)
OCR_ENABLED = os.getenv("OCR_ENABLED", "true").lower() == "true"


def extract_pages(pdf_bytes: bytes) -> list[dict]:
    """
    Extract text from every page of a PDF.
    Falls back to Tesseract OCR when a page has no selectable text.
    Returns: [{"page": 1, "text": "..."}, ...]
    """
    import pdfplumber

    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total = len(pdf.pages)
        for page_obj in pdf.pages:
            page_num = page_obj.page_number
            text = page_obj.extract_text() or ""

            # If less than 50 chars, treat as scanned and OCR it
            if len(text.strip()) < 50 and OCR_ENABLED:
                text = _ocr_page(pdf_bytes, page_num)

            if text.strip():
                pages.append({"page": page_num, "text": text.strip()})
            else:
                logger.warning(f"Page {page_num}/{total}: no text extracted")

    return pages


def _ocr_page(pdf_bytes: bytes, page_num: int) -> str:
    """Convert a single PDF page to image and run Tesseract OCR."""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract

        images = convert_from_bytes(
            pdf_bytes,
            first_page=page_num,
            last_page=page_num,
            dpi=200
        )
        if images:
            return pytesseract.image_to_string(images[0], lang="eng")
    except Exception as e:
        logger.error(f"OCR failed for page {page_num}: {e}")
    return ""


def chunk_pages(pages: list[dict], max_chars: int = 900, overlap: int = 120) -> list[dict]:
    """
    Split pages into overlapping chunks suitable for embedding.
    Returns: [{"page": N, "text": "...", "chunk_index": K}, ...]
    """
    chunks = []
    for page in pages:
        text = page["text"]
        page_num = page["page"]
        start = 0
        idx = 0
        while start < len(text):
            end = min(start + max_chars, len(text))
            chunk_text = text[start:end]
            chunks.append({
                "page": page_num,
                "chunk_index": idx,
                "text": chunk_text
            })
            start += max_chars - overlap
            idx += 1
    return chunks
