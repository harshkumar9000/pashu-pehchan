"""
export_onnx.py
Exports a trained PyTorch breed classification model checkpoint to ONNX format.
Validates the ONNX graph with onnx.checker and tests numerical equivalence
against PyTorch predictions using ONNX Runtime.
"""

import sys
import argparse
from pathlib import Path
import numpy as np
import torch

from training.model import build_model


def export_and_verify_onnx(
    checkpoint_path: str = "./artifacts/best_model.pth",
    output_onnx_path: str = "./artifacts/cattle_breed_classifier.onnx",
    device: str = "cpu"
) -> bool:
    """
    Exports model checkpoint to ONNX and validates using onnxruntime.
    Returns True on success.
    """
    try:
        import onnx  # type: ignore
        import onnxruntime as ort  # type: ignore
    except ImportError:
        print("[WARNING] 'onnx' or 'onnxruntime' not installed. Install via: pip install onnx onnxruntime")
        return False

    ckpt_path = Path(checkpoint_path)
    out_path = Path(output_onnx_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not ckpt_path.exists():
        print(f"[ERROR] Checkpoint file does not exist: {ckpt_path}")
        return False

    print(f"\n=======================================================")
    print(f"EXPORTING MODEL TO ONNX: {ckpt_path.name}")
    print(f"Target ONNX File        : {out_path}")
    print(f"=======================================================")

    # Load PyTorch checkpoint on CPU
    checkpoint = torch.load(str(ckpt_path), map_location="cpu")
    class_names = checkpoint.get("class_names", [])
    architecture = checkpoint.get("architecture", "efficientnet_b0")
    input_size = checkpoint.get("input_size", 224)

    if not class_names:
        print("[ERROR] Checkpoint missing 'class_names'.")
        return False

    # Reconstruct Model
    model = build_model(
        architecture=architecture,
        num_classes=len(class_names),
        pretrained=False
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Create Dummy Input Tensor
    dummy_input = torch.randn(1, 3, input_size, input_size, dtype=torch.float32)

    # Export to ONNX
    print("[1/3] Exporting PyTorch graph to ONNX...")
    torch.onnx.export(
        model,
        dummy_input,
        str(out_path),
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "logits": {0: "batch_size"}
        }
    )
    print(f"[SUCCESS] ONNX file exported ({out_path.stat().st_size / (1024**2):.2f} MB).")

    # Verify ONNX model with onnx.checker
    print("[2/3] Checking ONNX model integrity with onnx.checker...")
    onnx_model = onnx.load(str(out_path))
    onnx.checker.check_model(onnx_model)
    print("[SUCCESS] ONNX graph is valid and well-formed.")

    # Run ONNX Runtime verification test
    print("[3/3] Running inference equivalence test with ONNX Runtime...")
    ort_session = ort.InferenceSession(str(out_path), providers=["CPUExecutionProvider"])

    # PyTorch reference output
    with torch.no_grad():
        torch_out = model(dummy_input).numpy()

    # ONNX Runtime output
    ort_inputs = {ort_session.get_inputs()[0].name: dummy_input.numpy()}
    ort_outs = ort_session.run(None, ort_inputs)
    onnx_out = ort_outs[0]

    # Check maximum absolute difference
    max_diff = float(np.max(np.abs(torch_out - onnx_out)))
    print(f"  Maximum absolute difference: {max_diff:.6f}")

    if max_diff < 1e-3:
        print("[SUCCESS] PyTorch and ONNX Runtime predictions match within numerical tolerance!")
        print(f"[EXPORT COMPLETE] Model successfully validated at: {out_path}\n")
        return True
    else:
        print(f"[WARNING] Difference between PyTorch and ONNX is higher than expected: {max_diff}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Export PyTorch checkpoint to validated ONNX format.")
    parser.add_argument("--model", "-m", type=str, default="./artifacts/best_model.pth",
                        help="Path to trained PyTorch model checkpoint (.pth)")
    parser.add_argument("--output", "-o", type=str, default="./artifacts/cattle_breed_classifier.onnx",
                        help="Path for exported ONNX file")
    args = parser.parse_args()

    success = export_and_verify_onnx(
        checkpoint_path=args.model,
        output_onnx_path=args.output
    )
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
