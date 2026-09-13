from fastapi import APIRouter

from app.ml.model_loader import get_model_info
from app.schemas.model import ModelInfo

router = APIRouter()


@router.get("/info", response_model=ModelInfo, summary="Return model metadata and availability")
def model_info():
    return get_model_info()
