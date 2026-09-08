from typing import Dict, Any
from app.core.logging import logger

class DailyAnalysisService:
    @staticmethod
    def aggregate_daily_metrics(
        calories_consumed: int,
        water_ml: float,
        workout_minutes: float,
        sleep_hours: float,
        stress_level: int
    ) -> Dict[str, Any]:
        """
        Aggregates daily parameters to produce daily wellness score.
        """
        logger.info("Aggregating daily activity metrics...")
        
        # Simple weighted scoring algorithm
        hydration_score = min(100.0, (water_ml / 3000.0) * 100)
        workout_score = min(100.0, (workout_minutes / 30.0) * 100)
        sleep_score = min(100.0, (sleep_hours / 8.0) * 100)
        stress_penalty = (stress_level - 1) * 15.0

        daily_score = max(0.0, min(100.0, (hydration_score * 0.25 + workout_score * 0.35 + sleep_score * 0.40) - stress_penalty))

        return {
            "daily_score": round(daily_score, 1),
            "hydration_compliance": round(hydration_score, 1),
            "workout_compliance": round(workout_score, 1),
            "sleep_compliance": round(sleep_score, 1),
        }

daily_analysis_service = DailyAnalysisService()
