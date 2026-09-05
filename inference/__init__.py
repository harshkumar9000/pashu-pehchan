"""
Inference package for cattle and buffalo breed classification.
"""
from .predictor import predict_image, predict_pil_image, get_predictor

__all__ = ["predict_image", "predict_pil_image", "get_predictor"]
