import logging
from config import settings
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

# Active supported models on Groq
MODELS_TO_TRY = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound",
]


def generate_text(instruction: str, prompt: str, model: str | None = None) -> str:
    """
    Generates text using Groq's API via LangChain with active supported model fallbacks.
    """
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set in the environment variables.")

    primary_model = model or settings.groq_model or "openai/gpt-oss-120b"
    models = [primary_model] + [m for m in MODELS_TO_TRY if m != primary_model]

    last_error = None
    for model_name in models:
        try:
            llm = ChatGroq(
                temperature=0.1,
                groq_api_key=settings.groq_api_key,
                model_name=model_name,
                max_tokens=4000,
            )
            messages = [
                SystemMessage(content=instruction),
                HumanMessage(content=prompt),
            ]
            response = llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            logger.warning(f"Groq model {model_name} failed: {e}. Trying fallback...")
            last_error = e

    logger.error(f"All Groq models failed. Last error: {last_error}")
    raise last_error
