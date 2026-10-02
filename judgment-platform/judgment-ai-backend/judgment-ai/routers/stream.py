"""
stream.py
GET /stream/{case_id}  — Server-Sent Events stream that drives the
"Preparing the case brief" progress screen exactly as shown in the UI.

Each event is: data: {"step": "reading", "label": "Reading the document structure...", "done": true}
"""
import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.processing_state import get_processing_state

router = APIRouter()

# Ordered steps matching the UI labels exactly
STEPS = [
    ("reading",    "Reading the document structure..."),
    ("parties",    "Locating parties, court, and operative order..."),
    ("directions", "Finding directions, dates, and responsible offices..."),
    ("linking",    "Linking each action to a source page..."),
    ("brief",      "Preparing the workflow brief..."),
]


async def _event_generator(case_id: str):
    """
    Polls processing state and yields SSE events as steps complete.
    Closes stream when all done or error occurs.
    """
    sent_steps = set()
    timeout = 0

    while timeout < 300:   # 5-minute max
        state = get_processing_state(case_id)

        if not state:
            yield _sse({"error": "Case not found"})
            return

        if "error" in state:
            yield _sse({"error": state["error"]})
            return

        for step_key, step_label in STEPS:
            done = state.get(step_key, False)
            event_key = f"{step_key}_{done}"
            if event_key not in sent_steps:
                sent_steps.add(event_key)
                yield _sse({
                    "step": step_key,
                    "label": step_label,
                    "done": done
                })

        if state.get("done"):
            yield _sse({"step": "complete", "label": "Ready", "done": True})
            return

        await asyncio.sleep(1)
        timeout += 1

    yield _sse({"error": "Processing timed out"})


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.get("/stream/{case_id}")
async def stream_status(case_id: str):
    return StreamingResponse(
        _event_generator(case_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
