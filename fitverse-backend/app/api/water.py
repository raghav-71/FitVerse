from fastapi import APIRouter, Depends, status, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.services.daily_summary_service import daily_summary_service

router = APIRouter()

class WaterLogPayload(BaseModel):
    amount_ml: int = Field(..., gt=0, le=5000, example=500, description="Amount of water consumed in milliliters")

class WaterLogResponseModel(BaseModel):
    today_total_ml: int = Field(..., example=2500)
    daily_target_ml: int = Field(..., example=3500)
    progress_percentage: int = Field(..., example=71)
    glasses: Optional[int] = 10
    max_glasses: Optional[int] = 8

@router.post(
    "/log",
    response_model=WaterLogResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Log Water Intake",
    description="Logs water consumption, updates daily hydration total and daily summary table."
)
async def log_water(
    payload: WaterLogPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id", "usr_001")
    result = daily_summary_service.record_water(user_id, payload.amount_ml)
    return WaterLogResponseModel(
        today_total_ml=result["today_total_ml"],
        daily_target_ml=result["daily_target_ml"],
        progress_percentage=result["progress_percentage"],
        glasses=result.get("glasses", 0),
        max_glasses=result.get("max_glasses", 8)
    )

# Backward-compatible alias for existing POST /api/v1/water
@router.post(
    "",
    response_model=WaterLogResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Log Water Consumption (Alias)",
    include_in_schema=False
)
async def log_water_legacy(
    payload: WaterLogPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    return await log_water(payload, current_user)

@router.get(
    "/today",
    summary="Get Today's Water Consumption",
    description="Retrieves today's total hydration, daily target, progress percentage, and log history."
)
async def get_today_water(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("id", "usr_001")
    return daily_summary_service.get_water_today(user_id)

@router.delete(
    "/{id}",
    summary="Delete Water Log Entry",
    description="Removes a specific water log entry and recalculates daily summary totals."
)
async def delete_water_entry(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id", "usr_001")
    result = daily_summary_service.delete_water_log(user_id, id)
    return result
