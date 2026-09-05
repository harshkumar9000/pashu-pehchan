"""
server/app/services/inference/model_loader.py
Singleton model loader for loading and caching the trained PyTorch breed classification model.
Ensures the model is loaded once on application startup with automatic CPU/CUDA detection.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
import torch
import torch.nn as nn
from torchvision import transforms

from training.model import build_model

class ModelContainer:
    """
    Holds loaded model, transforms, class metadata, and execution device.
    """
    def __init__(
        self,
        model: nn.Module,
        class_names: list,
        class_to_idx: dict,
        transform: transforms.Compose,
        device: torch.device,
        metadata: Dict[str, Any]
    ):
        self.model = model
        self.class_names = class_names
        self.class_to_idx = class_to_idx
        self.transform = transform
        self.device = device
        self.metadata = metadata

_LOADED_CONTAINER: Optional[ModelContainer] = None

def get_compute_device() -> torch.device:
    """Auto-detects CUDA or CPU device."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

def load_trained_model(
    model_dir: str = "server/models",
    checkpoint_name: str = "best_model.pth",
    device: Optional[torch.device] = None
) -> ModelContainer:
    """
    Loads the trained model checkpoint and metadata into a singleton ModelContainer.
    """
    global _LOADED_CONTAINER
    if _LOADED_CONTAINER is not None:
        return _LOADED_CONTAINER

    base_path = Path(model_dir)
    ckpt_path = base_path / checkpoint_name
    
    if not ckpt_path.exists():
        # Fallback to artifacts/ if server/models not found
        alt_path = Path("artifacts") / checkpoint_name
        if alt_path.exists():
            ckpt_path = alt_path
        else:
            raise FileNotFoundError(f"Trained model checkpoint not found at: {ckpt_path}")

    if device is None:
        device = get_compute_device()

    # Load checkpoint on CPU first
    checkpoint = torch.load(str(ckpt_path), map_location="cpu")
    
    class_names = checkpoint.get("class_names", [])
    if not class_names:
        # Load from class_names.json if present
        names_file = base_path / "class_names.json"
        if names_file.exists():
            with open(names_file, "r", encoding="utf-8") as f:
                class_names = json.load(f)
        else:
            raise ValueError("Checkpoint missing class_names and class_names.json not found.")

    class_to_idx = checkpoint.get("class_to_index", {name: i for i, name in enumerate(class_names)})
    architecture = checkpoint.get("architecture", "efficientnet_b0")
    input_size = checkpoint.get("input_size", 224)
    norm = checkpoint.get("normalization", {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]})

    # Build architecture
    model = build_model(
        architecture=architecture,
        num_classes=len(class_names),
        pretrained=False
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Inference transformation pipeline
    resize_dim = int(input_size * 1.143)  # 256 for 224
    transform = transforms.Compose([
        transforms.Resize(resize_dim),
        transforms.CenterCrop(input_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=norm["mean"], std=norm["std"])
    ])

    metadata = {
        "architecture": architecture,
        "model_version": checkpoint.get("model_version", f"{architecture}-{len(class_names)}c"),
        "validation_accuracy": checkpoint.get("validation_accuracy", None),
        "validation_loss": checkpoint.get("validation_loss", None),
        "input_size": input_size,
        "normalization": norm,
        "device": str(device).upper()
    }

    print("\n=======================================================")
    print("VETRA INFERENCE SERVICE: MODEL LOADED")
    print("=======================================================")
    print(f"Model       : {architecture.upper()}")
    print(f"Version     : {metadata['model_version']}")
    print(f"Classes     : {len(class_names)}")
    print(f"Device      : {metadata['device']}")
    print("=======================================================\n")

    _LOADED_CONTAINER = ModelContainer(
        model=model,
        class_names=class_names,
        class_to_idx=class_to_idx,
        transform=transform,
        device=device,
        metadata=metadata
    )
    return _LOADED_CONTAINER

def get_loaded_model() -> ModelContainer:
    """Returns the currently loaded singleton model container."""
    global _LOADED_CONTAINER
    if _LOADED_CONTAINER is None:
        return load_trained_model()
    return _LOADED_CONTAINER
