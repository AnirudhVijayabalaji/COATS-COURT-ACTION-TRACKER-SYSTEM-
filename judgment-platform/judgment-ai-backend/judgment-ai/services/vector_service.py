"""
vector_service.py
Acts as a wrapper for llamaindex_service which handles local vector storage.
ChromaDB has been removed to ensure compatibility without C++ build tools.
"""
from services import llamaindex_service

def index_chunks(case_id: str, chunks: list[dict]) -> None:
    llamaindex_service.index_chunks(case_id, chunks)

def search(case_id: str, query: str, n_results: int = 6) -> list[dict]:
    return llamaindex_service.search(case_id, query, n_results=n_results)

def delete_case(case_id: str) -> None:
    llamaindex_service.delete_case(case_id)
