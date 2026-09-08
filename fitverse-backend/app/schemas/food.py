from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

MealType = Literal["Breakfast", "Lunch", "Dinner", "Snack"]

# Natural Language Food Analysis Request & Response
class AnalyzeFoodRequest(BaseModel):
    text: str = Field(..., min_length=1, example="I ate 2 rotis with one bowl dal")

class ParsedFoodItem(BaseModel):
    name: str = Field(..., example="Roti")
    quantity: float = Field(..., example=2.0)
    unit: str = Field(..., example="piece")
    calories: int = Field(..., example=200)
    protein: float = Field(..., example=6.0)
    carbs: float = Field(..., example=40.0)
    fat: float = Field(..., example=1.6)
    fiber: Optional[float] = Field(default=0.0, example=4.0)
    confidence: float = Field(..., ge=0.0, le=1.0, example=0.92)
    needs_confirmation: bool = Field(default=False)
    notes: Optional[str] = None

class MacroTotals(BaseModel):
    calories: int = Field(..., example=380)
    protein: float = Field(..., example=15.0)
    carbs: float = Field(..., example=65.0)
    fat: float = Field(..., example=6.6)
    fiber: float = Field(..., example=8.0)

class FoodAnalyzeResponse(BaseModel):
    success: bool = True
    detected_meal_type: Optional[str] = Field(default="Breakfast", example="Lunch")
    foods: List[ParsedFoodItem]
    total: MacroTotals
    needs_confirmation: bool = False
    confirmation_prompt: Optional[str] = None
    disclaimer: str = "Nutritional values are scientific estimates based on standard portion weights."

# Food Log Ingestion & Query
class FoodLogCreate(BaseModel):
    food_name: str = Field(..., example="Oatmeal with Almonds & Whey")
    quantity: float = Field(default=1.0, gt=0)
    quantity_unit: str = Field(default="serving")
    meal_type: MealType = Field(..., example="Breakfast")
    calories: int = Field(..., ge=0, example=480)
    protein: float = Field(default=0.0, ge=0, example=38.0)
    carbs: float = Field(default=0.0, ge=0, example=56.0)
    fat: float = Field(default=0.0, ge=0, example=12.0)
    fiber: Optional[float] = Field(default=0.0, ge=0)
    logged_at: Optional[datetime] = None

class FoodLogResponse(FoodLogCreate):
    id: str
    user_id: str
    logged_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class DailyNutritionSummary(BaseModel):
    date: str
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    calorie_target: int
    protein_target: float
    water_target: int
    meals_count: int

