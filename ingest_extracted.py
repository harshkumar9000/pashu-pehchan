"""
ingest_extracted.py
Fast local ingestion of extracted cattle images from images/ and yt_images/ folders.
Maps relevant SKUs to target classes (Sahiwal, Red_Sindhi, Holstein_Friesian)
and populates data/train, data/val, data/test with stratified splits.
"""

import os
import csv
import shutil
import random
from pathlib import Path
from collections import defaultdict
from PIL import Image

SEED = 42
random.seed(SEED)

BREED_MAPPING = {
    "SAHIWAL": "Sahiwal",
    "SINDHI": "Red_Sindhi",
    "HOSTINE_CROSS": "Holstein_Friesian",
}

# Max video frames per SKU to ensure dataset visual diversity
MAX_YT_FRAMES_PER_SKU = 8

def load_sku_mapping(csv_path: str = "dataset.csv"):
    sku_to_target = {}
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_sku = row.get("sku", "").replace(" ", "").strip().upper()
            raw_breed = row.get("breed", "").strip().upper()
            if raw_breed in BREED_MAPPING:
                sku_to_target[raw_sku] = BREED_MAPPING[raw_breed]
    return sku_to_target

def run_ingestion():
    sku_map = load_sku_mapping("dataset.csv")
    print(f"[INFO] Loaded mapping for {len(sku_map)} target SKUs across: {set(sku_map.values())}")

    # Collect files per target breed: breed -> list of Path objects
    collected_by_breed = defaultdict(list)

    # 1. Scan images/ folder (still photos)
    images_dir = Path("images")
    if images_dir.exists():
        print("[STEP 1/3] Scanning images/ directory for still photos...")
        for sku_dir in images_dir.iterdir():
            if not sku_dir.is_dir() or sku_dir.name.startswith("._"):
                continue
            normalized_sku = sku_dir.name.replace(" ", "").strip().upper()
            if normalized_sku in sku_map:
                target_breed = sku_map[normalized_sku]
                for img_file in sku_dir.iterdir():
                    if img_file.is_file() and not img_file.name.startswith("._") and img_file.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                        collected_by_breed[target_breed].append((img_file, f"still_{normalized_sku}_{img_file.name}"))
        print(f"  Still photos collected: { {b: len(imgs) for b, imgs in collected_by_breed.items()} }")
    else:
        print("[WARNING] images/ directory not found.")

    # 2. Scan yt_images/ folder (sampled video frames)
    yt_dir = Path("yt_images")
    if yt_dir.exists():
        print(f"[STEP 2/3] Scanning yt_images/ directory for video keyframes (sampling max {MAX_YT_FRAMES_PER_SKU} frames/SKU)...")
        for sku_dir in yt_dir.iterdir():
            if not sku_dir.is_dir() or sku_dir.name.startswith("._"):
                continue
            normalized_sku = sku_dir.name.replace(" ", "").strip().upper()
            if normalized_sku in sku_map:
                target_breed = sku_map[normalized_sku]
                valid_frames = [
                    f for f in sku_dir.iterdir()
                    if f.is_file() and not f.name.startswith("._") and f.suffix.lower() in [".jpg", ".jpeg", ".png"]
                ]
                valid_frames.sort(key=lambda x: x.name)
                n = len(valid_frames)
                if n <= MAX_YT_FRAMES_PER_SKU:
                    chosen = valid_frames
                else:
                    indices = [int(i * (n - 1) / (MAX_YT_FRAMES_PER_SKU - 1)) for i in range(MAX_YT_FRAMES_PER_SKU)]
                    chosen = [valid_frames[i] for i in indices]

                for frame_file in chosen:
                    collected_by_breed[target_breed].append((frame_file, f"yt_{normalized_sku}_{frame_file.name}"))
        print(f"  Total images after video frames: { {b: len(imgs) for b, imgs in collected_by_breed.items()} }")
    else:
        print("[INFO] yt_images/ directory not yet extracted or in progress.")

    # 3. Copy into data/train, data/val, data/test
    print("\n[STEP 3/3] Copying verified images into data/ splits...")
    out_root = Path("data")
    stats = defaultdict(lambda: {"train": 0, "val": 0, "test": 0})

    for breed, items in collected_by_breed.items():
        random.shuffle(items)
        total = len(items)
        n_train = int(total * 0.70)
        n_val = int(total * 0.15)
        n_test = total - n_train - n_val

        splits = {
            "train": items[:n_train],
            "val": items[n_train:n_train + n_val],
            "test": items[n_train + n_val:],
        }

        for split_name, file_list in splits.items():
            dest_dir = out_root / split_name / breed
            dest_dir.mkdir(parents=True, exist_ok=True)

            for src_path, dest_filename in file_list:
                try:
                    # Quick integrity check
                    with Image.open(src_path) as img:
                        img.verify()
                    dest_path = dest_dir / dest_filename
                    shutil.copy2(src_path, dest_path)
                    stats[breed][split_name] += 1
                except Exception as e:
                    # Skip unreadable image
                    continue

    print("\n=======================================================")
    print("INGESTION SUMMARY")
    print("=======================================================")
    print(f"{'BREED':20s} | {'TRAIN ADDED':>12s} | {'VAL ADDED':>10s} | {'TEST ADDED':>11s} | {'TOTAL ADDED':>12s}")
    print("-" * 75)
    total_added = 0
    for breed, s in sorted(stats.items()):
        tot = s["train"] + s["val"] + s["test"]
        total_added += tot
        print(f"{breed:20s} | {s['train']:12d} | {s['val']:10d} | {s['test']:11d} | {tot:12d}")
    print("-" * 75)
    print(f"Total verified images successfully integrated: {total_added}")

if __name__ == "__main__":
    run_ingestion()
