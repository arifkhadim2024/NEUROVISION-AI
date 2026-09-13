from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.core.config import settings


def get_input_size() -> tuple[int, int]:
    if settings.model_architecture.lower() == "resnet18":
        return (224, 224)
    return (224, 224)


def load_and_validate_image(image_path: str | Path) -> Image.Image:
    image = Image.open(str(image_path))
    image.verify()
    image = Image.open(str(image_path))
    image = image.convert("RGB")
    return image


def preprocess_image(image_path: str | Path, target_size: tuple[int, int] | None = None) -> torch.Tensor:
    image = load_and_validate_image(image_path)
    size = target_size or get_input_size()
    tensor_transform = transforms.Compose(
        [
            transforms.Resize(size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    tensor = tensor_transform(image)
    return tensor.unsqueeze(0)
