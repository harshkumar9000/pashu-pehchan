"""
server/test_model.py
CLI test utility verifying that the real trained model loads and performs inference.
"""

import sys
import argparse
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from server.app.services.inference.predictor import TrainedModelPredictor
from server.app.services.inference.model_loader import load_trained_model

def main():
    parser = argparse.ArgumentParser(description="Test trained breed model on an image.")
    parser.add_argument("--image", "-i", type=str, default="data/test/Gir/Gir_105.jpg",
                        help="Path to test image file")
    parser.add_argument("--model-dir", type=str, default="server/models",
                        help="Directory containing best_model.pth")
    args = parser.parse_args()

    img_path = Path(args.image)
    if not img_path.exists():
        print(f"[ERROR] Image file does not exist: {img_path}")
        sys.exit(1)

    print("\n=======================================================")
    print("VETRA: MODEL SMOKE TEST")
    print("=======================================================")
    print(f"Test Image   : {img_path}")
    print(f"Model Dir    : {args.model_dir}")
    
    try:
        container = load_trained_model(model_dir=args.model_dir)
        predictor = TrainedModelPredictor(container)
        print("Model loaded : YES")
    except Exception as e:
        print(f"Model loaded : NO ({e})")
        sys.exit(1)

    result = predictor.predict(img_path, top_k=3)
    predictions = result.get("predictions", [])

    print("\nTop 3:")
    for idx, pred in enumerate(predictions, start=1):
        print(f"  {idx}. {pred['breed']:<22} -> {pred['confidence'] * 100:>6.2f}% ({pred['animal_type']})")

    print(f"\nConfidence level : {result.get('confidence_level')}")
    print(f"Animal type      : {result.get('animal_type')}")
    print(f"Inference time   : {result.get('inference_time_ms')} ms")
    print(f"Recommendation   : {result.get('recommendation')}")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
