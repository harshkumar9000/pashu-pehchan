"""
test_pipeline.py
Automated test suite verifying the integrity and functionality of the entire
machine-learning pipeline: models, transforms, inference adapter, predictions,
and evaluation metrics.
"""

import unittest
from pathlib import Path
import torch
from PIL import Image

from training.model import build_model, freeze_backbone, unfreeze_backbone, get_parameter_counts
from training.dataset import get_training_transforms, get_validation_transforms
from inference.adapter import EfficientNetModelAdapter
from inference.predictor import predict_pil_image
from audit_dataset import verify_image


class TestModelArchitecture(unittest.TestCase):
    def test_build_efficientnet_b0(self):
        model = build_model("efficientnet_b0", num_classes=41, pretrained=False)
        self.assertEqual(model.num_classes, 41)
        self.assertEqual(model.architecture_name, "efficientnet_b0")
        
        # Test forward pass shape
        dummy_input = torch.randn(2, 3, 224, 224)
        output = model(dummy_input)
        self.assertEqual(output.shape, (2, 41))

    def test_freeze_and_unfreeze_backbone(self):
        model = build_model("efficientnet_b0", num_classes=41, pretrained=False)
        freeze_backbone(model)
        trainable_frozen, total = get_parameter_counts(model)
        self.assertLess(trainable_frozen, total)
        # Only classifier head is trainable
        self.assertEqual(trainable_frozen, 1280 * 41 + 41)

        unfreeze_backbone(model)
        trainable_unfrozen, _ = get_parameter_counts(model)
        self.assertEqual(trainable_unfrozen, total)


class TestTransformsAndData(unittest.TestCase):
    def test_transforms_output_shape(self):
        train_tf = get_training_transforms(image_size=224)
        val_tf = get_validation_transforms(image_size=224)

        img = Image.new("RGB", (300, 400), color=(120, 80, 50))
        t_tensor = train_tf(img)
        v_tensor = val_tf(img)

        self.assertEqual(t_tensor.shape, (3, 224, 224))
        self.assertEqual(v_tensor.shape, (3, 224, 224))


class TestAuditVerification(unittest.TestCase):
    def test_blank_image_detection(self):
        scratch_dir = Path("artifacts/test_scratch")
        scratch_dir.mkdir(parents=True, exist_ok=True)
        blank_img_path = scratch_dir / "blank_test.png"
        
        # Create pure white blank image
        img = Image.new("RGB", (100, 100), color=(255, 255, 255))
        img.save(blank_img_path)

        is_valid, msg, _ = verify_image(blank_img_path)
        self.assertFalse(is_valid)
        self.assertIn("Near-blank", msg)

        # Cleanup
        blank_img_path.unlink(missing_ok=True)


class TestInferenceAdapter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model_path = Path("artifacts/best_model.pth")
        if not cls.model_path.exists():
            raise unittest.SkipTest("artifacts/best_model.pth not found, skipping inference test.")

    def test_prediction_output_structure(self):
        img = Image.new("RGB", (250, 250), color=(100, 150, 200))
        result = predict_pil_image(img, model_path=str(self.model_path), top_k=3)

        self.assertIn("predictions", result)
        self.assertEqual(len(result["predictions"]), 3)
        self.assertIn("confidence_level", result)
        self.assertIn("recommendation", result)
        self.assertIn("model_version", result)
        self.assertIn("architecture", result)

        # Probabilities sum to <= 1.0
        confs = [p["confidence"] for p in result["predictions"]]
        self.assertGreaterEqual(confs[0], confs[1])
        self.assertGreaterEqual(confs[1], confs[2])

    def test_confidence_tiers(self):
        adapter = EfficientNetModelAdapter(checkpoint_path=str(self.model_path))
        level, rec = adapter._determine_confidence_level(0.85)
        self.assertEqual(level, "HIGH")
        self.assertIn("High model confidence", rec)

        level, rec = adapter._determine_confidence_level(0.55)
        self.assertEqual(level, "MEDIUM")
        self.assertIn("Moderate confidence", rec)

        level, rec = adapter._determine_confidence_level(0.35)
        self.assertEqual(level, "LOW")
        self.assertIn("Low confidence", rec)

        level, rec = adapter._determine_confidence_level(0.10)
        self.assertEqual(level, "UNKNOWN")
        self.assertIn("manual verification required", rec)


if __name__ == "__main__":
    unittest.main(verbosity=2)
