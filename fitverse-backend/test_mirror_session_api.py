"""
FitVerse Automated Mirror Camera & Workout Session Verification Suite (Phase 4)
Tests all 5 supported exercises and the full lifecycle of an AI Fitness Mirror session:
- Exercises: Squat, Push Up, Lunge, Plank, Jumping Jack
- Live Telemetry & Biomechanical Coaching Cues
- Rep Counting & Form Scoring
- Workout Completion & Atomic Updates:
  * workout_sessions
  * exercise_logs
  * daily_summaries
  * Fit Score
  * Weekly data
  * Gamification (Anti-Cheat XP/Coins)
"""

import sys
import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestMirrorWorkoutSessionApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.headers = {"Authorization": "Bearer dev_token_usr_001"}

    def test_01_start_workout_sessions(self):
        """Test starting an AI Fitness Mirror session for each supported exercise"""
        exercises = ["AI Barbell Squat", "AI Push Up", "AI Lunge", "AI Plank", "AI Jumping Jack"]
        for ex in exercises:
            payload = {
                "workout_name": ex,
                "intensity": "high",
                "scheduled_duration_minutes": 10.0
            }
            res = self.client.post("/api/v1/workout/start", json=payload, headers=self.headers)
            self.assertEqual(res.status_code, 201, f"Failed to start workout for {ex}: {res.text}")
            data = res.json()
            self.assertIn("session_id", data)
            self.assertEqual(data["status"], "active")
            self.assertEqual(data["workout_name"], ex)
            print(f"[OK] Started Mirror Session for {ex}: {data['session_id']}")

    def test_02_squat_telemetry_and_coaching(self):
        """Test Squat kinematic telemetry and AI Coach directives"""
        # Test 1: Optimal depth
        optimal = {
            "exercise_name": "AI Barbell Squat",
            "knee_angle": 88.0,
            "hip_angle": 80.0,
            "back_angle": 75.0,
            "current_rep": 8,
            "rep_phase": "bottom"
        }
        res = self.client.post("/api/v1/workout/telemetry", json=optimal, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["depth_reached"])
        self.assertTrue(data["rep_counted"])
        self.assertGreaterEqual(data["form_score"], 90.0)
        print(f"[OK] Squat Optimal Depth: FormScore={data['form_score']}, Cue='{data['feedback_cue']}'")

        # Test 2: Excessive torso forward lean fault
        lean_fault = {
            "exercise_name": "AI Barbell Squat",
            "knee_angle": 95.0,
            "hip_angle": 55.0,
            "back_angle": 50.0,
            "current_rep": 9,
            "rep_phase": "inflection"
        }
        res2 = self.client.post("/api/v1/workout/telemetry", json=lean_fault, headers=self.headers)
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(data2["status"], "WARNING")
        self.assertIn("Keep your back straight", data2["feedback_cue"])
        print(f"[OK] Squat Torso Fault: Status={data2['status']}, Cue='{data2['feedback_cue']}'")

    def test_03_pushup_telemetry_and_coaching(self):
        """Test Push Up kinematic telemetry and AI Coach directives"""
        # Test 1: Solid plank posture
        optimal = {
            "exercise_name": "AI Push Up",
            "knee_angle": 175.0,
            "hip_angle": 175.0,
            "back_angle": 170.0,
            "elbow_angle": 88.0,
            "current_rep": 10,
            "rep_phase": "bottom"
        }
        res = self.client.post("/api/v1/workout/telemetry", json=optimal, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Good form", data["feedback_cue"])
        print(f"[OK] Push Up Posture: FormScore={data['form_score']}, Cue='{data['feedback_cue']}'")

        # Test 2: Hip sag / posture warning
        hip_sag = {
            "exercise_name": "AI Push Up",
            "knee_angle": 140.0,
            "hip_angle": 145.0,
            "back_angle": 140.0,
            "current_rep": 11,
            "rep_phase": "inflection"
        }
        res2 = self.client.post("/api/v1/workout/telemetry", json=hip_sag, headers=self.headers)
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(data2["status"], "WARNING")
        self.assertIn("Keep your body straight", data2["feedback_cue"])
        print(f"[OK] Push Up Posture Fault: Status={data2['status']}, Cue='{data2['feedback_cue']}'")

    def test_04_log_exercise_execution(self):
        """Test logging exercises for Squat, Push-up, Lunge, Plank, and Jumping Jack"""
        exercises = [
            ("AI Barbell Squat", 12, 94.0),
            ("AI Push Up", 15, 92.0),
            ("AI Lunge", 10, 91.0),
            ("AI Plank", 45, 96.0),
            ("AI Jumping Jack", 30, 95.0),
        ]
        for name, reps, score in exercises:
            payload = {
                "workout_session_id": "wrk_test_session",
                "exercise_name": name,
                "sets": 1,
                "reps": reps,
                "weight_kg": 0.0,
                "duration_seconds": 60,
                "form_score": score
            }
            res = self.client.post("/api/v1/workout/exercise", json=payload, headers=self.headers)
            self.assertEqual(res.status_code, 201)
            data = res.json()
            self.assertEqual(data["exercise_name"], name)
            self.assertEqual(data["reps"], reps)
            print(f"[OK] Logged Exercise: {name} ({reps} reps, Form {score}%)")

    def test_05_workout_completion_atomic_updates(self):
        """Test completing workout and verify database, daily summary, Fit Score, weekly report, and gamification"""
        session_id = "wrk_mirror_complete_001"
        payload = {
            "session_id": session_id,
            "workout_name": "AI Fitness Mirror Full Body Session",
            "exercise": "AI Barbell Squat",
            "reps": 25,
            "duration_minutes": 5.0,
            "calories_burned": 75,
            "intensity": "high",
            "completed": True,
            "form_score": 93.5,
            "feedback": ["Keep your back straight", "Good form", "Rep 25 complete"],
            "exercises": [
                {
                    "exercise_name": "AI Barbell Squat",
                    "sets": 1,
                    "reps": 15,
                    "weight_kg": 0.0,
                    "duration_seconds": 180,
                    "form_score": 94.0
                },
                {
                    "exercise_name": "AI Push Up",
                    "sets": 1,
                    "reps": 10,
                    "weight_kg": 0.0,
                    "duration_seconds": 120,
                    "form_score": 93.0
                }
            ]
        }
        res = self.client.post("/api/v1/workout/complete", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200, f"Workout complete failed: {res.text}")
        data = res.json()
        self.assertTrue(data["success"])

        # 1. Verify session saved
        self.assertEqual(data["session"]["workout_name"], "AI Fitness Mirror Full Body Session")
        self.assertTrue(data["session"]["completed"])
        self.assertEqual(data["session"]["calories_burned"], 75)

        # 2. Verify exercise_logs saved
        self.assertGreaterEqual(len(data["exercises"]), 2)
        self.assertEqual(data["exercises"][0]["exercise_name"], "AI Barbell Squat")

        # 3. Verify daily_summary updated
        self.assertIn("daily_summary", data)

        # 4. Verify Fit Score
        self.assertGreater(data["fit_score"], 0)

        # 5. Verify Gamification rewards
        self.assertIn("rewards_earned", data)
        self.assertGreater(data["rewards_earned"]["xp"], 0)
        self.assertGreater(data["rewards_earned"]["coins"], 0)
        print(f"[OK] Workout Completion Verified: Fit Score={data['fit_score']}, XP={data['rewards_earned']['xp']}, Exercises={len(data['exercises'])}")

    def test_06_verify_dashboard_and_weekly_sync(self):
        """Verify dashboard, Fit Score and weekly report reflect the newly submitted workout"""
        # Fit score & breakdown reflect
        fit_res = self.client.get("/api/v1/progress/fit-score", headers=self.headers)
        self.assertEqual(fit_res.status_code, 200)
        fit_data = fit_res.json()
        self.assertGreater(fit_data["fit_score"], 0)
        self.assertGreater(fit_data["workout_score"], 0)
        print(f"[OK] Dashboard Fit Score Reflects Workout: Score={fit_data['fit_score']}, Workout Component={fit_data['workout_score']}")

        # Today's workout reflects
        today_res = self.client.get("/api/v1/workout/today", headers=self.headers)
        self.assertEqual(today_res.status_code, 200)
        today_data = today_res.json()
        self.assertGreaterEqual(today_data["total_workouts"], 1)
        self.assertGreaterEqual(today_data["total_calories_burned"], 75)
        print(f"[OK] Workout Today Endpoint Reflects Workout: Total Workouts={today_data['total_workouts']}, Calories={today_data['total_calories_burned']}")

        # Weekly report reflect
        weekly_res = self.client.get("/api/v1/ai/weekly-report", headers=self.headers)
        self.assertEqual(weekly_res.status_code, 200)
        weekly_data = weekly_res.json()
        self.assertTrue(weekly_data.get("has_data", False))
        self.assertGreaterEqual(weekly_data["workout"]["workout_days"], 1)
        print(f"[OK] Weekly AI Report Synced: Workout Days={weekly_data['workout']['workout_days']}, Weekly Score={weekly_data['weekly_score']}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
