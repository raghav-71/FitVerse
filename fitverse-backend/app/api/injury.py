from fastapi import APIRouter, Depends, status, Query
from typing import Dict, Any, Optional
from app.api.deps import get_current_user
from app.schemas.injury import (
    InjuryAnalyzeInput,
    InjuryAnalyzeResponse,
    InjuryProfileInput,
    InjuryProfileResponse,
    InjuryRuleConfig,
)
from app.services.injury_safety_service import injury_safety_service

router = APIRouter()


@router.post(
    "/analyze",
    response_model=InjuryAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Injury Concern & Evaluate Biomechanical Safety"
)
async def analyze_injury_concern(
    payload: InjuryAnalyzeInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Evaluates reported discomfort against configurable safety rules.
    Identifies exercises that may be inappropriate, suggests lower-impact alternatives,
    and provides non-diagnostic guidance with mandatory medical disclaimers.
    """
    return injury_safety_service.analyze_injury(payload)


@router.post(
    "/profile",
    response_model=InjuryProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save User Injury Concern Profile"
)
async def save_injury_profile(
    payload: InjuryProfileInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Persists user's selected injury concern (body part, pain level, description, recent injury, goal)
    and evaluates current risk & clearance.
    """
    user_id = current_user.get("id", "usr_001")
    return injury_safety_service.save_profile(user_id=user_id, payload=payload)


@router.get(
    "/recommendations",
    response_model=InjuryAnalyzeResponse,
    summary="Get Injury-Adapted Workout Recommendations"
)
async def get_injury_recommendations(
    body_part: Optional[str] = Query(None, description="Optional body part filter (e.g. knee, shoulder, back)"),
    pain_level: Optional[int] = Query(None, ge=0, le=10, description="Optional pain level (0-10)"),
    goal: Optional[str] = Query(None, description="Optional exercise goal (fat_loss, muscle_gain, etc.)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns exercise modifications, avoided movements, and lower-impact alternatives
    tailored to the user's active injury profile or query parameters.
    """
    user_id = current_user.get("id", "usr_001")
    return injury_safety_service.get_recommendations(
        user_id=user_id,
        body_part=body_part,
        pain_level=pain_level,
        goal=goal
    )


@router.get(
    "/rules",
    response_model=InjuryRuleConfig,
    summary="Get Active Configurable Safety Rules Configuration"
)
async def get_safety_rules():
    """
    Inspect the configurable pain thresholds and red flag keywords governing safety evaluations.
    """
    return injury_safety_service.config
