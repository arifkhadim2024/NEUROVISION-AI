from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import numpy as np
import torch
from PIL import Image

from app.core.config import settings


class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: str | None = None):
        self.model = model
        self.target_layer = target_layer
        self.feature_maps = None
        self.gradients = None

        if hasattr(model, "model") and hasattr(model.model, "features"):
            self._layer = model.model.features[-1]
        elif hasattr(model, "model") and hasattr(model.model, "layer4"):
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

    def generate(
        self,
        input_tensor: torch.Tensor,
        class_index: int | None = None,
        output_dir: str | None = None,
        original_image_path: str | None = None,
        analysis_id: str | None = None,
    ) -> dict[str, str]:
        """
        Generate a Grad-CAM heatmap and an overlay on the original image.

        Returns:
            {
                "heatmap_path": "...",
                "overlay_path": "..."
            }
        """

        if input_tensor.ndim == 3:
            input_tensor = input_tensor.unsqueeze(0)

        self.model.zero_grad(set_to_none=True)

        # Grad-CAM requires gradients, so do not use inference_mode here.
        with torch.enable_grad():
            logits = self.model(input_tensor)

            if class_index is None:
                class_index = int(logits.argmax(dim=1).item())

            target = logits[:, class_index].sum()
            target.backward()

        if self.gradients is None or self.feature_maps is None:
            raise RuntimeError("Grad-CAM hooks did not capture activations or gradients.")

        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * self.feature_maps, dim=1, keepdim=True)
        cam = torch.relu(cam)

        cam = cam[0, 0].detach().float().cpu().numpy()

        cam_min = np.min(cam)
        cam_max = np.max(cam)

        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        width = int(input_tensor.shape[-1])
        height = int(input_tensor.shape[-2])

        # Resize CAM to model input dimensions.
        heatmap = Image.fromarray((cam * 255).astype(np.uint8), mode="L")
        heatmap = heatmap.resize((width, height), Image.Resampling.BILINEAR)

        output_path = Path(output_dir or settings.output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        unique_id = analysis_id or str(uuid4())

        heatmap_path = output_path / f"gradcam_{unique_id}.png"
        overlay_path = output_path / f"overlay_{unique_id}.png"

        heatmap.save(heatmap_path)

        # Create a simple red/yellow/blue-style heatmap using a PIL gradient.
        heatmap_array = np.asarray(heatmap).astype(np.float32) / 255.0

        # JET-like visualization without requiring OpenCV.
        red = np.clip(1.5 * heatmap_array - 0.5, 0, 1)
        green = np.clip(1.5 - np.abs(2 * heatmap_array - 1.0) * 1.5, 0, 1)
        blue = np.clip(1.0 - 1.5 * heatmap_array, 0, 1)

        colored = np.stack(
            [
                red * 255,
                green * 255,
                blue * 255,
            ],
            axis=-1,
        ).astype(np.uint8)

        colored_heatmap = Image.fromarray(colored, mode="RGB")

        # Create overlay using the original MRI when supplied.
        if original_image_path:
            original = Image.open(original_image_path).convert("RGB")
            original = original.resize((width, height), Image.Resampling.LANCZOS)

            overlay = Image.blend(
                original,
                colored_heatmap,
                alpha=0.45,
            )
        else:
            overlay = colored_heatmap

        overlay.save(overlay_path)

        return {
            "heatmap_path": str(heatmap_path),
            "overlay_path": str(overlay_path),
        }