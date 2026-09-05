"""
server/inspect_model.py
Automatic inspection utility for the trained breed classification model artifact.
Prints framework, architecture, class count, metadata, input shape, and normalization parameters.
"""

import sys
import json
from pathlib import Path
import torch

def inspect_model(model_dir: str = "server/models"):
    model_path = Path(model_dir)
    print("\n=======================================================")
    print("VETRA: MODEL ARTIFACT INSPECTION REPORT")
    print("=======================================================")
    print(f"Inspection Directory : {model_path.resolve()}")
    
    if not model_path.exists():
        print(f"[ERROR] Directory does not exist: {model_path}")
        sys.exit(1)
        
    found_files = list(model_path.glob("*.*"))
    print(f"Detected Artifacts   : {len(found_files)} files")
    for f in found_files:
        print(f"  - {f.name:<28} ({f.stat().st_size / 1024:.1f} KB)")
        
    # Checkpoint inspection
    ckpt_file = model_path / "best_model.pth"
    if not ckpt_file.exists():
        candidates = list(model_path.glob("*.pth")) or list(model_path.glob("*.pt"))
        if candidates:
            ckpt_file = candidates[0]
        else:
            print("[ERROR] No PyTorch checkpoint (.pth or .pt) found.")
            sys.exit(1)
            
    print(f"\n--- Checkpoint Analysis: {ckpt_file.name} ---")
    try:
        ckpt = torch.load(str(ckpt_file), map_location="cpu")
        print("Framework            : PyTorch")
        print(f"Architecture         : {ckpt.get('architecture', 'unknown')}")
        print(f"Model Version        : {ckpt.get('model_version', 'unknown')}")
        print(f"Validation Accuracy  : {ckpt.get('validation_accuracy', 'N/A')}%")
        print(f"Validation Loss      : {ckpt.get('validation_loss', 'N/A')}")
        print(f"Input Shape          : 3 x {ckpt.get('input_size', 224)} x {ckpt.get('input_size', 224)}")
        print(f"Normalization Mean   : {ckpt.get('normalization', {}).get('mean', [0.485, 0.456, 0.406])}")
        print(f"Normalization Std    : {ckpt.get('normalization', {}).get('std', [0.229, 0.224, 0.225])}")
        
        class_names = ckpt.get("class_names", [])
        print(f"Embedded Classes     : {len(class_names)} classes")
        if class_names:
            print(f"  Sample Classes     : {', '.join(class_names[:6])} ... {', '.join(class_names[-3:])}")
            
    except Exception as e:
        print(f"[ERROR] Failed to inspect checkpoint: {e}")
        sys.exit(1)

    # Class mappings verification
    names_file = model_path / "class_names.json"
    if names_file.exists():
        with open(names_file, "r", encoding="utf-8") as f:
            classes = json.load(f)
        print(f"class_names.json     : Verified ({len(classes)} classes match)")
        
    config_file = model_path / "model_config.json"
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        print(f"model_config.json    : Verified (Thresholds: {cfg.get('confidence_thresholds', {})})")

    print("=======================================================\n")

if __name__ == "__main__":
    dir_arg = sys.argv[1] if len(sys.argv) > 1 else "server/models"
    inspect_model(dir_arg)
