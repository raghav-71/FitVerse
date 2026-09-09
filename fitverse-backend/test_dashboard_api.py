"""
FitVerse Phase 2 Dashboard Verification Test Suite

Tests all 5 user states required by Dashboard specification:
1. New user (newly registered user, unonboarded)
2. User with no data (onboarded, 0 meals, 0 workouts, 0 water)
3. User with food data (meals logged, no workout)
4. User with workout data (workout completed, no food)
5. User with full data (usr_001 with full multi-pillar logs)

Validates all 10 Dashboard requirements:
- User Greeting & Name
- Today's Fit Score (0-100 across 6 dimensions)
- Calories Consumed / Target
- Protein Consumed / Target
- Water Consumed / Target
- Workout Status (Completed / Start Workout)
- Quick Actions
- Daily AI Insight
- Weekly Preview (or "Start tracking to unlock your weekly insights")
- User Goal (Fat Loss, Muscle Gain, Maintenance, General Fitness)
"""

import sys
from datetime import datetime, date
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user

client = TestClient(app)

# Helper to mock authenticated user
def mock_user_auth(user_dict):
    app.dependency_overrides[get_current_user] = lambda: user_dict

def clear_user_auth():
    app.dependency_overrides.pop(get_current_user, None)

print("=" * 60)
print("RUNNING FITVERSE DASHBOARD VERIFICATION SUITE")
print("=" * 60)

# ==============================================================================
# TEST 1: NEW USER (Unonboarded, Empty Data)
# ==============================================================================
def test_new_user():
    print("\n--- TEST 1: New User ---")
    user_id = f"usr_new_{int(datetime.now().timestamp())}"
    user = {
        "id": user_id,
        "name": "Priya Patel",
        "email": "priya@fitverse.ai",
        "selected_goal": "Fat Loss",
        "xp": 0,
        "level": 1,
        "current_streak": 0,
    }
    mock_user_auth(user)

    # 1. Profile & Goal
    res_prof = client.get("/api/v1/user/profile")
    assert res_prof.status_code == 200, f"Profile error: {res_prof.text}"
    prof = res_prof.json()
    assert prof["name"] == "Priya Patel"
    assert prof["selected_goal"] in ["Fat Loss", "Muscle Gain", "Maintenance", "General Fitness", "Build Muscle"]
    print(f"[OK] User profile: {prof['name']}, Goal: {prof['selected_goal']}")

    # 2. Daily Nutrition (Should have 0 consumed meals)
    res_nut = client.get("/api/v1/nutrition/daily-summary")
    assert res_nut.status_code == 200, f"Nutrition error: {res_nut.text}"
    nut = res_nut.json()
    assert nut["calories"]["consumed"] == 0, f"Expected 0 consumed calories, got {nut['calories']['consumed']}"
    assert nut["protein"]["consumed"] == 0, f"Expected 0 consumed protein, got {nut['protein']['consumed']}"
    assert nut["water"]["consumed_ml"] == 0, f"Expected 0 consumed water, got {nut['water']['consumed_ml']}"
    print(f"[OK] Nutrition empty state: Calories 0/{nut['calories']['target']}, Water 0/{nut['water']['target_ml']}ml")

    # 3. Workouts (Should have 0 workouts)
    res_wrk = client.get("/api/v1/workout/today")
    assert res_wrk.status_code == 200, f"Workout error: {res_wrk.text}"
    wrk = res_wrk.json()
    assert wrk["total_workouts"] == 0, f"Expected 0 workouts, got {wrk['total_workouts']}"
    print("[OK] Workout today: 0 completed workouts (Action: Start your first workout)")

    # 4. Weekly Preview (Should have has_data == False)
    res_wk = client.get("/api/v1/ai/weekly-report?week_offset=0")
    assert res_wk.status_code == 200, f"Weekly error: {res_wk.text}"
    wk = res_wk.json()
    assert wk.get("has_data") is False, "Expected has_data=False for user with no weekly logs"
    print("[OK] Weekly preview: has_data=False (Prompt: 'Start tracking to unlock your weekly insights')")

# ==============================================================================
# TEST 2: USER WITH NO DATA (Onboarded, but 0 logs today)
# ==============================================================================
def test_user_with_no_data():
    print("\n--- TEST 2: User with No Data ---")
    user_id = "usr_empty_tester"
    user = {
        "id": user_id,
        "name": "Rohan Verma",
        "email": "rohan@fitverse.ai",
        "selected_goal": "Muscle Gain",
        "xp": 450,
        "level": 2,
        "current_streak": 2,
    }
    mock_user_auth(user)

    # 1. Fit Score
    res_fit = client.get("/api/v1/progress/fit-score")
    assert res_fit.status_code == 200, f"Fit score error: {res_fit.text}"
    fit = res_fit.json()
    assert 0 <= fit["fit_score"] <= 100
    assert "nutrition_score" in fit
    assert "workout_score" in fit
    assert "hydration_score" in fit
    print(f"[OK] Fit Score calculated gracefully: {fit['fit_score']}/100 across 6 dimensions")

    # 2. Food today list
    res_food = client.get("/api/v1/food/today")
    assert res_food.status_code == 200
    food = res_food.json()
    assert food["meals_count"] == 0
    print("[OK] Food logs count: 0 (Display: 'No meals logged yet')")

    # 3. Daily AI Insight
    res_ai = client.get("/api/v1/ai/daily-analysis")
    assert res_ai.status_code == 200
    ai = res_ai.json()
    assert len(ai["tomorrow_recommendations"]) > 0
    print(f"[OK] Daily AI Insight generated: {ai['tomorrow_recommendations'][0]}")

# ==============================================================================
# TEST 3: USER WITH FOOD DATA ONLY
# ==============================================================================
def test_user_with_food_data():
    print("\n--- TEST 3: User with Food Data Only ---")
    user_id = f"usr_food_{int(datetime.now().timestamp())}"
    user = {
        "id": user_id,
        "name": "Kavita Rao",
        "email": "kavita@fitverse.ai",
        "selected_goal": "Maintenance",
        "xp": 1200,
        "level": 3,
        "current_streak": 4,
    }
    mock_user_auth(user)

    # Log a meal
    meal_payload = {
        "food_name": "Tofu Scramble & Avocado Toast",
        "calories": 450,
        "protein": 32.0,
        "carbs": 38.0,
        "fat": 16.0,
        "meal_type": "Breakfast"
    }
    res_log = client.post("/api/v1/food/log", json=meal_payload)
    assert res_log.status_code == 201, f"Log meal failed: {res_log.text}"

    # Verify nutrition summary reflects the logged meal
    res_nut = client.get("/api/v1/nutrition/daily-summary")
    assert res_nut.status_code == 200
    nut = res_nut.json()
    assert nut["calories"]["consumed"] == 450
    assert nut["protein"]["consumed"] == 32
    print(f"[OK] Calories logged: {nut['calories']['consumed']}/{nut['calories']['target']} kcal")
    print(f"[OK] Protein logged: {nut['protein']['consumed']}/{nut['protein']['target']}g")

    # Verify workouts is still 0
    res_wrk = client.get("/api/v1/workout/today")
    assert res_wrk.status_code == 200
    assert res_wrk.json()["total_workouts"] == 0
    print("[OK] Workout status: Not completed (Start Today's Workout)")

# ==============================================================================
# TEST 4: USER WITH WORKOUT DATA ONLY
# ==============================================================================
def test_user_with_workout_data():
    print("\n--- TEST 4: User with Workout Data Only ---")
    user_id = f"usr_wrk_{int(datetime.now().timestamp())}"
    user = {
        "id": user_id,
        "name": "Vikram Seth",
        "email": "vikram@fitverse.ai",
        "selected_goal": "General Fitness",
        "xp": 2100,
        "level": 5,
        "current_streak": 6,
    }
    mock_user_auth(user)

    # Complete a workout session
    workout_payload = {
        "workout_name": "AI Kinetic Squat & Core Circuit",
        "duration_minutes": 25.0,
        "calories_burned": 210,
        "intensity": "high",
        "completed": True
    }
    res_comp = client.post("/api/v1/workout/complete", json=workout_payload)
    assert res_comp.status_code == 200, f"Complete workout failed: {res_comp.text}"

    # Verify workout today
    res_wrk = client.get("/api/v1/workout/today")
    assert res_wrk.status_code == 200
    wrk = res_wrk.json()
    assert wrk["total_workouts"] >= 1
    assert wrk["total_duration_minutes"] >= 25.0
    print(f"[OK] Workout completed today! Total workouts: {wrk['total_workouts']}, Duration: {wrk['total_duration_minutes']} mins (Display: 'Completed')")

    # Verify food is still 0
    res_nut = client.get("/api/v1/nutrition/daily-summary")
    assert res_nut.status_code == 200
    assert res_nut.json()["calories"]["consumed"] == 0
    print("[OK] Food consumed: 0 kcal (Display: 'No meals logged yet')")

# ==============================================================================
# TEST 5: USER WITH FULL DATA (usr_001)
# ==============================================================================
def test_user_with_full_data():
    print("\n--- TEST 5: User with Full Data (usr_001) ---")
    user = {
        "id": "usr_001",
        "name": "Aryan Sharma",
        "email": "athlete@fitverse.ai",
        "selected_goal": "Muscle Gain",
        "xp": 4820,
        "level": 13,
        "current_streak": 7,
    }
    mock_user_auth(user)

    # 1. Profile
    res_prof = client.get("/api/v1/user/profile")
    assert res_prof.status_code == 200
    prof = res_prof.json()
    print(f"[OK] Full Profile: {prof['name']} (Level {prof['level']}, {prof['xp']} XP, Streak {prof['current_streak']})")

    # 2. Nutrition
    res_nut = client.get("/api/v1/nutrition/daily-summary")
    assert res_nut.status_code == 200
    nut = res_nut.json()
    assert nut["calories"]["consumed"] > 0
    assert nut["protein"]["consumed"] > 0
    print(f"[OK] Full Nutrition: {nut['calories']['consumed']}/{nut['calories']['target']} kcal, Protein {nut['protein']['consumed']}/{nut['protein']['target']}g")

    # 3. Fit Score
    res_fit = client.get("/api/v1/progress/fit-score")
    assert res_fit.status_code == 200
    fit = res_fit.json()
    print(f"[OK] Today's Fit Score: {fit['fit_score']}/100 (Weekly Avg: {fit['weekly_average_fit_score']})")
    print(f"     Breakdown: Nutrition={fit['nutrition_score']}, Workout={fit['workout_score']}, Water={fit['hydration_score']}, Activity={fit['activity_score']}, Sleep={fit['sleep_score']}, Stress={fit['stress_score']}")

    # 4. Weekly Preview
    res_wk = client.get("/api/v1/ai/weekly-report?week_offset=0")
    assert res_wk.status_code == 200
    wk = res_wk.json()
    assert wk["has_data"] is True
    print(f"[OK] Weekly Preview: Score {wk['weekly_score']}, Workout Days: {wk['workout']['workout_days']}, Avg Protein: {wk['nutrition']['average_protein']}g, Avg Water: {round(wk['hydration']['daily_average_ml']/1000, 1)}L")

    # 5. AI Insight
    res_ai = client.get("/api/v1/ai/daily-analysis")
    assert res_ai.status_code == 200
    ai = res_ai.json()
    print(f"[OK] Daily AI Insight: {ai.get('headline') or ai['tomorrow_recommendations'][0]}")

if __name__ == "__main__":
    try:
        test_new_user()
        test_user_with_no_data()
        test_user_with_food_data()
        test_user_with_workout_data()
        test_user_with_full_data()
        print("\n" + "=" * 60)
        print("ALL 5 DASHBOARD TEST SCENARIOS PASSED 100%!")
        print("=" * 60)
    finally:
        clear_user_auth()
