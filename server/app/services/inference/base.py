"""
server/app/services/inference/base.py
Abstract base predictor contract defining the inference API.
Decouples frontend and FastAPI routes from specific ML framework implementations.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Union
from pathlib import Path
from PIL import Image

class BasePredictor(ABC):
    """
    Abstract predictor contract.
    Both TrainedModelPredictor and MockPredictor implement this interface.
    """

    @abstractmethod
    def predict(self, image: Union[str, Path, Image.Image], top_k: int = 3) -> Dict[str, Any]:
        """
        Runs breed classification on an image.
        Returns dictionary with predictions, confidence_level, model_version, animal_type, and inference_time_ms.
        """
        pass

    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """
        Returns runtime metadata about the model (architecture, version, classes count, device).
        """
        pass
