from dataclasses import dataclass
from typing import Optional
from datetime import datetime, date

@dataclass
class WaterLogModel:
    id: str
    user_id: str
    amount_ml: float
    logged_at: datetime
    created_at: Optional[datetime] = None

@dataclass
class WeightLogModel:
    id: str
    user_id: str
    weight_kg: float
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    logged_at: datetime

@dataclass
class StressLogModel:
    id: str
    user_id: str
    stress_level: int
    mood: Optional[str] = None
    notes: Optional[str] = None
    logged_at: datetime

@dataclass
class SleepLogModel:
    id: str
    user_id: str
    sleep_duration_hours: float
    sleep_quality: str
    bedtime: Optional[datetime] = None
    wake_time: Optional[datetime] = None
    logged_at: datetime

@dataclass
class DailySummaryModel:
    id: str
    user_id: str
    date: date
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_water_ml: float
    workout_minutes: float
    calories_burned: int
    steps: int
    sleep_hours: float
    stress_average: float
    daily_score: float
