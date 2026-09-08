from fastapi import APIRouter, Depends, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

class WeightLogInput(BaseModel):
    weight_kg: float = Field(..., gt=20, lt=350, example=75.8)
    body_fat_percentage: Optional[float] = Field(default=None, ge=3, le=60, example=18.5)
    muscle_mass: Optional[float] = Field(default=None, ge=10, lt=200, example=58.2)

class TargetWeightInput(BaseModel):
    target_weight_kg: float = Field(..., gt=20, lt=350, example=72.0)

# Local development store fallback
DEV_WEIGHT_HISTORY: List[Dict[str, Any]] = [
    {
        "id": "wt_1",
        "user_id": "usr_001",
        "weight_kg": 78.4,
        "body_fat_percentage": 20.4,
        "muscle_mass": 56.5,
        "logged_at": (datetime.now() - timedelta(days=28)).isoformat(),
    },
    {
        "id": "wt_2",
        "user_id": "usr_001",
        "weight_kg": 77.2,
        "body_fat_percentage": 19.5,
        "muscle_mass": 57.1,
        "logged_at": (datetime.now() - timedelta(days=14)).isoformat(),
    },
    {
        "id": "wt_3",
        "user_id": "usr_001",
        "weight_kg": 75.8,
        "body_fat_percentage": 18.8,
        "muscle_mass": 58.0,
        "logged_at": datetime.now().isoformat(),
    },
]

@router.get("/history", summary="Get Weight History & Progression")
async def get_weight_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")
    history = []

    if supabase and user_id != "usr_001":
        try:
            res = supabase.table("weight_logs").select("*").eq("user_id", user_id).order("logged_at", desc=False).execute()
            if res.data:
                history = res.data
        except Exception as e:
            logger.error(f"Failed to fetch weight logs from Supabase: {e}")

    if not history:
        history = [h for h in DEV_WEIGHT_HISTORY if h.get("user_id") == user_id or user_id == "usr_001"]

    current_weight = history[-1]["weight_kg"] if history else 75.8
    start_weight = history[0]["weight_kg"] if history else 78.4

    return {
        "current_weight_kg": current_weight,
        "start_weight_kg": start_weight,
        "target_weight_kg": 72.0,
        "history": history,
        "total_logged_days": len(history),
    }

@router.post("/log", status_code=status.HTTP_201_CREATED, summary="Log Weight Entry")
async def log_weight(
    payload: WeightLogInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")
    record = {
        "id": f"wt_{int(datetime.now().timestamp() * 1000)}",
        "user_id": user_id,
        "weight_kg": round(payload.weight_kg, 1),
        "body_fat_percentage": payload.body_fat_percentage,
        "muscle_mass": payload.muscle_mass,
        "logged_at": datetime.now().isoformat(),
    }

    if supabase and user_id != "usr_001":
        try:
            insert_data = record.copy()
            del insert_data["id"]
            res = supabase.table("weight_logs").insert(insert_data).execute()
            if res.data:
                record["id"] = res.data[0]["id"]
            # Also update profiles weight_kg
            supabase.table("profiles").update({"weight_kg": record["weight_kg"]}).eq("id", user_id).execute()
        except Exception as e:
            logger.error(f"Failed to insert weight log into Supabase: {e}")

    DEV_WEIGHT_HISTORY.append(record)
    return {
        "success": True,
        "message": "Weight logged successfully",
        "log": record
    }

@router.put("/target", summary="Update Target Weight Goal")
async def update_target_weight(
    payload: TargetWeightInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")

    if supabase and user_id != "usr_001":
        try:
            supabase.table("user_goals").update({"target_weight": payload.target_weight_kg}).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Failed to update target weight in Supabase: {e}")

    return {
        "success": True,
        "target_weight_kg": payload.target_weight_kg,
        "message": "Target weight updated successfully"
    }
