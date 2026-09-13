from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import torch

from app.core.config import settings
from app.ml.model_loader import get_model
from app.ml.preprocessing import preprocess_image

logger = logging.getLogger(__name__)


def predict(image_path: str | Path) -> dict:
    model = get_model()
    if model is None:
        raise RuntimeError("AI model is not configured.")

    tensor = preprocess_image(image_path)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tensor = tensor.to(device)
    model.to(device)
    with torch.inference_mode():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)
        confidence, idx = torch.max(probabilities, dim=1)
        conf = float(confidence.item())
        index = int(idx.item())

    classes = settings.model_classes or [f"class_{i}" for i in range(settings.num_classes)]
    if index >= len(classes):
        classes = [f"class_{i}" for i in range(settings.num_classes)]

    labels = []
    for i, name in enumerate(classes):
        labels.append({"label": name, "probability": float(probabilities[0, i].item())})

    return {
        "label": classes[index],
        "confidence": conf,
        "probabilities": labels,
    }
