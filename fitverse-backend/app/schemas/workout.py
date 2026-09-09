from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ExerciseLogCreate(BaseModel):
    exercise_name: str = Field(..., example="AI Barbell Squat")
    sets: int = Field(default=3, ge=1)
    reps: int = Field(default=12, ge=0)
    weight_kg: Optional[float] = Field(default=0.0, ge=0)
    duration_seconds: Optional[int] = Field(default=0, ge=0)
    form_score: Optional[float] = Field(default=94.0, ge=0, le=100)

class ExerciseLogResponse(ExerciseLogCreate):
    id: str
    workout_session_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class WorkoutSessionCreate(BaseModel):
    workout_name: str = Field(..., example="Full Body AI Calibration")
    duration_minutes: float = Field(default=15.0, ge=0)
    calories_burned: Optional[int] = Field(default=120, ge=0)
    intensity: Optional[str] = "medium"
    completed: bool = True
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    exercises: Optional[List[ExerciseLogCreate]] = []

class WorkoutSessionResponse(BaseModel):
    id: str
    user_id: str
    workout_name: str
    duration_minutes: float
    calories_burned: int
    intensity: Optional[str]
    completed: bool
    started_at: datetime
    completed_at: Optional[datetime]
    created_at: datetime
    exercises: Optional[List[ExerciseLogResponse]] = []

    class Config:
        from_attributes = True

class WorkoutTelemetryInput(BaseModel):
    exercise_name: str = Field(default="AI Barbell Squat")
    knee_angle: Optional[float] = Field(default=95.0, description="Knee flexion angle in degrees")
    hip_angle: Optional[float] = Field(default=85.0, description="Hip flexion angle in degrees")
    back_angle: Optional[float] = Field(default=75.0, description="Torso inclination relative to vertical")
    elbow_angle: Optional[float] = Field(default=90.0, description="Elbow flexion angle in degrees")
    current_rep: int = Field(default=1, ge=0)
    rep_phase: Optional[str] = Field(default="concentric", description="'eccentric' | 'bottom' | 'concentric' | 'lockout'")

class WorkoutTelemetryResponse(BaseModel):
    form_score: float
    status: str = Field(..., description="'OPTIMAL' | 'WARNING' | 'DANGER'")
    feedback_cue: str
    depth_reached: bool
    rep_counted: bool


# ==============================================================================
# WORKOUT LIFECYCLE SCHEMAS
# ==============================================================================

class WorkoutStartInput(BaseModel):
    workout_name: str = Field(..., example="AI Barbell Squat")
    intensity: Optional[str] = Field(default="medium", example="medium")
    scheduled_duration_minutes: Optional[float] = Field(default=15.0, ge=0)


class WorkoutStartResponse(BaseModel):
    session_id: str
    workout_name: str
    intensity: str
    started_at: datetime
    status: str = "active"


class WorkoutExerciseInput(BaseModel):
    workout_session_id: str
    exercise_name: str = Field(..., example="AI Barbell Squat")
    sets: int = Field(default=1, ge=1)
    reps: int = Field(default=12, ge=0)
    weight_kg: Optional[float] = Field(default=0.0, ge=0)
    duration_seconds: Optional[int] = Field(default=60, ge=0)
    form_score: Optional[float] = Field(default=95.0, ge=0, le=100)


class WorkoutExerciseResponse(BaseModel):
    id: str
    workout_session_id: str
    exercise_name: str
    sets: int
    reps: int
    weight_kg: float
    duration_seconds: int
    form_score: Optional[float]
    created_at: datetime
    status: str = "logged"


class WorkoutCompleteInput(BaseModel):
    session_id: Optional[str] = None
    workout_name: str = Field(..., example="AI Barbell Squat Session")
    exercise: Optional[str] = None
    reps: Optional[int] = None
    total_reps: Optional[int] = None
    duration_minutes: float = Field(..., ge=0, example=15.0)
    calories_burned: Optional[int] = Field(default=120, ge=0)
    intensity: Optional[str] = Field(default="medium")
    completed: bool = True
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    form_score: Optional[float] = Field(default=92.0, ge=0, le=100)
    feedback: Optional[List[str]] = []
    feedback_summary: Optional[str] = None
    exercises: Optional[List[ExerciseLogCreate]] = []


class WorkoutRewardsEarned(BaseModel):
    xp: int
    coins: int
    level: int
    current_streak: int
    streak_incremented: bool


class WorkoutCompleteResponse(BaseModel):
    success: bool
    session: Dict[str, Any] if False else Any
    exercises: List[Any] = []
    daily_summary: Dict[str, Any]
    fit_score: int
    rewards_earned: WorkoutRewardsEarned


class WorkoutTodayResponse(BaseModel):
    date: str
    total_workouts: int
    total_duration_minutes: float
    total_calories_burned: int
    average_form_score: Optional[float]
    sessions: List[Dict[str, Any]] = []


