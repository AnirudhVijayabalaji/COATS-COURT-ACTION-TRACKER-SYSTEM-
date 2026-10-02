import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
    STORAGE_DIR = Path("/tmp/storage")
else:
    STORAGE_DIR = Path("./storage")

STORAGE_DIR.mkdir(parents=True, exist_ok=True)

_embed_model = None

def _get_embed_model():
    global _embed_model
    if _embed_model is None:
        try:
            from llama_index.core import Settings
            from llama_index.embeddings.huggingface import HuggingFaceEmbedding
            _embed_model = HuggingFaceEmbedding(model_name="all-MiniLM-L6-v2")
            Settings.embed_model = _embed_model
            Settings.llm = None
        except Exception as e:
            logger.error(f"Failed to initialize local HuggingFace embeddings: {e}")
    return _embed_model

def _get_case_storage_dir(case_id: str) -> Path:
    safe_id = case_id.replace("-", "_")
    return STORAGE_DIR / f"case_{safe_id}"

def index_chunks(case_id: str, chunks: list[dict]) -> bool:
    """
    Stores chunks in LlamaIndex's built-in SimpleVectorStore, saving to local JSON files.
    """
    try:
        _get_embed_model()
        from llama_index.core import VectorStoreIndex, Document

        documents = []
        for c in chunks:
            doc = Document(
                text=c["text"], 
                metadata={"page": c["page"], "chunk_index": c["chunk_index"]}
            )
            documents.append(doc)
            
        case_dir = _get_case_storage_dir(case_id)
        
        index = VectorStoreIndex.from_documents(documents)
        index.storage_context.persist(persist_dir=str(case_dir))
        return True
    except Exception as exc:
        logger.error("LlamaIndex local indexing failed: %s", exc)
        return False

def search(case_id: str, question: str, n_results: int = 6) -> list[dict]:
    """
    Retrieves relevant chunks using LlamaIndex SimpleVectorStore.
    """
    try:
        _get_embed_model()
        from llama_index.core import StorageContext, load_index_from_storage

        case_dir = _get_case_storage_dir(case_id)
        if not case_dir.exists():
            return []
            
        storage_context = StorageContext.from_defaults(persist_dir=str(case_dir))
        index = load_index_from_storage(storage_context)
        
        retriever = index.as_retriever(similarity_top_k=n_results)
        nodes = retriever.retrieve(question)
        
        results = []
        for node in nodes:
            results.append({
                "page": node.metadata.get("page", 1),
                "text": node.text,
                "score": getattr(node, "score", 0.0) or 0.0
            })
        return results
    except Exception as exc:
        logger.error("LlamaIndex search failed: %s", exc)
        return []

def delete_case(case_id: str) -> None:
    try:
        case_dir = _get_case_storage_dir(case_id)
        if case_dir.exists():
            import shutil
            shutil.rmtree(case_dir)
    except Exception as exc:
        logger.error("Failed to delete LlamaIndex storage for %s: %s", case_id, exc)
