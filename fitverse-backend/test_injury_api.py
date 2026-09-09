import sys
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_status():
    print("Testing /api/v1/status...")
    res = client.get("/api/v1/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    data = res.json()
    assert data["services"].get("injury") == "active", f"Injury not active in status: {data}"
    print("[OK] Status OK")

def test_injury_analyze():
    print("\nTesting POST /api/v1/injury/analyze (knee, pain 7, fat_loss)...")
    payload = {
        "body_part": "knee",
        "pain_level": 7,
        "goal": "fat_loss"
    }
    res = client.post("/api/v1/injury/analyze", json=payload)
    assert res.status_code == 200, f"Analyze failed: {res.text}"
    data = res.json()
    print("Response:")
    print(json.dumps(data, indent=2))
    
    assert data["caution_level"] == "high", f"Expected caution_level 'high', got {data['caution_level']}"
    assert len(data["avoid_or_modify"]) > 0, "Expected non-empty avoid_or_modify"
    assert len(data["lower_impact_alternatives"]) > 0, "Expected non-empty lower_impact_alternatives"
    assert len(data["general_recommendations"]) > 0, "Expected non-empty general_recommendations"
    assert "not a medical device" in data["medical_disclaimer"].lower() or "not diagnose" in data["medical_disclaimer"].lower()
    # Verify severe pain recommendation
    has_prof = any("physician" in r.lower() or "clinical" in r.lower() or "physical therapist" in r.lower() for r in data["general_recommendations"])
    assert has_prof, f"Expected professional evaluation recommendation for pain level 7: {data['general_recommendations']}"
    print("[OK] Analyze OK")

def test_injury_profile_and_recommendations():
    print("\nTesting POST /api/v1/injury/profile...")
    payload = {
        "body_part": "shoulder",
        "body_parts": ["Shoulder", "Neck"],
        "pain_level": 5,
        "pain_description": "Aching during overhead press",
        "recent_injury": "Minor rotator cuff strain last month",
        "goal": "muscle_gain"
    }
    res = client.post("/api/v1/injury/profile", json=payload)
    assert res.status_code == 201, f"Profile creation failed: {res.text}"
    profile = res.json()
    print(f"Profile created ID: {profile['id']}, Caution Level: {profile['caution_level']}")
    assert profile["caution_level"] == "moderate"
    print("[OK] Profile OK")

    print("\nTesting GET /api/v1/injury/recommendations...")
    res = client.get("/api/v1/injury/recommendations")
    assert res.status_code == 200, f"Recommendations failed: {res.text}"
    recs = res.json()
    assert recs["caution_level"] == "moderate"
    assert "Incline Landmine Press" in str(recs["lower_impact_alternatives"]) or "Neutral" in str(recs["lower_impact_alternatives"])
    print("[OK] Recommendations OK")

def test_workout_integration():
    print("\nTesting GET /api/v1/workout/recommendations...")
    res = client.get("/api/v1/workout/recommendations")
    assert res.status_code == 200, f"Workout recs failed: {res.text}"
    data = res.json()
    assert data["caution_level"] == "moderate"
    assert data["monitored_body_part"] == "shoulder"
    print("[OK] Workout recommendations integration OK")

def test_daily_coach_integration():
    print("\nTesting daily health coach integration with injury profile...")
    from app.services.daily_health_coach_service import daily_health_coach_service
    analysis = daily_health_coach_service.generate_daily_analysis("usr_001")
    assert "Joint Guard Active" in analysis["recovery_analysis"] or "Shoulder" in analysis["recovery_analysis"]
    has_joint_rec = any("Shoulder" in r or "joint" in r.lower() for r in analysis["tomorrow_recommendations"])
    assert has_joint_rec, f"Expected joint safety in tomorrow_recommendations: {analysis['tomorrow_recommendations']}"
    print("[OK] Daily Coach integration OK")

def test_weekly_report_integration():
    print("\nTesting weekly report integration with injury profile...")
    from app.services.weekly_analysis_service import weekly_analysis_service
    report = weekly_analysis_service.generate_weekly_report("usr_001")
    workout_plan = report["next_week_plan"]["workout"]
    has_joint_plan = any("Shoulder" in p or "Joint" in p for p in workout_plan)
    assert has_joint_plan, f"Expected joint plan in weekly workout plan: {workout_plan}"
    print("[OK] Weekly Report integration OK")

if __name__ == "__main__":
    try:
        test_status()
        test_injury_analyze()
        test_injury_profile_and_recommendations()
        test_workout_integration()
        test_daily_coach_integration()
        test_weekly_report_integration()
        print("\n==========================================")
        print("ALL INJURY COACH BACKEND TESTS PASSED 100%")
        print("==========================================")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
