from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import torch

from app.core.config import settings
from app.ml.model import NeuroVisionClassifier, build_model

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def load_model() -> NeuroVisionClassifier | None:
    if not settings.model_path or not os.path.exists(settings.model_path):
        logger.warning("Model checkpoint not found: %s", settings.model_path)
        return None
    try:
        model = build_model()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()
        logger.info("Model loaded successfully from %s", settings.model_path)
        return model
    except Exception as exc:
        logger.exception("Failed to load model: %s", exc)
        return None


def _get_effective_metrics() -> dict[str, Any]:
    metrics = dict(settings.validation_metrics) if settings.validation_metrics else {}
    if not metrics and settings.model_path:
        metrics_file = Path(settings.model_path).parent / "neurovision_efficientnet_b0_metrics.json"
        if metrics_file.exists():
            try:
                import json
                with open(metrics_file, "r") as f:
                    metrics = json.load(f)
            except Exception:
                pass
    return metrics


def get_model_metadata() -> dict[str, Any]:
    model = load_model()
    return {
        "name": settings.model_name or "NeuroVision EfficientNet-B0",
        "version": settings.model_version or "1.0.0",
        "architecture": settings.model_architecture,
        "framework": "PyTorch",
        "input_size": [224, 224],
        "classes": settings.model_classes or [],
        "num_classes": settings.num_classes,
        "training_dataset": settings.training_dataset or None,
        "validation_metrics": _get_effective_metrics(),
        "model_available": model is not None,
    }


def get_model() -> NeuroVisionClassifier | None:
    return load_model()


def get_model_info() -> dict[str, Any]:
    model = load_model()
    return {
        "name": settings.model_name or "NeuroVision EfficientNet-B0",
        "version": settings.model_version or "1.0.0",
        "architecture": settings.model_architecture,
        "framework": "PyTorch",
        "input_size": [224, 224],
        "classes": settings.model_classes or [],
        "num_classes": settings.num_classes,
        "training_dataset": settings.training_dataset or None,
        "validation_metrics": _get_effective_metrics(),
        "model_available": model is not None,
    }


def get_model_status() -> dict[str, Any]:
    model = load_model()
    return {
        "model_available": model is not None,
        "status": "ok" if model is not None else "unavailable",
        "message": "AI model is configured and available." if model is not None else "AI model is not configured.",
        "name": settings.model_name or None,
        "version": settings.model_version or None,
    }
