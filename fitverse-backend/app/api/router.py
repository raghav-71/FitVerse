from fastapi import APIRouter
from app.api import auth, users, food, water, workout, progress, stress, sleep, ai, weight, activity, nutrition, pose, injury, gamification
from app.schemas.common import APIStatusResponse

api_router = APIRouter()

# API Status Endpoint (/api/v1/status)
@api_router.get("/status", response_model=APIStatusResponse, summary="API v1 Operational Status")
async def get_api_status():
    return APIStatusResponse(
        app_name="FitVerse AI API",
        environment="development",
        api_version="v1",
        status="operational",
        services={
            "auth": "active",
            "users": "active",
            "food": "active",
            "water": "active",
            "nutrition": "active",
            "weight": "active",
            "activity": "active",
            "workout": "active",
            "progress": "active",
            "stress": "active",
            "sleep": "active",
            "ai": "active",
            "pose": "active",
            "injury": "active",
            "gamification": "active",
            "leaderboard": "active"
        }
    )

# Include Sub-Routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/user", tags=["User Profile"])
api_router.include_router(food.router, prefix="/food", tags=["Nutrition & Food"])
api_router.include_router(water.router, prefix="/water", tags=["Hydration"])
api_router.include_router(nutrition.router, prefix="/nutrition", tags=["Daily Nutrition & Macros"])
api_router.include_router(weight.router, prefix="/weight", tags=["Weight Progression"])
api_router.include_router(activity.router, prefix="/activity", tags=["Daily Activity & Habits"])
api_router.include_router(workout.router, prefix="/workout", tags=["Workouts & Kinetic Tracking"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress & Analytics"])
api_router.include_router(stress.router, prefix="/stress", tags=["Stress & Recovery"])
api_router.include_router(sleep.router, prefix="/sleep", tags=["Sleep Tracking"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Biomechanical & Nutrition Services"])
api_router.include_router(pose.router, prefix="/pose", tags=["Pose Detection & Biomechanics"])
api_router.include_router(injury.router, prefix="/injury", tags=["Injury Prevention Coach"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["Gamification, XP & Challenges"])
api_router.include_router(gamification.leaderboard_router, prefix="/leaderboard", tags=["Leaderboard Arena"])


