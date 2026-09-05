"""
prepare_splits.py
Extracts and structures cattle breed datasets into ImageFolder format:
data/
  train/<breed>/
  val/<breed>/
  test/<breed>/
  external_test/<breed>/

Supports extracting from KaggleDataset.zip with stratified train/val/test splits,
or staging independent real-world photos into data/external_test/.
"""

import zipfile
import random
import argparse
from pathlib import Path
from collections import defaultdict

def create_stratified_splits(
    zip_path: str = "KaggleDataset.zip",
    output_data_dir: str = "./data",
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
    max_images_per_class: int = None
):
    """
    Extracts KaggleDataset.zip and creates clean, stratified train/val/test splits.
    Guarantees that no images are duplicated across splits.
    """
    random.seed(seed)
    zip_file = Path(zip_path)
    if not zip_file.exists():
        print(f"[ERROR] Zip file not found at: {zip_file}")
        return

    out_dir = Path(output_data_dir)
    train_dir = out_dir / "train"
    val_dir = out_dir / "val"
    test_dir = out_dir / "test"

    print("\n==========================================================")
    print("EXTRACTING & PREPARING STRATIFIED DATASET SPLITS")
    print("==========================================================")
    print(f"Source Archive : {zip_file.name}")
    print(f"Output Target  : {out_dir}")
    print(f"Split Ratio    : Train {train_ratio*100:.0f}% / Val {val_ratio*100:.0f}% / Test {test_ratio*100:.0f}%")
    print(f"Random Seed    : {seed}")

    with zipfile.ZipFile(zip_file, "r") as z:
        # Group valid image entries by breed
        breed_images = defaultdict(list)
        for item in z.namelist():
            parts = item.split("/")
            if len(parts) >= 3 and parts[-1]:
                ext = Path(parts[-1]).suffix.lower()
                if ext in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
                    breed = parts[-2]
                    breed_images[breed].append(item)

        print(f"Detected {len(breed_images)} breed classes in archive.")
        total_extracted = 0

        for breed, items in sorted(breed_images.items()):
            # Shuffle deterministically
            random.shuffle(items)

            if max_images_per_class:
                items = items[:max_images_per_class]

            n = len(items)
            n_train = int(n * train_ratio)
            n_val = int(n * val_ratio)
            # Remaining goes to test
            n_test = n - n_train - n_val

            train_items = items[:n_train]
            val_items = items[n_train:n_train + n_val]
            test_items = items[n_train + n_val:]

            # Create target directories
            (train_dir / breed).mkdir(parents=True, exist_ok=True)
            (val_dir / breed).mkdir(parents=True, exist_ok=True)
            (test_dir / breed).mkdir(parents=True, exist_ok=True)

            for item in train_items:
                fname = Path(item).name
                with z.open(item) as src, open(train_dir / breed / fname, "wb") as dst:
                    dst.write(src.read())

            for item in val_items:
                fname = Path(item).name
                with z.open(item) as src, open(val_dir / breed / fname, "wb") as dst:
                    dst.write(src.read())

            for item in test_items:
                fname = Path(item).name
                with z.open(item) as src, open(test_dir / breed / fname, "wb") as dst:
                    dst.write(src.read())

            total_extracted += n

    # Summary
    train_count = len(list(train_dir.glob("*/*.*")))
    val_count = len(list(val_dir.glob("*/*.*")))
    test_count = len(list(test_dir.glob("*/*.*")))

    print("\n---------------- EXTRACTION SUMMARY ----------------")
    print(f"Total Images Extracted : {total_extracted}")
    print(f"Train Split Images     : {train_count}")
    print(f"Val Split Images       : {val_count}")
    print(f"Test Split Images      : {test_count}")
    print(f"Total Breed Classes    : {len(breed_images)}")
    print("[SUCCESS] Dataset successfully staged in ImageFolder format.")
    print("====================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Prepare stratified ImageFolder dataset splits.")
    parser.add_argument("--zip", type=str, default="KaggleDataset.zip", help="Path to Kaggle zip archive")
    parser.add_argument("--output", type=str, default="./data", help="Output data directory")
    parser.add_argument("--train-ratio", type=float, default=0.70, help="Train ratio (default: 0.70)")
    parser.add_argument("--val-ratio", type=float, default=0.15, help="Val ratio (default: 0.15)")
    parser.add_argument("--test-ratio", type=float, default=0.15, help="Test ratio (default: 0.15)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic split")
    parser.add_argument("--max-per-class", type=int, default=None, help="Cap images per class (optional)")
    args = parser.parse_args()

    create_stratified_splits(
        zip_path=args.zip,
        output_data_dir=args.output,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed,
        max_images_per_class=args.max_per_class
    )


if __name__ == "__main__":
    main()
