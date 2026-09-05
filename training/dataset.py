"""
training/dataset.py
Dataset loaders, field-realistic augmentations, dynamic class detection,
and class imbalance weighting for cattle & buffalo breed classification.
"""

from pathlib import Path
from typing import Tuple, List, Dict, Optional
import warnings
import numpy as np
import torch
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms

# Suppress harmless PIL transparency palette byte warning
warnings.filterwarnings("ignore", category=UserWarning, module="PIL")

# Standard ImageNet normalization statistics
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_training_transforms(image_size: int = 224) -> transforms.Compose:
    """
    Returns realistic field augmentations for livestock photography.
    Simulates variations in camera angle, distance, lighting, and pose
    without unrealistic distortions.
    """
    return transforms.Compose([
        transforms.RandomResizedCrop(
            size=image_size,
            scale=(0.8, 1.0),
            ratio=(0.85, 1.15)
        ),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(
            brightness=0.2,
            contrast=0.2,
            saturation=0.2,
            hue=0.05
        ),
        transforms.RandomAffine(
            degrees=0,
            translate=(0.05, 0.05)
        ),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])


def get_validation_transforms(image_size: int = 224) -> transforms.Compose:
    """
    Returns strictly deterministic transforms for validation and testing.
    Resizes to slightly larger dimension before center-cropping.
    """
    resize_dim = int(image_size * 1.143)  # 256 for 224
    return transforms.Compose([
        transforms.Resize(resize_dim),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])


def compute_class_weights(dataset: datasets.ImageFolder) -> torch.Tensor:
    """
    Computes inverse-frequency class weights for CrossEntropyLoss:
    w_c = N / (C * N_c)
    Normalized so that the average weight is 1.0.
    """
    targets = [s[1] for s in dataset.samples]
    class_counts = np.bincount(targets, minlength=len(dataset.classes))
    total_samples = len(targets)
    num_classes = len(dataset.classes)

    # Avoid zero division if any empty class exists
    class_counts = np.maximum(class_counts, 1)

    weights = total_samples / (num_classes * class_counts)
    weights = weights / np.mean(weights)  # Normalize mean to 1.0
    return torch.tensor(weights, dtype=torch.float)


def compute_sampler_weights(dataset: datasets.ImageFolder) -> torch.DoubleTensor:
    """
    Computes per-sample weights for WeightedRandomSampler.
    """
    targets = [s[1] for s in dataset.samples]
    class_counts = np.bincount(targets, minlength=len(dataset.classes))
    class_counts = np.maximum(class_counts, 1)
    class_weights = 1.0 / class_counts
    sample_weights = [class_weights[t] for t in targets]
    return torch.DoubleTensor(sample_weights)


def print_dataset_statistics(
    train_dataset: datasets.ImageFolder,
    val_dataset: Optional[datasets.ImageFolder] = None,
    test_dataset: Optional[datasets.ImageFolder] = None
):
    """
    Prints comprehensive dataset statistics including class distribution
    and imbalance ratios.
    """
    print("\n=======================================================")
    print("DATASET CLASS DISTRIBUTION & IMBALANCE STATISTICS")
    print("=======================================================")
    
    classes = train_dataset.classes
    num_classes = len(classes)
    train_counts = np.bincount([s[1] for s in train_dataset.samples], minlength=num_classes)
    
    print(f"Total Detected Classes : {num_classes}")
    print(f"Training Images Count  : {len(train_dataset)}")
    if val_dataset is not None:
        print(f"Validation Images Count: {len(val_dataset)}")
    if test_dataset is not None:
        print(f"Test Images Count      : {len(test_dataset)}")

    min_c = int(np.min(train_counts))
    max_c = int(np.max(train_counts))
    mean_c = float(np.mean(train_counts))
    imbalance_ratio = max_c / max(1, min_c)

    print(f"\nTraining Class Imbalance Analysis:")
    print(f"  Min images in a class: {min_c}")
    print(f"  Max images in a class: {max_c}")
    print(f"  Mean images per class: {mean_c:.1f}")
    print(f"  Imbalance Ratio      : {imbalance_ratio:.2f}x (Max/Min)")

    # Display 5 most frequent and 5 least frequent classes
    sorted_indices = np.argsort(train_counts)
    print("\n  Top 5 Most Represented Classes:")
    for idx in reversed(sorted_indices[-5:]):
        print(f"    - {classes[idx]}: {train_counts[idx]} images")

    print("\n  Top 5 Least Represented Classes:")
    for idx in sorted_indices[:5]:
        print(f"    - {classes[idx]}: {train_counts[idx]} images")

    print("=======================================================\n")


def build_dataloaders(config: dict) -> Tuple[DataLoader, DataLoader, Optional[DataLoader], List[str], Dict[str, int], torch.Tensor]:
    """
    Constructs train, val, and test DataLoaders, canonical class mapping,
    and imbalance weights based on the config dictionary.
    """
    data_cfg = config.get("dataset", {})
    train_cfg = config.get("training", {})
    
    train_dir = data_cfg.get("train_dir", "./data/train")
    val_dir = data_cfg.get("val_dir", "./data/val")
    test_dir = data_cfg.get("test_dir", "./data/test")
    image_size = data_cfg.get("image_size", 224)
    batch_size = train_cfg.get("batch_size", 32)
    num_workers = data_cfg.get("num_workers", 0)
    pin_memory = data_cfg.get("pin_memory", True) if torch.cuda.is_available() else False
    imbalance_strategy = train_cfg.get("imbalance_handling", "weighted_loss")

    # Transforms
    train_transform = get_training_transforms(image_size=image_size)
    eval_transform = get_validation_transforms(image_size=image_size)

    # Datasets
    if not Path(train_dir).exists():
        raise FileNotFoundError(f"Training directory not found at: {train_dir}")
    train_dataset = datasets.ImageFolder(root=train_dir, transform=train_transform)

    val_dataset = None
    if Path(val_dir).exists():
        val_dataset = datasets.ImageFolder(root=val_dir, transform=eval_transform)

    test_dataset = None
    if Path(test_dir).exists():
        test_dataset = datasets.ImageFolder(root=test_dir, transform=eval_transform)

    class_names = train_dataset.classes
    class_to_idx = train_dataset.class_to_idx

    # Print statistics
    print_dataset_statistics(train_dataset, val_dataset, test_dataset)

    # Calculate class weights for loss
    class_weights = compute_class_weights(train_dataset)

    # Configure training sampler or shuffle
    sampler = None
    shuffle = True
    if imbalance_strategy == "sampler":
        sampler_weights = compute_sampler_weights(train_dataset)
        sampler = WeightedRandomSampler(weights=sampler_weights, num_samples=len(sampler_weights), replacement=True)
        shuffle = False
        print("[INFO] Using WeightedRandomSampler for class imbalance handling.")
    elif imbalance_strategy == "weighted_loss":
        print("[INFO] Using Weighted CrossEntropyLoss for class imbalance handling.")
    else:
        print("[INFO] Standard unweighted training enabled.")

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=pin_memory
    )

    val_loader = None
    if val_dataset is not None:
        val_loader = DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=pin_memory
        )

    test_loader = None
    if test_dataset is not None:
        test_loader = DataLoader(
            test_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=pin_memory
        )

    return train_loader, val_loader, test_loader, class_names, class_to_idx, class_weights
