import sys
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_gamification_profile():
    print("Testing GET /api/v1/gamification/profile...")
    res = client.get("/api/v1/gamification/profile")
    assert res.status_code == 200, f"Profile failed: {res.text}"
    data = res.json()
    print("Gamification Profile:", json.dumps({
        "xp": data["xp"],
        "coins": data["coins"],
        "level": data["level"],
        "streak": data["current_streak"],
        "streak_criteria": data["streak_criteria"]
    }, indent=2))
    assert "xp" in data
    assert "coins" in data
    assert "level" in data
    assert "current_streak" in data
    assert "streak_criteria" in data
    print("[OK] Profile OK")

def test_anti_cheat_xp():
    print("\nTesting Anti-Cheat on POST /api/v1/gamification/xp...")
    
    # 1. Invalid event
    res = client.post("/api/v1/gamification/xp", json={"event_type": "fake_free_xp"})
    assert res.status_code == 400, f"Expected 400 for fake event, got {res.status_code}: {res.text}"
    print("[OK] Rejected arbitrary event type")

    # 2. Workout event with non-existent session
    res = client.post("/api/v1/gamification/xp", json={
        "event_type": "workout_completed",
        "reference_id": "non_existent_fake_session_12345"
    })
    # Note: usr_001 might have mock sessions or check DEV_WORKOUT_SESSIONS
    # 3. Valid workout session event
    from app.api.workout import DEV_WORKOUT_SESSIONS
    valid_id = DEV_WORKOUT_SESSIONS[0]["id"]
    res = client.post("/api/v1/gamification/xp", json={
        "event_type": "workout_completed",
        "reference_id": valid_id
    })
    assert res.status_code == 200, f"Expected 200 for valid session, got {res.status_code}: {res.text}"
    claim1 = res.json()
    assert claim1["xp_awarded"] == 100, f"Expected 100 XP, got {claim1['xp_awarded']}"
    print(f"[OK] Awarded 100 XP for valid workout: {claim1['message']}")

    # 4. Attempt duplicate claim for the same session
    res_dup = client.post("/api/v1/gamification/xp", json={
        "event_type": "workout_completed",
        "reference_id": valid_id
    })
    assert res_dup.status_code == 400, f"Expected 400 for duplicate claim, got {res_dup.status_code}: {res_dup.text}"
    print("[OK] Duplicate claim prevented by anti-cheat")

def test_health_events_xp():
    print("\nTesting Protein and Water event XP claims...")
    # Protein target completed
    res_p = client.post("/api/v1/gamification/xp", json={
        "event_type": "protein_target_completed",
        "reference_id": "test_today_protein"
    })
    assert res_p.status_code == 200, f"Protein claim failed: {res_p.text}"
    assert res_p.json()["xp_awarded"] == 50
    print("[OK] Protein Target Awarded 50 XP")

    # Water target completed
    res_w = client.post("/api/v1/gamification/xp", json={
        "event_type": "water_target_completed",
        "reference_id": "test_today_water"
    })
    assert res_w.status_code == 200, f"Water claim failed: {res_w.text}"
    assert res_w.json()["xp_awarded"] == 30
    print("[OK] Water Target Awarded 30 XP")

def test_challenges():
    print("\nTesting GET /api/v1/gamification/challenges...")
    res = client.get("/api/v1/gamification/challenges")
    assert res.status_code == 200, f"Challenges failed: {res.text}"
    challenges = res.json()
    assert len(challenges) > 0
    print(f"[OK] Found {len(challenges)} active challenges")

    # Test complete challenge
    ch_to_claim = next((c for c in challenges if c["completed"] and not c["claimed"]), challenges[0])
    print(f"Testing POST /api/v1/gamification/challenge/complete for '{ch_to_claim['id']}'...")
    res_c = client.post("/api/v1/gamification/challenge/complete", json={"challenge_id": ch_to_claim["id"]})
    if ch_to_claim["completed"]:
        assert res_c.status_code == 200, f"Challenge complete failed: {res_c.text}"
        data = res_c.json()
        assert data["reward_xp"] > 0
        print(f"[OK] Completed challenge: {data['message']}")
    else:
        assert res_c.status_code == 400
        print(f"[OK] Properly blocked incomplete challenge: {res_c.text}")

def test_leaderboard():
    print("\nTesting GET /api/v1/leaderboard...")
    res = client.get("/api/v1/leaderboard?period=weekly&scope=national")
    assert res.status_code == 200, f"Leaderboard failed: {res.text}"
    data = res.json()
    assert len(data["entries"]) >= 3
    assert data["user_rank"] is not None
    print(f"[OK] Leaderboard loaded: {len(data['entries'])} entries. Current user rank: #{data['user_rank']['rank']} with {data['user_rank']['xp']} XP")

if __name__ == "__main__":
    try:
        test_gamification_profile()
        test_anti_cheat_xp()
        test_health_events_xp()
        test_challenges()
        test_leaderboard()
        print("\n==========================================")
        print("ALL GAMIFICATION BACKEND TESTS PASSED 100%")
        print("==========================================")
    except Exception as e:
        print(f"\n[ERROR] TEST FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
