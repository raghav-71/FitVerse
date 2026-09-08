from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.database.supabase import get_supabase
from app.core.logging import logger
from app.services.daily_summary_service import DEFAULT_GOALS

class DietPlanRequest(BaseModel):
    age: int = Field(..., ge=12, le=110, example=22)
    gender: str = Field(default="male", example="male", description="'male' | 'female' | 'other'")
    height_cm: float = Field(..., gt=100, lt=260, example=170)
    weight_kg: float = Field(..., gt=30, lt=350, example=85)
    goal: str = Field(default="fat_loss", example="fat_loss", description="'fat_loss' | 'muscle_gain' | 'maintenance' | 'general_fitness'")
    activity_level: str = Field(default="moderate", example="moderate", description="'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'")
    diet_preference: str = Field(default="vegetarian", example="vegetarian", description="'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian'")
    target_weight: Optional[float] = Field(default=None, example=75.0)

class DailyTargets(BaseModel):
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    water_ml: int

class MealItem(BaseModel):
    meal_name: str
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    suggested_foods: list[str]

class MealDistribution(BaseModel):
    breakfast: MealItem
    lunch: MealItem
    snacks: MealItem
    dinner: MealItem

class DietPlanResponse(BaseModel):
    bmr: int
    tdee: int
    daily_targets: DailyTargets
    reasoning: str
    meal_distribution: MealDistribution
    disclaimer: str = (
        "Estimates are for informational fitness planning only, not clinical or medical advice. "
        "Consult a certified dietitian or physician for personalized medical nutrition guidance."
    )

class DietPlannerService:
    @staticmethod
    def calculate_plan(req: DietPlanRequest, user_id: str = "usr_001") -> Dict[str, Any]:
        """
        Calculates scientifically sound, non-extreme nutrition targets using Mifflin-St Jeor.
        Saves resulting targets to public.user_goals.
        """
        w = req.weight_kg
        h = req.height_cm
        a = req.age
        g = req.gender.lower()

        # 1. BMR (Mifflin-St Jeor)
        if "fem" in g or g == "female":
            bmr = round(10 * w + 6.25 * h - 5 * a - 161)
        else:
            bmr = round(10 * w + 6.25 * h - 5 * a + 5)
        bmr = max(1100, bmr)

        # 2. Activity Multiplier
        act = req.activity_level.lower()
        if "sedent" in act:
            mult = 1.20
        elif "light" in act:
            mult = 1.375
        elif "active" in act or "high" in act or "heavy" in act:
            mult = 1.725
        elif "very" in act:
            mult = 1.90
        else:
            mult = 1.55 # moderate default

        tdee = round(bmr * mult)

        # 3. Goal Adjustment (Avoid extreme deficits)
        goal = req.goal.lower()
        if "fat" in goal or "loss" in goal or "cut" in goal:
            # Safe 15-20% deficit (~450 kcal), never below minimum safe floor
            deficit = min(500, max(300, round(tdee * 0.18)))
            min_floor = 1500 if ("fem" not in g) else 1200
            calories = max(min_floor, tdee - deficit)
            goal_label = "gradual fat loss with muscle preservation"
            protein_factor = 2.0 # 2.0g per kg
        elif "muscle" in goal or "gain" in goal or "bulk" in goal:
            surplus = round(tdee * 0.12) # ~12% lean surplus
            calories = tdee + surplus
            goal_label = "lean muscle hypertrophy"
            protein_factor = 2.0
        else:
            calories = tdee
            goal_label = "metabolic maintenance & daily energy vitality"
            protein_factor = 1.6

        # 4. Macros
        # Protein
        protein_g = round(min(220, max(75, w * protein_factor)))
        protein_cals = protein_g * 4

        # Fat (~27% of total calories)
        fat_cals = calories * 0.27
        fat_g = round(min(110, max(35, fat_cals / 9)))

        # Carbs: Remainder of energy
        carbs_cals = max(300, calories - protein_cals - (fat_g * 9))
        carbs_g = round(carbs_cals / 4)

        # 5. Hydration
        # 35ml per kg + 500ml activity offset
        water_ml = round((w * 35 + (500 if mult > 1.3 else 200)) / 100) * 100
        water_ml = int(min(4500, max(2500, water_ml)))

        # 6. Meal Breakdown & Suggestions based on Diet Preference
        pref = req.diet_preference.lower()
        if "vegan" in pref:
            b_foods = ["Oatmeal with chia seeds & almond butter", "Soy milk shake with berries"]
            l_foods = ["Tofu scramble with brown rice", "Mixed lentil dal & spinach"]
            s_foods = ["Roasted chickpeas", "Handful of walnuts & green apple"]
            d_foods = ["Quinoa bowl with edamame & broccoli", "Tempeh stir-fry"]
        elif "egg" in pref:
            b_foods = ["3 Egg white omelette with whole wheat toast", "Oats with milk & sliced almonds"]
            l_foods = ["Paneer bhurji with 2 multigrain rotis", "Yellow moong dal & cucumber salad"]
            s_foods = ["Boiled egg whites with chaat masala", "Greek yogurt"]
            d_foods = ["Tofu & vegetable pulao", "Egg curry with steamed rice"]
        elif "non" in pref:
            b_foods = ["Eggs & avocado toast", "Whey protein shake with banana & oats"]
            l_foods = ["Grilled chicken breast bowl with brown rice", "Steamed beans & curd"]
            s_foods = ["Greek yogurt with pumpkin seeds", "Roasted peanuts"]
            d_foods = ["Fish fillet / Lean chicken with sautéed veggies", "1-2 Rotis"]
        else: # Vegetarian
            b_foods = ["Rolled oats with skimmed milk, almonds & protein scoop", "Paneer stuffed multigrain paratha"]
            l_foods = ["Paneer tikka bowl with brown rice", "Thick dal tadka & cucumber raita"]
            s_foods = ["Sprouts chaat with lemon", "Roasted makhana & handful of almonds"]
            d_foods = ["Soya chunks curry with 2 phulkas", "Mixed vegetable sabzi & curd"]

        meal_distribution = {
            "breakfast": {
                "meal_name": "Power Breakfast",
                "calories": round(calories * 0.25),
                "protein_g": round(protein_g * 0.25),
                "carbs_g": round(carbs_g * 0.25),
                "fat_g": round(fat_g * 0.25),
                "suggested_foods": b_foods,
            },
            "lunch": {
                "meal_name": "Nutrient Dense Lunch",
                "calories": round(calories * 0.35),
                "protein_g": round(protein_g * 0.35),
                "carbs_g": round(carbs_g * 0.35),
                "fat_g": round(fat_g * 0.35),
                "suggested_foods": l_foods,
            },
            "snacks": {
                "meal_name": "Pre/Post Training Fuel",
                "calories": round(calories * 0.15),
                "protein_g": round(protein_g * 0.15),
                "carbs_g": round(carbs_g * 0.15),
                "fat_g": round(fat_g * 0.15),
                "suggested_foods": s_foods,
            },
            "dinner": {
                "meal_name": "Lean Recovery Dinner",
                "calories": round(calories * 0.25),
                "protein_g": round(protein_g * 0.25),
                "carbs_g": round(carbs_g * 0.25),
                "fat_g": round(fat_g * 0.25),
                "suggested_foods": d_foods,
            },
        }

        # 7. Reasoning
        reasoning = (
            f"Calculated from your BMR of {bmr} kcal and {req.activity_level} activity multiplier (TDEE ~{tdee} kcal). "
            f"To support sustainable {goal_label} without extreme fatigue, target intake is {calories} kcal. "
            f"Protein is pegged at {protein_g}g ({protein_factor}g/kg) to safeguard lean mass, balanced with {carbs_g}g carbs for kinetic energy "
            f"and {fat_g}g essential lipids."
        )

        # 8. Save targets to user_goals (Supabase & Dev cache)
        DEFAULT_GOALS["daily_calorie_target"] = calories
        DEFAULT_GOALS["daily_protein_target"] = protein_g
        DEFAULT_GOALS["daily_carbs_target"] = carbs_g
        DEFAULT_GOALS["daily_fat_target"] = fat_g
        DEFAULT_GOALS["daily_water_target_ml"] = water_ml

        supabase = get_supabase()
        if supabase and user_id != "usr_001":
            try:
                goal_payload = {
                    "user_id": user_id,
                    "goal": req.goal,
                    "activity_level": req.activity_level,
                    "target_weight": req.target_weight or req.weight_kg,
                    "daily_calorie_target": calories,
                    "daily_protein_target": protein_g,
                    "daily_carbs_target": carbs_g,
                    "daily_fat_target": fat_g,
                    "daily_water_target": round(water_ml / 1000.0, 2),
                    "diet_preference": req.diet_preference,
                    "updated_at": datetime.now().isoformat(),
                }
                supabase.table("user_goals").upsert(goal_payload, on_conflict="user_id").execute()
                logger.info(f"Updated user_goals in Supabase for user {user_id}")
            except Exception as e:
                logger.warning(f"Could not persist user_goals in Supabase: {e}")

        return {
            "bmr": bmr,
            "tdee": tdee,
            "daily_targets": {
                "calories": calories,
                "protein_g": protein_g,
                "carbs_g": carbs_g,
                "fat_g": fat_g,
                "water_ml": water_ml,
            },
            "reasoning": reasoning,
            "meal_distribution": meal_distribution,
        }

diet_planner_service = DietPlannerService()
