from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WaterLogCreate(BaseModel):
    amount_ml: float = Field(..., gt=0, example=250.0)

class WaterLogResponse(WaterLogCreate):
    id: str
    user_id: str
    logged_at: datetime
    created_at: datetime

class WeightLogCreate(BaseModel):
    weight_kg: float = Field(..., gt=0, example=75.8)
    body_fat_percentage: Optional[float] = Field(default=None, ge=0, le=100)
    muscle_mass: Optional[float] = Field(default=None, ge=0)

class WeightLogResponse(WeightLogCreate):
    id: str
    user_id: str
    logged_at: datetime
    created_at: datetime

class StressLogCreate(BaseModel):
    stress_level: int = Field(..., ge=1, le=5, example=2)
    mood: Optional[str] = "calm"
    notes: Optional[str] = None

class StressLogResponse(StressLogCreate):
    id: str
    user_id: str
    logged_at: datetime
    created_at: datetime

class SleepLogCreate(BaseModel):
    sleep_duration_hours: float = Field(..., ge=0, le=24, example=7.5)
    sleep_quality: Optional[str] = "good"
    bedtime: Optional[datetime] = None
    wake_time: Optional[datetime] = None

class SleepLogResponse(SleepLogCreate):
    id: str
    user_id: str
    logged_at: datetime
    created_at: datetime
