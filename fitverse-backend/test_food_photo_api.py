import sys
import os
import base64
from fastapi.testclient import TestClient

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

client = TestClient(app)

def test_food_photo_upload():
    print("Testing POST /api/v1/food/upload...")
    dummy_b64 = base64.b64encode(b"fake_jpeg_data").decode("utf-8")
    response = client.post(
        "/api/v1/food/upload",
        json={
            "image_base64": dummy_b64,
            "filename": "paneer_lunch.jpg",
            "consent_to_store": False
        }
    )
    assert response.status_code == 201, f"Upload failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert "image_id" in data
    assert data["is_temporary"] is True
    assert "Not permanently stored" in data["storage_notice"]
    print(f"[PASS] Upload passed! image_id={data['image_id']}")
    return data["image_id"]

def test_analyze_food_image_paneer(image_id):
    print("\nTesting POST /api/v1/food/analyze-image for Paneer Curry...")
    response = client.post(
        "/api/v1/food/analyze-image",
        json={
            "image_id": image_id,
            "meal_hint": "Paneer Curry",
        }
    )
    assert response.status_code == 200, f"Analysis failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert "Paneer" in data["primary_food"]
    assert data["calories"] == 350
    assert data["protein"] == 22.0
    assert data["carbs"] == 12.0
    assert data["fat"] == 24.0
    assert data["confidence_percentage"] == 82
    assert data["disclaimer"] == "Nutrition values are estimated."
    assert data["is_low_confidence"] is False
    print("[PASS] Paneer Curry analysis passed with 82% confidence & disclaimer!")

def test_analyze_indian_meals():
    print("\nTesting Indian meals support (Roti, Dal, Rice, Idli, Dosa, Biryani)...")
    meals = [
        ("Roti", "Roti", 160, 6.0),
        ("Dal", "Dal", 180, 11.0),
        ("Rice", "Rice", 195, 4.2),
        ("Idli", "Idli", 210, 7.5),
        ("Dosa", "Dosa", 280, 6.5),
        ("Biryani", "Biryani", 460, 28.0),
        ("Upma", "Upma", 230, 6.0),
        ("Poha", "Poha", 250, 5.5),
        ("Sabzi", "Sabzi", 170, 4.0),
    ]
    for hint, expected_sub, expected_cal, expected_pro in meals:
        res = client.post(
            "/api/v1/food/analyze-image",
            json={"meal_hint": hint}
        )
        assert res.status_code == 200
        d = res.json()
        assert expected_sub in d["primary_food"], f"Failed for {hint}: got {d['primary_food']}"
        assert d["calories"] == expected_cal
        assert d["protein"] == expected_pro
        assert d["disclaimer"] == "Nutrition values are estimated."
        print(f"  [PASS] {hint}: {d['primary_food']} ({d['calories']} kcal, {d['protein']}g pro, {d['confidence_percentage']}%)")

def test_low_confidence_prompt():
    print("\nTesting Low Confidence detection (<80%) and prompt...")
    res = client.post(
        "/api/v1/food/analyze-image",
        json={"meal_hint": "unknown obscure street food"}
    )
    assert res.status_code == 200
    d = res.json()
    assert d["is_low_confidence"] is True
    assert d["confidence"] < 0.80
    assert d["review_prompt"] is not None
    assert "confirm food" in d["review_prompt"].lower() or "edit" in d["review_prompt"].lower()
    assert d["disclaimer"] == "Nutrition values are estimated."
    print(f"[PASS] Low confidence flagged correctly: conf={d['confidence_percentage']}%, prompt='{d['review_prompt']}'")

def test_log_and_update_nutrition():
    print("\nTesting logging confirmed food and updating daily nutrition...")
    # Log the confirmed meal
    res = client.post(
        "/api/v1/food/log",
        json={
            "food_name": "Paneer Curry",
            "quantity": 1.0,
            "quantity_unit": "150g",
            "meal_type": "Lunch",
            "calories": 350,
            "protein": 22.0,
            "carbs": 12.0,
            "fat": 24.0,
            "fiber": 4.0
        }
    )
    assert res.status_code == 201, f"Log failed: {res.text}"
    log_data = res.json()
    assert log_data["success"] is True
    assert log_data["meal"]["food_name"] == "Paneer Curry"
    assert log_data["meal"]["calories"] == 350

    # Verify /food/today reflects updated totals
    today_res = client.get("/api/v1/food/today")
    assert today_res.status_code == 200
    today_data = today_res.json()
    assert today_data["total"]["calories"] >= 350
    assert today_data["total"]["protein"] >= 22.0
    print("[PASS] Confirmed meal logged to food_logs and /food/today nutrition updated!")

if __name__ == "__main__":
    print("========================================")
    print("RUNNING PHASE 6 FOOD PHOTO & VISION TESTS")
    print("========================================")
    img_id = test_food_photo_upload()
    test_analyze_food_image_paneer(img_id)
    test_analyze_indian_meals()
    test_low_confidence_prompt()
    test_log_and_update_nutrition()
    print("\n========================================")
    print("ALL PHASE 6 FOOD PHOTO & VISION TESTS PASSED!")
    print("========================================")
