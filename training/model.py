"""
training/model.py
Transfer learning model architectures with configurable backbones
(EfficientNet-B0 default, MobileNetV3-Large, EfficientNet-B1),
head replacement, and backbone freeze/unfreeze utilities for two-stage training.
"""

from typing import Tuple
import torch.nn as nn
from torchvision import models


SUPPORTED_ARCHITECTURES = {
    "efficientnet_b0": {
        "model_fn": models.efficientnet_b0,
        "weights": models.EfficientNet_B0_Weights.DEFAULT,
        "classifier_attr": "classifier",
        "in_features_idx": 1  # classifier[1] is Linear
    },
    "efficientnet_b1": {
        "model_fn": models.efficientnet_b1,
        "weights": models.EfficientNet_B1_Weights.DEFAULT,
        "classifier_attr": "classifier",
        "in_features_idx": 1
    },
    "mobilenet_v3_large": {
        "model_fn": models.mobilenet_v3_large,
        "weights": models.MobileNet_V3_Large_Weights.DEFAULT,
        "classifier_attr": "classifier",
        "in_features_idx": 3  # classifier[3] is Linear
    }
}


def build_model(
    architecture: str = "efficientnet_b0",
    num_classes: int = 67,
    pretrained: bool = True,
    dropout: float = 0.3
) -> nn.Module:
    """
    Builds a vision model with pretrained ImageNet weights, replacing the final
    classification head with a custom head for the target number of breed classes.
    """
    arch_lower = architecture.lower()
    if arch_lower not in SUPPORTED_ARCHITECTURES:
        raise ValueError(
            f"Unsupported architecture: {architecture}. "
            f"Supported options: {list(SUPPORTED_ARCHITECTURES.keys())}"
        )

    arch_info = SUPPORTED_ARCHITECTURES[arch_lower]
    weights = arch_info["weights"] if pretrained else None
    model = arch_info["model_fn"](weights=weights)

    # Replace classifier head
    if arch_lower.startswith("efficientnet"):
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=dropout, inplace=True),
            nn.Linear(in_features, num_classes)
        )
    elif arch_lower == "mobilenet_v3_large":
        in_features = model.classifier[3].in_features
        # Replace the final linear layer
        model.classifier[2] = nn.Dropout(p=dropout)
        model.classifier[3] = nn.Linear(in_features, num_classes)

    # Attach architecture metadata to model
    model.architecture_name = arch_lower
    model.num_classes = num_classes

    return model


def freeze_backbone(model: nn.Module) -> None:
    """
    Stage 1: Freezes all backbone parameters so only the classification head
    is trained.
    """
    arch = getattr(model, "architecture_name", "efficientnet_b0")
    
    # First freeze all parameters
    for param in model.parameters():
        param.requires_grad = False

    # Unfreeze only the classifier head
    if hasattr(model, "classifier"):
        for param in model.classifier.parameters():
            param.requires_grad = True

    trainable_params, total_params = get_parameter_counts(model)
    print(f"[STAGE 1 - FREEZE BACKBONE] Backbone frozen. "
          f"Trainable parameters: {trainable_params:,} / {total_params:,} "
          f"({100 * trainable_params / total_params:.2f}%)")


def unfreeze_backbone(model: nn.Module) -> None:
    """
    Stage 2: Unfreezes all parameters across the entire network for full fine-tuning.
    """
    for param in model.parameters():
        param.requires_grad = True

    trainable_params, total_params = get_parameter_counts(model)
    print(f"[STAGE 2 - UNFREEZE BACKBONE] Entire network unfrozen. "
          f"Trainable parameters: {trainable_params:,} / {total_params:,} (100.0%)")


def get_parameter_counts(model: nn.Module) -> Tuple[int, int]:
    """
    Returns (trainable_parameters, total_parameters).
    """
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    return trainable, total
