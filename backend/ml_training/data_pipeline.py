from __future__ import annotations

import json
from pathlib import Path

import torch
from PIL import Image, ImageFile
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

ImageFile.LOAD_TRUNCATED_IMAGES = True


class BrainTumorDataset(Dataset):
    def __init__(self, root_dir: str | Path, class_names: list[str], transform=None):
        self.root_dir = Path(root_dir)
        self.class_names = class_names
        self.class_to_idx = {name: idx for idx, name in enumerate(class_names)}
        self.transform = transform

        self.samples = []
        for class_name in class_names:
            class_dir = self.root_dir / class_name
            if not class_dir.exists():
                continue
            for image_path in sorted(class_dir.iterdir()):
                if image_path.is_file() and image_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}:
                    self.samples.append((image_path, self.class_to_idx[class_name]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        image_path, label = self.samples[idx]
        image = Image.open(image_path).convert("RGB")
        if self.transform is not None:
            image = self.transform(image)
        return image, label


def build_train_val_split(train_dir: str | Path, class_names: list[str], validation_fraction: float = 0.2, random_state: int = 42):
    train_root = Path(train_dir)
    train_files = []
    train_labels = []

    for class_name in class_names:
        class_dir = train_root / class_name
        if not class_dir.exists():
            continue
        for image_path in sorted(class_dir.iterdir()):
            if image_path.is_file() and image_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}:
                train_files.append(str(image_path))
                train_labels.append(class_name)

    if not train_files:
        raise ValueError(f"No images were found in {train_dir}")

    original_labels = list(train_labels)
    train_idx, val_idx = train_test_split(
        range(len(train_files)),
        test_size=validation_fraction,
        stratify=original_labels,
        random_state=random_state,
    )

    train_paths = [train_files[i] for i in train_idx]
    val_paths = [train_files[i] for i in val_idx]
    train_labels = [original_labels[i] for i in train_idx]
    val_labels = [original_labels[i] for i in val_idx]

    return train_paths, val_paths, train_labels, val_labels


def make_transforms(image_size: tuple[int, int], is_training: bool = True):
    if is_training:
        return transforms.Compose([
            transforms.Resize((image_size[0], image_size[1])),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(10),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    return transforms.Compose([
        transforms.Resize((image_size[0], image_size[1])),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


def build_data_loaders(train_dir: str | Path, test_dir: str | Path, class_names: list[str], image_size: tuple[int, int], batch_size: int, num_workers: int, validation_fraction: float = 0.2, random_state: int = 42):
    train_paths, val_paths, train_labels, val_labels = build_train_val_split(train_dir, class_names, validation_fraction=validation_fraction, random_state=random_state)

    train_dataset = BrainTumorDataset(root_dir=train_dir, class_names=class_names, transform=make_transforms(image_size, is_training=True))
    val_dataset = BrainTumorDataset(root_dir=train_dir, class_names=class_names, transform=make_transforms(image_size, is_training=False))

    # Use the subset indices for the split without altering the original dataset folders.
    train_subset = []
    val_subset = []
    for path, label in train_dataset.samples:
        if str(path) in set(train_paths):
            train_subset.append((path, label))
        elif str(path) in set(val_paths):
            val_subset.append((path, label))

    train_dataset.samples = train_subset
    val_dataset.samples = val_subset

    test_dataset = BrainTumorDataset(root_dir=test_dir, class_names=class_names, transform=make_transforms(image_size, is_training=False))

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=torch.cuda.is_available())
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=torch.cuda.is_available())
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=torch.cuda.is_available())

    return train_loader, val_loader, test_loader, {"train": len(train_dataset), "validation": len(val_dataset), "test": len(test_dataset)}


def save_class_mapping(class_names: list[str], class_to_idx: dict[str, int], output_path: str | Path):
    output = {
        "class_names": class_names,
        "class_to_idx": class_to_idx,
        "num_classes": len(class_names),
    }
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
