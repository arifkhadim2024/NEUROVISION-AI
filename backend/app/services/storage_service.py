from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.core.config import settings


class StorageService:
    @staticmethod
    def ensure_directories() -> None:
        settings.upload_dir_path.mkdir(parents=True, exist_ok=True)
        settings.output_dir_path.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        base = os.path.basename(filename)
        stem = Path(base).stem
        suffix = Path(base).suffix.lower()
        cleaned_stem = ''.join(ch if ch.isalnum() or ch in {'-', '_'} else '_' for ch in stem)
        if not cleaned_stem:
            cleaned_stem = 'upload'
        return f"{cleaned_stem}-{uuid.uuid4().hex}{suffix}"

    @staticmethod
    def validate_upload(file: UploadFile) -> None:
        if file is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No file uploaded")

        if not file.filename:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Uploaded file is missing a filename")

        ext = Path(file.filename).suffix.lower().lstrip('.')
        if ext not in settings.allowed_image_extensions:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported file type")

        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)
        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        if size_bytes > max_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image exceeds maximum file size")

        try:
            image = Image.open(file.file)
            image.verify()
            file.file.seek(0)
            image = Image.open(file.file)
            image.load()
            file.file.seek(0)
            if image.mode not in {"RGB", "L", "RGBA", "CMYK", "P"}:
                raise ValueError("Unsupported image mode")
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid or corrupted image file") from exc

    @staticmethod
    def save_upload(file: UploadFile) -> str:
        StorageService.ensure_directories()
        StorageService.validate_upload(file)
        file_name = StorageService.sanitize_filename(file.filename or "upload.jpg")
        destination = settings.upload_dir_path / file_name
        file.file.seek(0)
        with destination.open("wb") as buffer:
            buffer.write(file.file.read())
        return str(destination)
