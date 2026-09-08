from fastapi import APIRouter, Depends, status
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

class ManualExerciseLogInput(BaseModel):
    activities: List[str] = Field(..., example=["Gym", "Home Workout"])
    duration_minutes: Optional[float] = 45.0
    notes: Optional[str] = None

# In-memory dev fallback
DEV_ACTIVITY_STATE = {
    "exercise_logged": True,
    "logged_activities": ["Gym", "Home Workout"],
    "week_workouts_count": 6,
    "streak_days": 18,
}

@router.get("/daily-summary", summary="Get Daily Activity Summary")
async def get_daily_activity_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "date": date.today().isoformat(),
        "exercise_logged": DEV_ACTIVITY_STATE["exercise_logged"],
        "logged_activities": DEV_ACTIVITY_STATE["logged_activities"],
        "week_workouts_count": DEV_ACTIVITY_STATE["week_workouts_count"],
        "streak_days": DEV_ACTIVITY_STATE["streak_days"],
        "water_glasses": 4,
        "max_glasses": 8,
        "current_weight_kg": 75.8,
        "target_weight_kg": 72.0,
    }

@router.post("/exercise", status_code=status.HTTP_201_CREATED, summary="Log Manual Exercise Activity")
async def log_manual_exercise(
    payload: ManualExerciseLogInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    DEV_ACTIVITY_STATE["exercise_logged"] = True
    DEV_ACTIVITY_STATE["logged_activities"] = payload.activities
    return {
        "success": True,
        "message": "Exercise activity logged successfully",
        "logged_activities": payload.activities,
        "week_workouts_count": DEV_ACTIVITY_STATE["week_workouts_count"],
    }
