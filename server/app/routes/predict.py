"""
server/app/routes/predict.py
Inference endpoint for cattle and buffalo breed identification.
Accepts an image upload and executes the local trained PyTorch vision model.
"""

import io
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from PIL import Image

from server.app.schemas.schemas import PredictResponse
from server.app.services.inference.predictor import get_inference_service
from server.app.database.database import insert_analysis_history

router = APIRouter(prefix="/api", tags=["Inference"])

MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "application/octet-stream"
}

@router.post("/predict", response_model=PredictResponse)
async def predict_breed(
    image: UploadFile = File(..., description="Cattle or Buffalo photo for breed classification")
):
    """
    Run breed classification on the uploaded image.
    Uses trained EfficientNet-B0 (41 bovine classes).
    Returns top-3 predictions with confidence scores and verification recommendations.
    """
    # 1. Content type check
    if image.content_type and image.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {image.content_type}. Please upload a JPEG, PNG, or WebP image."
        )

    # 2. Read image content
    try:
        contents = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds maximum size limit of 15MB.")

    # 3. Open with PIL and validate integrity
    try:
        pil_image = Image.open(io.BytesIO(contents))
        pil_image.verify()  # Validate image headers
        # Re-open after verify (verify consumes the buffer)
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Corrupted or invalid image file: {str(e)}"
        )

    # 4. Execute inference
    try:
        predictor = get_inference_service()
        result = predictor.predict(pil_image, top_k=3)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference execution failed: {str(e)}"
        )

    # 5. Log prediction into audit table
    try:
        top_pred = result.get("top_prediction", {})
        insert_analysis_history(
            image_filename=image.filename or "upload.jpg",
            predicted_breed=top_pred.get("breed", "Unknown"),
            predicted_confidence=top_pred.get("confidence", 0.0),
            animal_type=result.get("animal_type", "Cattle"),
            confidence_level=result.get("confidence_level", "LOW"),
            inference_time_ms=result.get("inference_time_ms", 0.0),
            model_version=result.get("model_version", "efficientnet_b0-41c")
        )
    except Exception as log_err:
        print(f"[WARNING] Failed to log analysis history: {log_err}")

    return PredictResponse(**result)

@router.get("/sample/{breed_name}")
def get_sample_image(breed_name: str):
    """
    Returns a sample evaluation image for the requested breed from available sample assets or test dataset.
    """
    norm_breed = breed_name.strip().lower().replace(" ", "").replace("_", "")
    # Check direct sample files first
    sample_dirs = [Path("data/sample_images"), Path("frontend/public/samples")]
    for s_dir in sample_dirs:
        if s_dir.exists():
            for f in s_dir.glob("*.*"):
                stem = f.stem.lower().replace(" ", "").replace("_", "")
                if stem == norm_breed or stem in norm_breed or norm_breed in stem:
                    return FileResponse(str(f))

    # Check test dataset directory
    test_dir = Path("data/test")
    if test_dir.exists():
        target_dir = test_dir / breed_name
        if not target_dir.exists() or not target_dir.is_dir():
            matches = [d for d in test_dir.iterdir() if d.is_dir() and d.name.lower().replace("_", "") == norm_breed]
            if matches:
                target_dir = matches[0]
            else:
                target_dir = None

        if target_dir and target_dir.exists():
            images = list(target_dir.glob("*.jpg")) + list(target_dir.glob("*.png")) + list(target_dir.glob("*.j*pg"))
            if images:
                return FileResponse(str(images[0]))

    raise HTTPException(status_code=404, detail=f"No sample images available for breed: {breed_name}")

