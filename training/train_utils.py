"""
training/train_utils.py
Utilities for hardware detection, seed reproducibility, checkpoint saving,
metrics tracking, and plotting training progression curves.
"""

import random
from pathlib import Path
from datetime import datetime
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import matplotlib.pyplot as plt


def set_seed(seed: int = 42) -> None:
    """
    Sets deterministic random seeds across Python, NumPy, and PyTorch.
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    print(f"[REPRODUCIBILITY] Random seed set to: {seed}")


def get_device(auto: bool = True) -> torch.device:
    """
    Detects and returns the compute device (NVIDIA CUDA, Apple MPS, or CPU).
    Prints hardware specifications.
    """
    if auto and torch.cuda.is_available():
        device = torch.device("cuda")
        gpu_name = torch.cuda.get_device_name(0)
        gpu_count = torch.cuda.device_count()
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"\n[DEVICE DETECTED] GPU: NVIDIA {gpu_name} ({gpu_count} device(s), {vram_gb:.1f} GB VRAM)")
    elif auto and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("\n[DEVICE DETECTED] Apple Silicon MPS acceleration enabled.")
    else:
        device = torch.device("cpu")
        print("\n[DEVICE DETECTED] Running on CPU.")
    return device


def generate_model_version(architecture: str, num_classes: int) -> str:
    """
    Generates a structured model version string:
    e.g. efficientnet_b0-67c-2026-09-04
    """
    date_str = datetime.now().strftime("%Y-%m-%d")
    clean_arch = architecture.lower().replace("-", "_")
    return f"{clean_arch}-{num_classes}c-{date_str}"


def save_checkpoint(
    path: str,
    model: nn.Module,
    class_names: list,
    class_to_idx: dict,
    architecture: str,
    input_size: int,
    training_config: dict,
    epoch: int,
    val_accuracy: float,
    val_loss: float,
    model_version: Optional[str] = None
) -> None:
    """
    Saves a comprehensive, self-contained model checkpoint.
    Includes weights, class mappings, input size, normalization, and config
    so downstream deployment never depends on external state.
    """
    if model_version is None:
        model_version = generate_model_version(architecture, len(class_names))

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "class_to_index": class_to_idx,
        "architecture": architecture,
        "input_size": input_size,
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "training_config": training_config,
        "epoch": epoch,
        "validation_accuracy": float(val_accuracy),
        "validation_loss": float(val_loss),
        "model_version": model_version,
        "saved_at": datetime.now().isoformat()
    }

    target_path = Path(path)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(checkpoint, target_path)
    print(f"[CHECKPOINT] Saved complete model checkpoint to: {target_path} (Val Acc: {val_accuracy:.2f}%)")


def plot_training_curves(history: dict, output_path: str) -> None:
    """
    Generates clean, readable training loss and accuracy progression curves.
    """
    epochs = history.get("epochs", [])
    if not epochs:
        return

    train_loss = history.get("train_loss", [])
    val_loss = history.get("val_loss", [])
    train_acc = history.get("train_acc", [])
    val_acc = history.get("val_acc", [])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    # Loss plot
    ax1.plot(epochs, train_loss, 'o-', color='#1f77b4', label='Train Loss', linewidth=2)
    ax1.plot(epochs, val_loss, 's--', color='#ff7f0e', label='Validation Loss', linewidth=2)
    ax1.set_title('Cross-Entropy Loss Progression', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Epoch', fontsize=11)
    ax1.set_ylabel('Loss', fontsize=11)
    ax1.grid(True, linestyle=':', alpha=0.6)
    ax1.legend(loc='upper right', frameon=True)

    # Accuracy plot
    ax2.plot(epochs, train_acc, 'o-', color='#2ca02c', label='Train Top-1 Acc', linewidth=2)
    ax2.plot(epochs, val_acc, 's--', color='#d62728', label='Validation Top-1 Acc', linewidth=2)
    ax2.set_title('Top-1 Accuracy (%) Progression', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Epoch', fontsize=11)
    ax2.set_ylabel('Accuracy (%)', fontsize=11)
    ax2.grid(True, linestyle=':', alpha=0.6)
    ax2.legend(loc='lower right', frameon=True)

    plt.tight_layout()
    target_path = Path(output_path)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(target_path, dpi=200)
    plt.close()
    print(f"[PLOT] Training curves saved to: {target_path}")
