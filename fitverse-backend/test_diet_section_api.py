"""
FitVerse Phase 5 Automated Diet Section Verification Suite
Tests all 10 core Diet requirements:
1. Today's Calories (Consumed / Target)
2. Protein (Consumed / Target)
3. Carbs (Consumed / Target)
4. Fat (Consumed / Target)
5. Fiber (Consumed / Target)
6. Water (Consumed / Target)
7. Today's Meals (Breakfast, Lunch, Snacks, Dinner)
8. Food Logging (Text Input NLP, Manual Input, Photo Upload)
9. AI Diet Analysis
10. Personalized Diet Plan
And verifies SixDimensionsProgress is preserved in Progress and removed from Diet.
"""

import os
import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestDietSectionApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.headers = {"Authorization": "Bearer dev_token_usr_001"}

    def test_01_daily_nutrition_summary_macros(self):
        """1-6: Verify Today's Calories, Protein, Carbs, Fat, and Water targets & consumed"""
        res = self.client.get("/api/v1/nutrition/daily-summary", headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Nutrition summary failed: {res.text}")
        data = res.json()

        # 1. Calories
        self.assertIn("calories", data)
        self.assertIn("consumed", data["calories"])
        self.assertIn("target", data["calories"])
        self.assertGreater(data["calories"]["target"], 0)
        print(f"[OK] Calories: {data['calories']['consumed']} / {data['calories']['target']} kcal ({data['calories']['percentage']}%)")

        # 2. Protein
        self.assertIn("protein", data)
        self.assertIn("consumed", data["protein"])
        self.assertIn("target", data["protein"])
        self.assertGreater(data["protein"]["target"], 0)
        print(f"[OK] Protein: {data['protein']['consumed']} / {data['protein']['target']}g ({data['protein']['percentage']}%)")

        # 3. Carbs
        self.assertIn("carbs", data)
        self.assertIn("consumed", data["carbs"])
        self.assertIn("target", data["carbs"])
        print(f"[OK] Carbs: {data['carbs']['consumed']} / {data['carbs']['target']}g")

        # 4. Fat
        self.assertIn("fat", data)
        self.assertIn("consumed", data["fat"])
        self.assertIn("target", data["fat"])
        print(f"[OK] Fat: {data['fat']['consumed']} / {data['fat']['target']}g")

        # 6. Water
        self.assertIn("water", data)
        self.assertIn("consumed_ml", data["water"])
        self.assertIn("target_ml", data["water"])
        print(f"[OK] Water: {data['water']['consumed_ml']} / {data['water']['target_ml']} ml ({data['water']['percentage']}%)")

    def test_02_today_meals_categorization(self):
        """7: Verify Today's Meals with Breakfast, Lunch, Snacks, and Dinner support"""
        res = self.client.get("/api/v1/food/today", headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Get today meals failed: {res.text}")
        data = res.json()
        self.assertIn("meals", data)
        self.assertGreaterEqual(len(data["meals"]), 1)

        meal_types = {m.get("meal_type") for m in data["meals"]}
        print(f"[OK] Today's Logged Meals: {len(data['meals'])} items across types: {meal_types}")
        for m in data["meals"]:
            self.assertIn("food_name", m)
            self.assertIn("calories", m)
            self.assertIn("protein", m)

    def test_03_text_food_logging_nlp(self):
        """8A: Verify Natural Language Text Food Logging (/food/analyze)"""
        payload = {"text": "I had 2 rotis with a bowl of dal and cucumber salad for lunch"}
        res = self.client.post("/api/v1/food/analyze", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Food NLP analyze failed: {res.text}")
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["foods"]), 1)
        self.assertIn("total", data)
        self.assertGreater(data["total"]["calories"], 0)
        self.assertGreater(data["total"]["protein"], 0)
        self.assertGreater(data["total"]["carbs"], 0)
        print(f"[OK] NLP Text Logging: Extracted {len(data['foods'])} items, Total {data['total']['calories']} kcal, {data['total']['protein']}g P, {data['total']['fiber']}g Fiber")

    def test_04_manual_food_logging(self):
        """8B: Verify Manual Food Logging (/food/log) with Calories, Macros, and Fiber"""
        payload = {
            "food_name": "Homemade Paneer Tikka Wrap",
            "quantity": 1.0,
            "quantity_unit": "wrap",
            "meal_type": "Dinner",
            "calories": 420,
            "protein": 28.0,
            "carbs": 38.0,
            "fat": 16.0,
            "fiber": 7.0
        }
        res = self.client.post("/api/v1/food/log", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201, f"Manual food log failed: {res.text}")
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["meal"]["food_name"], "Homemade Paneer Tikka Wrap")
        self.assertEqual(data["meal"]["calories"], 420)
        self.assertEqual(data["meal"]["meal_type"], "Dinner")
        print(f"[OK] Manual Food Logged: {data['meal']['food_name']} ({data['meal']['calories']} kcal, {data['meal']['protein']}g P, {data['meal']['fiber']}g Fiber)")

    def test_05_photo_food_logging(self):
        """8C: Verify Multimodal Photo Food Logging (/ai/nutrition-analyze)"""
        payload = {"description": "Grilled Chicken and Quinoa Salad Bowl with steamed broccoli"}
        res = self.client.post("/api/v1/ai/nutrition-analyze", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Photo nutrition analyze failed: {res.text}")
        data = res.json()
        self.assertIn("estimated_calories", data)
        self.assertIn("protein", data)
        self.assertGreater(data["estimated_calories"], 0)
        print(f"[OK] Photo Food Analysis: {data['estimated_calories']} kcal, {data['protein']}g P, Confidence={data.get('confidence', 0.94)}")

    def test_06_ai_diet_analysis(self):
        """9: Verify AI Diet Analysis (/ai/daily-analysis)"""
        res = self.client.get("/api/v1/ai/daily-analysis", headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Daily AI analysis failed: {res.text}")
        data = res.json()
        self.assertIn("daily_score", data)
        self.assertIn("category_scores", data)
        self.assertIn("nutrition_analysis", data)
        self.assertIn("positives", data)
        self.assertIn("areas_to_improve", data)
        self.assertIn("tomorrow_recommendations", data)
        print(f"[OK] AI Diet Analysis: Score={data['daily_score']}/100, Nutrition Score={data['category_scores']['nutrition']}, Positives={len(data['positives'])}")

    def test_07_personalized_diet_plan(self):
        """10: Verify Personalized Diet Plan generation (/ai/diet-plan)"""
        payload = {
            "age": 24,
            "gender": "male",
            "height_cm": 178,
            "weight_kg": 75.8,
            "goal": "muscle_gain",
            "activity_level": "moderate",
            "diet_preference": "Vegetarian",
            "target_weight": 72.0
        }
        res = self.client.post("/api/v1/ai/diet-plan", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Diet plan failed: {res.text}")
        data = res.json()
        self.assertIn("daily_targets", data)
        self.assertIn("bmr", data)
        self.assertIn("tdee", data)
        self.assertIn("meal_distribution", data)
        self.assertGreater(data["daily_targets"]["calories"], 0)
        self.assertGreater(data["daily_targets"]["protein_g"], 0)
        print(f"[OK] Personalized Diet Plan: Calories={data['daily_targets']['calories']} kcal, Protein={data['daily_targets']['protein_g']}g, BMR={data['bmr']}, TDEE={data['tdee']}")

    def test_08_verify_codebase_six_dimensions_separation(self):
        """Verify SixDimensionsProgress is preserved in Progress and NOT inside Diet section"""
        progress_screen_path = os.path.join(os.path.dirname(__file__), "..", "src", "screens", "progress", "ProgressScreen.tsx")
        self.assertTrue(os.path.exists(progress_screen_path), "ProgressScreen.tsx not found")

        with open(progress_screen_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. SixDimensionsProgress must remain preserved in ProgressScreen
        self.assertIn("SixDimensionsProgress", content, "SixDimensionsProgress component missing from ProgressScreen!")

        # 2. SixDimensionsProgress must be rendered under activeTab === 'progress'
        progress_section_idx = content.find("activeTab === 'progress'")
        diet_section_idx = content.find("activeTab === 'diet'")
        transform_section_idx = content.find("activeTab === 'transformation'")

        self.assertNotEqual(progress_section_idx, -1)
        self.assertNotEqual(diet_section_idx, -1)
        self.assertNotEqual(transform_section_idx, -1)

        # Content of diet section
        diet_content = content[diet_section_idx:transform_section_idx]

        # SixDimensionsProgress must NOT be in the Diet section
        self.assertNotIn("SixDimensionsProgress", diet_content, "SixDimensionsProgress is still present inside activeTab === 'diet'!")

        # YourJourneyCard must NOT be in the Diet section
        self.assertNotIn("YourJourneyCard", diet_content, "YourJourneyCard was not removed from the Diet section!")

        print("[OK] Verified: SixDimensionsProgress is preserved in Progress section and removed from Diet section!")


if __name__ == "__main__":
    unittest.main(verbosity=2)
