"""
audit_dataset.py
Audits dataset integrity, image quality, corruptions, blank files, and class imbalance.
Produces artifacts/dataset_report.json.
"""

import json
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def verify_image(file_path: Path, min_dim: int = 32):
    """
    Validates an image file.
    Returns (status: bool, error_msg: str, stats: dict)
    """
    if file_path.suffix.lower() not in VALID_EXTENSIONS:
        return False, f"Invalid extension: {file_path.suffix}", {}

    try:
        with Image.open(file_path) as img:
            # Force verification and load pixel data
            img.verify()

        # Reopen to test pixel loading & check size/variance
        with Image.open(file_path) as img:
            width, height = img.size
            if width < min_dim or height < min_dim:
                return False, f"Image dimensions too small ({width}x{height} < {min_dim})", {}

            # Convert to RGB to verify decoding
            rgb_img = img.convert("RGB")
            arr = np.array(rgb_img)

            # Check for blank / solid color images
            std_dev = float(np.std(arr))
            if std_dev < 1.0:
                return False, f"Near-blank / zero-variance image (std_dev: {std_dev:.2f})", {}

            return True, "", {
                "width": width,
                "height": height,
                "channels": 3,
                "std_dev": std_dev
            }
    except Exception as e:
        return False, f"Corrupt or unreadable image: {str(e)}", {}


def audit_split(split_dir: Path, min_dim: int = 32):
    """
    Audits an individual dataset split directory (train, val, test, external_test).
    """
    report = {
        "exists": split_dir.exists(),
        "total_images": 0,
        "valid_images": 0,
        "corrupt_images": [],
        "invalid_extensions": [],
        "empty_classes": [],
        "class_counts": {},
        "dimensions": {
            "min_width": 999999,
            "max_width": 0,
            "min_height": 999999,
            "max_height": 0
        }
    }

    if not split_dir.exists():
        return report

    class_folders = [d for d in split_dir.iterdir() if d.is_dir()]
    
    for class_dir in sorted(class_folders):
        class_name = class_dir.name
        img_files = [f for f in class_dir.iterdir() if f.is_file()]
        
        if len(img_files) == 0:
            report["empty_classes"].append(class_name)
            report["class_counts"][class_name] = 0
            continue

        valid_in_class = 0
        for img_path in img_files:
            report["total_images"] += 1
            if img_path.suffix.lower() not in VALID_EXTENSIONS:
                report["invalid_extensions"].append(str(img_path))
                continue

            is_valid, err, stats = verify_image(img_path, min_dim=min_dim)
            if not is_valid:
                report["corrupt_images"].append({
                    "path": str(img_path),
                    "reason": err
                })
            else:
                valid_in_class += 1
                report["valid_images"] += 1
                w, h = stats["width"], stats["height"]
                report["dimensions"]["min_width"] = min(report["dimensions"]["min_width"], w)
                report["dimensions"]["max_width"] = max(report["dimensions"]["max_width"], w)
                report["dimensions"]["min_height"] = min(report["dimensions"]["min_height"], h)
                report["dimensions"]["max_height"] = max(report["dimensions"]["max_height"], h)

        report["class_counts"][class_name] = valid_in_class

    if report["valid_images"] == 0:
        report["dimensions"] = {"min_width": 0, "max_width": 0, "min_height": 0, "max_height": 0}

    return report


def run_dataset_audit(data_root: str, artifacts_dir: str, remove_corrupt: bool = False):
    """
    Executes a comprehensive audit of all dataset splits and exports dataset_report.json.
    """
    print("\n=======================================================")
    print(f"Running Comprehensive Dataset Audit: {data_root}")
    print("=======================================================")

    root = Path(data_root)
    artifacts = Path(artifacts_dir)
    artifacts.mkdir(parents=True, exist_ok=True)

    splits = ["train", "val", "test", "external_test"]
    split_reports = {}

    for split in splits:
        split_dir = root / split
        print(f"Auditing split: {split} ...")
        split_reports[split] = audit_split(split_dir)

    # Class consistency across train, val, test
    train_classes = set(split_reports["train"]["class_counts"].keys())
    val_classes = set(split_reports["val"]["class_counts"].keys())
    test_classes = set(split_reports["test"]["class_counts"].keys())

    missing_in_val = sorted(list(train_classes - val_classes))
    missing_in_test = sorted(list(train_classes - test_classes))
    extra_in_val = sorted(list(val_classes - train_classes))
    extra_in_test = sorted(list(test_classes - train_classes))

    # Class distribution statistics for train
    train_counts = list(split_reports["train"]["class_counts"].values())
    imbalance_stats = {}
    if train_counts:
        min_c = int(np.min(train_counts))
        max_c = int(np.max(train_counts))
        imbalance_stats = {
            "num_classes": len(train_counts),
            "min_images_per_class": min_c,
            "max_images_per_class": max_c,
            "mean_images_per_class": float(np.mean(train_counts)),
            "median_images_per_class": float(np.median(train_counts)),
            "std_dev": float(np.std(train_counts)),
            "imbalance_ratio_max_min": float(max_c / max(1, min_c))
        }

    total_corrupt = sum(len(split_reports[s]["corrupt_images"]) for s in splits)
    all_corrupt_files = []
    for s in splits:
        all_corrupt_files.extend(split_reports[s]["corrupt_images"])

    overall_report = {
        "data_root": str(root.resolve()),
        "splits": split_reports,
        "class_consistency": {
            "train_classes_count": len(train_classes),
            "val_classes_count": len(val_classes),
            "test_classes_count": len(test_classes),
            "classes_missing_in_val": missing_in_val,
            "classes_missing_in_test": missing_in_test,
            "extra_classes_in_val": extra_in_val,
            "extra_classes_in_test": extra_in_test
        },
        "train_imbalance_stats": imbalance_stats,
        "total_corrupt_images_found": total_corrupt,
        "corrupt_images": all_corrupt_files
    }

    report_path = artifacts / "dataset_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(overall_report, f, indent=2)

    # Print summary to terminal
    print("\n---------------- AUDIT SUMMARY ----------------")
    print(f"Report saved to          : {report_path}")
    print(f"Train split images       : {split_reports['train']['valid_images']} valid ({split_reports['train']['total_images']} total)")
    print(f"Val split images         : {split_reports['val']['valid_images']} valid ({split_reports['val']['total_images']} total)")
    print(f"Test split images        : {split_reports['test']['valid_images']} valid ({split_reports['test']['total_images']} total)")
    if split_reports['external_test']['exists']:
        print(f"External test images     : {split_reports['external_test']['valid_images']} valid")
    print(f"Detected Train classes   : {len(train_classes)}")
    
    if imbalance_stats:
        print(f"\nClass Distribution Statistics (Train):")
        print(f"  Min images / class     : {imbalance_stats['min_images_per_class']}")
        print(f"  Max images / class     : {imbalance_stats['max_images_per_class']}")
        print(f"  Mean images / class    : {imbalance_stats['mean_images_per_class']:.1f}")
        print(f"  Imbalance ratio        : {imbalance_stats['imbalance_ratio_max_min']:.2f}x")

    if missing_in_val:
        print(f"[WARNING] Classes in train but missing in val: {len(missing_in_val)}")
    if missing_in_test:
        print(f"[WARNING] Classes in train but missing in test: {len(missing_in_test)}")

    if total_corrupt > 0:
        print(f"\n[WARNING] Found {total_corrupt} corrupt or unreadable images!")
        for c in all_corrupt_files[:10]:
            print(f"  - {c['path']}: {c['reason']}")
        if len(all_corrupt_files) > 10:
            print(f"  ... and {len(all_corrupt_files) - 10} more.")

        if remove_corrupt:
            print("\n[ACTION] Removing corrupt images as --remove-corrupt was specified...")
            for c in all_corrupt_files:
                p = Path(c["path"])
                if p.exists():
                    p.unlink()
                    print(f"  Deleted: {p}")
            print("[ACTION] Removal complete. Re-run audit to verify.")
        else:
            print("\n[NOTE] Corrupt files were NOT deleted. Use --remove-corrupt to delete if desired.")
    else:
        print("\n[SUCCESS] No corrupt or unreadable images found. Dataset integrity intact.")

    print("===============================================\n")
    return overall_report


def main():
    parser = argparse.ArgumentParser(description="Audit dataset integrity and class distribution.")
    parser.add_argument("--data-dir", type=str, default="./data", help="Root data directory")
    parser.add_argument("--artifacts-dir", type=str, default="./artifacts", help="Artifacts directory")
    parser.add_argument("--remove-corrupt", action="store_true", help="Remove corrupt files (requires explicit flag)")
    args = parser.parse_args()

    run_dataset_audit(args.data_dir, args.artifacts_dir, remove_corrupt=args.remove_corrupt)


if __name__ == "__main__":
    main()
