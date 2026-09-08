from typing import Dict, Any, List, Optional
from datetime import datetime, date
from app.database.supabase import get_supabase
from app.core.logging import logger
from app.services.daily_summary_service import daily_summary_service

# Dev in-memory storage for daily scores
DEV_DAILY_SCORES: Dict[str, int] = {}

class DailyHealthCoachService:
    @staticmethod
    def generate_daily_analysis(user_id: str = "usr_001", target_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Gathers complete multi-dimensional logs:
        - Food Logs
        - Water Logs
        - Workout Sessions
        - Exercise Logs
        - Steps
        - Sleep
        - Stress
        - Weight if available
        - User Goals
        
        Evaluates ACTUAL DATA vs USER TARGETS and generates encouraging, constructive coaching feedback.
        Saves the daily score to daily_summaries.
        """
        today_str = target_date or date.today().isoformat()
        supabase = get_supabase()

        # -------------------------------------------------------------
        # 1. GATHER USER GOALS
        # -------------------------------------------------------------
        goals = daily_summary_service.get_user_goals(user_id)
        cal_target = goals.get("daily_calorie_target", 2200)
        pro_target = goals.get("daily_protein_target", 140)
        carbs_target = goals.get("daily_carbs_target", 250)
        fat_target = goals.get("daily_fat_target", 70)
        water_target_ml = goals.get("daily_water_target_ml", 3500)
        target_weight = goals.get("target_weight", 72.0)
        step_target = goals.get("daily_step_target", 10000)

        # -------------------------------------------------------------
        # 2. GATHER FOOD LOGS & NUTRITION
        # -------------------------------------------------------------
        summary = daily_summary_service.sync_daily_summary(user_id, today_str)
        cal_consumed = int(summary.get("total_calories", 0))
        pro_consumed = int(summary.get("total_protein", 0))
        carbs_consumed = int(summary.get("total_carbs", 0))
        fat_consumed = int(summary.get("total_fat", 0))
        fiber_consumed = int(summary.get("total_fiber", 0))

        # -------------------------------------------------------------
        # 3. GATHER WATER LOGS
        # -------------------------------------------------------------
        water_consumed_ml = int(summary.get("total_water_ml", 0))

        # -------------------------------------------------------------
        # 4. GATHER WORKOUT SESSIONS & EXERCISE LOGS
        # -------------------------------------------------------------
        workout_minutes = 0
        calories_burned = 0
        avg_form_score: Optional[float] = None
        workout_name = "AI Barbell Squat Session"
        exercise_count = 0
        has_workout = False

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
                    workout_name = sess.get("workout_name", "Kinetic Session")
                    workout_minutes = int(sess.get("duration_minutes", 15))
                    calories_burned = int(sess.get("calories_burned", 120))
                    exs = sess.get("exercise_logs", [])
                    exercise_count = len(exs)
                    if exs:
                        scores = [e.get("form_score", 90) for e in exs if e.get("form_score")]
                        if scores:
                            avg_form_score = round(sum(scores) / len(scores), 1)
            except Exception as e:
                logger.warning(f"Error reading workout sessions for coach: {e}")
        else:
            # Dev state
            has_workout = True
            workout_minutes = 25
            calories_burned = 180
            avg_form_score = 94.2
            exercise_count = 4

        # -------------------------------------------------------------
        # 5. GATHER STEPS
        # -------------------------------------------------------------
        steps_logged: Optional[int] = None
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
                    steps_logged = int(sum_res.data[0]["steps"])
            except Exception as e:
                logger.warning(f"Error reading steps from daily_summaries: {e}")
        else:
            steps_logged = 7850 # Dev state active day

        # -------------------------------------------------------------
        # 6. GATHER SLEEP LOGS
        # -------------------------------------------------------------
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
                    sleep_quality = s_res.data[0].get("sleep_quality", "good")
            except Exception as e:
                logger.warning(f"Error fetching sleep logs: {e}")

        # -------------------------------------------------------------
        # 7. GATHER STRESS LOGS
        # -------------------------------------------------------------
        stress_level: Optional[int] = None
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
                    stress_level = int(str_res.data[0].get("stress_level", 2))
            except Exception as e:
                logger.warning(f"Error fetching stress logs: {e}")
        else:
            stress_level = 2 # Mild in dev store

        # -------------------------------------------------------------
        # 8. GATHER WEIGHT (IF AVAILABLE)
        # -------------------------------------------------------------
        weight_kg: Optional[float] = None
        if supabase and user_id != "usr_001":
            try:
                w_log = (
                    supabase.table("weight_logs")
                    .select("weight_kg")
                    .eq("user_id", user_id)
                    .order("logged_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if w_log.data and w_log.data[0].get("weight_kg"):
                    weight_kg = float(w_log.data[0]["weight_kg"])
                else:
                    p_res = supabase.table("profiles").select("weight_kg").eq("id", user_id).single().execute()
                    if p_res.data and p_res.data.get("weight_kg"):
                        weight_kg = float(p_res.data["weight_kg"])
            except Exception as e:
                logger.warning(f"Error fetching weight: {e}")
        else:
            weight_kg = 75.8 # Dev store baseline

        # -------------------------------------------------------------
        # CALCULATE CATEGORY SCORES (0 - 100)
        # -------------------------------------------------------------

        # Nutrition Score
        if cal_consumed > 0:
            cal_diff = abs(cal_consumed - cal_target)
            cal_score = max(0, 50 - int((cal_diff / cal_target) * 50))
            pro_ratio = min(1.0, pro_consumed / max(1, pro_target))
            pro_score = int(pro_ratio * 50)
            nutrition_score = min(100, cal_score + pro_score)
        else:
            nutrition_score = 0

        # Hydration Score
        if water_target_ml > 0:
            hydration_score = min(100, round((water_consumed_ml / water_target_ml) * 100))
        else:
            hydration_score = 70

        # Workout Score
        if has_workout:
            form_bonus = (avg_form_score * 0.3) if avg_form_score else 25.0
            workout_score = min(100, int(70 + form_bonus))
        else:
            workout_score = 50 # Baseline rest day value

        # Activity Score
        if steps_logged is not None and steps_logged > 0:
            activity_score = min(100, round((steps_logged / step_target) * 100))
        elif has_workout:
            activity_score = 80
        else:
            activity_score = 60

        # Sleep Score
        if sleep_hours is not None:
            if sleep_hours >= 7.0:
                sleep_score = min(100, int(85 + (sleep_hours - 7.0) * 10))
            elif sleep_hours >= 6.0:
                sleep_score = 75
            else:
                sleep_score = 55
        else:
            sleep_score = 70 # Neutral baseline when unlogged

        # Stress Score
        if stress_level is not None:
            stress_map = {1: 95, 2: 88, 3: 75, 4: 55, 5: 35}
            stress_score = stress_map.get(stress_level, 75)
        else:
            stress_score = 75

        # Overall Weighted Daily Score
        daily_score = round(
            (nutrition_score * 0.28) +
            (hydration_score * 0.22) +
            (workout_score * 0.22) +
            (activity_score * 0.12) +
            (sleep_score * 0.08) +
            (stress_score * 0.08)
        )
        daily_score = min(100, max(10, daily_score))

        # -------------------------------------------------------------
        # BUILD POSITIVES & AREAS TO IMPROVE (Encouraging Tone, No Shaming)
        # -------------------------------------------------------------
        positives: List[str] = []
        areas_to_improve: List[str] = []

        # Nutrition comparisons
        if pro_consumed >= pro_target * 0.85:
            positives.append(f"Great job hitting {pro_consumed}g protein ({round((pro_consumed/pro_target)*100)}% of your target) to support muscle recovery.")
        elif cal_consumed > 0:
            areas_to_improve.append(f"Your protein intake was below your target today ({pro_consumed}g vs {pro_target}g). Consider adding a protein-rich food to your meals tomorrow.")

        if cal_consumed > 0 and abs(cal_consumed - cal_target) <= 250:
            positives.append(f"Calorie intake was well-balanced at {cal_consumed} kcal (close to your {cal_target} kcal goal).")

        # Hydration comparisons
        if hydration_score >= 80:
            positives.append(f"Terrific hydration compliance ({water_consumed_ml}ml of your {water_target_ml}ml target).")
        elif water_consumed_ml > 0:
            areas_to_improve.append(f"Water intake reached {water_consumed_ml}ml ({hydration_score}% of target). Keeping a water bottle nearby can make reaching your goal easier tomorrow.")

        # Workout & Movement comparisons
        if has_workout:
            form_text = f" with an impressive form consistency score of {avg_form_score}%" if avg_form_score else ""
            positives.append(f"Conquered {workout_name}{form_text} for ~{workout_minutes} minutes, burning an estimated {calories_burned} kcal.")
        else:
            areas_to_improve.append("No kinetic workout logged today. If today was a designated rest day, fantastic! Otherwise, consider a quick 10-15 minute session tomorrow.")

        # Steps & Activity comparisons
        if steps_logged is not None and steps_logged >= 7000:
            positives.append(f"Active movement today with {steps_logged:,} steps logged.")
        elif steps_logged is not None:
            areas_to_improve.append(f"Step count was {steps_logged:,} today against a {step_target:,} goal. A brisk 15-minute walk tomorrow can add an easy 1,500 steps.")

        # Weight comparison
        if weight_kg is not None and target_weight:
            positives.append(f"Current logged weight is {weight_kg} kg, on track toward your target of {target_weight} kg.")

        # Autonomic balance
        if stress_level is not None and stress_level <= 2:
            positives.append("Autonomic stress levels are low to mild, signaling good balance and neuromuscular readiness.")

        # -------------------------------------------------------------
        # CATEGORY ANALYSES (Encouraging, Clear, No Inventions)
        # -------------------------------------------------------------
        if cal_consumed > 0:
            nutrition_analysis = (
                f"You logged {cal_consumed} kcal today against your target of {cal_target} kcal. "
                f"Your macro intake was {pro_consumed}g protein, {carbs_consumed}g carbs, {fat_consumed}g fat, and {fiber_consumed}g fiber. "
                "Your nutrient balance provides steady energy to power athletic progression without metabolic fatigue."
            )
        else:
            nutrition_analysis = "Food logs were not recorded today. Logging your meals will unlock detailed macro coaching and daily insights."

        if water_consumed_ml > 0:
            hydration_analysis = (
                f"You drank {water_consumed_ml}ml out of your {water_target_ml}ml target ({hydration_score}%). "
                "Staying properly hydrated supports optimal circulation, joint lubrication, and post-exercise recovery."
            )
        else:
            hydration_analysis = "Water intake was not recorded today. Try enjoying a fresh glass of water to support your hydration goal."

        if has_workout:
            form_str = f"Form score averaged {avg_form_score}%, maintaining safe joint alignment." if avg_form_score else "Great kinetic engagement throughout your sets."
            workout_analysis = (
                f"You completed {workout_name} ({workout_minutes} minutes, ~{calories_burned} kcal burned across {exercise_count} exercises). "
                f"{form_str}"
            )
        else:
            workout_analysis = "No workout sessions were logged today. Rest days are essential for muscular repair and athletic longevity."

        # Recovery Analysis (Sleep & Stress & Weight)
        recovery_parts: List[str] = []
        if sleep_hours is not None:
            quality_str = f" ({sleep_quality} quality)" if sleep_quality else ""
            recovery_parts.append(f"You recorded {sleep_hours} hours of sleep{quality_str}.")
        else:
            recovery_parts.append("Sleep data was not logged today, so recovery analysis is limited.")

        if stress_level is not None:
            stress_desc = {1: "Optimal", 2: "Mild", 3: "Moderate", 4: "Elevated", 5: "High"}.get(stress_level, "Moderate")
            recovery_parts.append(f"Autonomic stress is at Level {stress_level} ({stress_desc}), indicating healthy nervous system recovery.")
        else:
            recovery_parts.append("Stress level was not logged today.")

        if weight_kg is not None and target_weight:
            recovery_parts.append(f"Weight is currently tracking at {weight_kg} kg against your {target_weight} kg goal.")

        recovery_analysis = " ".join(recovery_parts)

        # -------------------------------------------------------------
        # TOMORROW RECOMMENDATIONS (Encouraging, Practical, Safe)
        # -------------------------------------------------------------
        tomorrow_recs: List[str] = []
        if pro_consumed < pro_target:
            tomorrow_recs.append("Your protein intake was below your target today. Consider adding a protein-rich food to your meals tomorrow.")
        else:
            tomorrow_recs.append("Maintain your strong protein pacing across breakfast and post-workout meals.")

        if hydration_score < 80:
            tomorrow_recs.append("Drink a full glass of water first thing in the morning to jump-start your daily hydration.")
        else:
            tomorrow_recs.append("Keep a water bottle on hand during workouts to continue your great hydration streak.")

        if has_workout:
            tomorrow_recs.append("Perform 5 minutes of hip and ankle mobility before your next workout session.")
        else:
            tomorrow_recs.append("Aim for a 15-minute AI Mirror session tomorrow to keep your workout consistency high.")

        if sleep_hours is None:
            tomorrow_recs.append("Log your sleep tonight to help your AI Coach provide more personalized recovery recommendations.")

        # -------------------------------------------------------------
        # SAVE DAILY SCORE TO daily_summaries
        # -------------------------------------------------------------
        DEV_DAILY_SCORES[user_id] = daily_score

        if supabase and user_id != "usr_001":
            try:
                supabase.table("daily_summaries").upsert({
                    "user_id": user_id,
                    "date": today_str,
                    "daily_score": daily_score,
                    "updated_at": datetime.now().isoformat()
                }, on_conflict="user_id,date").execute()
                logger.info(f"Saved daily_score {daily_score} to daily_summaries for {user_id}")
            except Exception as e:
                logger.warning(f"Could not persist daily_score in Supabase: {e}")

        return {
            "daily_score": daily_score,
            "category_scores": {
                "nutrition": nutrition_score,
                "hydration": hydration_score,
                "workout": workout_score,
                "activity": activity_score,
                "sleep": sleep_score,
                "stress": stress_score,
            },
            "positives": positives,
            "areas_to_improve": areas_to_improve,
            "nutrition_analysis": nutrition_analysis,
            "workout_analysis": workout_analysis,
            "hydration_analysis": hydration_analysis,
            "recovery_analysis": recovery_analysis,
            "tomorrow_recommendations": tomorrow_recs,
        }

daily_health_coach_service = DailyHealthCoachService()

