from fastapi import APIRouter, Depends, Query, status
from typing import Dict, Any, List, Optional
from app.api.deps import get_current_user
from app.schemas.gamification import (
    GamificationProfileResponse,
    GamificationEventXPInput,
    GamificationEventXPResponse,
    ChallengeItem,
    ChallengeCompleteInput,
    ChallengeCompleteResponse,
    LeaderboardResponse,
)
from app.services.gamification_service import gamification_service

router = APIRouter()
leaderboard_router = APIRouter()


@router.get(
    "/profile",
    response_model=GamificationProfileResponse,
    summary="Get User Gamification Profile, XP, Level, Streaks & Achievements"
)
async def get_gamification_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns user's verified XP, Coins, Level, next-level threshold,
    and multi-dimensional streak criteria across Workout, Nutrition, Water, and Fit Score.
    """
    user_id = current_user.get("id", "usr_001")
    return gamification_service.get_profile(user_id)


@router.post(
    "/xp",
    response_model=GamificationEventXPResponse,
    status_code=status.HTTP_200_OK,
    summary="Award Server-Validated Event XP"
)
async def award_event_xp(
    payload: GamificationEventXPInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Awards XP strictly based on backend-validated health events:
    - Workout Completed = 100 XP
    - Daily Protein Target Completed = 50 XP
    - Daily Water Target Completed = 30 XP
    - 7-Day Streak = 200 XP
    - Daily Fit Score >= 75 = 40 XP

    Anti-cheat protection: Prevents arbitrary XP injection and rejects duplicate claims.
    """
    user_id = current_user.get("id", "usr_001")
    return gamification_service.award_event_xp(user_id, payload)


@router.get(
    "/challenges",
    response_model=List[ChallengeItem],
    summary="Get Active Daily & Weekly Gamification Challenges"
)
async def get_gamification_challenges(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns active daily and weekly fitness challenges evaluated against actual user logs.
    """
    user_id = current_user.get("id", "usr_001")
    return gamification_service.get_challenges(user_id)


@router.post(
    "/challenge/complete",
    response_model=ChallengeCompleteResponse,
    summary="Claim Completed Challenge Rewards"
)
async def complete_challenge(
    payload: ChallengeCompleteInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Validates that challenge criteria were met, credits XP & Coins to the user profile,
    and returns reward confirmation.
    """
    user_id = current_user.get("id", "usr_001")
    return gamification_service.complete_challenge(user_id, payload.challenge_id)


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get Leaderboard Standings (Gamification prefix)"
)
@leaderboard_router.get(
    "",
    response_model=LeaderboardResponse,
    summary="Get National / Friend Leaderboard Standings"
)
async def get_leaderboard(
    period: str = Query("weekly", description="'daily' | 'weekly' | 'all_time'"),
    scope: str = Query("national", description="'national' | 'friends'"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns ranked leaderboard with current user dynamically inserted into standings.
    """
    user_id = current_user.get("id", "usr_001")
    return gamification_service.get_leaderboard(user_id=user_id, period=period, scope=scope)
