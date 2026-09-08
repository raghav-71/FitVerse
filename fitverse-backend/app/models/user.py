from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class ProfileModel:
    id: str
    name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class UserGoalModel:
    id: str
    user_id: str
    goal: str
    activity_level: str
    target_weight: Optional[float] = None
    daily_calorie_target: Optional[int] = 2200
    daily_protein_target: Optional[float] = 150.0
    daily_carbs_target: Optional[float] = None
    daily_fat_target: Optional[float] = None
    daily_water_target: Optional[float] = 3.0
    diet_preference: Optional[str] = None

@dataclass
class UserRewardModel:
    id: str
    user_id: str
    xp: int = 0
    coins: int = 0
    level: int = 1
    current_streak: int = 0
    updated_at: Optional[datetime] = None
