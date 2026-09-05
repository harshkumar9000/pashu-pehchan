"""
predict.py
Command-line inference tool for cattle & buffalo breed identification.
Supports both human-readable terminal output and structured JSON output.
"""

import sys
import json
import argparse
from pathlib import Path
from inference.predictor import predict_image

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(
        description="Identify cattle and buffalo breeds from an image."
    )
    parser.add_argument(
        "--image", "-i", type=str, required=True,
        help="Path to the input animal photograph"
    )
    parser.add_argument(
        "--model", "-m", type=str, default="./artifacts/best_model.pth",
        help="Path to model checkpoint (.pth)"
    )
    parser.add_argument(
        "--top-k", "-k", type=int, default=3,
        help="Number of top suggested breeds (default: 3)"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Output raw JSON instead of formatted text"
    )
    parser.add_argument(
        "--device", type=str, default=None,
        help="Execution device ('cpu', 'cuda', or auto if omitted)"
    )
    args = parser.parse_args()

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"[ERROR] Image file does not exist: {image_path}", file=sys.stderr)
        sys.exit(1)

    try:
        result = predict_image(
            image_path=image_path,
            model_path=args.model,
            device=args.device,
            top_k=args.top_k
        )
    except Exception as e:
        print(f"[ERROR] Inference failed: {e}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        # Output clean JSON
        output_data = {
            "image": str(image_path),
            **result
        }
        print(json.dumps(output_data, indent=2))
    else:
        # Human-readable formatted text
        predictions = result.get("predictions", [])
        top_pred = predictions[0] if predictions else {"breed": "None", "confidence": 0.0}

        print("\n==========================================================")
        print("CATTLE & BUFFALO BREED IDENTIFICATION")
        print("==========================================================")
        print(f"Image         : {image_path}")
        print(f"Top prediction: {top_pred['breed']}")
        print(f"Confidence    : {top_pred['confidence'] * 100:.2f}%")
        print("\nTop 3 Suggestions:")
        for idx, pred in enumerate(predictions, start=1):
            print(f"  {idx}. {pred['breed']:<25} -> {pred['confidence'] * 100:>6.2f}%")

        print(f"\nConfidence level:")
        print(f"  {result.get('confidence_level')}")
        print(f"Recommendation:")
        print(f"  {result.get('recommendation')}")

        print(f"\nModel:")
        print(f"  {result.get('architecture').upper()}")
        print(f"Model version:")
        print(f"  {result.get('model_version')}")
        print("==========================================================\n")


if __name__ == "__main__":
    main()
