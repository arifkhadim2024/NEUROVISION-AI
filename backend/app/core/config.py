from __future__ import annotations

import os
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "neurovision-backend"
    app_version: str = "1.0.0"
    database_url: str = Field(default="sqlite:///./test.db")
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    model_path: str = str(BACKEND_DIR / "ml_models" / "neurovision_efficientnet_b0.pth")
    upload_dir: str = "uploads"
    output_dir: str = "outputs"
    allowed_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:5175,http://127.0.0.1:5175,"
        "https://neurovision-ai-cyan.vercel.app"
    )
    max_upload_size_mb: int = 10
    model_name: str = ""
    model_version: str = ""
    model_architecture: str = "efficientnet_b0"
    num_classes: int = 4
    model_classes: str = "glioma,meningioma,notumor,pituitary"
    training_dataset: str = "/Users/arifkhadim/Documents/NEUROVISION AI/Dataset/Brain tumor dataset/Training"
    test_dataset: str = "/Users/arifkhadim/Documents/NEUROVISION AI/Dataset/Brain tumor dataset/Testing"
    validation_metrics: dict = {}
    allowed_image_extensions: set[str] = {"png", "jpg", "jpeg"}

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def upload_dir_path(self) -> Path:
        if os.getenv("VERCEL"):
            return Path("/tmp/uploads")
        return Path(self.upload_dir)

    @property
    def output_dir_path(self) -> Path:
        if os.getenv("VERCEL"):
            return Path("/tmp/outputs")
        return Path(self.output_dir)

    @property
    def effective_database_url(self) -> str:
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")
        if os.getenv("VERCEL") and self.database_url.startswith("sqlite:///."):
            return "sqlite:////tmp/test.db"
        return self.database_url

    @property
    def effective_model_path(self) -> str:
        if self.model_path and Path(self.model_path).exists():
            return self.model_path
        candidates = [
            BACKEND_DIR / "ml_models" / "neurovision_efficientnet_b0.pth",
            Path(__file__).resolve().parents[3] / "backend" / "ml_models" / "neurovision_efficientnet_b0.pth",
            Path("backend/ml_models/neurovision_efficientnet_b0.pth"),
            Path("ml_models/neurovision_efficientnet_b0.pth"),
        ]
        for candidate in candidates:
            if candidate.exists():
                return str(candidate)
        return self.model_path


settings = Settings()

if isinstance(settings.allowed_origins, str):
    settings.allowed_origins = [
        origin.strip()
        for origin in settings.allowed_origins.split(",")
        if origin.strip()
    ]

if isinstance(settings.model_classes, str):
    settings.model_classes = [
        clazz.strip()
        for clazz in settings.model_classes.split(",")
        if clazz.strip()
    ]