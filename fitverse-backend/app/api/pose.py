from fastapi import APIRouter, Depends, status, HTTPException
from typing import List, Dict, Any
from datetime import datetime
import time

from app.api.deps import get_current_user
from app.schemas.pose import (
    PoseSessionCreate,
    PoseSessionSummaryResponse,
    PoseHistoryResponse,
    PoseHistoryItem,
)
from app.database.supabase import get_supabase
from app.services.daily_summary_service import daily_summary_service
from app.services.health_score_service import health_score_service

router = APIRouter()

# In-memory storage fallback for development / offline mode
DEV_POSE_SESSIONS: List[Dict[str, Any]] = [
    {
        "id": "pose_mock_1",
        "user_id": "usr_001",
        "exercise": "squat",
        "reps": 12,
        "duration_seconds": 60,
        "average_form_score": 91.5,
        "common_mistakes": ["Knees moving inward slightly"],
        "feedback": ["Great depth, keep knees tracking with toes"],
        "created_at": datetime.now(),
    }
]


@router.post(
    "/session",
    response_model=PoseSessionSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save AI Pose Detection & Form Analysis Session",
)
async def create_pose_session(
    input_data: PoseSessionCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Records an on-device evaluated AI Fitness Mirror pose session.
    Persists reps, duration, average form score, mistakes, and cues.
    Updates daily summaries, calorie expenditures, and daily Fit Score.
    """
    session_id = f"pose_{int(time.time() * 1000)}"
    now = datetime.now()

    # Estimate calories burned based on MET values for calisthenics
    # Average ~0.12 kcal per second (~7.2 kcal/min)
    calories_est = max(5, int(input_data.duration_seconds * 0.12)) if input_data.duration_seconds > 0 else max(5, input_data.reps * 3)

    session_record = {
        "id": session_id,
        "user_id": user_id,
        "exercise": input_data.exercise.lower().strip(),
        "reps": input_data.reps,
        "duration_seconds": input_data.duration_seconds,
        "average_form_score": round(float(input_data.average_form_score), 1),
        "common_mistakes": input_data.common_mistakes or [],
        "feedback": input_data.feedback or [],
        "joint_angles_summary": input_data.joint_angles_summary or {},
        "created_at": now,
    }

    # 1. Supabase Persistence or In-Memory fallback
    supabase = get_supabase()
    if supabase:
        try:
            supabase.client.table("pose_sessions").insert({
                "id": session_id,
                "user_id": user_id,
                "exercise_name": session_record["exercise"],
                "reps": session_record["reps"],
                "duration_seconds": session_record["duration_seconds"],
                "form_score": session_record["average_form_score"],
                "mistakes": session_record["common_mistakes"],
                "feedback": session_record["feedback"],
                "created_at": now.isoformat(),
            }).execute()
        except Exception as e:
            # Fallback to local array if table is absent
            DEV_POSE_SESSIONS.insert(0, session_record)
    else:
        DEV_POSE_SESSIONS.insert(0, session_record)

    # 2. Update Daily Summary (Duration in minutes & Calories)
    try:
        duration_min = round(input_data.duration_seconds / 60.0, 1)
        daily_summary_service.add_workout_activity(
            user_id=user_id,
            duration_minutes=duration_min,
            calories_burned=calories_est,
        )
    except Exception:
        pass

    # 3. Recalculate Fit Score
    try:
        health_score_service.calculate_daily_fit_score(user_id)
    except Exception:
        pass

    # 4. Return exact requested schema
    return PoseSessionSummaryResponse(
        exercise=session_record["exercise"],
        reps=session_record["reps"],
        average_form_score=session_record["average_form_score"],
        common_mistakes=session_record["common_mistakes"],
        feedback=session_record["feedback"],
    )


@router.get(
    "/history",
    response_model=PoseHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Pose Detection & Form Score History",
)
async def get_pose_history(
    user_id: str = Depends(get_current_user),
):
    """
    Returns user's pose detection sessions history and cumulative form score average.
    """
    supabase = get_supabase()
    user_sessions: List[PoseHistoryItem] = []

    if supabase:
        try:
            res = (
                supabase.client.table("pose_sessions")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
            if res.data:
                for row in res.data:
                    user_sessions.append(
                        PoseHistoryItem(
                            id=row.get("id"),
                            exercise=row.get("exercise_name") or row.get("exercise", "squat"),
                            reps=row.get("reps", 0),
                            duration_seconds=row.get("duration_seconds", 0),
                            average_form_score=float(row.get("form_score") or row.get("average_form_score", 85.0)),
                            common_mistakes=row.get("mistakes") or row.get("common_mistakes") or [],
                            feedback=row.get("feedback") or [],
                            created_at=datetime.fromisoformat(row.get("created_at")) if isinstance(row.get("created_at"), str) else datetime.now(),
                        )
                    )
        except Exception:
            pass

    if not user_sessions:
        for s in DEV_POSE_SESSIONS:
            if s.get("user_id") == user_id or s.get("user_id") == "usr_001":
                user_sessions.append(
                    PoseHistoryItem(
                        id=s["id"],
                        exercise=s["exercise"],
                        reps=s["reps"],
                        duration_seconds=s["duration_seconds"],
                        average_form_score=s["average_form_score"],
                        common_mistakes=s["common_mistakes"],
                        feedback=s["feedback"],
                        created_at=s["created_at"],
                    )
                )

    total_count = len(user_sessions)
    overall_avg = (
        round(sum(item.average_form_score for item in user_sessions) / total_count, 1)
        if total_count > 0
        else 90.0
    )

    return PoseHistoryResponse(
        total_sessions=total_count,
        average_overall_form_score=overall_avg,
        sessions=user_sessions,
    )
