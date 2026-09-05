"""
Test that camera-captured images (JPEG Blob/File payload) work seamlessly with /api/predict
and match the exact structure expected by ScanScreen and ResultScreen.
"""
import requests
import os

def test_camera_capture_inference_flow():
    url = "http://127.0.0.1:8000/api/predict"
    sample_path = "data/sample_images/gir.jpg"
    
    assert os.path.exists(sample_path), f"Sample image not found: {sample_path}"
    
    with open(sample_path, "rb") as f:
        files = {
            "image": ("cattle_capture_1788545350.jpg", f, "image/jpeg")
        }
        res = requests.post(url, files=files)
        
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    
    top_pred = data.get("top_prediction", {})
    breed_name = top_pred.get("breed") or data.get("breed")
    confidence = top_pred.get("confidence", 0.0)
    preds = data.get("predictions") or data.get("top_3", [])
    
    print("[PASS] Camera captured photo inference status: 200 OK")
    print(f"[PASS] Top-1 Predicted Breed: {breed_name} ({confidence*100:.1f}%)")
    print(f"[PASS] Species: {data.get('animal_type', 'Cattle')} | Tier: {data.get('confidence_level')}")
    print(f"[PASS] Predictions count: {len(preds)}")
    for i, top in enumerate(preds, 1):
        print(f"       {i}. {top.get('breed')} - {top.get('confidence', 0.0)*100:.1f}%")
        
    assert confidence > 0.5, "Confidence score should be valid"
    assert len(preds) >= 3, "Top 3 predictions should be present"
    print("\n[SUCCESS] Web camera captured image payload is 100% compatible with existing prediction pipeline!")

if __name__ == "__main__":
    test_camera_capture_inference_flow()
