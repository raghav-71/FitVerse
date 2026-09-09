from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., example="Aryan Sharma")
    email: str = Field(..., example="athlete@fitverse.ai")

class UserProfileResponse(UserBase):
    id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = 178.0
    weight_kg: Optional[float] = 75.8
    target_weight_kg: Optional[float] = 72.0
    diet_preference: Optional[str] = "Vegetarian"
    selected_goal: Optional[str] = "Build Muscle"
    activity_level: Optional[str] = "Moderately Active"
    experience_level: Optional[str] = "Intermediate"
    xp: Optional[int] = 4820
    level: Optional[int] = 14
    coins: Optional[int] = 1450
    current_streak: Optional[int] = 18
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    diet_preference: Optional[str] = None
    selected_goal: Optional[str] = None
    activity_level: Optional[str] = None
    experience_level: Optional[str] = None
