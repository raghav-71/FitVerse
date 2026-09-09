from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class PoseSessionCreate(BaseModel):
    exercise: str = Field(..., example="squat")
    reps: int = Field(default=0, ge=0)
    duration_seconds: int = Field(default=0, ge=0)
    average_form_score: float = Field(default=88.0, ge=0.0, le=100.0)
    common_mistakes: List[str] = Field(default_factory=list, example=["Knees moving inward"])
    feedback: List[str] = Field(default_factory=list, example=["Keep your back straight"])
    joint_angles_summary: Optional[Dict[str, Any]] = None


class PoseSessionResponse(BaseModel):
    id: str
    user_id: str
    exercise: str
    reps: int
    average_form_score: float
    common_mistakes: List[str]
    feedback: List[str]
    duration_seconds: int
    created_at: datetime


class PoseSessionSummaryResponse(BaseModel):
    exercise: str
    reps: int
    average_form_score: float
    common_mistakes: List[str]
    feedback: List[str]


class PoseHistoryItem(BaseModel):
    id: str
    exercise: str
    reps: int
    duration_seconds: int
    average_form_score: float
    common_mistakes: List[str]
    feedback: List[str]
    created_at: datetime


class PoseHistoryResponse(BaseModel):
    total_sessions: int
    average_overall_form_score: float
    sessions: List[PoseHistoryItem]
