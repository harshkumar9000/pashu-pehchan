"""
inference/predictor.py
High-level, reusable inference API for direct import by FastAPI or other backend services.
Provides cached model loading to prevent redundant disk I/O on repeated calls.
"""

from pathlib import Path
from typing import Union, Dict, Any, Optional
from PIL import Image

from .adapter import EfficientNetModelAdapter, BaseModelAdapter

# Global cache for model adapter instance
_CACHED_ADAPTER: Optional[BaseModelAdapter] = None
_CACHED_MODEL_PATH: Optional[str] = None


def get_predictor(
    model_path: str = "./artifacts/best_model.pth",
    device: Optional[str] = None,
    force_reload: bool = False
) -> BaseModelAdapter:
    """
    Returns a cached instance of the model adapter.
    Reloads only if force_reload=True or model_path changes.
    """
    global _CACHED_ADAPTER, _CACHED_MODEL_PATH
    norm_path = str(Path(model_path).resolve())

    if _CACHED_ADAPTER is None or _CACHED_MODEL_PATH != norm_path or force_reload:
        _CACHED_ADAPTER = EfficientNetModelAdapter(checkpoint_path=model_path, device=device)
        _CACHED_MODEL_PATH = norm_path

    return _CACHED_ADAPTER


def predict_image(
    image_path: Union[str, Path],
    model_path: str = "./artifacts/best_model.pth",
    device: Optional[str] = None,
    top_k: int = 3
) -> Dict[str, Any]:
    """
    Inference from a file path.
    Example:
        result = predict_image("path/to/cattle.jpg")
    """
    predictor = get_predictor(model_path=model_path, device=device)
    return predictor.predict(image_path, top_k=top_k)


def predict_pil_image(
    image: Image.Image,
    model_path: str = "./artifacts/best_model.pth",
    device: Optional[str] = None,
    top_k: int = 3
) -> Dict[str, Any]:
    """
    Inference directly from a PIL Image instance.
    Ideal for FastAPI file upload routes:
    
    ```python
    from fastapi import FastAPI, UploadFile, File
    from PIL import Image
    import io
    from inference.predictor import predict_pil_image

    app = FastAPI()

    @app.post("/api/predict")
    async def predict_breed(file: UploadFile = File(...)):
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents))
        return predict_pil_image(pil_img)
    ```
    """
    predictor = get_predictor(model_path=model_path, device=device)
    return predictor.predict(image, top_k=top_k)
