"""
train.py
End-to-end two-stage training orchestrator for cattle & buffalo breed identification.
Follows transfer learning with EfficientNet-B0 (or configurable backbone).
Stage 1: Train classifier head with frozen backbone.
Stage 2: Full network fine-tuning with lower learning rate.
Exports checkpoints, class mappings, metrics, curves, and confusion matrix.
"""

import json
import yaml
import time
import argparse
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tqdm import tqdm

from training.dataset import build_dataloaders
from training.model import build_model, freeze_backbone, unfreeze_backbone
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
    total_epochs: int,
    stage_name: str
) -> tuple[float, float]:
    """Trains the model for one epoch. Returns (avg_loss, top1_accuracy_percent)."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(
        dataloader,
        desc=f"[{stage_name}] Epoch {epoch_idx}/{total_epochs}",
        leave=False,
        ncols=100
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
    """Validates the model. Returns (val_loss, top1_accuracy, top3_accuracy)."""
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

        # Top-3 check
        k = min(3, outputs.size(1))
        _, top3_preds = torch.topk(outputs, k=k, dim=1)
        top3_correct += torch.any(top3_preds == targets.unsqueeze(1), dim=1).sum().item()

        total += targets.size(0)

    val_loss = running_loss / max(1, total)
    val_top1 = (top1_correct / max(1, total)) * 100
    val_top3 = (top3_correct / max(1, total)) * 100
    return val_loss, val_top1, val_top3


def run_training(config_path: str = "configs/config.yaml"):
    """
    Main training workflow.
    """
    # 1. Load Configuration
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    print("\n==========================================================")
    print("AI-DRIVEN CATTLE & BUFFALO BREED CLASSIFICATION PIPELINE")
    print("==========================================================")
    print(f"Configuration file : {config_path}")

    # Set random seed
    seed = config.get("seed", 42)
    set_seed(seed)

    # Detect Device
    device_cfg = config.get("device", {})
    auto_device = device_cfg.get("auto", True)
    device = get_device(auto=auto_device)

    # Artifacts Directory
    artifacts_dir = Path(config.get("artifacts", {}).get("dir", "./artifacts"))
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # 2. Run Dataset Audit
    data_cfg = config.get("dataset", {})
    data_root = data_cfg.get("root", "./data")
    print("\n[STEP 1/7] Running Dataset Audit Check...")
    audit_report = run_dataset_audit(data_root=data_root, artifacts_dir=str(artifacts_dir))

    # 3. Build DataLoaders & Class Mapping
    print("[STEP 2/7] Constructing DataLoaders & Class Imbalance Weights...")
    train_loader, val_loader, test_loader, class_names, class_to_idx, class_weights = build_dataloaders(config)

    num_classes = len(class_names)
    print(f"[INFO] Initialized DataLoaders with {num_classes} breed classes.")

    # Save Class Names and Mappings immediately
    class_names_path = artifacts_dir / "class_names.json"
    with open(class_names_path, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    class_to_idx_path = artifacts_dir / "class_to_index.json"
    with open(class_to_idx_path, "w", encoding="utf-8") as f:
        json.dump(class_to_idx, f, indent=2)

    print(f"[INFO] Exported canonical class mappings to {class_names_path} & {class_to_idx_path}")

    # 4. Instantiate Model
    model_cfg = config.get("model", {})
    arch = model_cfg.get("architecture", "efficientnet_b0")
    pretrained = model_cfg.get("pretrained", True)
    dropout = model_cfg.get("dropout", 0.3)

    print(f"\n[STEP 3/7] Building Model Architecture ({arch.upper()})...")
    model = build_model(
        architecture=arch,
        num_classes=num_classes,
        pretrained=pretrained,
        dropout=dropout
    ).to(device)

    # Model Version
    model_version = generate_model_version(arch, num_classes)
    print(f"[INFO] Model Version: {model_version}")

    # Loss Function (with optional class weights)
    train_cfg = config.get("training", {})
    imbalance_strategy = train_cfg.get("imbalance_handling", "weighted_loss")
    if imbalance_strategy == "weighted_loss":
        criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    else:
        criterion = nn.CrossEntropyLoss()

    # Training Metrics History
    history = {
        "epochs": [],
        "train_loss": [],
        "val_loss": [],
        "train_acc": [],
        "val_acc": [],
        "val_top3_acc": [],
        "stage": []
    }

    best_val_acc = 0.0
    best_val_loss = float("inf")
    best_checkpoint_path = artifacts_dir / "best_model.pth"
    final_checkpoint_path = artifacts_dir / "final_model.pth"

    # ========================================================
    # STAGE 1: Train Classifier Head (Frozen Backbone)
    # ========================================================
    stage1_epochs = train_cfg.get("stage1_epochs", 6)
    head_lr = train_cfg.get("head_lr", 0.0001)
    weight_decay = train_cfg.get("weight_decay", 0.0001)

    print("\n=======================================================")
    print(f"STAGE 1: Training Classification Head ({stage1_epochs} Epochs)")
    print(f"Backbone: Frozen | Optimizer: AdamW | Head LR: {head_lr}")
    print("=======================================================")

    freeze_backbone(model)
    optimizer_stage1 = AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=head_lr,
        weight_decay=weight_decay
    )
    scheduler_stage1 = CosineAnnealingLR(optimizer_stage1, T_max=max(1, stage1_epochs))

    start_time = time.time()
    current_epoch = 0

    for epoch in range(1, stage1_epochs + 1):
        current_epoch += 1
        t_loss, t_acc = train_one_epoch(
            model, train_loader, criterion, optimizer_stage1, device, epoch, stage1_epochs, "STAGE 1"
        )
        scheduler_stage1.step()

        if val_loader:
            v_loss, v_top1, v_top3 = validate_one_epoch(model, val_loader, criterion, device)
        else:
            v_loss, v_top1, v_top3 = t_loss, t_acc, t_acc

        history["epochs"].append(current_epoch)
        history["train_loss"].append(round(t_loss, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["train_acc"].append(round(t_acc, 2))
        history["val_acc"].append(round(v_top1, 2))
        history["val_top3_acc"].append(round(v_top3, 2))
        history["stage"].append("stage_1")

        print(f"Stage 1 Epoch {epoch:02d}/{stage1_epochs:02d} | "
              f"Train Loss: {t_loss:.4f} | Train Acc: {t_acc:.1f}% | "
              f"Val Loss: {v_loss:.4f} | Val Top-1: {v_top1:.1f}% | Val Top-3: {v_top3:.1f}%")

        if v_top1 > best_val_acc:
            best_val_acc = v_top1
            best_val_loss = v_loss
            save_checkpoint(
                path=str(best_checkpoint_path),
                model=model,
                class_names=class_names,
                class_to_idx=class_to_idx,
                architecture=arch,
                input_size=data_cfg.get("image_size", 224),
                training_config=config,
                epoch=current_epoch,
                val_accuracy=v_top1,
                val_loss=v_loss,
                model_version=model_version
            )

    # ========================================================
    # STAGE 2: Fine-Tuning Entire Network (Unfrozen Backbone)
    # ========================================================
    stage2_epochs = train_cfg.get("stage2_epochs", 4)
    fine_tune_lr = train_cfg.get("fine_tune_lr", 0.00001)

    print("\n=======================================================")
    print(f"STAGE 2: Fine-Tuning Entire Network ({stage2_epochs} Epochs)")
    print(f"Backbone: Unfrozen | Optimizer: AdamW | Fine-Tune LR: {fine_tune_lr}")
    print("=======================================================")

    unfreeze_backbone(model)
    optimizer_stage2 = AdamW(
        model.parameters(),
        lr=fine_tune_lr,
        weight_decay=weight_decay
    )
    scheduler_stage2 = CosineAnnealingLR(optimizer_stage2, T_max=max(1, stage2_epochs))

    for epoch in range(1, stage2_epochs + 1):
        current_epoch += 1
        t_loss, t_acc = train_one_epoch(
            model, train_loader, criterion, optimizer_stage2, device, epoch, stage2_epochs, "STAGE 2"
        )
        scheduler_stage2.step()

        if val_loader:
            v_loss, v_top1, v_top3 = validate_one_epoch(model, val_loader, criterion, device)
        else:
            v_loss, v_top1, v_top3 = t_loss, t_acc, t_acc

        history["epochs"].append(current_epoch)
        history["train_loss"].append(round(t_loss, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["train_acc"].append(round(t_acc, 2))
        history["val_acc"].append(round(v_top1, 2))
        history["val_top3_acc"].append(round(v_top3, 2))
        history["stage"].append("stage_2")

        print(f"Stage 2 Epoch {epoch:02d}/{stage2_epochs:02d} | "
              f"Train Loss: {t_loss:.4f} | Train Acc: {t_acc:.1f}% | "
              f"Val Loss: {v_loss:.4f} | Val Top-1: {v_top1:.1f}% | Val Top-3: {v_top3:.1f}%")

        if v_top1 >= best_val_acc:
            best_val_acc = v_top1
            best_val_loss = v_loss
            save_checkpoint(
                path=str(best_checkpoint_path),
                model=model,
                class_names=class_names,
                class_to_idx=class_to_idx,
                architecture=arch,
                input_size=data_cfg.get("image_size", 224),
                training_config=config,
                epoch=current_epoch,
                val_accuracy=v_top1,
                val_loss=v_loss,
                model_version=model_version
            )

    elapsed_mins = (time.time() - start_time) / 60
    print(f"\n[INFO] Training completed in {elapsed_mins:.1f} minutes.")

    # Save final model checkpoint
    save_checkpoint(
        path=str(final_checkpoint_path),
        model=model,
        class_names=class_names,
        class_to_idx=class_to_idx,
        architecture=arch,
        input_size=data_cfg.get("image_size", 224),
        training_config=config,
        epoch=current_epoch,
        val_accuracy=history["val_acc"][-1],
        val_loss=history["val_loss"][-1],
        model_version=model_version
    )

    # Save training history JSON & plot curves
    history_file = artifacts_dir / "training_history.json"
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"[REPORT] Saved training history to: {history_file}")

    plot_training_curves(history, output_path=str(artifacts_dir / "training_curves.png"))

    # Save model_config.json
    model_config_data = {
        "architecture": arch,
        "model_version": model_version,
        "num_classes": num_classes,
        "input_size": data_cfg.get("image_size", 224),
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "best_val_accuracy": best_val_acc,
        "best_val_loss": best_val_loss,
        "total_training_epochs": current_epoch,
        "confidence_thresholds": config.get("confidence_thresholds", {})
    }
    with open(artifacts_dir / "model_config.json", "w", encoding="utf-8") as f:
        json.dump(model_config_data, f, indent=2)

    # 5. Final Evaluation on Benchmark Test Set
    print("\n[STEP 5/7] Running Full Evaluation on Benchmark Test Set...")
    # Load best checkpoint for test evaluation
    best_ckpt = torch.load(str(best_checkpoint_path), map_location=device)
    model.load_state_dict(best_ckpt["model_state_dict"])
    model.eval()

    eval_loader = test_loader if test_loader is not None else val_loader
    split_name = "test" if test_loader is not None else "val"
    test_metrics = evaluate_model(
        model=model,
        dataloader=eval_loader,
        class_names=class_names,
        device=device,
        top_k=config.get("evaluation", {}).get("top_k", 3),
        artifacts_dir=str(artifacts_dir),
        split_name=split_name
    )

    # 6. Check for External Test Set
    ext_test_dir = Path(data_cfg.get("external_test_dir", "./data/external_test"))
    if ext_test_dir.exists():
        ext_classes = [d for d in ext_test_dir.iterdir() if d.is_dir()]
        ext_imgs = list(ext_test_dir.glob("*/*.*"))
        if len(ext_imgs) > 0:
            print(f"\n[STEP 6/7] Found External Real-World Test Set: {len(ext_imgs)} images across {len(ext_classes)} classes.")
            print("[CRITICAL NOTE] External test results are strictly separated from benchmark test set scores.")
            from torchvision import datasets
            from training.dataset import get_validation_transforms
            ext_dataset = datasets.ImageFolder(
                root=str(ext_test_dir),
                transform=get_validation_transforms(data_cfg.get("image_size", 224))
            )
            ext_loader = torch.utils.data.DataLoader(
                ext_dataset, batch_size=train_cfg.get("batch_size", 32), shuffle=False
            )
            evaluate_model(
                model=model,
                dataloader=ext_loader,
                class_names=ext_dataset.classes,
                device=device,
                top_k=config.get("evaluation", {}).get("top_k", 3),
                artifacts_dir=str(artifacts_dir),
                split_name="external_test"
            )
        else:
            print("\n[STEP 6/7] External test set directory is empty. Skipping external evaluation.")
    else:
        print("\n[STEP 6/7] No external test set directory found.")

    # 7. Optional ONNX Export
    if config.get("artifacts", {}).get("export_onnx", True):
        print("\n[STEP 7/7] Exporting and Validating ONNX Model...")
        onnx_file = artifacts_dir / config.get("artifacts", {}).get("onnx_filename", "cattle_breed_classifier.onnx")
        try:
            from export_onnx import export_and_verify_onnx
            export_and_verify_onnx(
                checkpoint_path=str(best_checkpoint_path),
                output_onnx_path=str(onnx_file),
                device=str(device)
            )
        except Exception as e:
            print(f"[WARNING] ONNX export failed: {e}")

    # Inference Smoke Test
    print("\n---------------- SMOKE TEST ----------------")
    sample_imgs = list(Path(data_root).glob("test/*/*.*")) or list(Path(data_root).glob("val/*/*.*")) or list(Path(data_root).glob("train/*/*.*"))
    if sample_imgs:
        sample_img = sample_imgs[0]
        print(f"Testing inference on sample image: {sample_img}")
        from inference.predictor import predict_image
        smoke_result = predict_image(sample_img, model_path=str(best_checkpoint_path))
        print(f"  Top Prediction : {smoke_result['predictions'][0]['breed']} ({smoke_result['predictions'][0]['confidence']*100:.2f}%)")
        print(f"  Confidence Tier: {smoke_result['confidence_level']}")
        print(f"  Recommendation : {smoke_result['recommendation']}")
        print("[SUCCESS] Inference smoke test completed successfully.")
    print("============================================\n")


def main():
    parser = argparse.ArgumentParser(description="Train cattle and buffalo breed classifier.")
    parser.add_argument("--config", "-c", type=str, default="configs/config.yaml", help="Path to config.yaml")
    args = parser.parse_args()

    run_training(args.config)


if __name__ == "__main__":
    main()
