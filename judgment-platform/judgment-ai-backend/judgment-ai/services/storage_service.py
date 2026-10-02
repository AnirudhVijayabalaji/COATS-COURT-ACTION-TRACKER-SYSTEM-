import shutil
from pathlib import Path
from fastapi import UploadFile
from config import settings


def _safe_filename(filename: str) -> str:
    return Path(filename).name.replace("/", "_").replace("\\", "_")


async def save_upload(case_id: str, file: UploadFile) -> dict:
    data = await file.read()
    return save_bytes(case_id, file.filename, data, file.content_type)


def save_bytes(case_id: str, filename: str, data: bytes, content_type: str | None = None) -> dict:
    if settings.storage_backend != "local":
        raise NotImplementedError("Only local storage is configured in this runnable backend.")

    case_dir = settings.upload_dir / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    target = case_dir / _safe_filename(filename)
    target.write_bytes(data)

    return {
        "backend": "local",
        "path": str(target),
        "filename": target.name,
        "size_bytes": len(data),
        "content_type": content_type or "application/pdf",
    }


def read_bytes(storage_path: str) -> bytes:
    return Path(storage_path).read_bytes()


def delete_case_files(case_id: str) -> None:
    case_dir = settings.upload_dir / case_id
    if case_dir.exists():
        shutil.rmtree(case_dir)
