"""
training/evaluate.py
Multi-metric evaluation engine: Top-1, Top-3, Macro/Weighted F1,
10 weakest classes, confusion matrix plot, and detailed errors.csv.
"""

import json
import csv
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import (
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)
import matplotlib.pyplot as plt


@torch.no_grad()
def evaluate_model(
    model: nn.Module,
    dataloader: DataLoader,
    class_names: List[str],
    device: torch.device,
    top_k: int = 3,
    artifacts_dir: str = "./artifacts",
    split_name: str = "test",
    save_artifacts: bool = True
) -> Dict[str, Any]:
    """
    Runs comprehensive evaluation on a dataloader.
    Returns a dictionary of all calculated metrics and exports reports.
    """
    model.eval()
    all_targets = []
    all_pred_top1 = []
    all_probs = []
    all_image_paths = []

    # Check if dataset exposes file paths
    dataset_samples = getattr(dataloader.dataset, "samples", None)

    sample_idx = 0
    for images, targets in dataloader:
        images = images.to(device)
        targets = targets.to(device)

        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)

        _, preds = torch.max(outputs, 1)

        batch_size = targets.size(0)
        all_targets.extend(targets.cpu().numpy().tolist())
        all_pred_top1.extend(preds.cpu().numpy().tolist())
        all_probs.append(probs.cpu().numpy())

        # Collect image file paths if available
        if dataset_samples is not None:
            for i in range(batch_size):
                if sample_idx < len(dataset_samples):
                    all_image_paths.append(dataset_samples[sample_idx][0])
                else:
                    all_image_paths.append(f"sample_{sample_idx}")
                sample_idx += 1
        else:
            for i in range(batch_size):
                all_image_paths.append(f"sample_{sample_idx}")
                sample_idx += 1

    all_targets = np.array(all_targets)
    all_pred_top1 = np.array(all_pred_top1)
    all_probs = np.vstack(all_probs)  # Shape: (N, num_classes)

    total_samples = len(all_targets)
    num_classes = len(class_names)

    # 1. Top-1 Accuracy
    top1_correct = np.sum(all_pred_top1 == all_targets)
    top1_acc = float((top1_correct / total_samples) * 100)

    # 2. Top-K Accuracy
    k = min(top_k, num_classes)
    top_k_indices = np.argsort(all_probs, axis=1)[:, -k:][:, ::-1]  # Sort descending
    top_k_correct = np.any(top_k_indices == all_targets[:, None], axis=1)
    top_k_acc = float((np.sum(top_k_correct) / total_samples) * 100)

    # 3. Macro and Weighted Metrics
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        all_targets, all_pred_top1, average="macro", zero_division=0
    )
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(
        all_targets, all_pred_top1, average="weighted", zero_division=0
    )

    # 4. Per-Class Metrics
    per_class_p, per_class_r, per_class_f1, per_class_support = precision_recall_fscore_support(
        all_targets, all_pred_top1, average=None, labels=list(range(num_classes)), zero_division=0
    )

    class_metrics = {}
    for idx, name in enumerate(class_names):
        class_metrics[name] = {
            "precision": float(per_class_p[idx]),
            "recall": float(per_class_r[idx]),
            "f1_score": float(per_class_f1[idx]),
            "support": int(per_class_support[idx])
        }

    # Identify 10 weakest classes by F1
    sorted_by_f1 = sorted(class_metrics.items(), key=lambda x: (x[1]["f1_score"], -x[1]["support"]))
    weakest_10 = sorted_by_f1[:10]

    # Full Classification Report String
    clf_report_str = classification_report(
        all_targets, all_pred_top1,
        target_names=class_names,
        labels=list(range(num_classes)),
        zero_division=0
    )

    # 5. Error Analysis CSV
    errors = []
    for i in range(total_samples):
        true_idx = all_targets[i]
        pred_idx = all_pred_top1[i]
        if true_idx != pred_idx:
            # Top-3 predictions
            top3 = top_k_indices[i][:3]
            c1 = float(all_probs[i][top3[0]])
            c2 = float(all_probs[i][top3[1]]) if len(top3) > 1 else 0.0
            c3 = float(all_probs[i][top3[2]]) if len(top3) > 2 else 0.0

            img_name = Path(all_image_paths[i]).name if all_image_paths else f"img_{i}"
            errors.append({
                "image": img_name,
                "full_path": all_image_paths[i] if all_image_paths else "",
                "true_class": class_names[true_idx],
                "predicted_class": class_names[pred_idx],
                "confidence": round(c1, 4),
                "second_prediction": f"{class_names[top3[1]]} ({c2:.4f})" if len(top3) > 1 else "None",
                "third_prediction": f"{class_names[top3[2]]} ({c3:.4f})" if len(top3) > 2 else "None"
            })

    # Summary dictionary
    results = {
        "split": split_name,
        "total_samples": total_samples,
        "num_classes": num_classes,
        "top1_accuracy": round(top1_acc, 2),
        f"top{k}_accuracy": round(top_k_acc, 2),
        "macro_precision": round(float(macro_p) * 100, 2),
        "macro_recall": round(float(macro_r) * 100, 2),
        "macro_f1": round(float(macro_f1) * 100, 2),
        "weighted_f1": round(float(weighted_f1) * 100, 2),
        "weakest_10_classes": [{"breed": name, "f1_score": round(data["f1_score"] * 100, 2), "support": data["support"]} for name, data in weakest_10],
        "total_errors": len(errors)
    }

    # Print summary
    print(f"\n=======================================================")
    print(f"EVALUATION REPORT: {split_name.upper()} SET")
    print(f"=======================================================")
    print(f"Total Samples Evaluated: {total_samples}")
    print(f"Top-1 Accuracy         : {results['top1_accuracy']}%")
    print(f"Top-{k} Accuracy         : {results[f'top{k}_accuracy']}%")
    print(f"Macro Precision        : {results['macro_precision']}%")
    print(f"Macro Recall           : {results['macro_recall']}%")
    print(f"Macro F1-Score         : {results['macro_f1']}%")
    print(f"Weighted F1-Score      : {results['weighted_f1']}%")
    print(f"Total Misclassifications: {len(errors)} / {total_samples}")

    print(f"\nWeakest 10 Breeds by F1-Score:")
    for item in results["weakest_10_classes"]:
        print(f"  - {item['breed']:<25}: F1 = {item['f1_score']:>5.1f}% (Support: {item['support']})")
    print("=======================================================\n")

    if save_artifacts:
        art_dir = Path(artifacts_dir)
        art_dir.mkdir(parents=True, exist_ok=True)

        # 1. Save metrics.json
        metrics_file = art_dir / f"metrics_{split_name}.json" if split_name != "test" else art_dir / "metrics.json"
        with open(metrics_file, "w", encoding="utf-8") as f:
            json.dump({**results, "per_class_metrics": class_metrics}, f, indent=2)
        print(f"[REPORT] Saved metrics JSON to: {metrics_file}")

        # 2. Save classification_report.txt
        clf_file = art_dir / f"classification_report_{split_name}.txt" if split_name != "test" else art_dir / "classification_report.txt"
        with open(clf_file, "w", encoding="utf-8") as f:
            f.write(f"Cattle & Buffalo Breed Classification Report - {split_name.upper()}\n")
            f.write(f"Top-1 Accuracy: {results['top1_accuracy']}%\n")
            f.write(f"Top-{k} Accuracy: {results[f'top{k}_accuracy']}%\n")
            f.write(f"Macro F1: {results['macro_f1']}%\n\n")
            f.write(clf_report_str)
        print(f"[REPORT] Saved classification report text to: {clf_file}")

        # 3. Save errors.csv
        errors_file = art_dir / f"errors_{split_name}.csv" if split_name != "test" else art_dir / "errors.csv"
        fieldnames = ["image", "true_class", "predicted_class", "confidence", "second_prediction", "third_prediction", "full_path"]
        with open(errors_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(errors)
        print(f"[REPORT] Saved error analysis CSV to: {errors_file} ({len(errors)} error rows)")

        # 4. Save Confusion Matrix Plot
        plot_confusion_matrix(
            all_targets,
            all_pred_top1,
            class_names,
            output_path=str(art_dir / f"confusion_matrix_{split_name}.png" if split_name != "test" else art_dir / "confusion_matrix.png")
        )

    return results


def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: List[str],
    output_path: str
) -> None:
    """
    Plots and saves a normalized confusion matrix visualization.
    """
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))
    # Normalize row-wise (recall per class)
    with np.errstate(all='ignore'):
        cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        cm_norm = np.nan_to_num(cm_norm)

    fig_size = max(10, len(class_names) * 0.25)
    fig, ax = plt.subplots(figsize=(fig_size, fig_size))
    cax = ax.matshow(cm_norm, cmap=plt.cm.Blues, vmin=0, vmax=1)
    plt.title('Normalized Confusion Matrix (Recall per Breed)', fontsize=14, pad=20, fontweight='bold')
    fig.colorbar(cax, fraction=0.046, pad=0.04)

    # Tick marks
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=90, fontsize=7)
    ax.set_yticklabels(class_names, fontsize=7)

    plt.xlabel('Predicted Breed', fontsize=11, labelpad=10)
    plt.ylabel('True Breed', fontsize=11, labelpad=10)
    plt.tight_layout()

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_file, dpi=180)
    plt.close()
    print(f"[PLOT] Confusion matrix plot saved to: {out_file}")
