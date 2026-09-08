from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from datetime import datetime
from app.api.deps import get_current_user
from app.schemas.health import SleepLogCreate, SleepLogResponse
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

@router.get("/latest", summary="Get Latest Sleep Record")
async def get_latest_sleep(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "sleep_duration_hours": 7.5,
        "sleep_quality": "good",
        "logged_at": datetime.now().isoformat()
    }

@router.post("", response_model=SleepLogResponse, status_code=status.HTTP_201_CREATED, summary="Log Sleep Data")
async def log_sleep(
    payload: SleepLogCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    record = {
        "id": f"slp_{int(datetime.now().timestamp())}",
        "user_id": current_user["id"],
        "sleep_duration_hours": payload.sleep_duration_hours,
        "sleep_quality": payload.sleep_quality,
        "bedtime": payload.bedtime,
        "wake_time": payload.wake_time,
        "logged_at": datetime.now(),
        "created_at": datetime.now(),
    }

    if supabase and current_user.get("id") != "usr_001":
        try:
            insert_data = record.copy()
            del insert_data["id"]
            res = supabase.table("sleep_logs").insert(insert_data).execute()
            if res.data:
                record.update(res.data[0])
        except Exception as e:
            logger.error(f"Failed to log sleep in Supabase: {e}")

    return SleepLogResponse(**record)
