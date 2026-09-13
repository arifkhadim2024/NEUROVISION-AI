from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.core.config import settings


class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: str | None = None):
        self.model = model
        self.target_layer = target_layer
        self.feature_maps = None
        self.gradients = None

        if hasattr(model, "model") and hasattr(model.model, "features"):
            self._layer = model.model.features[-1]
        elif hasattr(model, "model") and hasattr(model.model, "avgpool"):
            self._layer = model.model.layer4[-1]
        else:
            raise ValueError("Grad-CAM is not supported for this architecture.")

        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.feature_maps = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self._layer.register_forward_hook(forward_hook)
        self._layer.register_full_backward_hook(backward_hook)

    def generate(self, input_tensor: torch.Tensor, class_index: int | None = None, output_dir: str | None = None):
        self.model.zero_grad()
        logits = self.model(input_tensor)
        if class_index is None:
            class_index = int(logits.argmax(dim=1).item())
        logits[:, class_index].backward()

        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * self.feature_maps, dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam = cam[0, 0].detach().cpu().numpy()
        cam = cam - np.min(cam)
        cam = cam / (np.max(cam) + 1e-8)

        heatmap = Image.fromarray((cam * 255).astype(np.uint8))
        heatmap = heatmap.resize((input_tensor.shape[-1], input_tensor.shape[-2]))

        output_path = Path(output_dir or settings.output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        heatmap_path = output_path / f"gradcam_{class_index}.png"
        heatmap.save(heatmap_path)
        return str(heatmap_path)
