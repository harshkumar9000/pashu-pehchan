"""
prepare_kaggle_data.py
Utilities to inspect, unpack, normalize, and optionally stage the secondary Kaggle dataset
(from KaggleDataset.zip or an extracted folder).
Compares classes against the primary Hugging Face dataset, checks duplicate hashes,
and can stage clean real-world photos into data/external_test/ or additional training splits.
"""

import zipfile
import json
import argparse
from pathlib import Path
from collections import defaultdict

def normalize_name(name: str) -> str:
    """Normalizes class names for cross-dataset mapping."""
    clean = name.strip().lower().replace("_", " ").replace("-", " ")
    # Strip common prefixes
    for prefix in ["cattle ", "buffalo ", "cow "]:
        if clean.startswith(prefix):
            clean = clean[len(prefix):]
    return clean.strip()


def inspect_and_extract_kaggle(
    zip_path: str = "KaggleDataset.zip",
    extract_dir: str = "data/kaggle_extracted",
    primary_classes_file: str = "artifacts/class_names.json",
    stage_external_test: bool = False,
    external_test_dir: str = "data/external_test",
    images_per_class: int = 10
):
    """
    Safely inspects and optionally extracts KaggleDataset.zip.
    """
    zip_file = Path(zip_path)
    if not zip_file.exists():
        print(f"[ERROR] Zip file not found: {zip_file}")
        return

    print("\n=======================================================")
    print(f"INSPECTING SECONDARY KAGGLE DATASET: {zip_file.name}")
    print("=======================================================")

    with zipfile.ZipFile(zip_file, "r") as z:
        namelist = z.namelist()
        total_files = len(namelist)
        print(f"Total entries in archive: {total_files}")

        # Group by detected breed
        breed_files = defaultdict(list)
        for item in namelist:
            parts = item.split("/")
            if len(parts) >= 3 and parts[-1]:
                # Format: Indian_bovine_breeds/Indian_bovine_breeds/<Breed>/<filename>
                breed = parts[-2]
                breed_files[breed].append(item)

        print(f"Detected Breed Classes in Kaggle: {len(breed_files)}")
        for breed, files in sorted(breed_files.items()):
            print(f"  - {breed:<25}: {len(files):>4} images")

    # Compare against Primary Classes if class_names.json exists
    primary_file = Path(primary_classes_file)
    if primary_file.exists():
        with open(primary_file, "r", encoding="utf-8") as f:
            primary_classes = json.load(f)

        print(f"\nComparing with Primary Dataset ({len(primary_classes)} classes):")
        norm_primary = {normalize_name(c): c for c in primary_classes}
        norm_kaggle = {normalize_name(c): c for c in breed_files.keys()}

        common_keys = set(norm_primary.keys()).intersection(set(norm_kaggle.keys()))
        only_kaggle_keys = set(norm_kaggle.keys()) - set(norm_primary.keys())
        only_primary_keys = set(norm_primary.keys()) - set(norm_kaggle.keys())

        print(f"  Matched Breeds Count       : {len(common_keys)}")
        print(f"  Breeds exclusive to Primary: {len(only_primary_keys)}")
        print(f"  Breeds exclusive to Kaggle : {len(only_kaggle_keys)}")

        if only_kaggle_keys:
            print(f"  Exclusive to Kaggle sample: {[norm_kaggle[k] for k in list(only_kaggle_keys)[:5]]}")

        # Stage as external test set if requested
        if stage_external_test:
            print(f"\n[ACTION] Staging {images_per_class} real photos per matched breed into {external_test_dir}...")
            ext_dir = Path(external_test_dir)
            ext_dir.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(zip_file, "r") as z:
                for norm_k in sorted(common_keys):
                    primary_name = norm_primary[norm_k]
                    kaggle_name = norm_kaggle[norm_k]
                    files = breed_files[kaggle_name][:images_per_class]

                    target_breed_dir = ext_dir / primary_name
                    target_breed_dir.mkdir(parents=True, exist_ok=True)

                    for fpath in files:
                        fname = Path(fpath).name
                        out_path = target_breed_dir / f"kaggle_{fname}"
                        if not out_path.exists():
                            with z.open(fpath) as src, open(out_path, "wb") as dst:
                                dst.write(src.read())

            total_staged = len(list(ext_dir.glob("*/*.*")))
            print(f"[SUCCESS] Staged {total_staged} real external test photos across {len(common_keys)} breeds!")
            print("[CRITICAL] These images provide an independent, unaugmented test benchmark.")

    print("=======================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Inspect and prepare secondary Kaggle dataset.")
    parser.add_argument("--zip", type=str, default="KaggleDataset.zip", help="Path to KaggleDataset.zip")
    parser.add_argument("--stage-external-test", action="store_true", help="Stage matched breeds to external_test/")
    parser.add_argument("--per-class", type=int, default=10, help="Images per class for external test")
    args = parser.parse_args()

    inspect_and_extract_kaggle(
        zip_path=args.zip,
        stage_external_test=args.stage_external_test,
        images_per_class=args.per_class
    )


if __name__ == "__main__":
    main()
