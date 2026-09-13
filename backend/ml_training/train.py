from __future__ import annotations

import json
import os
from pathlib import Path

import matplotlib
import numpy as np
import torch
from matplotlib import pyplot as plt
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from torch import nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from app.ml.model import NeuroVisionClassifier
from ml_training.data_pipeline import build_data_loaders, save_class_mapping
from ml_training.training_config import TrainingConfig

matplotlib.use("Agg")


def evaluate_model(model, test_loader, class_names, device):
    model.eval()
    all_labels = []
    all_logits = []

    with torch.inference_mode():
        for images, labels in test_loader:
            images = images.to(device)
            labels = labels.to(device)
            logits = model(images)
            all_labels.extend(labels.cpu().tolist())
            all_logits.append(logits.cpu())

    logits = torch.cat(all_logits, dim=0)
    probs = torch.softmax(logits, dim=1).numpy()
    preds = probs.argmax(axis=1)
    labels = np.asarray(all_labels)

    accuracy = accuracy_score(labels, preds)
    precision = precision_score(labels, preds, average="macro", zero_division=0)
    recall = recall_score(labels, preds, average="macro", zero_division=0)
    f1 = f1_score(labels, preds, average="macro", zero_division=0)

    cm = confusion_matrix(labels, preds, labels=list(range(len(class_names))))

    y_true_one_hot = np.eye(len(class_names))[labels]
    try:
        roc_auc = roc_auc_score(y_true_one_hot, probs, multi_class="ovr", average="macro")
    except ValueError:
        roc_auc = None

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "roc_auc": float(roc_auc) if roc_auc is not None else None,
        "confusion_matrix": cm.tolist(),
        "class_names": class_names,
    }


def save_confusion_matrix(cm, class_names, output_path: str | Path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(8, 7))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha="right")
    ax.set_yticklabels(class_names)
    ax.set_xlabel("Predicted label")
    ax.set_ylabel("True label")
    fig.colorbar(im, ax=ax)
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="white" if cm[i, j] > cm.max() / 2 else "black")
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def get_training_device():
    if torch.backends.mps.is_available():
        print("Training device: Apple MPS")
        return torch.device("mps")
    if torch.cuda.is_available():
        print("Training device: CUDA")
        return torch.device("cuda")
    print("Training device: CPU")
    return torch.device("cpu")


def run_training_pipeline():
    cfg = TrainingConfig()
    os.makedirs(cfg.checkpoint_dir, exist_ok=True)

    class_names = cfg.classes
    class_to_idx = cfg.class_to_idx
    device = get_training_device()

    train_loader, val_loader, test_loader, counts = build_data_loaders(
        train_dir=cfg.train_dir,
        test_dir=cfg.test_dir,
        class_names=class_names,
        image_size=cfg.image_size,
        batch_size=cfg.batch_size,
        num_workers=cfg.num_workers,
        validation_fraction=cfg.validation_fraction,
        random_state=cfg.random_seed,
    )

    torch.manual_seed(cfg.random_seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(cfg.random_seed)

    model = NeuroVisionClassifier(architecture="efficientnet_b0", num_classes=len(class_names))
    model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=cfg.label_smoothing)
    optimizer = AdamW(model.parameters(), lr=cfg.learning_rate, weight_decay=cfg.weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=cfg.epochs)

    best_val_loss = float("inf")
    best_val_acc = 0.0
    best_epoch = 0
    best_state = None
    patience = 0
    history = []

    for epoch in range(cfg.epochs):
        model.train()
        running_loss = 0.0
        train_preds = []
        train_targets = []

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            train_preds.extend(logits.argmax(dim=1).cpu().tolist())
            train_targets.extend(labels.cpu().tolist())

        train_loss = running_loss / len(train_loader.dataset)
        train_acc = accuracy_score(train_targets, train_preds)

        model.eval()
        val_loss = 0.0
        val_preds = []
        val_targets = []
        with torch.inference_mode():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                logits = model(images)
                loss = criterion(logits, labels)
                val_loss += loss.item() * images.size(0)
                val_preds.extend(logits.argmax(dim=1).cpu().tolist())
                val_targets.extend(labels.cpu().tolist())

        val_loss /= len(val_loader.dataset)
        val_acc = accuracy_score(val_targets, val_preds)
        current_lr = optimizer.param_groups[0]["lr"]
        scheduler.step()

        history.append(
            {
                "epoch": epoch + 1,
                "train_loss": float(train_loss),
                "train_accuracy": float(train_acc),
                "val_loss": float(val_loss),
                "val_accuracy": float(val_acc),
                "learning_rate": float(current_lr),
            }
        )

        if val_loss < best_val_loss - cfg.min_delta:
            best_val_loss = val_loss
            best_val_acc = val_acc
            best_epoch = epoch + 1
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            patience = 0
        else:
            patience += 1

        print(
            f"Epoch {epoch + 1}/{cfg.epochs} | train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} lr={current_lr:.6f}"
        )

        if patience >= cfg.early_stopping_patience:
            print(f"Early stopping triggered at epoch {epoch + 1}")
            break

    if best_state is None:
        best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

    model.load_state_dict(best_state)
    metrics = evaluate_model(model, test_loader, class_names, device)

    checkpoint_payload = {
        "model_state_dict": best_state,
        "class_names": class_names,
        "class_to_idx": class_to_idx,
        "num_classes": len(class_names),
        "architecture": "efficientnet_b0",
        "image_size": list(cfg.image_size),
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "random_seed": cfg.random_seed,
        "training_config": {
            "batch_size": cfg.batch_size,
            "learning_rate": cfg.learning_rate,
            "optimizer": cfg.optimizer,
            "scheduler": cfg.scheduler,
            "epochs": cfg.epochs,
            "early_stopping_patience": cfg.early_stopping_patience,
            "weight_decay": cfg.weight_decay,
            "label_smoothing": cfg.label_smoothing,
        },
        "dataset": {
            "train_dir": cfg.train_dir,
            "test_dir": cfg.test_dir,
            "validation_fraction": cfg.validation_fraction,
            "train_count": counts["train"],
            "validation_count": counts["validation"],
            "test_count": counts["test"],
        },
        "best_epoch": best_epoch,
        "best_validation_loss": float(best_val_loss),
        "best_validation_accuracy": float(best_val_acc),
    }
    torch.save(checkpoint_payload, cfg.checkpoint_path)

    metadata = {
        "architecture": "efficientnet_b0",
        "class_names": class_names,
        "class_to_idx": class_to_idx,
        "image_size": [cfg.image_size[0], cfg.image_size[1]],
        "preprocessing": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
            "resize": list(cfg.image_size),
        },
        "training_config": {
            "batch_size": cfg.batch_size,
            "learning_rate": cfg.learning_rate,
            "weight_decay": cfg.weight_decay,
            "optimizer": cfg.optimizer,
            "scheduler": cfg.scheduler,
            "epochs": cfg.epochs,
            "early_stopping_patience": cfg.early_stopping_patience,
            "label_smoothing": cfg.label_smoothing,
            "random_seed": cfg.random_seed,
        },
        "dataset": {
            "train_dir": cfg.train_dir,
            "test_dir": cfg.test_dir,
            "validation_fraction": cfg.validation_fraction,
            "train_count": counts["train"],
            "validation_count": counts["validation"],
            "test_count": counts["test"],
        },
        "random_seed": cfg.random_seed,
        "best_epoch": best_epoch,
        "best_validation_loss": float(best_val_loss),
        "best_validation_accuracy": float(best_val_acc),
    }

    with open(Path(cfg.checkpoint_dir) / "neurovision_efficientnet_b0_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(Path(cfg.checkpoint_dir) / "neurovision_efficientnet_b0_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    with open(Path(cfg.checkpoint_dir) / "neurovision_efficientnet_b0_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    save_class_mapping(class_names, class_to_idx, Path(cfg.checkpoint_dir) / "class_mapping.json")
    save_confusion_matrix(np.asarray(metrics["confusion_matrix"]), class_names, Path(cfg.checkpoint_dir) / "neurovision_efficientnet_b0_confusion_matrix.png")

    print("\n=== BEST MODEL SUMMARY ===")
    print(f"Best epoch: {best_epoch}")
    print(f"Best validation loss: {best_val_loss:.6f}")
    print(f"Best validation accuracy: {best_val_acc:.6f}")
    print(f"Test accuracy: {metrics['accuracy']:.6f}")
    print(f"Test precision: {metrics['precision']:.6f}")
    print(f"Test recall: {metrics['recall']:.6f}")
    print(f"Test F1: {metrics['f1_score']:.6f}")
    print(f"Test ROC-AUC: {metrics['roc_auc']:.6f}" if metrics["roc_auc"] is not None else "Test ROC-AUC: not available")
    print(f"Checkpoint: {cfg.checkpoint_path}")
    print(f"Metrics JSON: {Path(cfg.checkpoint_dir) / 'neurovision_efficientnet_b0_metrics.json'}")
    print(f"Confusion matrix: {Path(cfg.checkpoint_dir) / 'neurovision_efficientnet_b0_confusion_matrix.png'}")
    print(f"History JSON: {Path(cfg.checkpoint_dir) / 'neurovision_efficientnet_b0_history.json'}")

    return model, history, metrics


if __name__ == "__main__":
    run_training_pipeline()
