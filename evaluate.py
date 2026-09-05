"""
evaluate.py
Standalone evaluation script for evaluating trained checkpoints on
benchmark test data or independent external field test sets.
"""

import sys
import warnings
import argparse
from pathlib import Path
import torch
from torch.utils.data import DataLoader
from torchvision import datasets

from training.dataset import get_validation_transforms
from training.model import build_model
from training.train_utils import get_device
from training.evaluate import evaluate_model

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

warnings.filterwarnings("ignore", category=UserWarning, module="PIL")


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate a trained cattle & buffalo breed model checkpoint."
    )
    parser.add_argument(
        "--model", "-m", type=str, default="./artifacts/best_model.pth",
        help="Path to trained model checkpoint (.pth)"
    )
    parser.add_argument(
        "--data-dir", "-d", type=str, default="./data",
        help="Root data directory containing split folders"
    )
    parser.add_argument(
        "--split", "-s", type=str, default="test",
        help="Dataset split to evaluate ('test', 'val', or 'external_test')"
    )
    parser.add_argument(
        "--artifacts-dir", "-a", type=str, default="./artifacts",
        help="Directory to save evaluation reports and plots"
    )
    parser.add_argument(
        "--batch-size", "-b", type=int, default=32,
        help="Batch size for evaluation"
    )
    parser.add_argument(
        "--top-k", "-k", type=int, default=3,
        help="Calculate Top-K accuracy (default: 3)"
    )
    parser.add_argument(
        "--device", type=str, default=None,
        help="Execution device ('cpu', 'cuda', or auto if omitted)"
    )
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(f"[ERROR] Checkpoint file does not exist: {model_path}", file=sys.stderr)
        sys.exit(1)

    eval_dir = Path(args.data_dir) / args.split
    if not eval_dir.exists():
        print(f"[ERROR] Evaluation directory does not exist: {eval_dir}", file=sys.stderr)
        sys.exit(1)

    # Device
    if args.device:
        device = torch.device(args.device)
    else:
        device = get_device(auto=True)

    print(f"\n=======================================================")
    print(f"EVALUATING MODEL CHECKPOINT: {model_path.name}")
    print(f"Target Directory           : {eval_dir}")
    print(f"Split Name                 : {args.split.upper()}")
    print(f"Device                     : {device}")
    print(f"=======================================================")

    # Load Checkpoint
    checkpoint = torch.load(str(model_path), map_location=device)
    class_names = checkpoint.get("class_names", [])
    architecture = checkpoint.get("architecture", "efficientnet_b0")
    input_size = checkpoint.get("input_size", 224)

    if not class_names:
        print(f"[ERROR] Checkpoint missing 'class_names' attribute.", file=sys.stderr)
        sys.exit(1)

    # Build Model and Load Weights
    model = build_model(
        architecture=architecture,
        num_classes=len(class_names),
        pretrained=False
    ).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Create Dataset & DataLoader
    eval_transform = get_validation_transforms(image_size=input_size)
    eval_dataset = datasets.ImageFolder(root=str(eval_dir), transform=eval_transform)
    eval_loader = DataLoader(
        eval_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0
    )

    print(f"[INFO] Loaded {len(eval_dataset)} images across {len(eval_dataset.classes)} folders.")

    # Check if classes match checkpoint
    if eval_dataset.classes != class_names:
        print(f"[WARNING] Dataset classes in {args.split} differ from model training classes!")
        print(f"  Model classes count  : {len(class_names)}")
        print(f"  Directory folders    : {len(eval_dataset.classes)}")

    # Run Evaluation
    results = evaluate_model(
        model=model,
        dataloader=eval_loader,
        class_names=class_names,
        device=device,
        top_k=args.top_k,
        artifacts_dir=args.artifacts_dir,
        split_name=args.split,
        save_artifacts=True
    )

    print(f"[SUCCESS] Standalone evaluation complete.")


if __name__ == "__main__":
    main()
