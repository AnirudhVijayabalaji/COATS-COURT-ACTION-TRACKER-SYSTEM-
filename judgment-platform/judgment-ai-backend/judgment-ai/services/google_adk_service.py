import asyncio
import os
import uuid
from config import settings


async def _generate_with_adk_async(instruction: str, prompt: str, model: str) -> str:
    try:
        from google.adk.agents import LlmAgent
    except Exception:
        from google.adk import Agent as LlmAgent

    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    agent = LlmAgent(
        name="judgment_platform_agent",
        model=model,
        instruction=instruction,
    )

    app_name = "judgment_platform"
    user_id = "backend"
    session_id = str(uuid.uuid4())
    session_service = InMemorySessionService()
    await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
    )
    runner = Runner(agent=agent, app_name=app_name, session_service=session_service)
    content = types.Content(role="user", parts=[types.Part(text=prompt)])

    final_text = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content,
    ):
        if hasattr(event, "is_final_response") and event.is_final_response():
            if event.content and event.content.parts:
                final_text = "".join(part.text or "" for part in event.content.parts)
        elif event.content and event.content.parts:
            final_text = "".join(part.text or "" for part in event.content.parts if getattr(part, "text", None))

    return final_text.strip()


def generate_text(instruction: str, prompt: str, model: str | None = None) -> str:
    if getattr(settings, "google_api_key", None):
        os.environ.setdefault("GOOGLE_API_KEY", settings.google_api_key)

    selected_model = model or getattr(settings, "google_adk_model", "gemini-2.0-flash-lite")
    return asyncio.run(_generate_with_adk_async(instruction, prompt, selected_model))
