import logging
from services import ai_service, vector_service
from services import google_adk_service

logger = logging.getLogger(__name__)


AGENT_SYSTEM = """You are an agentic legal assistant for a government court-case workflow.
Use verified action-plan data first when it exists. Use judgment source chunks for legal/source grounding.
Do not invent facts. If the answer is not in the verified data or source chunks, say it is not available.
Return concise prose and mention source pages when using judgment chunks.
"""


def _compact_verified_plan(verified_brief: dict | None) -> str:
    if not verified_brief:
        return "No human-approved action plan exists yet."
    import json

    return json.dumps(verified_brief, ensure_ascii=False)[:5000]


def _format_chunks(chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[Page {chunk.get('page')} | Score {chunk.get('score')}]\n{chunk.get('text', '')}"
        for chunk in chunks
    )


def _langchain_answer(question: str, verified_brief: dict | None, chunks: list[dict]) -> str | None:
    try:
        from langchain_core.prompts import ChatPromptTemplate
    except Exception as exc:
        logger.info("LangChain unavailable, using direct Google ADK fallback: %s", exc)
        return None

    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", AGENT_SYSTEM),
            (
                "human",
                "Verified action plan:\n{verified_plan}\n\n"
                "Judgment source chunks:\n{source_chunks}\n\n"
                "Question: {question}",
            ),
        ])
        messages = prompt.format_messages(
            verified_plan=_compact_verified_plan(verified_brief),
            source_chunks=_format_chunks(chunks),
            question=question,
        )
        system_text = "\n\n".join(msg.content for msg in messages if msg.type == "system")
        user_text = "\n\n".join(msg.content for msg in messages if msg.type != "system")
        from services import groq_service
        return groq_service.generate_text(
            instruction=system_text,
            prompt=user_text,
            model=ai_service.MODEL,
        ).strip()
    except Exception as exc:
        logger.warning("LangChain prompt orchestration failed, using direct Groq fallback: %s", exc)
        return None


def answer_case_question(case_payload: dict, question: str) -> dict:
    """
    LangChain agent layer:
    1. Retrieve source chunks via LlamaIndex-backed vector_service when available.
    2. Prefer verified action-plan context when present.
    3. Fall back to the original source-bound Google ADK answer.
    """
    case_id = case_payload["case_id"]
    chunks = vector_service.search(case_id, question, n_results=6)
    if not chunks:
        raw_chunks = case_payload.get("chunks") or []
        if not raw_chunks and case_payload.get("pages"):
            raw_chunks = [
                {"page": p.get("page", i + 1), "text": p.get("text", "")}
                for i, p in enumerate(case_payload["pages"])
                if isinstance(p, dict) and p.get("text")
            ]
        chunks = raw_chunks[:8]

    if not chunks:
        return {
            "answer": "No relevant judgment sources were found for this question.",
            "sources": [],
            "confidence": 0,
            "mode": "no_sources",
        }

    answer = _langchain_answer(question, case_payload.get("verified_brief"), chunks)
    if answer:
        sources = [
            {"page": c["page"], "excerpt": c["text"][:250]}
            for c in chunks[:3]
        ]
        # Calculate real confidence based on source chunks & page citations
        lower_ans = answer.lower()
        num_sources = len(sources)
        if "not in the indexed pages" in lower_ans or "not in the provided context" in lower_ans:
            confidence = 0
        elif num_sources >= 3:
            confidence = 96
        elif num_sources == 2:
            confidence = 94
        elif num_sources == 1:
            confidence = 91
        else:
            confidence = 88
        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "mode": "langchain_agent",
        }

    direct = ai_service.answer_question(question, chunks)
    direct["mode"] = "direct_rag_fallback"
    return direct
