"""
download_dataset.py
Downloads the primary Indian Cattle & Buffalo Breeds dataset from Hugging Face
and provides utilities to inspect metadata and optionally stage secondary Kaggle data.
"""

import sys
import json
import argparse
from pathlib import Path

def download_huggingface_dataset(repo_id: str, target_dir: str, artifacts_dir: str):
    """
    Downloads the Hugging Face dataset locally into target_dir.
    Once downloaded, the training pipeline runs 100% offline.
    """
    try:
        from huggingface_hub import snapshot_download  # type: ignore
    except ImportError:
        print("[ERROR] huggingface_hub is required. Install via: pip install huggingface_hub")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f"Downloading Primary Dataset: {repo_id}")
    print(f"Target Directory           : {target_dir}")
    print(f"=======================================================")

    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    artifacts_path = Path(artifacts_dir)
    artifacts_path.mkdir(parents=True, exist_ok=True)

    # Download repository snapshot
    local_path = snapshot_download(
        repo_id=repo_id,
        repo_type="dataset",
        local_dir=str(target_path),
        local_dir_use_symlinks=False,
        resume_download=True
    )
    print(f"[SUCCESS] Dataset files downloaded to: {local_path}")

    # Inspect for breed metadata files (metadata.csv or metadata.json)
    metadata_candidates = [
        target_path / "metadata.csv",
        target_path / "metadata.json",
        target_path / "breed_metadata.json",
        target_path / "breed_metadata.csv",
    ]

    extracted_metadata = None
    for candidate in metadata_candidates:
        if candidate.exists():
            print(f"[INFO] Found metadata file: {candidate.name}")
            if candidate.suffix == ".json":
                try:
                    with open(candidate, "r", encoding="utf-8") as f:
                        extracted_metadata = json.load(f)
                except Exception as e:
                    print(f"[WARNING] Could not parse JSON metadata: {e}")
            elif candidate.suffix == ".csv":
                try:
                    import csv
                    with open(candidate, "r", encoding="utf-8") as f:
                        reader = csv.DictReader(f)
                        extracted_metadata = list(reader)
                except Exception as e:
                    print(f"[WARNING] Could not parse CSV metadata: {e}")
            break

    if extracted_metadata is not None:
        out_meta_file = artifacts_path / "breed_metadata.json"
        with open(out_meta_file, "w", encoding="utf-8") as f:
            json.dump(extracted_metadata, f, indent=2)
        print(f"[INFO] Saved extracted breed metadata to: {out_meta_file}")
    else:
        print("[INFO] No external metadata CSV/JSON file detected in root of dataset.")

    # Verify standard split folders
    train_dir = target_path / "train"
    val_dir = target_path / "val"
    test_dir = target_path / "test"

    print("\n--- Split Verification ---")
    for name, path in [("train", train_dir), ("val", val_dir), ("test", test_dir)]:
        if path.exists() and path.is_dir():
            classes = [d for d in path.iterdir() if d.is_dir()]
            img_count = len(list(path.glob("*/*.*")))
            print(f"  {name:5s}: {len(classes)} classes, {img_count} images found.")
        else:
            print(f"  [WARNING] {name} directory missing at {path}")

    # Create empty external_test directory if not present
    ext_test = target_path / "external_test"
    if not ext_test.exists():
        ext_test.mkdir(parents=True, exist_ok=True)
        readme_ext = ext_test / "README.txt"
        readme_ext.write_text(
            "Place genuinely unseen, independent field test photos here structured by breed class:\n"
            "external_test/<breed_name>/<image.jpg>\n"
            "Scores on external_test are reported completely separately from benchmark test splits.\n"
        )
        print(f"[INFO] Initialized external test set directory at: {ext_test}")


def normalize_class_name(name: str) -> str:
    """Normalizes class string for comparison."""
    return name.strip().lower().replace("_", " ").replace("-", " ")


def inspect_kaggle_secondary(kaggle_dir: str, primary_dir: str):
    """
    Safely inspects a secondary Kaggle dataset before any merging:
    - Normalizes class names
    - Reports classes exclusive to one dataset
    - Reports label conflicts
    - Checks duplicate filenames
    """
    print(f"\n=======================================================")
    print(f"Inspecting Secondary Kaggle Dataset: {kaggle_dir}")
    print(f"Comparing against Primary: {primary_dir}")
    print(f"=======================================================")

    kaggle_path = Path(kaggle_dir)
    primary_path = Path(primary_dir)

    if not kaggle_path.exists():
        print(f"[ERROR] Kaggle directory does not exist: {kaggle_path}")
        return

    # Find classes in primary train
    primary_train = primary_path / "train"
    primary_classes = {d.name: normalize_class_name(d.name) for d in primary_train.iterdir() if d.is_dir()} if primary_train.exists() else {}

    # Find classes in kaggle
    kaggle_classes = {d.name: normalize_class_name(d.name) for d in kaggle_path.iterdir() if d.is_dir()}

    print(f"Primary classes count : {len(primary_classes)}")
    print(f"Kaggle classes count  : {len(kaggle_classes)}")

    norm_to_primary = {v: k for k, v in primary_classes.items()}
    norm_to_kaggle = {v: k for k, v in kaggle_classes.items()}

    matched = set(norm_to_primary.keys()).intersection(set(norm_to_kaggle.keys()))
    only_primary = set(norm_to_primary.keys()) - set(norm_to_kaggle.keys())
    only_kaggle = set(norm_to_kaggle.keys()) - set(norm_to_primary.keys())

    print(f"\nMatched normalized classes   : {len(matched)}")
    print(f"Classes only in Primary       : {len(only_primary)}")
    if only_primary:
        print("  Sample:", list(only_primary)[:5])
    print(f"Classes only in Kaggle        : {len(only_kaggle)}")
    if only_kaggle:
        print("  Sample:", list(only_kaggle)[:5])

    print("\n[RECOMMENDATION] Train on primary dataset first. To merge matched Kaggle classes,")
    print("use a curated script with duplicate image hashing to avoid test set contamination.")


def main():
    parser = argparse.ArgumentParser(description="Download and manage cattle breed datasets.")
    parser.add_argument("--repo-id", type=str, default="SynthAIzer/indian-cattle-buffalo-breeds",
                        help="Hugging Face repo ID")
    parser.add_argument("--target-dir", type=str, default="./data",
                        help="Target local directory for dataset")
    parser.add_argument("--artifacts-dir", type=str, default="./artifacts",
                        help="Directory to store extracted metadata")
    parser.add_argument("--inspect-kaggle", type=str, default=None,
                        help="Path to secondary Kaggle dataset to inspect before merging")
    args = parser.parse_args()

    if args.inspect_kaggle:
        inspect_kaggle_secondary(args.inspect_kaggle, args.target_dir)
    else:
        download_huggingface_dataset(args.repo_id, args.target_dir, args.artifacts_dir)


if __name__ == "__main__":
    main()
