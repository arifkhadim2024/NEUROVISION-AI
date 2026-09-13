from __future__ import annotations

from typing import Any

import torch
import torch.nn as nn
from torchvision import models

from app.core.config import settings


class NeuroVisionClassifier(nn.Module):
    def __init__(self, architecture: str | None = None, num_classes: int | None = None):
        super().__init__()
        self.architecture = architecture or settings.model_architecture
        self.num_classes = num_classes or settings.num_classes

        if self.architecture.lower() == "efficientnet_b0":
            self.model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
            in_features = self.model.classifier[1].in_features
            self.model.classifier[1] = nn.Linear(in_features, self.num_classes)
        elif self.architecture.lower() == "resnet18":
            self.model = models.resnet18(weights=None, num_classes=self.num_classes)
        else:
            raise ValueError(f"Unsupported model architecture: {self.architecture}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)


def build_model() -> nn.Module:
    if not settings.model_path:
        raise FileNotFoundError("AI model is not configured.")
    model = NeuroVisionClassifier(settings.model_architecture, settings.num_classes)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(settings.model_path, map_location=device)
    state_dict = checkpoint.get("model_state_dict", checkpoint)
    if isinstance(state_dict, dict):
        state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
        model.load_state_dict(state_dict, strict=False)
    return model
