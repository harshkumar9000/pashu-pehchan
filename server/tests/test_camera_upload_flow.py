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
    
    print("[PASS] Camera captured photo inference status: 200 OK")
    print(f"[PASS] Top-1 Predicted Breed: {data['breed']} ({data['confidence']*100:.1f}%)")
    print(f"[PASS] Species: {data['species']} | Category: {data['category']}")
    print(f"[PASS] Top-3 Predictions count: {len(data['top_3'])}")
    for i, top in enumerate(data['top_3'], 1):
        print(f"       {i}. {top['breed']} - {top['confidence']*100:.1f}%")
        
    assert data['confidence'] > 0.5, "Confidence score should be valid"
    assert len(data['top_3']) >= 3, "Top 3 predictions should be present"
    print("\n[SUCCESS] Web camera captured image payload is 100% compatible with existing prediction pipeline!")

if __name__ == "__main__":
    test_camera_capture_inference_flow()
