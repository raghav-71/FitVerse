from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from app.api.deps import get_current_user
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.schemas.common import APIResponse
from app.database.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="Get Current User Profile",
    description="Fetches the authenticated user's kinetic profile, physical metrics, and gamification standing."
)
async def get_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user.get("id")

    if supabase and user_id != "usr_001":
        try:
            # Query profile from Supabase
            res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            if res.data:
                # Merge rewards and goals
                rewards = supabase.table("user_rewards").select("*").eq("user_id", user_id).single().execute()
                goals = supabase.table("user_goals").select("*").eq("user_id", user_id).single().execute()
                data = res.data
                if rewards.data:
                    data.update({"xp": rewards.data.get("xp"), "coins": rewards.data.get("coins"), "level": rewards.data.get("level"), "current_streak": rewards.data.get("current_streak")})
                if goals.data:
                    data.update({"selected_goal": goals.data.get("goal"), "activity_level": goals.data.get("activity_level")})
                return UserProfileResponse(**data)
        except Exception as e:
            logger.warning(f"Error fetching profile from Supabase: {e}. Falling back to active session profile.")

    return UserProfileResponse(**current_user)

@router.put(
    "/profile",
    response_model=UserProfileResponse,
    summary="Update User Profile",
    description="Updates user physical measurements, experience levels, or training goal."
)
async def update_user_profile(
    updates: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user.get("id")
    update_data = updates.model_dump(exclude_unset=True)

    if supabase and user_id != "usr_001":
        try:
            res = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
            if res.data:
                current_user.update(res.data[0])
        except Exception as e:
            logger.error(f"Failed to update profile in Supabase: {e}")

    current_user.update(update_data)
    return UserProfileResponse(**current_user)
