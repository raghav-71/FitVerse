from fastapi import APIRouter, Depends, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.api.deps import get_current_user
from app.schemas.workout import (
    WorkoutSessionCreate,
    WorkoutSessionResponse,
    WorkoutTelemetryInput,
    WorkoutTelemetryResponse,
    WorkoutStartInput,
    WorkoutStartResponse,
    WorkoutExerciseInput,
    WorkoutExerciseResponse,
    WorkoutCompleteInput,
    WorkoutCompleteResponse,
    WorkoutRewardsEarned,
    WorkoutTodayResponse,
)
from app.services.health_score_service import health_score_service
from app.services.daily_summary_service import daily_summary_service
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

EXERCISE_CATALOG = [
    {
        "id": "ex_squats",
        "name": "AI Barbell Squat",
        "category": "Legs & Core",
        "difficulty": "Intermediate",
        "target_reps": 12,
        "target_sets": 3,
        "duration_estimate": "3 min",
        "calories_estimate": 48,
        "target_muscles": ["Quadriceps", "Glutes", "Core", "Hamstrings"],
        "safety_notes": [
            "Keep your spine aligned and avoid arching the lower back.",
            "Ensure knees track slightly outward, inline with toes.",
            "Do not let knees buckle inward during ascent."
        ],
        "form_cues": [
            "Maintain chest upright",
            "Hit parallel squat depth (hips below knees)",
            "Drive upward through midfoot & heels"
        ]
    },
    {
        "id": "ex_pushups",
        "name": "AI Perfect Pushups",
        "category": "Chest & Triceps",
        "difficulty": "Easy",
        "target_reps": 15,
        "target_sets": 3,
        "duration_estimate": "2 min",
        "calories_estimate": 35,
        "target_muscles": ["Pectorals", "Triceps", "Anterior Deltoids", "Core"],
        "safety_notes": [
            "Keep elbows at a 45-degree angle to protect shoulders.",
            "Engage glutes to prevent lumbar sagging."
        ],
        "form_cues": [
            "Full lockout at top",
            "Chest within 2 inches of floor",
            "Maintain rigid plank posture"
        ]
    },
    {
        "id": "ex_lunges",
        "name": "Dynamic Lunges",
        "category": "Legs & Balance",
        "difficulty": "Intermediate",
        "target_reps": 10,
        "target_sets": 3,
        "duration_estimate": "3 min",
        "calories_estimate": 42,
        "target_muscles": ["Quadriceps", "Glutes", "Calves"],
        "safety_notes": [
            "Avoid letting front knee cave inwards or overshoot past toes aggressively."
        ],
        "form_cues": [
            "90-degree bend at front and back knees",
            "Torso upright",
            "Controlled descent"
        ]
    }
]

# In-memory storage for development / offline mode
DEV_WORKOUT_SESSIONS: List[Dict[str, Any]] = [
    {
        "id": "wrk_1",
        "user_id": "usr_001",
        "workout_name": "AI Barbell Squat Session",
        "duration_minutes": 14.5,
        "calories_burned": 120,
        "intensity": "high",
        "completed": True,
        "started_at": datetime.now().isoformat(),
        "completed_at": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
    }
]

DEV_EXERCISE_LOGS: List[Dict[str, Any]] = [
    {
        "id": "ex_1",
        "workout_session_id": "wrk_1",
        "exercise_name": "AI Barbell Squat",
        "sets": 3,
        "reps": 12,
        "weight_kg": 60.0,
        "duration_seconds": 180,
        "form_score": 94.0,
        "created_at": datetime.now().isoformat()
    }
]

DEV_USER_REWARDS: Dict[str, Dict[str, Any]] = {
    "usr_001": {
        "xp": 1450,
        "coins": 320,
        "level": 2,
        "current_streak": 7,
        "last_workout_date": None
    }
}


@router.get("/catalog", summary="Get Exercise Catalog & Biomechanical Metadata")
async def get_exercise_catalog():
    return EXERCISE_CATALOG


@router.post("/telemetry", response_model=WorkoutTelemetryResponse, summary="Process Live Biomechanical Telemetry")
async def process_workout_telemetry(payload: WorkoutTelemetryInput):
    """
    Analyzes joint angles from Computer Vision (MediaPipe / MoveNet landmarks)
    and computes real-time form accuracy, coaching alerts, and rep milestones.
    """
    form_score = 95.0
    status_text = "OPTIMAL"
    cue = "Great cadence! Maintain smooth movement."
    depth_reached = False
    rep_counted = False

    knee = payload.knee_angle or 90.0
    back = payload.back_angle or 80.0

    if "squat" in payload.exercise_name.lower():
        if knee <= 90:
            depth_reached = True
            cue = "Good depth! Hips parallel to knees."
            form_score = 96.0
        elif knee > 115:
            cue = "Go a little deeper to achieve full activation."
            form_score = 88.0

        if back < 60:
            status_text = "WARNING"
            cue = "Keep chest upright — excessive forward lean detected!"
            form_score = max(70.0, form_score - 15)

    elif "pushup" in payload.exercise_name.lower():
        if knee < 160:
            status_text = "WARNING"
            cue = "Keep your legs straight and hips level."
            form_score = 82.0
        else:
            cue = "Solid plank posture maintained."

    if payload.rep_phase == "bottom" and depth_reached:
        rep_counted = True

    return WorkoutTelemetryResponse(
        form_score=round(form_score, 1),
        status=status_text,
        feedback_cue=cue,
        depth_reached=depth_reached,
        rep_counted=rep_counted
    )


# ==============================================================================
# 1. POST /api/v1/workout/start
# ==============================================================================
@router.post("/start", response_model=WorkoutStartResponse, status_code=status.HTTP_201_CREATED, summary="Start a Workout Session")
async def start_workout_session(
    payload: WorkoutStartInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Initializes a new workout session record and returns session_id for logging.
    """
    now = datetime.now()
    session_id = f"wrk_{int(now.timestamp() * 1000)}"
    user_id = current_user["id"]

    session_data = {
        "id": session_id,
        "user_id": user_id,
        "workout_name": payload.workout_name,
        "duration_minutes": 0.0,
        "calories_burned": 0,
        "intensity": payload.intensity or "medium",
        "completed": False,
        "started_at": now.isoformat(),
        "created_at": now.isoformat(),
    }

    supabase = get_supabase()
    if supabase and user_id != "usr_001":
        try:
            insert_row = {
                "user_id": user_id,
                "workout_name": payload.workout_name,
                "duration_minutes": 0.0,
                "calories_burned": 0,
                "intensity": payload.intensity or "medium",
                "completed": False,
                "started_at": now.isoformat(),
            }
            res = supabase.table("workout_sessions").insert(insert_row).execute()
            if res.data:
                session_id = res.data[0]["id"]
                session_data["id"] = session_id
        except Exception as e:
            logger.error(f"Error creating workout session in Supabase: {e}")

    DEV_WORKOUT_SESSIONS.insert(0, session_data)

    return WorkoutStartResponse(
        session_id=str(session_id),
        workout_name=payload.workout_name,
        intensity=payload.intensity or "medium",
        started_at=now,
        status="active"
    )


# ==============================================================================
# 2. POST /api/v1/workout/exercise
# ==============================================================================
@router.post("/exercise", response_model=WorkoutExerciseResponse, status_code=status.HTTP_201_CREATED, summary="Log Exercise within Workout Session")
async def log_exercise(
    payload: WorkoutExerciseInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Logs an individual exercise execution linked to an active workout session.
    """
    now = datetime.now()
    log_id = f"ex_{int(now.timestamp() * 1000)}"
    user_id = current_user["id"]

    log_record = {
        "id": log_id,
        "workout_session_id": payload.workout_session_id,
        "exercise_name": payload.exercise_name,
        "sets": payload.sets,
        "reps": payload.reps,
        "weight_kg": payload.weight_kg or 0.0,
        "duration_seconds": payload.duration_seconds or 60,
        "form_score": payload.form_score or 95.0,
        "created_at": now.isoformat(),
    }

    supabase = get_supabase()
    if supabase and user_id != "usr_001":
        try:
            insert_row = {
                "workout_session_id": payload.workout_session_id,
                "exercise_name": payload.exercise_name,
                "sets": payload.sets,
                "reps": payload.reps,
                "weight_kg": payload.weight_kg or 0.0,
                "duration_seconds": payload.duration_seconds or 60,
                "form_score": payload.form_score,
            }
            res = supabase.table("exercise_logs").insert(insert_row).execute()
            if res.data:
                log_id = res.data[0]["id"]
                log_record["id"] = log_id
        except Exception as e:
            logger.error(f"Error inserting exercise log in Supabase: {e}")

    DEV_EXERCISE_LOGS.append(log_record)

    return WorkoutExerciseResponse(
        id=str(log_id),
        workout_session_id=str(payload.workout_session_id),
        exercise_name=payload.exercise_name,
        sets=payload.sets,
        reps=payload.reps,
        weight_kg=payload.weight_kg or 0.0,
        duration_seconds=payload.duration_seconds or 60,
        form_score=payload.form_score,
        created_at=now,
        status="logged"
    )


# ==============================================================================
# 3. POST /api/v1/workout/complete
# ==============================================================================
@router.post("/complete", response_model=WorkoutCompleteResponse, summary="Complete Workout Session & Update Health Matrix")
async def complete_workout_session(
    payload: WorkoutCompleteInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Executes the 7 required post-workout steps:
    1. Save workout session
    2. Save exercise logs
    3. Update daily summary (workout_minutes, calories_burned)
    4. Update Fit Score
    5. Update streak
    6. Update XP and rewards
    7. Make data available for weekly AI analysis
    """
    now = datetime.now()
    today_str = now.date().isoformat()
    user_id = current_user["id"]
    supabase = get_supabase()

    # 1. Save / Update workout session
    session_id = payload.session_id
    if not session_id:
        session_id = f"wrk_{int(now.timestamp() * 1000)}"

    session_record = {
        "id": session_id,
        "user_id": user_id,
        "workout_name": payload.workout_name,
        "duration_minutes": payload.duration_minutes,
        "calories_burned": payload.calories_burned or int(payload.duration_minutes * 8),
        "intensity": payload.intensity or "medium",
        "completed": True,
        "started_at": payload.started_at.isoformat() if payload.started_at else now.isoformat(),
        "completed_at": payload.completed_at.isoformat() if payload.completed_at else now.isoformat(),
        "created_at": now.isoformat(),
    }

    # In-memory sync for dev mode
    dev_idx = next((i for i, s in enumerate(DEV_WORKOUT_SESSIONS) if s["id"] == session_id), None)
    if dev_idx is not None:
        DEV_WORKOUT_SESSIONS[dev_idx].update(session_record)
    else:
        DEV_WORKOUT_SESSIONS.insert(0, session_record)

    if supabase and user_id != "usr_001":
        try:
            update_payload = {
                "workout_name": payload.workout_name,
                "duration_minutes": payload.duration_minutes,
                "calories_burned": session_record["calories_burned"],
                "intensity": payload.intensity or "medium",
                "completed": True,
                "completed_at": now.isoformat(),
            }
            res = supabase.table("workout_sessions").update(update_payload).eq("id", session_id).execute()
            if not res.data:
                # Insert as new completed row
                insert_payload = {
                    "user_id": user_id,
                    "workout_name": payload.workout_name,
                    "duration_minutes": payload.duration_minutes,
                    "calories_burned": session_record["calories_burned"],
                    "intensity": payload.intensity or "medium",
                    "completed": True,
                    "started_at": session_record["started_at"],
                    "completed_at": session_record["completed_at"],
                }
                insert_res = supabase.table("workout_sessions").insert(insert_payload).execute()
                if insert_res.data:
                    session_id = insert_res.data[0]["id"]
                    session_record["id"] = session_id
        except Exception as e:
            logger.error(f"Error persisting completed workout in Supabase: {e}")

    # 2. Save exercise logs
    saved_exercises = []
    if payload.exercises:
        for ex in payload.exercises:
            ex_id = f"ex_{int(datetime.now().timestamp() * 1000)}"
            ex_record = {
                "id": ex_id,
                "workout_session_id": session_id,
                "exercise_name": ex.exercise_name,
                "sets": ex.sets,
                "reps": ex.reps,
                "weight_kg": ex.weight_kg or 0.0,
                "duration_seconds": ex.duration_seconds or int(payload.duration_minutes * 60),
                "form_score": ex.form_score or payload.form_score or 92.0,
                "created_at": now.isoformat(),
            }
            DEV_EXERCISE_LOGS.append(ex_record)
            saved_exercises.append(ex_record)

            if supabase and user_id != "usr_001":
                try:
                    supabase.table("exercise_logs").insert({
                        "workout_session_id": session_id,
                        "exercise_name": ex.exercise_name,
                        "sets": ex.sets,
                        "reps": ex.reps,
                        "weight_kg": ex.weight_kg or 0.0,
                        "duration_seconds": ex.duration_seconds or int(payload.duration_minutes * 60),
                        "form_score": ex.form_score or payload.form_score or 92.0,
                    }).execute()
                except Exception as e:
                    logger.error(f"Error saving exercise log to Supabase: {e}")

    # 3. Update daily summary (workout_minutes, calories_burned)
    today_sessions = [
        s for s in DEV_WORKOUT_SESSIONS
        if (s.get("user_id") == user_id or user_id == "usr_001")
        and s.get("completed") is True
        and s.get("started_at", "").startswith(today_str)
    ]
    tot_workout_mins = sum(float(s.get("duration_minutes", 0.0)) for s in today_sessions)
    tot_calories_burned = sum(int(s.get("calories_burned", 0)) for s in today_sessions)

    if supabase and user_id != "usr_001":
        try:
            today_res = (
                supabase.table("workout_sessions")
                .select("duration_minutes, calories_burned")
                .eq("user_id", user_id)
                .eq("completed", True)
                .gte("started_at", today_str)
                .execute()
            )
            if today_res.data:
                tot_workout_mins = sum(float(row.get("duration_minutes", 0.0)) for row in today_res.data)
                tot_calories_burned = sum(int(row.get("calories_burned", 0)) for row in today_res.data)
        except Exception as e:
            logger.error(f"Error calculating today's workout totals: {e}")

    summary_data = daily_summary_service.sync_daily_summary(user_id, today_str)

    # 4. Update Fit Score (via health_score_service)
    fit_score_calc = health_score_service.calculate_daily_fit_score(user_id, today_str)
    current_fit_score = fit_score_calc["fit_score"]

    daily_summary_record = {
        "user_id": user_id,
        "date": today_str,
        "workout_minutes": round(tot_workout_mins, 1),
        "calories_burned": tot_calories_burned,
        "daily_score": current_fit_score,
        "updated_at": now.isoformat(),
    }
    if supabase and user_id != "usr_001":
        try:
            supabase.table("daily_summaries").upsert(daily_summary_record, on_conflict="user_id,date").execute()
        except Exception as e:
            logger.error(f"Error upserting workout to daily_summaries: {e}")

    # 5 & 6. Update streak, XP and rewards in user_rewards
    user_rewards = DEV_USER_REWARDS.get(user_id, {
        "xp": 1450,
        "coins": 320,
        "level": 2,
        "current_streak": 7,
        "last_workout_date": None
    })

    xp_earned = int(100 + (payload.duration_minutes * 2) + ((payload.form_score or 90) * 0.2))
    coins_earned = int(10 + (payload.duration_minutes * 0.5))

    streak_incremented = False
    last_date = user_rewards.get("last_workout_date")
    if last_date != today_str:
        user_rewards["current_streak"] = user_rewards.get("current_streak", 0) + 1
        user_rewards["last_workout_date"] = today_str
        streak_incremented = True

    user_rewards["xp"] = user_rewards.get("xp", 0) + xp_earned
    user_rewards["coins"] = user_rewards.get("coins", 0) + coins_earned
    user_rewards["level"] = 1 + (user_rewards["xp"] // 1000)
    DEV_USER_REWARDS[user_id] = user_rewards

    if supabase and user_id != "usr_001":
        try:
            reward_update = {
                "user_id": user_id,
                "xp": user_rewards["xp"],
                "coins": user_rewards["coins"],
                "level": user_rewards["level"],
                "current_streak": user_rewards["current_streak"],
                "updated_at": now.isoformat(),
            }
            supabase.table("user_rewards").upsert(reward_update, on_conflict="user_id").execute()
        except Exception as e:
            logger.error(f"Error persisting user_rewards in Supabase: {e}")

    # 7. Make data available for weekly AI analysis
    # Data is saved in workout_sessions and daily_summaries, immediately accessible to /ai/weekly-report

    return WorkoutCompleteResponse(
        success=True,
        session=session_record,
        exercises=saved_exercises,
        daily_summary={
            "workout_minutes": round(tot_workout_mins, 1),
            "calories_burned": tot_calories_burned,
            "daily_score": current_fit_score,
            "total_calories_consumed": summary_data.get("total_calories", 0),
            "total_water_ml": summary_data.get("total_water_ml", 0),
        },
        fit_score=current_fit_score,
        rewards_earned=WorkoutRewardsEarned(
            xp=xp_earned,
            coins=coins_earned,
            level=user_rewards["level"],
            current_streak=user_rewards["current_streak"],
            streak_incremented=streak_incremented,
        )
    )


# Maintain backward compatibility with POST /api/v1/workout/session
@router.post("/session", status_code=status.HTTP_201_CREATED, summary="Submit Completed Workout Session (Legacy Alias)")
async def submit_workout_session(
    payload: WorkoutSessionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    complete_input = WorkoutCompleteInput(
        workout_name=payload.workout_name,
        duration_minutes=payload.duration_minutes,
        calories_burned=payload.calories_burned,
        intensity=payload.intensity,
        completed=payload.completed,
        started_at=payload.started_at,
        completed_at=payload.completed_at,
        exercises=payload.exercises,
    )
    return await complete_workout_session(complete_input, current_user)


# ==============================================================================
# 4. GET /api/v1/workout/history
# ==============================================================================
@router.get("/history", summary="Get Workout History")
async def get_workout_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the user's workout history with associated exercise logs and form scores.
    """
    supabase = get_supabase()
    user_id = current_user["id"]

    if supabase and user_id != "usr_001":
        try:
            res = (
                supabase.table("workout_sessions")
                .select("*, exercise_logs(*)")
                .eq("user_id", user_id)
                .order("started_at", desc=True)
                .execute()
            )
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Error querying workout sessions in Supabase: {e}")

    # Fallback to in-memory store
    user_sessions = [s for s in DEV_WORKOUT_SESSIONS if s.get("user_id") == user_id or user_id == "usr_001"]
    result = []
    for s in user_sessions:
        s_copy = dict(s)
        s_copy["exercises"] = [
            ex for ex in DEV_EXERCISE_LOGS if ex.get("workout_session_id") == s["id"]
        ]
        result.append(s_copy)

    return result


# ==============================================================================
# 5. GET /api/v1/workout/today
# ==============================================================================
@router.get("/today", response_model=WorkoutTodayResponse, summary="Get Today's Workout Summary")
async def get_workout_today(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns today's workout sessions and cumulative summary statistics.
    """
    user_id = current_user["id"]
    today_str = datetime.now().date().isoformat()
    supabase = get_supabase()

    sessions = []
    if supabase and user_id != "usr_001":
        try:
            res = (
                supabase.table("workout_sessions")
                .select("*, exercise_logs(*)")
                .eq("user_id", user_id)
                .gte("started_at", today_str)
                .order("started_at", desc=True)
                .execute()
            )
            if res.data:
                sessions = res.data
        except Exception as e:
            logger.error(f"Error querying today's workouts in Supabase: {e}")
    else:
        user_sessions = [
            s for s in DEV_WORKOUT_SESSIONS
            if (s.get("user_id") == user_id or user_id == "usr_001")
            and s.get("started_at", "").startswith(today_str)
        ]
        for s in user_sessions:
            s_copy = dict(s)
            s_copy["exercises"] = [
                ex for ex in DEV_EXERCISE_LOGS if ex.get("workout_session_id") == s["id"]
            ]
            sessions.append(s_copy)

    completed_sessions = [s for s in sessions if s.get("completed") is True]
    total_duration = sum(float(s.get("duration_minutes", 0.0)) for s in completed_sessions)
    total_cals = sum(int(s.get("calories_burned", 0)) for s in completed_sessions)

    all_scores = []
    for s in sessions:
        ex_list = s.get("exercises", []) or s.get("exercise_logs", [])
        for ex in ex_list:
            if ex.get("form_score"):
                all_scores.append(float(ex["form_score"]))
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else None

    return WorkoutTodayResponse(
        date=today_str,
        total_workouts=len(completed_sessions),
        total_duration_minutes=round(total_duration, 1),
        total_calories_burned=total_cals,
        average_form_score=avg_score,
        sessions=sessions
    )
