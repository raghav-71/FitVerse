from fastapi import APIRouter, Depends, status, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from app.api.deps import get_current_user
from app.schemas.food import (
    AnalyzeFoodRequest,
    FoodAnalyzeResponse,
    FoodLogCreate,
    FoodLogResponse,
    DailyNutritionSummary,
)
from app.services.food_nlp_service import food_nlp_service
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

# In-memory local development store when Supabase keys are not yet configured
DEV_MEALS_STORE: List[Dict[str, Any]] = [
    {
        "id": "meal_1",
        "user_id": "usr_001",
        "food_name": "Oatmeal with Almonds & Whey",
        "quantity": 1.0,
        "quantity_unit": "bowl",
        "meal_type": "Breakfast",
        "calories": 480,
        "protein": 38.0,
        "carbs": 56.0,
        "fat": 12.0,
        "fiber": 8.0,
        "logged_at": "08:15 AM",
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "meal_2",
        "user_id": "usr_001",
        "food_name": "Paneer Tikka Bowl & Brown Rice",
        "quantity": 1.0,
        "quantity_unit": "bowl",
        "meal_type": "Lunch",
        "calories": 680,
        "protein": 44.0,
        "carbs": 72.0,
        "fat": 18.0,
        "fiber": 10.0,
        "logged_at": "01:30 PM",
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "meal_3",
        "user_id": "usr_001",
        "food_name": "Greek Yogurt & Mixed Berries",
        "quantity": 1.0,
        "quantity_unit": "cup",
        "meal_type": "Snack",
        "calories": 220,
        "protein": 20.0,
        "carbs": 26.0,
        "fat": 4.0,
        "fiber": 3.0,
        "logged_at": "05:00 PM",
        "created_at": datetime.now().isoformat(),
    },
]

# 1. POST /api/v1/food/analyze
@router.post(
    "/analyze",
    response_model=FoodAnalyzeResponse,
    summary="Natural Language Food Nutrition Extraction",
    description="Parses free-form text input (e.g. 'I ate 2 rotis with dal'), extracts items, quantities, meal type, and estimates nutritional breakdown."
)
async def analyze_food(payload: AnalyzeFoodRequest):
    return food_nlp_service.analyze_natural_language(payload.text)

# 2. POST /api/v1/food/log
@router.post(
    "/log",
    status_code=status.HTTP_201_CREATED,
    summary="Log Meal Item",
    description="Saves a confirmed food log entry into the database."
)
async def log_food_entry(
    payload: FoodLogCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")
    meal_id = f"meal_{int(datetime.now().timestamp() * 1000)}"
    time_str = datetime.now().strftime("%I:%M %p")

    record = {
        "id": meal_id,
        "user_id": user_id,
        "food_name": payload.food_name,
        "quantity": payload.quantity,
        "quantity_unit": payload.quantity_unit,
        "meal_type": payload.meal_type,
        "calories": payload.calories,
        "protein": payload.protein,
        "carbs": payload.carbs,
        "fat": payload.fat,
        "fiber": payload.fiber or 0.0,
        "logged_at": time_str,
        "created_at": datetime.now().isoformat(),
    }

    if supabase and user_id != "usr_001":
        try:
            insert_data = record.copy()
            del insert_data["id"]
            insert_data["logged_at"] = datetime.now().isoformat()
            res = supabase.table("food_logs").insert(insert_data).execute()
            if res.data:
                record["id"] = res.data[0]["id"]
        except Exception as e:
            logger.error(f"Failed to insert food log into Supabase: {e}")

    DEV_MEALS_STORE.append(record)

    # 2. Update daily nutrition & 3. Update daily summary
    from app.services.daily_summary_service import daily_summary_service
    updated_summary = daily_summary_service.sync_daily_summary(user_id)

    return {
        "success": True,
        "message": "Meal logged successfully",
        "meal": record,
        "daily_summary": updated_summary
    }

# 3. GET /api/v1/food/today
@router.get(
    "/today",
    summary="Get Today's Food Logs and Macro Summary",
    description="Retrieves all meals logged today, aggregated macros, and target progress."
)
async def get_today_food_logs(current_user: Dict[str, Any] = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")
    meals: List[Dict[str, Any]] = []

    if supabase and user_id != "usr_001":
        try:
            today_date = date.today().isoformat()
            res = supabase.table("food_logs").select("*").eq("user_id", user_id).gte("created_at", today_date).order("created_at", desc=False).execute()
            if res.data:
                meals = res.data
        except Exception as e:
            logger.error(f"Error querying today's food logs: {e}")

    if not meals:
        meals = [m for m in DEV_MEALS_STORE if m.get("user_id") == user_id or user_id == "usr_001"]

    total_cal = sum(m.get("calories", 0) for m in meals)
    total_pro = round(sum(float(m.get("protein", 0.0)) for m in meals), 1)
    total_carb = round(sum(float(m.get("carbs", 0.0)) for m in meals), 1)
    total_fat = round(sum(float(m.get("fat", 0.0)) for m in meals), 1)
    total_fiber = round(sum(float(m.get("fiber", 0.0)) for m in meals), 1)

    return {
        "date": date.today().isoformat(),
        "total": {
            "calories": total_cal,
            "protein": total_pro,
            "carbs": total_carb,
            "fat": total_fat,
            "fiber": total_fiber,
        },
        "targets": {
            "calories": 2200,
            "protein": 150.0,
            "water": 8,
        },
        "meals": meals,
        "meals_count": len(meals),
    }

# 4. GET /api/v1/food/history
@router.get(
    "/history",
    summary="Get Food Log History",
    description="Fetches recent meals across past days."
)
async def get_food_history(
    limit: int = 30,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")

    if supabase and user_id != "usr_001":
        try:
            res = supabase.table("food_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return {"success": True, "meals": res.data or []}
        except Exception as e:
            logger.error(f"Error querying food history: {e}")

    return {"success": True, "meals": DEV_MEALS_STORE}

# 5. DELETE /api/v1/food/{id}
@router.delete(
    "/{meal_id}",
    summary="Delete Food Log Entry",
    description="Deletes a meal log by its ID."
)
async def delete_food_log(
    meal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    global DEV_MEALS_STORE
    supabase = get_supabase()
    user_id = current_user.get("id", "usr_001")

    if supabase and user_id != "usr_001":
        try:
            supabase.table("food_logs").delete().eq("id", meal_id).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Error deleting food log from Supabase: {e}")

    DEV_MEALS_STORE = [m for m in DEV_MEALS_STORE if m.get("id") != meal_id]
    from app.services.daily_summary_service import daily_summary_service
    daily_summary_service.sync_daily_summary(user_id)

    return {"success": True, "message": f"Meal {meal_id} deleted successfully"}

