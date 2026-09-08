from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.api.deps import get_current_user
from app.services.nutrition_service import nutrition_service

router = APIRouter()

class InjuryScreenRequest(BaseModel):
    body_parts: List[str]
    pain_type: Optional[str] = "joint_strain"
    pain_level: str = "mild"

class AnalyzeFoodRequest(BaseModel):
    description: str

@router.post("/injury-screen", summary="AI Biomechanical Injury Screening")
async def screen_injury(payload: InjuryScreenRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    has_knee = any("knee" in p.lower() for p in payload.body_parts)
    has_back = any("back" in p.lower() for p in payload.body_parts)

    status = "SAFE"
    reason = "Kinetic chain alignment is within safe loading parameters."
    restricted = []
    alternatives = []

    if payload.pain_level == "severe" or len(payload.body_parts) >= 3:
        status = "BLOCK"
        reason = "Multiple high-load stress points detected. Axial spinal loads are locked."
        restricted = ["Barbell Back Squat", "Romanian Deadlift"]
        alternatives = [
            {"original": "Barbell Back Squat", "alternative": "High Box Squat", "reason": "Reduces patellar shear past 90 degrees"}
        ]
    elif has_knee or has_back or payload.pain_level == "moderate":
        status = "CAUTION"
        reason = f"Mild tension reported on {', '.join(payload.body_parts)}. AI Form Guard active."
        if has_knee:
            restricted.append("Dynamic Lunges")
            alternatives.append({"original": "Dynamic Lunges", "alternative": "High Box Squat", "reason": "Guards patellar tendon"})

    return {
        "status": status,
        "assessment_reason": reason,
        "restricted_exercises": restricted,
        "recommended_alternatives": alternatives,
    }

@router.post("/nutrition-analyze", summary="AI Multimodal Nutrition Estimator")
async def analyze_nutrition(payload: AnalyzeFoodRequest):
    return await nutrition_service.analyze_food_text_or_image(payload.description)

from app.services.diet_planner_service import diet_planner_service, DietPlanRequest, DietPlanResponse
from app.services.daily_health_coach_service import daily_health_coach_service
from app.services.weekly_analysis_service import weekly_analysis_service

class CategoryScores(BaseModel):
    nutrition: int
    hydration: int
    workout: int
    activity: int
    sleep: int
    stress: int

class DailyAnalysisResponse(BaseModel):
    daily_score: int
    category_scores: CategoryScores
    positives: List[str]
    areas_to_improve: List[str]
    nutrition_analysis: str
    workout_analysis: str
    hydration_analysis: str
    recovery_analysis: str
    tomorrow_recommendations: List[str]

# Weekly Intelligence Report Schemas
class WeekRange(BaseModel):
    start: str
    end: str

class WeeklyNutrition(BaseModel):
    average_calories: int
    target_calories: int
    average_protein: int
    target_protein: int
    improvement_percentage: int

class WeeklyHydration(BaseModel):
    total_water_ml: int
    daily_average_ml: int
    target_ml: int

class WeeklyWorkout(BaseModel):
    workout_days: int
    total_minutes: int
    calories_burned: int

class WeeklySleep(BaseModel):
    average_hours: float

class WeeklyStress(BaseModel):
    average_level: float

class WeeklyWeight(BaseModel):
    start_weight: float
    end_weight: float
    change: float

class NextWeekPlan(BaseModel):
    nutrition: List[str]
    hydration: List[str]
    workout: List[str]
    sleep: List[str]
    stress: List[str]

class WeeklyReportResponse(BaseModel):
    week: WeekRange
    weekly_score: int
    previous_week_score: int
    score_change: int
    nutrition: WeeklyNutrition
    hydration: WeeklyHydration
    workout: WeeklyWorkout
    sleep: WeeklySleep
    stress: WeeklyStress
    weight: WeeklyWeight
    improvements: List[str]
    problems: List[str]
    achievements: List[str]
    ai_analysis: str
    next_week_plan: NextWeekPlan

@router.post(
    "/diet-plan",
    response_model=DietPlanResponse,
    summary="Personalized AI Diet & Nutrition Planner",
    description="Calculates personalized BMR, TDEE, calories, macros, hydration targets, and meal breakdown based on user biometrics and goals, saving targets to user_goals."
)
async def generate_diet_plan(
    payload: DietPlanRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id", "usr_001")
    return diet_planner_service.calculate_plan(payload, user_id=user_id)

@router.get(
    "/daily-analysis",
    response_model=DailyAnalysisResponse,
    summary="Daily AI Health Coach Full-Day Analysis",
    description="Analyzes the user's complete day across nutrition, hydration, workouts, activity, sleep, stress, and goals vs actuals, generating positive actionable guidance."
)
async def get_daily_analysis(
    date: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id", "usr_001")
    return daily_health_coach_service.generate_daily_analysis(user_id=user_id, target_date=date)

@router.get(
    "/weekly-report",
    response_model=WeeklyReportResponse,
    summary="AI Weekly Health Intelligence Report",
    description="Analyzes the previous 7 days comparing current week vs previous week, synthesizing improvements, negative patterns, consistency, and realistic next-week goals."
)
async def get_weekly_report(
    week_offset: int = 0,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id", "usr_001")
    return weekly_analysis_service.generate_weekly_report(user_id=user_id, week_offset=week_offset)



