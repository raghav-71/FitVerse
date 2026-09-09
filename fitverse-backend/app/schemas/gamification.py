from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class StreakCriteria(BaseModel):
    workout_completed: bool = False
    protein_target_met: bool = False
    water_target_met: bool = False
    fit_score_target_met: bool = False
    streak_maintained: bool = False


class AchievementItem(BaseModel):
    id: str
    title: str
    description: str
    icon: str = "Trophy"
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    reward_xp: int = 50
    reward_coins: int = 20


class GamificationProfileResponse(BaseModel):
    user_id: str
    xp: int = Field(default=0, ge=0)
    coins: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    current_streak: int = Field(default=0, ge=0)
    longest_streak: int = Field(default=0, ge=0)
    xp_to_next_level: int = Field(default=400)
    level_progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    streak_criteria: StreakCriteria
    achievements: List[AchievementItem] = Field(default_factory=list)


class GamificationEventXPInput(BaseModel):
    event_type: str = Field(
        ...,
        description=(
            "Validated event intent: 'workout_completed', 'protein_target_completed', "
            "'water_target_completed', 'streak_milestone_7d', 'daily_fit_score_achieved', 'challenge_completed'"
        )
    )
    reference_id: Optional[str] = Field(None, description="Optional entity ID (e.g. workout session ID, date string, challenge ID)")


class GamificationEventXPResponse(BaseModel):
    success: bool = True
    event_type: str
    xp_awarded: int
    coins_awarded: int
    new_xp: int
    new_coins: int
    new_level: int
    leveled_up: bool
    streak: int
    message: str


class ChallengeItem(BaseModel):
    id: str
    title: str
    description: str
    category: str = Field(default="daily", description="'daily' | 'weekly' | 'special'")
    target_value: int
    current_progress: int
    reward_xp: int
    reward_coins: int
    joined: bool = True
    completed: bool = False
    claimed: bool = False


class ChallengeCompleteInput(BaseModel):
    challenge_id: str


class ChallengeCompleteResponse(BaseModel):
    success: bool
    challenge_id: str
    reward_xp: int
    reward_coins: int
    new_xp: int
    new_coins: int
    new_level: int
    leveled_up: bool
    message: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    avatar_url: str
    xp: int
    level: int
    streak: int
    badge: Optional[str] = None
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    period: str = Field(default="weekly", description="'daily' | 'weekly' | 'all_time'")
    scope: str = Field(default="national", description="'national' | 'friends'")
    entries: List[LeaderboardEntry] = Field(default_factory=list)
    user_rank: Optional[LeaderboardEntry] = None
