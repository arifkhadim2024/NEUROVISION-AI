from fastapi import APIRouter

from app.core.config import settings
from app.ml.model_loader import get_model_status

router = APIRouter()


@router.get("", summary="Health check endpoint")
def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/model", summary="Check whether the ML model is configured and available")
def health_model():
    return get_model_status()
