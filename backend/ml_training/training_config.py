from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class TrainingConfig:
    dataset_root: str = "/Users/arifkhadim/Documents/NEUROVISION AI/Dataset/Brain tumor dataset"
    train_dir: str = "/Users/arifkhadim/Documents/NEUROVISION AI/Dataset/Brain tumor dataset/Training"
    test_dir: str = "/Users/arifkhadim/Documents/NEUROVISION AI/Dataset/Brain tumor dataset/Testing"
    image_size: tuple[int, int] = (224, 224)
    batch_size: int = 32
    learning_rate: float = 1e-4
    weight_decay: float = 1e-4
    optimizer: str = "adamw"
    scheduler: str = "cosine"
    epochs: int = 25
    early_stopping_patience: int = 5
    min_delta: float = 1e-4
    random_seed: int = 42
    num_workers: int = 2
    checkpoint_dir: str = "/Users/arifkhadim/Documents/NEUROVISION AI/backend/ml_models"
    checkpoint_name: str = "neurovision_efficientnet_b0.pth"
    classes: list[str] = field(default_factory=lambda: ["glioma", "meningioma", "notumor", "pituitary"])
    class_to_idx: dict[str, int] = field(default_factory=lambda: {"glioma": 0, "meningioma": 1, "notumor": 2, "pituitary": 3})
    label_smoothing: float = 0.1
    validation_fraction: float = 0.2

    @property
    def checkpoint_path(self) -> str:
        return str(Path(self.checkpoint_dir) / self.checkpoint_name)
