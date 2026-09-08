from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.services.daily_summary_service import daily_summary_service

router = APIRouter()

class MetricWithPercentage(BaseModel):
    consumed: int
    target: int
    percentage: int

class MetricSimple(BaseModel):
    consumed: int
    target: int

class WaterMetric(BaseModel):
    consumed_ml: int
    target_ml: int
    percentage: int

class DailyNutritionSummaryResponse(BaseModel):
    date: str
    calories: MetricWithPercentage
    protein: MetricWithPercentage
    carbs: MetricSimple
    fat: MetricSimple
    water: WaterMetric

@router.get(
    "/daily-summary",
    response_model=DailyNutritionSummaryResponse,
    summary="Get Daily Nutrition & Hydration Summary",
    description="Returns aggregated daily calories, macros (protein, carbs, fat), and hydration against user targets with completion percentages."
)
async def get_daily_nutrition_summary(
    date: Optional[str] = Query(None, description="ISO date YYYY-MM-DD (defaults to today)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id", "usr_001")
    return daily_summary_service.get_nutrition_daily_summary(user_id, date)
