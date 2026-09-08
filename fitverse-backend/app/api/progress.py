from fastapi import APIRouter, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.services.health_score_service import health_score_service

router = APIRouter()

class DailyFitScoreDetail(BaseModel):
    fit_score: int
    nutrition_score: int
    workout_score: int
    hydration_score: int
    activity_score: int
    sleep_score: int
    stress_score: int
    date: str

class FitScoreTrendItem(BaseModel):
    date: str
    fit_score: int

class FitScoreOverviewResponse(BaseModel):
    fit_score: int
    nutrition_score: int
    workout_score: int
    hydration_score: int
    activity_score: int
    sleep_score: int
    stress_score: int
    daily_fit_score: DailyFitScoreDetail
    weekly_average_fit_score: int
    monthly_trend: List[FitScoreTrendItem]
    category_weights: Dict[str, float]

@router.get("/summary", summary="Get Progress & 6 Dimensions Overview")
async def get_progress_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "streak_days": current_user.get("current_streak", 18),
        "total_xp": current_user.get("xp", 4820),
        "avg_form_score": 94.2,
        "total_sessions": 42,
        "six_dimensions": health_score_service.calculate_six_dimensions(),
        "weekly_stress": 2,
    }

@router.get(
    "/fit-score",
    response_model=FitScoreOverviewResponse,
    summary="FitVerse FIT SCORE System",
    description="Returns the holistic daily Fit Score (0-100), category breakdowns, weekly average, and 30-day monthly trend."
)
async def get_fit_score(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("id", "usr_001")
    return health_score_service.get_fit_score_overview(user_id=user_id)

