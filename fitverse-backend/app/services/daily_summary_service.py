from typing import Dict, Any, List, Optional
from datetime import datetime, date
from app.database.supabase import get_supabase
from app.core.logging import logger

# In-memory storage for dev / offline mode
DEV_WATER_LOGS: List[Dict[str, Any]] = [
    {
        "id": "wtr_1",
        "user_id": "usr_001",
        "amount_ml": 500,
        "logged_at": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "wtr_2",
        "user_id": "usr_001",
        "amount_ml": 500,
        "logged_at": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
    },
]

# Daily goals cache
DEFAULT_GOALS = {
    "daily_calorie_target": 2200,
    "daily_protein_target": 140,
    "daily_carbs_target": 250,
    "daily_fat_target": 70,
    "daily_water_target_ml": 3500,
}

class DailySummaryService:
    @staticmethod
    def get_user_goals(user_id: str) -> Dict[str, Any]:
        """Fetch user nutrition and water goals from Supabase user_goals or fallback."""
        supabase = get_supabase()
        if supabase and user_id != "usr_001":
            try:
                res = supabase.table("user_goals").select("*").eq("user_id", user_id).single().execute()
                if res.data:
                    data = res.data
                    return {
                        "daily_calorie_target": data.get("daily_calorie_target") or DEFAULT_GOALS["daily_calorie_target"],
                        "daily_protein_target": int(data.get("daily_protein_target") or DEFAULT_GOALS["daily_protein_target"]),
                        "daily_carbs_target": int(data.get("daily_carbs_target") or DEFAULT_GOALS["daily_carbs_target"]),
                        "daily_fat_target": int(data.get("daily_fat_target") or DEFAULT_GOALS["daily_fat_target"]),
                        "daily_water_target_ml": int((data.get("daily_water_target") or 3.5) * 1000),
                    }
            except Exception as e:
                logger.warning(f"Could not load user_goals from Supabase: {e}")
        return DEFAULT_GOALS.copy()

    @staticmethod
    def sync_daily_summary(user_id: str, target_date: Optional[str] = None):
        """
        Calculates daily nutrition & hydration and updates/upserts public.daily_summaries.
        """
        supabase = get_supabase()
        today_str = target_date or date.today().isoformat()

        # 1. Food totals
        from app.api.food import DEV_MEALS_STORE
        total_calories = 0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_fiber = 0.0

        if supabase and user_id != "usr_001":
            try:
                res = (
                    supabase.table("food_logs")
                    .select("calories, protein, carbs, fat, fiber")
                    .eq("user_id", user_id)
                    .gte("created_at", today_str)
                    .execute()
                )
                if res.data:
                    for row in res.data:
                        total_calories += row.get("calories", 0)
                        total_protein += float(row.get("protein", 0.0))
                        total_carbs += float(row.get("carbs", 0.0))
                        total_fat += float(row.get("fat", 0.0))
                        total_fiber += float(row.get("fiber", 0.0))
            except Exception as e:
                logger.error(f"Error summing food logs from Supabase: {e}")
        else:
            user_meals = [m for m in DEV_MEALS_STORE if m.get("user_id") == user_id or user_id == "usr_001"]
            total_calories = sum(m.get("calories", 0) for m in user_meals)
            total_protein = sum(float(m.get("protein", 0.0)) for m in user_meals)
            total_carbs = sum(float(m.get("carbs", 0.0)) for m in user_meals)
            total_fat = sum(float(m.get("fat", 0.0)) for m in user_meals)
            total_fiber = sum(float(m.get("fiber", 0.0)) for m in user_meals)

        # 2. Water totals
        total_water_ml = 0.0
        if supabase and user_id != "usr_001":
            try:
                res = (
                    supabase.table("water_logs")
                    .select("amount_ml")
                    .eq("user_id", user_id)
                    .gte("logged_at", today_str)
                    .execute()
                )
                if res.data:
                    total_water_ml = sum(float(row.get("amount_ml", 0.0)) for row in res.data)
            except Exception as e:
                logger.error(f"Error summing water logs from Supabase: {e}")
        else:
            user_water = [w for w in DEV_WATER_LOGS if w.get("user_id") == user_id or user_id == "usr_001"]
            total_water_ml = sum(float(w.get("amount_ml", 0.0)) for w in user_water)

        # 3. Upsert to Supabase daily_summaries if connected
        if supabase and user_id != "usr_001":
            try:
                summary_data = {
                    "user_id": user_id,
                    "date": today_str,
                    "total_calories": total_calories,
                    "total_protein": round(total_protein, 2),
                    "total_carbs": round(total_carbs, 2),
                    "total_fat": round(total_fat, 2),
                    "total_fiber": round(total_fiber, 2),
                    "total_water_ml": round(total_water_ml, 2),
                    "updated_at": datetime.now().isoformat(),
                }
                supabase.table("daily_summaries").upsert(summary_data, on_conflict="user_id,date").execute()
            except Exception as e:
                logger.warning(f"Failed to upsert daily_summaries in Supabase: {e}")

        return {
            "total_calories": total_calories,
            "total_protein": round(total_protein, 1),
            "total_carbs": round(total_carbs, 1),
            "total_fat": round(total_fat, 1),
            "total_fiber": round(total_fiber, 1),
            "total_water_ml": round(total_water_ml, 1),
        }

    @staticmethod
    def record_water(user_id: str, amount_ml: int) -> Dict[str, Any]:
        """
        Logs water intake, updates daily summary, and returns progress against target.
        """
        supabase = get_supabase()
        goals = DailySummaryService.get_user_goals(user_id)
        daily_target_ml = goals["daily_water_target_ml"]
        now = datetime.now()
        record_id = f"wtr_{int(now.timestamp() * 1000)}"

        new_entry = {
            "id": record_id,
            "user_id": user_id,
            "amount_ml": amount_ml,
            "logged_at": now.isoformat(),
            "created_at": now.isoformat(),
        }

        if supabase and user_id != "usr_001":
            try:
                insert_payload = {
                    "user_id": user_id,
                    "amount_ml": amount_ml,
                    "logged_at": now.isoformat(),
                }
                res = supabase.table("water_logs").insert(insert_payload).execute()
                if res.data:
                    new_entry["id"] = res.data[0]["id"]
            except Exception as e:
                logger.error(f"Error inserting water log into Supabase: {e}")

        DEV_WATER_LOGS.append(new_entry)

        # Update daily summary
        summary = DailySummaryService.sync_daily_summary(user_id)
        today_total_ml = int(summary["total_water_ml"])
        progress_pct = min(100, round((today_total_ml / daily_target_ml) * 100)) if daily_target_ml > 0 else 0

        return {
            "today_total_ml": today_total_ml,
            "daily_target_ml": daily_target_ml,
            "progress_percentage": progress_pct,
            "id": new_entry["id"],
            "amount_ml": amount_ml,
            "glasses": int(today_total_ml // 250),
            "max_glasses": 8,
        }

    @staticmethod
    def get_water_today(user_id: str) -> Dict[str, Any]:
        """
        Retrieves today's water summary, target, progress percentage, and logs.
        """
        goals = DailySummaryService.get_user_goals(user_id)
        daily_target_ml = goals["daily_water_target_ml"]
        summary = DailySummaryService.sync_daily_summary(user_id)
        today_total_ml = int(summary["total_water_ml"])
        progress_pct = min(100, round((today_total_ml / daily_target_ml) * 100)) if daily_target_ml > 0 else 0

        # Retrieve today's logs
        supabase = get_supabase()
        logs = []
        if supabase and user_id != "usr_001":
            try:
                today_str = date.today().isoformat()
                res = (
                    supabase.table("water_logs")
                    .select("*")
                    .eq("user_id", user_id)
                    .gte("logged_at", today_str)
                    .order("logged_at", desc=True)
                    .execute()
                )
                if res.data:
                    logs = res.data
            except Exception as e:
                logger.error(f"Error fetching water logs: {e}")
        else:
            logs = [w for w in DEV_WATER_LOGS if w.get("user_id") == user_id or user_id == "usr_001"]

        return {
            "today_total_ml": today_total_ml,
            "daily_target_ml": daily_target_ml,
            "progress_percentage": progress_pct,
            "glasses": int(today_total_ml // 250),
            "max_glasses": 8,
            "yesterday_liters": 1.0,
            "avg_liters_per_day": 1.3,
            "streak_days": 12,
            "logs": logs,
        }

    @staticmethod
    def delete_water_log(user_id: str, log_id: str) -> Dict[str, Any]:
        """
        Deletes a water log entry and updates the daily summary.
        """
        global DEV_WATER_LOGS
        supabase = get_supabase()

        if supabase and user_id != "usr_001":
            try:
                supabase.table("water_logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
            except Exception as e:
                logger.error(f"Error deleting water log in Supabase: {e}")

        DEV_WATER_LOGS = [w for w in DEV_WATER_LOGS if w.get("id") != log_id]

        summary = DailySummaryService.sync_daily_summary(user_id)
        goals = DailySummaryService.get_user_goals(user_id)
        daily_target_ml = goals["daily_water_target_ml"]
        today_total_ml = int(summary["total_water_ml"])
        progress_pct = min(100, round((today_total_ml / daily_target_ml) * 100)) if daily_target_ml > 0 else 0

        return {
            "success": True,
            "message": "Water log deleted successfully",
            "today_total_ml": today_total_ml,
            "daily_target_ml": daily_target_ml,
            "progress_percentage": progress_pct,
            "glasses": int(today_total_ml // 250),
        }

    @staticmethod
    def get_nutrition_daily_summary(user_id: str, target_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns full daily nutrition breakdown matching FitVerse requirements:
        date, calories, protein, carbs, fat, water.
        """
        today_str = target_date or date.today().isoformat()
        goals = DailySummaryService.get_user_goals(user_id)
        summary = DailySummaryService.sync_daily_summary(user_id, today_str)

        cal_target = goals["daily_calorie_target"]
        pro_target = goals["daily_protein_target"]
        carbs_target = goals["daily_carbs_target"]
        fat_target = goals["daily_fat_target"]
        water_target = goals["daily_water_target_ml"]

        cal_consumed = int(summary["total_calories"])
        pro_consumed = int(summary["total_protein"])
        carbs_consumed = int(summary["total_carbs"])
        fat_consumed = int(summary["total_fat"])
        water_consumed = int(summary["total_water_ml"])

        cal_percentage = min(100, round((cal_consumed / cal_target) * 100)) if cal_target > 0 else 0
        pro_percentage = min(100, round((pro_consumed / pro_target) * 100)) if pro_target > 0 else 0
        water_percentage = min(100, round((water_consumed / water_target) * 100)) if water_target > 0 else 0

        return {
            "date": today_str,
            "calories": {
                "consumed": cal_consumed,
                "target": cal_target,
                "percentage": cal_percentage,
            },
            "protein": {
                "consumed": pro_consumed,
                "target": pro_target,
                "percentage": pro_percentage,
            },
            "carbs": {
                "consumed": carbs_consumed,
                "target": carbs_target,
            },
            "fat": {
                "consumed": fat_consumed,
                "target": fat_target,
            },
            "water": {
                "consumed_ml": water_consumed,
                "target_ml": water_target,
                "percentage": water_percentage,
            },
        }

daily_summary_service = DailySummaryService()
