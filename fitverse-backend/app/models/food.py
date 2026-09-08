from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class FoodLogModel:
    id: str
    user_id: str
    food_name: str
    quantity: float
    quantity_unit: str
    meal_type: str
    calories: int
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = 0.0
    logged_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
