"""
ingest_new_dataset.py
Extracts and integrates images from images.tar.gz and yt_images.tar.gz based on dataset.csv.
Maps target breeds (Sahiwal, Red_Sindhi, Holstein_Friesian) and splits them into
train (70%), val (15%), and test (15%) splits.
"""

import os
import csv
import tarfile
import random
from pathlib import Path
from collections import defaultdict
from PIL import Image
import io

SEED = 42
random.seed(SEED)

BREED_MAPPING = {
    "SAHIWAL": "Sahiwal",
    "SINDHI": "Red_Sindhi",
    "HOSTINE_CROSS": "Holstein_Friesian",
}

# Max video frames to extract per SKU to ensure frame diversity without redundant bias
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

def extract_and_ingest():
    sku_map = load_sku_mapping("dataset.csv")
    print(f"[INFO] Loaded SKU mapping for {len(sku_map)} relevant SKUs across breeds: {set(sku_map.values())}")

    # Track extracted images per breed: breed -> list of (bytes, filename)
    extracted_by_breed = defaultdict(list)

    # 1. Process images.tar.gz (High-quality still photos)
    images_tar = Path("images.tar.gz")
    if images_tar.exists():
        print(f"\n[STEP 1/3] Ingesting still photos from {images_tar.name}...")
        with tarfile.open(images_tar, "r:gz") as tar:
            for member in tar.getmembers():
                if not member.isfile():
                    continue
                filename = os.path.basename(member.name)
                if filename.startswith("._") or not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue

                parts = member.name.split("/")
                if len(parts) < 2:
                    continue
                sku = parts[1].replace(" ", "").strip().upper()
                if sku in sku_map:
                    target_breed = sku_map[sku]
                    f = tar.extractfile(member)
                    if f:
                        data = f.read()
                        extracted_by_breed[target_breed].append((data, f"still_{sku}_{filename}"))
        print(f"  Extracted still photos so far: { {b: len(imgs) for b, imgs in extracted_by_breed.items()} }")
    else:
        print(f"[WARNING] {images_tar} not found.")

    # 2. Process yt_images.tar.gz (Sampled diverse video keyframes)
    yt_tar = Path("yt_images.tar.gz")
    if yt_tar.exists():
        print(f"\n[STEP 2/3] Ingesting diverse video frames from {yt_tar.name} (sampling up to {MAX_YT_FRAMES_PER_SKU} frames/SKU)...")
        # First collect all valid members per SKU
        sku_members = defaultdict(list)
        with tarfile.open(yt_tar, "r:gz") as tar:
            for member in tar.getmembers():
                if not member.isfile():
                    continue
                filename = os.path.basename(member.name)
                if filename.startswith("._") or not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue

                parts = member.name.split("/")
                if len(parts) < 2:
                    continue
                sku = parts[1].replace(" ", "").strip().upper()
                if sku in sku_map:
                    sku_members[sku].append(member)

            # Sample frames with even stride across the video sequence
            for sku, members in sku_members.items():
                target_breed = sku_map[sku]
                # Sort members by filename to get chronological sequence
                members.sort(key=lambda m: m.name)
                n = len(members)
                if n <= MAX_YT_FRAMES_PER_SKU:
                    chosen = members
                else:
                    # Uniform stride sampling
                    indices = [int(i * (n - 1) / (MAX_YT_FRAMES_PER_SKU - 1)) for i in range(MAX_YT_FRAMES_PER_SKU)]
                    chosen = [members[i] for i in indices]

                for member in chosen:
                    filename = os.path.basename(member.name)
                    f = tar.extractfile(member)
                    if f:
                        data = f.read()
                        extracted_by_breed[target_breed].append((data, f"yt_{sku}_{filename}"))

        print(f"  Total extracted images after video sampling: { {b: len(imgs) for b, imgs in extracted_by_breed.items()} }")
    else:
        print(f"[WARNING] {yt_tar} not found.")

    # 3. Distribute into train (70%), val (15%), test (15%)
    print("\n[STEP 3/3] Distributing into data/train, data/val, and data/test splits...")
    out_root = Path("data")
    stats = defaultdict(lambda: {"train": 0, "val": 0, "test": 0})

    for breed, img_list in extracted_by_breed.items():
        random.shuffle(img_list)
        total = len(img_list)
        n_train = int(total * 0.70)
        n_val = int(total * 0.15)
        n_test = total - n_train - n_val

        splits = {
            "train": img_list[:n_train],
            "val": img_list[n_train:n_train + n_val],
            "test": img_list[n_train + n_val:],
        }

        for split_name, items in splits.items():
            split_dir = out_root / split_name / breed
            split_dir.mkdir(parents=True, exist_ok=True)

            for img_bytes, filename in items:
                # Verify image integrity
                try:
                    img = Image.open(io.BytesIO(img_bytes))
                    img.verify()
                    # Write valid image
                    dest = split_dir / filename
                    with open(dest, "wb") as out_f:
                        out_f.write(img_bytes)
                    stats[breed][split_name] += 1
                except Exception as e:
                    # Skip corrupt files
                    continue

    print("\n=======================================================")
    print("NEW DATASET INGESTION COMPLETE")
    print("=======================================================")
    print(f"{'BREED':20s} | {'TRAIN ADDED':>12s} | {'VAL ADDED':>10s} | {'TEST ADDED':>11s} | {'TOTAL ADDED':>12s}")
    print("-" * 75)
    for breed, s in sorted(stats.items()):
        tot = s["train"] + s["val"] + s["test"]
        print(f"{breed:20s} | {s['train']:12d} | {s['val']:10d} | {s['test']:11d} | {tot:12d}")
    print("-" * 75)

if __name__ == "__main__":
    extract_and_ingest()
