"""Dataset configuration for the Brain Tumor MRI dataset.

This file configures the dataset path and class list without modifying the original
source files. If a validation split is not present, it is generated in code from the
training split only; the original dataset folders are left untouched.
"""

from __future__ import annotations

from pathlib import Path

from sklearn.model_selection import train_test_split


class DatasetConfig:
    def __init__(self, root_dir: str | Path | None = None):
        self.root_dir = Path(root_dir or "/Users/arifkhadim/Documents/NEUROVISION AI/Dataset/Brain tumor dataset")
        self.classes = ["glioma", "meningioma", "notumor", "pituitary"]
        self.train_dir = self.root_dir / "Training"
        self.test_dir = self.root_dir / "Testing"
        self.val_dir = None
        self.image_size = (224, 224)

    def get_class_counts(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for class_name in self.classes:
            class_path = self.train_dir / class_name
            counts[class_name] = len([p for p in class_path.glob("*") if p.is_file()]) if class_path.exists() else 0
        return counts

    def get_train_test_counts(self) -> dict[str, int]:
        train_count = 0
        test_count = 0
        for class_name in self.classes:
            train_path = self.train_dir / class_name
            test_path = self.test_dir / class_name
            train_count += len([p for p in train_path.glob("*") if p.is_file()]) if train_path.exists() else 0
            test_count += len([p for p in test_path.glob("*") if p.is_file()]) if test_path.exists() else 0
        return {"train": train_count, "test": test_count, "validation": 0}

    def build_validation_split(self, validation_fraction: float = 0.2, random_state: int = 42):
        """Create a validation split in memory only, without altering source folders."""
        if not self.train_dir.exists():
            raise FileNotFoundError(f"Training dataset not found: {self.train_dir}")

        image_paths: list[Path] = []
        labels: list[str] = []

        for class_name in self.classes:
            class_path = self.train_dir / class_name
            if not class_path.exists():
                continue
            for image_path in sorted(class_path.glob("*")):
                if image_path.is_file():
                    image_paths.append(image_path)
                    labels.append(class_name)

        if len(image_paths) == 0:
            raise ValueError(f"No training images found under {self.train_dir}")

        train_files, val_files, train_labels, val_labels = train_test_split(
            image_paths,
            labels,
            test_size=validation_fraction,
            stratify=labels,
            random_state=random_state,
        )

        return {
            "train": len(train_files),
            "validation": len(val_files),
            "test": self.get_train_test_counts()["test"],
            "train_labels": train_labels,
            "validation_labels": val_labels,
        }


DATASET_CONFIG = DatasetConfig()
