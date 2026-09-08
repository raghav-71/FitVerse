from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from datetime import datetime
from app.api.deps import get_current_user
from app.schemas.health import StressLogCreate, StressLogResponse
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

@router.get("/latest", summary="Get Latest Stress Level")
async def get_latest_stress(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "stress_level": 2,
        "label": "Mild",
        "recovery_status": "Good Balance",
        "recommendation": "Optimal recovery state for compound barbell lifts."
    }

@router.post("", response_model=StressLogResponse, status_code=status.HTTP_201_CREATED, summary="Log Stress Check-in")
async def log_stress(
    payload: StressLogCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    record = {
        "id": f"str_{int(datetime.now().timestamp())}",
        "user_id": current_user["id"],
        "stress_level": payload.stress_level,
        "mood": payload.mood,
        "notes": payload.notes,
        "logged_at": datetime.now(),
        "created_at": datetime.now(),
    }

    if supabase and current_user.get("id") != "usr_001":
        try:
            insert_data = record.copy()
            del insert_data["id"]
            res = supabase.table("stress_logs").insert(insert_data).execute()
            if res.data:
                record.update(res.data[0])
        except Exception as e:
            logger.error(f"Failed to log stress in Supabase: {e}")

    return StressLogResponse(**record)
