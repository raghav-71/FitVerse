from typing import Dict, Any, List
from app.core.logging import logger
from app.schemas.food import FoodLogCreate

class NutritionService:
    @staticmethod
    def calculate_macro_totals(meals: List[Dict[str, Any]]) -> Dict[str, Any]:
        totals = {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0}
        for m in meals:
            totals["calories"] += m.get("calories", 0)
            totals["protein"] += float(m.get("protein", 0.0))
            totals["carbs"] += float(m.get("carbs", 0.0))
            totals["fat"] += float(m.get("fat", 0.0))
            totals["fiber"] += float(m.get("fiber", 0.0))
        return totals

    @staticmethod
    async def analyze_food_text_or_image(description: str) -> Dict[str, Any]:
        """
        AI hook for multimodal nutrition analysis.
        Will interface with Gemini Flash / Food Vision models.
        """
        logger.info(f"Analyzing food: {description}")
        return {
            "food_name": description,
            "estimated_calories": 420,
            "protein": 28.0,
            "carbs": 35.0,
            "fat": 14.0,
            "confidence": 0.94,
        }

nutrition_service = NutritionService()
