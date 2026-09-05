"""
inference/adapter.py
Clean Model Adapter abstractions decoupling PyTorch implementation
from downstream web APIs (e.g. FastAPI, Flask, CLI).
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Union, Dict, Any, Optional, Tuple
from PIL import Image
import torch
from torchvision import transforms

from training.model import build_model


class BaseModelAdapter(ABC):
    """
    Abstract Model Adapter interface.
    Allows web applications to query predictions without knowing internal model details.
    """

    @abstractmethod
    def predict(self, image: Union[str, Path, Image.Image], top_k: int = 3) -> Dict[str, Any]:
        """
        Runs inference on an input image and returns structured prediction results.
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Returns metadata about the active model (architecture, version, classes).
        """
        pass


class EfficientNetModelAdapter(BaseModelAdapter):
    """
    Concrete adapter for EfficientNet (and compatible backbones) cattle breed classifiers.
    Handles checkpoint loading, deterministic preprocessing, top-k softmax extraction,
    and confidence tier calibration.
    """

    def __init__(
        self,
        checkpoint_path: str = "./artifacts/best_model.pth",
        device: Optional[str] = None,
        high_threshold: float = 0.75,
        medium_threshold: float = 0.45,
        unknown_cutoff: float = 0.20
    ):
        self.checkpoint_path = Path(checkpoint_path)
        self.high_threshold = high_threshold
        self.medium_threshold = medium_threshold
        self.unknown_cutoff = unknown_cutoff

        # Setup compute device
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.model = None
        self.class_names = []
        self.class_to_index = {}
        self.architecture = "efficientnet_b0"
        self.model_version = "unknown"
        self.input_size = 224
        self.normalization = {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]}

        self._load_model()
        self._setup_transform()

    def _load_model(self) -> None:
        """Loads model weights and metadata from checkpoint."""
        if not self.checkpoint_path.exists():
            raise FileNotFoundError(f"Model checkpoint not found at: {self.checkpoint_path}")

        checkpoint = torch.load(str(self.checkpoint_path), map_location=self.device)

        self.class_names = checkpoint.get("class_names", [])
        self.class_to_index = checkpoint.get("class_to_index", {})
        self.architecture = checkpoint.get("architecture", "efficientnet_b0")
        self.model_version = checkpoint.get("model_version", f"{self.architecture}-custom")
        self.input_size = checkpoint.get("input_size", 224)
        self.normalization = checkpoint.get("normalization", {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        })

        num_classes = len(self.class_names)
        if num_classes == 0:
            raise ValueError("Checkpoint does not contain valid 'class_names' mapping.")

        # Reconstruct model architecture
        self.model = build_model(
            architecture=self.architecture,
            num_classes=num_classes,
            pretrained=False
        )
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

    def _setup_transform(self) -> None:
        """Sets up deterministic evaluation transforms matching training."""
        resize_dim = int(self.input_size * 1.143)
        self.transform = transforms.Compose([
            transforms.Resize(resize_dim),
            transforms.CenterCrop(self.input_size),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=self.normalization["mean"],
                std=self.normalization["std"]
            )
        ])

    def _determine_confidence_level(self, top_confidence: float) -> Tuple[str, str]:
        """
        Determines the confidence tier and field recommendation.
        Never claims calibrated probability; explicitly indicates model confidence.
        """
        if top_confidence < self.unknown_cutoff:
            return "UNKNOWN", "Low confidence / unidentifiable breed - manual verification required."
        elif top_confidence < self.medium_threshold:
            return "LOW", "Low confidence - manual verification recommended."
        elif top_confidence < self.high_threshold:
            return "MEDIUM", "Moderate confidence - verify before recording."
        else:
            return "HIGH", "High model confidence - human verification still required."

    def predict(self, image: Union[str, Path, Image.Image], top_k: int = 3) -> Dict[str, Any]:
        """
        Infers breed predictions from an image file or PIL Image object.
        Returns Top-K predictions sorted descending by model confidence.
        """
        if isinstance(image, (str, Path)):
            img_path = Path(image)
            if not img_path.exists():
                raise FileNotFoundError(f"Image not found at: {img_path}")
            pil_image = Image.open(img_path).convert("RGB")
        elif isinstance(image, Image.Image):
            pil_image = image.convert("RGB")
        else:
            raise TypeError(f"Expected image path or PIL.Image, got {type(image)}")

        # Transform and batch
        tensor = self.transform(pil_image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1).squeeze(0)

        # Get top-k predictions
        k = min(top_k, len(self.class_names))
        top_probs, top_indices = torch.topk(probs, k=k)

        top_probs = top_probs.cpu().tolist()
        top_indices = top_indices.cpu().tolist()

        predictions = []
        for prob, idx in zip(top_probs, top_indices):
            predictions.append({
                "breed": self.class_names[idx],
                "confidence": round(float(prob), 4)
            })

        top_confidence = predictions[0]["confidence"] if predictions else 0.0
        confidence_level, recommendation = self._determine_confidence_level(top_confidence)

        return {
            "predictions": predictions,
            "confidence_level": confidence_level,
            "recommendation": recommendation,
            "model_version": self.model_version,
            "architecture": self.architecture,
            "device": str(self.device)
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Returns metadata about the active model."""
        return {
            "architecture": self.architecture,
            "model_version": self.model_version,
            "num_classes": len(self.class_names),
            "input_size": self.input_size,
            "class_names": self.class_names,
            "checkpoint_path": str(self.checkpoint_path),
            "device": str(self.device),
            "thresholds": {
                "high": self.high_threshold,
                "medium": self.medium_threshold,
                "unknown_cutoff": self.unknown_cutoff
            }
        }
