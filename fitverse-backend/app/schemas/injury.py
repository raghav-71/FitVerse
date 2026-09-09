from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class InjuryAnalyzeInput(BaseModel):
    body_part: str = Field(..., description="Target body area: knee, shoulder, back, neck, wrist, ankle, other")
    pain_level: int = Field(..., ge=0, le=10, description="Pain rating from 0 (none) to 10 (unbearable)")
    pain_description: Optional[str] = Field(None, description="User description of the pain sensation")
    recent_injury: Optional[str] = Field(None, description="Details of recent sprain, strain, surgery, or trauma")
    goal: Optional[str] = Field(None, description="Exercise goal: fat_loss, muscle_gain, strength, general_fitness")


class ExerciseClearanceItem(BaseModel):
    name: str
    target: str
    status: str = Field(..., description="'SAFE' | 'CAUTION' | 'BLOCK'")
    reason: str
    alternative: Optional[str] = None
    benefit: Optional[str] = None


class InjuryAnalyzeResponse(BaseModel):
    caution_level: str = Field(..., description="'low' | 'moderate' | 'high'")
    avoid_or_modify: List[str] = Field(default_factory=list, description="Exercises that should be avoided or modified")
    lower_impact_alternatives: List[str] = Field(default_factory=list, description="Low-impact exercise substitutes")
    general_recommendations: List[str] = Field(default_factory=list, description="Safe recovery and athletic guidance")
    medical_disclaimer: str = Field(..., description="Non-diagnostic safety notice")
    body_part: Optional[str] = None
    pain_level: Optional[int] = None
    goal: Optional[str] = None
    exercise_clearances: List[ExerciseClearanceItem] = Field(default_factory=list)


class InjuryProfileInput(BaseModel):
    body_part: str = Field(..., description="Primary affected body area: knee, shoulder, back, neck, wrist, ankle, other")
    body_parts: Optional[List[str]] = Field(default=None, description="Optional list of all affected body zones")
    pain_level: int = Field(..., ge=0, le=10, description="Pain level on a 0-10 scale")
    pain_description: Optional[str] = Field(None, description="Description of the discomfort")
    recent_injury: Optional[str] = Field(None, description="Recent trauma, sprain, or diagnosis")
    goal: Optional[str] = Field("general_fitness", description="Target fitness goal")


class InjuryProfileResponse(BaseModel):
    id: str
    user_id: str
    body_part: str
    body_parts: List[str]
    pain_level: int
    pain_description: Optional[str] = None
    recent_injury: Optional[str] = None
    goal: Optional[str] = None
    caution_level: str
    analysis: InjuryAnalyzeResponse
    created_at: datetime
    updated_at: datetime


class InjuryRuleConfig(BaseModel):
    high_pain_threshold: int = 7
    moderate_pain_threshold: int = 4
    red_flag_keywords: List[str] = [
        "sharp", "radiating", "numbness", "tingling", "swelling",
        "cannot bear weight", "pop", "popping", "locking", "unbearable", "severe"
    ]
    disclaimer: str
