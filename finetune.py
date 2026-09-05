"""
finetune.py
Fine-tunes the existing EfficientNet-B0 model with the newly integrated cattle dataset.
Loads artifacts/best_model.pth, trains for 4 epochs using AdamW + CosineAnnealing,
validates after each epoch, updates artifacts, and syncs weights to server/models/.
"""

import sys
import json
import yaml
import shutil
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tqdm import tqdm

from training.dataset import build_dataloaders
from training.model import build_model, unfreeze_backbone
from training.train_utils import (
    set_seed,
    get_device,
    save_checkpoint,
    plot_training_curves,
    generate_model_version
)
from training.evaluate import evaluate_model
from audit_dataset import run_dataset_audit


def train_one_epoch(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    epoch_idx: int,
    total_epochs: int
) -> tuple[float, float]:
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(
        dataloader,
        desc=f"[FINE-TUNE] Epoch {epoch_idx}/{total_epochs}",
        ncols=100,
        leave=False
    )

    for images, targets in pbar:
        images = images.to(device)
        targets = targets.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == targets).sum().item()
        total += targets.size(0)

        current_loss = running_loss / max(1, total)
        current_acc = (correct / max(1, total)) * 100
        pbar.set_postfix({"loss": f"{current_loss:.4f}", "acc": f"{current_acc:.1f}%"})

    epoch_loss = running_loss / max(1, total)
    epoch_acc = (correct / max(1, total)) * 100
    return epoch_loss, epoch_acc


@torch.no_grad()
def validate_one_epoch(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> tuple[float, float, float]:
    model.eval()
    running_loss = 0.0
    top1_correct = 0
    top3_correct = 0
    total = 0

    for images, targets in dataloader:
        images = images.to(device)
        targets = targets.to(device)

        outputs = model(images)
        loss = criterion(outputs, targets)
        running_loss += loss.item() * images.size(0)

        _, preds = torch.max(outputs, 1)
        top1_correct += (preds == targets).sum().item()

        # Top-3 accuracy
        _, top3_preds = torch.topk(outputs, k=min(3, outputs.size(1)), dim=1)
        top3_correct += (top3_preds == targets.unsqueeze(1)).any(dim=1).sum().item()

        total += targets.size(0)

    val_loss = running_loss / max(1, total)
    val_top1 = (top1_correct / max(1, total)) * 100
    val_top3 = (top3_correct / max(1, total)) * 100
    return val_loss, val_top1, val_top3


def run_finetuning(config_path: str = "configs/config.yaml", epochs: int = 4, lr: float = 2.5e-5):
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    artifacts_dir = Path(config.get("artifacts", {}).get("dir", "./artifacts"))
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    server_models_dir = Path("server/models")
    server_models_dir.mkdir(parents=True, exist_ok=True)

    set_seed(config.get("seed", 42))
    device = get_device(auto=True)

    print("\n=======================================================")
    print("VETRA MODEL FINE-TUNING PIPELINE (NEW DATA INTEGRATION)")
    print("=======================================================")

    # 1. Dataset audit already completed
    data_root = config.get("dataset", {}).get("root", "./data")

    # 2. Build DataLoaders
    print("\n[STEP 1/5] Building DataLoaders with enriched dataset...")
    train_loader, val_loader, test_loader, class_names, class_to_idx, class_weights = build_dataloaders(config)
    num_classes = len(class_names)
    print(f"[INFO] Classes: {num_classes} | Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")

    # 3. Load pre-trained checkpoint
    arch = config.get("model", {}).get("architecture", "efficientnet_b0")
    model = build_model(
        architecture=arch,
        num_classes=num_classes,
        pretrained=True,
        dropout=config.get("model", {}).get("dropout", 0.3)
    ).to(device)

    prev_checkpoint = artifacts_dir / "best_model.pth"
    if prev_checkpoint.exists():
        print(f"\n[STEP 2/5] Loading baseline checkpoint weights from {prev_checkpoint}...")
        ckpt = torch.load(str(prev_checkpoint), map_location=device)
        model.load_state_dict(ckpt["model_state_dict"])
        print("[SUCCESS] Checkpoint loaded successfully into model.")
    else:
        print(f"[WARNING] Baseline checkpoint {prev_checkpoint} not found. Training from torchvision pretrained weights.")

    # Unfreeze network for fine-tuning
    unfreeze_backbone(model)

    # 4. Setup Optimizer, Scheduler, and Loss
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))

    best_val_acc = 0.0
    best_val_loss = float("inf")
    best_checkpoint_path = artifacts_dir / "best_model.pth"

    history = {
        "epochs": [],
        "train_loss": [],
        "val_loss": [],
        "train_acc": [],
        "val_acc": [],
        "val_top3_acc": [],
        "stage": []
    }

    model_version = generate_model_version(arch, num_classes)

    print(f"\n[STEP 3/5] Commencing Fine-Tuning ({epochs} Epochs on {device})...")
    print(f"Optimizer: AdamW | LR: {lr} | Scheduler: CosineAnnealing")
    print("-" * 75)

    start_time = time.time()
    for ep in range(1, epochs + 1):
        t_loss, t_acc = train_one_epoch(model, train_loader, criterion, optimizer, device, ep, epochs)
        scheduler.step()

        v_loss, v_top1, v_top3 = validate_one_epoch(model, val_loader, criterion, device)

        history["epochs"].append(ep)
        history["train_loss"].append(round(t_loss, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["train_acc"].append(round(t_acc, 2))
        history["val_acc"].append(round(v_top1, 2))
        history["val_top3_acc"].append(round(v_top3, 2))
        history["stage"].append("finetune")

        print(f"Epoch {ep:02d}/{epochs:02d} | Train Loss: {t_loss:.4f} | Train Acc: {t_acc:.1f}% | "
              f"Val Loss: {v_loss:.4f} | Val Top-1: {v_top1:.1f}% | Val Top-3: {v_top3:.1f}%")

        if v_top1 > best_val_acc or ep == 1:
            best_val_acc = v_top1
            best_val_loss = v_loss
            save_checkpoint(
                path=str(best_checkpoint_path),
                model=model,
                class_names=class_names,
                class_to_idx=class_to_idx,
                architecture=arch,
                input_size=config.get("dataset", {}).get("image_size", 224),
                training_config=config,
                epoch=ep,
                val_accuracy=v_top1,
                val_loss=v_loss,
                model_version=model_version
            )
            print(f"  --> Saved new best model checkpoint (Val Acc: {v_top1:.2f}%)")

    total_time = time.time() - start_time
    print(f"\n[FINE-TUNING COMPLETE] Total Duration: {total_time/60:.1f} minutes.")

    # 5. Evaluate on Test Set
    print("\n[STEP 4/5] Running Comprehensive Test Set Evaluation...")
    best_ckpt = torch.load(str(best_checkpoint_path), map_location=device)
    model.load_state_dict(best_ckpt["model_state_dict"])
    model.eval()

    test_metrics = evaluate_model(
        model=model,
        dataloader=test_loader,
        class_names=class_names,
        device=device,
        top_k=config.get("evaluation", {}).get("top_k", 3),
        artifacts_dir=str(artifacts_dir),
        split_name="test"
    )

    # Plot updated training curves
    try:
        plot_training_curves(history, str(artifacts_dir / "training_curves.png"))
    except Exception as e:
        print(f"[WARNING] Could not plot curves: {e}")

    # 6. Deploy to server/models/
    print("\n[STEP 5/5] Deploying updated model weights to server/models/...")
    shutil.copy2(str(best_checkpoint_path), str(server_models_dir / "best_model.pth"))
    shutil.copy2(str(artifacts_dir / "metrics.json"), str(server_models_dir / "metrics.json"))
    shutil.copy2(str(artifacts_dir / "class_names.json"), str(server_models_dir / "class_names.json"))
    print("[SUCCESS] Model artifacts deployed to server/models/.")

    print("\n=======================================================")
    print("FINAL EVALUATION METRICS AFTER INTEGRATION")
    print("=======================================================")
    print(f"Top-1 Test Accuracy : {test_metrics['top1_accuracy']:.1f}%")
    print(f"Top-3 Test Accuracy : {test_metrics['top3_accuracy']:.1f}%")
    print(f"Macro F1 Score      : {test_metrics['macro_f1']:.1f}%")
    print(f"Weighted F1 Score   : {test_metrics['weighted_f1']:.1f}%")
    print("=======================================================\n")


if __name__ == "__main__":
    run_finetuning(epochs=4, lr=2.5e-5)
