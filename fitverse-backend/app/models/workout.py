from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class ExerciseLogModel:
    id: str
    workout_session_id: str
    exercise_name: str
    sets: int
    reps: int
    weight_kg: float
    duration_seconds: int
    form_score: float

@dataclass
class WorkoutSessionModel:
    id: str
    user_id: str
    workout_name: str
    duration_minutes: float
    calories_burned: int
    intensity: str
    completed: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    exercises: Optional[List[ExerciseLogModel]] = None

@dataclass
class PoseSessionModel:
    id: str
    workout_session_id: str
    joint_angles: Optional[dict] = None
    form_scores: Optional[dict] = None
    landmarks_summary: Optional[dict] = None
    created_at: Optional[datetime] = None

