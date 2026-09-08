from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from app.core.logging import logger
from app.database.supabase import get_supabase
from app.services.daily_summary_service import daily_summary_service

# Configurable Weights (Must sum to 1.0)
DEFAULT_CATEGORY_WEIGHTS: Dict[str, float] = {
    "nutrition": 0.25,
    "workout": 0.20,
    "hydration": 0.15,
    "activity": 0.15,
    "sleep": 0.15,
    "stress": 0.10,
}

# Configurable Target Benchmarks
DEFAULT_BENCHMARKS = {
    "step_target": 10000,
    "sleep_target_hours": 7.5,
    "min_sleep_optimal": 7.0,
    "neutral_unlogged_score": 70,
    "rest_day_workout_score": 75,
}

class HealthScoreService:
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or DEFAULT_CATEGORY_WEIGHTS.copy()

    def update_weights(self, new_weights: Dict[str, float]):
        """Allows dynamic configuration of category weights."""
        total = sum(new_weights.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Category weights must sum to 1.0 (current sum = {total})")
        self.weights = new_weights.copy()

    # -------------------------------------------------------------
    # CATEGORY SCORING ALGORITHMS
    # -------------------------------------------------------------

    def calculate_nutrition_score(
        self,
        cals_consumed: int,
        cals_target: int,
        pro_consumed: float,
        pro_target: float,
    ) -> int:
        """
        Calculates Nutrition score (0-100) comparing actuals vs personal targets.
        Graceful handling: If no food logged yet today, returns 50 neutral baseline.
        """
        if cals_consumed <= 0 or cals_target <= 0:
            return DEFAULT_BENCHMARKS["neutral_unlogged_score"]

        # 1. Caloric proximity (up to 50 points)
        cal_diff_pct = abs(cals_consumed - cals_target) / cals_target
        if cal_diff_pct <= 0.10:
            cal_pts = 50
        elif cal_diff_pct <= 0.20:
            cal_pts = 42
        elif cal_diff_pct <= 0.30:
            cal_pts = 34
        else:
            cal_pts = max(10, int(50 - (cal_diff_pct * 60)))

        # 2. Protein compliance (up to 50 points)
        if pro_target > 0:
            pro_ratio = pro_consumed / pro_target
            if pro_ratio >= 0.95:
                pro_pts = 50
            elif pro_ratio >= 0.80:
                pro_pts = 42
            elif pro_ratio >= 0.60:
                pro_pts = 32
            else:
                pro_pts = max(10, int(pro_ratio * 50))
        else:
            pro_pts = 40

        return min(100, max(0, cal_pts + pro_pts))

    def calculate_workout_score(
        self,
        has_workout: bool,
        duration_mins: int = 0,
        avg_form_score: Optional[float] = None,
        is_rest_day: bool = False,
    ) -> int:
        """
        Calculates Workout score (0-100).
        Avoids unfair penalty: Active rest days receive a solid 75 benchmark.
        """
        if is_rest_day or not has_workout:
            return DEFAULT_BENCHMARKS["rest_day_workout_score"]

        # Workout session completed
        # Base completion (60 pts) + Duration bonus (up to 15 pts) + Form score bonus (up to 25 pts)
        base = 60
        duration_bonus = min(15, int((duration_mins / 30) * 15))
        form_bonus = min(25, int(((avg_form_score or 90.0) / 100.0) * 25))

        return min(100, base + duration_bonus + form_bonus)

    def calculate_hydration_score(
        self,
        water_consumed_ml: float,
        water_target_ml: float,
    ) -> int:
        """
        Calculates Hydration score (0-100).
        """
        if water_target_ml <= 0:
            return DEFAULT_BENCHMARKS["neutral_unlogged_score"]

        if water_consumed_ml <= 0:
            return 40 # Morning / early day baseline before logging

        ratio = water_consumed_ml / water_target_ml
        if ratio >= 1.0:
            return 100
        elif ratio >= 0.85:
            return 90
        elif ratio >= 0.70:
            return 80
        elif ratio >= 0.50:
            return 65
        else:
            return max(30, int(ratio * 100))

    def calculate_activity_score(
        self,
        steps: Optional[int],
        step_target: int = 10000,
        has_workout: bool = False,
    ) -> int:
        """
        Calculates Activity score (0-100) based on daily steps and movement.
        """
        if steps is not None and steps > 0:
            ratio = steps / max(1, step_target)
            if ratio >= 1.0:
                return 100
            elif ratio >= 0.80:
                return 90
            elif ratio >= 0.60:
                return 75
            else:
                return max(35, int(ratio * 100))

        # Steps unlogged: fallback to workout presence without penalizing
        return 80 if has_workout else DEFAULT_BENCHMARKS["neutral_unlogged_score"]

    def calculate_sleep_score(
        self,
        sleep_hours: Optional[float],
        sleep_quality: Optional[str] = None,
    ) -> int:
        """
        Calculates Sleep score (0-100).
        Avoids unfair penalty: unlogged sleep yields neutral 70 score.
        """
        if sleep_hours is None or sleep_hours <= 0:
            return DEFAULT_BENCHMARKS["neutral_unlogged_score"]

        if sleep_hours >= 7.5:
            base = 95
        elif sleep_hours >= 7.0:
            base = 88
        elif sleep_hours >= 6.0:
            base = 75
        elif sleep_hours >= 5.0:
            base = 60
        else:
            base = 45

        # Quality modifier
        if sleep_quality == "excellent":
            base = min(100, base + 5)
        elif sleep_quality == "poor":
            base = max(35, base - 10)

        return base

    def calculate_stress_score(
        self,
        stress_level: Optional[int],
    ) -> int:
        """
        Calculates Stress score (0-100).
        Levels 1-5 where 1 is optimal, 5 is severe fatigue.
        """
        if stress_level is None:
            return 75 # Neutral baseline when unlogged

        stress_map = {
            1: 95, # Peak recovery
            2: 88, # Good balance
            3: 75, # Moderate
            4: 55, # Elevated
            5: 35, # Deload needed
        }
        return stress_map.get(stress_level, 75)

    # -------------------------------------------------------------
    # AGGREGATE DAILY FIT SCORE
    # -------------------------------------------------------------

    def calculate_daily_fit_score(
        self,
        user_id: str = "usr_001",
        target_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Computes the complete daily Fit Score with category breakdowns,
        comparing actual values with personal user targets and avoiding unfair penalties.
        """
        today_str = target_date or date.today().isoformat()
        supabase = get_supabase()

        # 1. Fetch Goals
        goals = daily_summary_service.get_user_goals(user_id)
        cals_target = goals.get("daily_calorie_target", 2200)
        pro_target = goals.get("daily_protein_target", 140)
        water_target = goals.get("daily_water_target_ml", 3500)
        step_target = goals.get("daily_step_target", 10000)

        # 2. Fetch Actuals from daily_summary_service
        summary = daily_summary_service.sync_daily_summary(user_id, today_str)
        cals_consumed = int(summary.get("total_calories", 0))
        pro_consumed = float(summary.get("total_protein", 0.0))
        water_consumed = float(summary.get("total_water_ml", 0.0))

        # 3. Workouts & Exercises
        has_workout = False
        duration_mins = 0
        avg_form: Optional[float] = None

        if supabase and user_id != "usr_001":
            try:
                w_res = (
                    supabase.table("workout_sessions")
                    .select("*, exercise_logs(*)")
                    .eq("user_id", user_id)
                    .gte("started_at", today_str)
                    .execute()
                )
                if w_res.data and len(w_res.data) > 0:
                    has_workout = True
                    sess = w_res.data[0]
                    duration_mins = int(sess.get("duration_minutes", 20))
                    exs = sess.get("exercise_logs", [])
                    if exs:
                        scores = [e["form_score"] for e in exs if e.get("form_score")]
                        if scores:
                            avg_form = sum(scores) / len(scores)
            except Exception as e:
                logger.warning(f"Error fetching workouts for fit score: {e}")
        else:
            # Dev state
            has_workout = True
            duration_mins = 25
            avg_form = 94.2

        # 4. Steps
        steps: Optional[int] = None
        if supabase and user_id != "usr_001":
            try:
                sum_res = (
                    supabase.table("daily_summaries")
                    .select("steps")
                    .eq("user_id", user_id)
                    .eq("date", today_str)
                    .execute()
                )
                if sum_res.data and sum_res.data[0].get("steps"):
                    steps = int(sum_res.data[0]["steps"])
            except Exception as e:
                logger.warning(f"Error fetching steps: {e}")
        else:
            steps = 8200

        # 5. Sleep
        sleep_hours: Optional[float] = None
        sleep_quality: Optional[str] = None
        if supabase and user_id != "usr_001":
            try:
                s_res = (
                    supabase.table("sleep_logs")
                    .select("*")
                    .eq("user_id", user_id)
                    .gte("logged_at", today_str)
                    .order("logged_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if s_res.data:
                    sleep_hours = float(s_res.data[0].get("sleep_duration_hours", 7.5))
                    sleep_quality = s_res.data[0].get("sleep_quality")
            except Exception as e:
                logger.warning(f"Error fetching sleep for fit score: {e}")
        else:
            sleep_hours = 7.3

        # 6. Stress
        stress_lvl: Optional[int] = None
        if supabase and user_id != "usr_001":
            try:
                str_res = (
                    supabase.table("stress_logs")
                    .select("*")
                    .eq("user_id", user_id)
                    .gte("logged_at", today_str)
                    .order("logged_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if str_res.data:
                    stress_lvl = int(str_res.data[0].get("stress_level", 2))
            except Exception as e:
                logger.warning(f"Error fetching stress for fit score: {e}")
        else:
            stress_lvl = 2

        # Compute Category Scores
        nutrition_score = self.calculate_nutrition_score(cals_consumed, cals_target, pro_consumed, pro_target)
        workout_score = self.calculate_workout_score(has_workout, duration_mins, avg_form)
        hydration_score = self.calculate_hydration_score(water_consumed, water_target)
        activity_score = self.calculate_activity_score(steps, step_target, has_workout)
        sleep_score = self.calculate_sleep_score(sleep_hours, sleep_quality)
        stress_score = self.calculate_stress_score(stress_lvl)

        # Weighted Aggregate Fit Score
        raw_score = (
            (nutrition_score * self.weights["nutrition"]) +
            (workout_score * self.weights["workout"]) +
            (hydration_score * self.weights["hydration"]) +
            (activity_score * self.weights["activity"]) +
            (sleep_score * self.weights["sleep"]) +
            (stress_score * self.weights["stress"])
        )
        fit_score = min(100, max(0, round(raw_score)))

        return {
            "fit_score": fit_score,
            "nutrition_score": nutrition_score,
            "workout_score": workout_score,
            "hydration_score": hydration_score,
            "activity_score": activity_score,
            "sleep_score": sleep_score,
            "stress_score": stress_score,
            "date": today_str,
        }

    # -------------------------------------------------------------
    # WEEKLY AVERAGE & MONTHLY TREND
    # -------------------------------------------------------------

    def get_fit_score_overview(self, user_id: str = "usr_001") -> Dict[str, Any]:
        """
        Generates:
        - Daily Fit Score
        - Weekly Average Fit Score
        - Monthly Trend (past 30 days)
        - Category Breakdown
        """
        today = date.today()
        daily = self.calculate_daily_fit_score(user_id, today.isoformat())

        # Generate past 30 days trend
        supabase = get_supabase()
        trend_map: Dict[str, int] = {}

        if supabase and user_id != "usr_001":
            try:
                start_30 = (today - timedelta(days=29)).isoformat()
                res = (
                    supabase.table("daily_summaries")
                    .select("date, daily_score")
                    .eq("user_id", user_id)
                    .gte("date", start_30)
                    .order("date", desc=False)
                    .execute()
                )
                if res.data:
                    for row in res.data:
                        if row.get("daily_score") is not None:
                            trend_map[row["date"]] = int(row["daily_score"])
            except Exception as e:
                logger.warning(f"Error fetching monthly trend: {e}")

        # Build complete 30-day array
        monthly_trend: List[Dict[str, Any]] = []
        scores_7d: List[int] = []

        base_val = daily["fit_score"]
        for i in range(29, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            if d in trend_map:
                sc = trend_map[d]
            elif i == 0:
                sc = daily["fit_score"]
            else:
                # Simulated gentle historical variance for dev mode
                variance = ((i * 7) % 11) - 5
                sc = min(100, max(60, base_val - (i // 5) + variance))
            monthly_trend.append({"date": d, "fit_score": sc})
            if i < 7:
                scores_7d.append(sc)

        weekly_avg = round(sum(scores_7d) / max(1, len(scores_7d)))

        return {
            "fit_score": daily["fit_score"],
            "nutrition_score": daily["nutrition_score"],
            "workout_score": daily["workout_score"],
            "hydration_score": daily["hydration_score"],
            "activity_score": daily["activity_score"],
            "sleep_score": daily["sleep_score"],
            "stress_score": daily["stress_score"],
            "daily_fit_score": daily,
            "weekly_average_fit_score": weekly_avg,
            "monthly_trend": monthly_trend,
            "category_weights": self.weights,
        }

    # Backward compatibility with existing progress endpoint
    @staticmethod
    def calculate_six_dimensions(
        health_check: int = 18,
        habits: int = 12,
        mindfulness: int = 8,
        fitness_form: int = 14,
        daily_water: int = 7,
        nutrition_goals: int = 15
    ) -> Dict[str, Any]:
        return {
            "health_check": {"current": health_check, "total": 20},
            "habits": {"current": habits, "total": 14},
            "mindfulness": {"current": mindfulness, "total": 10},
            "fitness_form": {"current": fitness_form, "total": 15},
            "daily_water": {"current": daily_water, "total": 8},
            "nutrition_goals": {"current": nutrition_goals, "total": 18},
        }

health_score_service = HealthScoreService()
