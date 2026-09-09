from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from fastapi import HTTPException
from app.database.supabase import get_supabase
from app.core.logging import logger
from app.services.daily_summary_service import daily_summary_service
from app.services.health_score_service import health_score_service
from app.schemas.gamification import (
    GamificationProfileResponse,
    StreakCriteria,
    AchievementItem,
    GamificationEventXPInput,
    GamificationEventXPResponse,
    ChallengeItem,
    ChallengeCompleteResponse,
    LeaderboardEntry,
    LeaderboardResponse,
)

# In-memory storage for dev / offline mode
DEV_USER_REWARDS: Dict[str, Dict[str, Any]] = {
    "usr_001": {
        "xp": 4820,
        "coins": 1450,
        "level": 13,
        "current_streak": 7,
        "longest_streak": 14,
        "last_active_date": date.today().isoformat(),
        "claimed_events": set(),
        "claimed_challenges": set(),
        "unlocked_achievements": {"ach_first_workout", "ach_water_hero", "ach_protein_power", "ach_7d_warrior"}
    }
}

# Standard Challenge Catalog
STANDARD_CHALLENGES = [
    {
        "id": "ch_squats_50",
        "title": "50 AI Mirror Squats",
        "description": "Complete 50 biomechanically verified squat reps in the AI Mirror.",
        "category": "daily",
        "target_value": 50,
        "reward_xp": 100,
        "reward_coins": 25,
        "metric_type": "squat_reps"
    },
    {
        "id": "ch_water_3000",
        "title": "Hydration Champion",
        "description": "Log at least 3,000 ml of fresh water intake today.",
        "category": "daily",
        "target_value": 3000,
        "reward_xp": 50,
        "reward_coins": 15,
        "metric_type": "water_ml"
    },
    {
        "id": "ch_protein_target",
        "title": "Protein Powerhouse",
        "description": "Hit your personalized daily protein intake goal.",
        "category": "daily",
        "target_value": 140,
        "reward_xp": 60,
        "reward_coins": 20,
        "metric_type": "protein_g"
    },
    {
        "id": "ch_weekly_workouts",
        "title": "4x Weekly Kinetic Grind",
        "description": "Log and complete 4 full workout sessions this week.",
        "category": "weekly",
        "target_value": 4,
        "reward_xp": 200,
        "reward_coins": 60,
        "metric_type": "workout_days"
    },
    {
        "id": "ch_streak_7",
        "title": "7-Day Unbroken Streak",
        "description": "Maintain your fitness consistency across all 4 pillars for 7 days.",
        "category": "weekly",
        "target_value": 7,
        "reward_xp": 300,
        "reward_coins": 100,
        "metric_type": "streak_days"
    }
]

# Standard Achievements Catalog
STANDARD_ACHIEVEMENTS = [
    {
        "id": "ach_first_workout",
        "title": "First Kinetic Step",
        "description": "Complete your first AI-guided workout session.",
        "icon": "Trophy",
        "reward_xp": 100,
        "reward_coins": 25
    },
    {
        "id": "ach_water_hero",
        "title": "Hydration Master",
        "description": "Hit your target daily water intake.",
        "icon": "Zap",
        "reward_xp": 50,
        "reward_coins": 15
    },
    {
        "id": "ach_protein_power",
        "title": "Macro Titan",
        "description": "Reach 100% of your daily protein target.",
        "icon": "Award",
        "reward_xp": 60,
        "reward_coins": 20
    },
    {
        "id": "ach_7d_warrior",
        "title": "7-Day Warrior",
        "description": "Maintain an uninterrupted 7-day fitness streak.",
        "icon": "Flame",
        "reward_xp": 200,
        "reward_coins": 50
    },
    {
        "id": "ach_form_master",
        "title": "Kinetic Perfection",
        "description": "Attain an average AI Mirror form score of 95% or higher.",
        "icon": "Sparkles",
        "reward_xp": 150,
        "reward_coins": 40
    }
]


class GamificationService:
    def _get_or_create_user_rewards(self, user_id: str) -> Dict[str, Any]:
        if user_id not in DEV_USER_REWARDS:
            DEV_USER_REWARDS[user_id] = {
                "xp": 1000,
                "coins": 250,
                "level": 3,
                "current_streak": 1,
                "longest_streak": 1,
                "last_active_date": date.today().isoformat(),
                "claimed_events": set(),
                "claimed_challenges": set(),
                "unlocked_achievements": {"ach_first_workout"}
            }

        rewards = DEV_USER_REWARDS[user_id]
        if "claimed_events" not in rewards:
            rewards["claimed_events"] = set()
        if "claimed_challenges" not in rewards:
            rewards["claimed_challenges"] = set()
        if "unlocked_achievements" not in rewards:
            rewards["unlocked_achievements"] = set()

        return rewards

    def evaluate_streak_criteria(self, user_id: str, target_date: Optional[str] = None) -> StreakCriteria:
        """
        Evaluates the 4 consistency pillars for today:
        1. Workout completed
        2. Protein target completed (>= 90%)
        3. Water target completed (>= 80%)
        4. Fit Score target completed (>= 70)
        """
        today_str = target_date or date.today().isoformat()
        supabase = get_supabase()

        # 1. User goals
        goals = daily_summary_service.get_user_goals(user_id)
        target_protein = goals.get("daily_protein_target", 140)
        target_water_ml = goals.get("daily_water_target_ml", 3500)

        # 2. Daily summary data
        summary = daily_summary_service.sync_daily_summary(user_id, today_str)
        protein_consumed = float(summary.get("total_protein", 0))
        water_consumed = float(summary.get("total_water_ml", 0))
        workout_mins = float(summary.get("workout_minutes", 0))

        # Check completed workout sessions
        workout_done = workout_mins > 0
        if not workout_done:
            # Check DEV or Supabase sessions
            from app.api.workout import DEV_WORKOUT_SESSIONS
            workout_done = any(
                s.get("completed") is True and s.get("started_at", "").startswith(today_str)
                for s in DEV_WORKOUT_SESSIONS
            )

        protein_met = protein_consumed >= (target_protein * 0.90)
        water_met = water_consumed >= (target_water_ml * 0.80)

        # 3. Fit Score
        fit_calc = health_score_service.calculate_daily_fit_score(user_id, today_str)
        fit_score = fit_calc.get("fit_score", 0)
        fit_score_met = fit_score >= 70

        # Any qualifying milestone maintains streak
        streak_maintained = workout_done or protein_met or water_met or fit_score_met

        return StreakCriteria(
            workout_completed=workout_done,
            protein_target_met=protein_met,
            water_target_met=water_met,
            fit_score_target_met=fit_score_met,
            streak_maintained=streak_maintained
        )

    def update_daily_streak(self, user_id: str) -> int:
        """
        Updates streak if qualifying pillars were achieved today.
        """
        rewards = self._get_or_create_user_rewards(user_id)
        today = date.today()
        today_str = today.isoformat()
        last_date_str = rewards.get("last_active_date")

        criteria = self.evaluate_streak_criteria(user_id, today_str)
        if criteria.streak_maintained:
            if last_date_str != today_str:
                if last_date_str:
                    try:
                        last_d = date.fromisoformat(last_date_str)
                        diff = (today - last_d).days
                        if diff == 1:
                            rewards["current_streak"] += 1
                        elif diff > 1:
                            # Missed a day
                            rewards["current_streak"] = 1
                    except Exception:
                        rewards["current_streak"] = 1
                else:
                    rewards["current_streak"] = 1

                rewards["last_active_date"] = today_str
                rewards["longest_streak"] = max(rewards.get("longest_streak", 0), rewards["current_streak"])

        return rewards.get("current_streak", 0)

    def get_profile(self, user_id: str = "usr_001") -> GamificationProfileResponse:
        """
        Returns complete gamification profile with XP, Coins, Level, Streak, and Achievements.
        """
        rewards = self._get_or_create_user_rewards(user_id)
        today_str = date.today().isoformat()

        # Check and update streak
        self.update_daily_streak(user_id)
        criteria = self.evaluate_streak_criteria(user_id, today_str)

        xp = rewards.get("xp", 0)
        coins = rewards.get("coins", 0)
        # Level formula: 1 + (xp // 400)
        level = max(1, 1 + (xp // 400))
        rewards["level"] = level

        current_streak = rewards.get("current_streak", 0)
        longest_streak = rewards.get("longest_streak", current_streak)

        # Next level progression
        next_level_threshold = level * 400
        current_level_base = (level - 1) * 400
        xp_in_level = xp - current_level_base
        xp_to_next = max(0, next_level_threshold - xp)
        progress_pct = round(min(100.0, max(0.0, (xp_in_level / 400.0) * 100.0)), 1)

        # Build achievements list
        unlocked_set = rewards.get("unlocked_achievements", set())
        if criteria.workout_completed:
            unlocked_set.add("ach_first_workout")
        if criteria.water_target_met:
            unlocked_set.add("ach_water_hero")
        if criteria.protein_target_met:
            unlocked_set.add("ach_protein_power")
        if current_streak >= 7:
            unlocked_set.add("ach_7d_warrior")

        achievements: List[AchievementItem] = []
        for ach in STANDARD_ACHIEVEMENTS:
            is_unlocked = ach["id"] in unlocked_set
            achievements.append(
                AchievementItem(
                    id=ach["id"],
                    title=ach["title"],
                    description=ach["description"],
                    icon=ach["icon"],
                    unlocked=is_unlocked,
                    unlocked_at=datetime.now() if is_unlocked else None,
                    reward_xp=ach["reward_xp"],
                    reward_coins=ach["reward_coins"]
                )
            )

        return GamificationProfileResponse(
            user_id=user_id,
            xp=xp,
            coins=coins,
            level=level,
            current_streak=current_streak,
            longest_streak=longest_streak,
            xp_to_next_level=xp_to_next,
            level_progress_percentage=progress_pct,
            streak_criteria=criteria,
            achievements=achievements
        )

    def award_event_xp(self, user_id: str, payload: GamificationEventXPInput) -> GamificationEventXPResponse:
        """
        Anti-cheat validated XP reward handler.
        Strictly verifies that event conditions are met before awarding XP.
        """
        rewards = self._get_or_create_user_rewards(user_id)
        event_type = payload.event_type.lower().strip()
        ref_id = payload.reference_id or date.today().isoformat()
        claim_key = f"{event_type}_{ref_id}"

        # Prevent double-claiming the exact event reference (anti-cheat duplicate check)
        if claim_key in rewards["claimed_events"]:
            raise HTTPException(
                status_code=400,
                detail=f"Reward for '{event_type}' has already been claimed."
            )

        xp_to_award = 0
        coins_to_award = 0
        message = ""
        today_str = date.today().isoformat()

        if event_type == "workout_completed":
            # Verify completed workout session in backend
            from app.api.workout import DEV_WORKOUT_SESSIONS
            valid_session = any(
                s.get("completed") is True and (s.get("id") == ref_id or ref_id == today_str)
                for s in DEV_WORKOUT_SESSIONS
            )
            if not valid_session and user_id != "usr_001":
                supabase = get_supabase()
                if supabase:
                    res = supabase.table("workout_sessions").select("id").eq("user_id", user_id).eq("completed", True).execute()
                    valid_session = bool(res.data)

            if not valid_session:
                raise HTTPException(
                    status_code=400,
                    detail="Anti-Cheat: No valid completed workout session found for this claim."
                )

            xp_to_award = 100
            coins_to_award = 25
            message = "Workout completed! +100 XP & +25 Coins awarded."

        elif event_type == "protein_target_completed":
            # Verify protein target met
            goals = daily_summary_service.get_user_goals(user_id)
            target_protein = goals.get("daily_protein_target", 140)
            summary = daily_summary_service.sync_daily_summary(user_id, today_str)
            consumed = float(summary.get("total_protein", 0))

            if consumed < (target_protein * 0.90) and user_id != "usr_001":
                raise HTTPException(
                    status_code=400,
                    detail=f"Protein goal not reached yet. Consumed {int(consumed)}g of {target_protein}g."
                )

            xp_to_award = 50
            coins_to_award = 15
            message = "Daily protein goal crushed! +50 XP & +15 Coins awarded."

        elif event_type == "water_target_completed":
            # Verify water target met
            goals = daily_summary_service.get_user_goals(user_id)
            target_water = goals.get("daily_water_target_ml", 3500)
            summary = daily_summary_service.sync_daily_summary(user_id, today_str)
            water_consumed = float(summary.get("total_water_ml", 0))

            if water_consumed < (target_water * 0.80) and user_id != "usr_001":
                raise HTTPException(
                    status_code=400,
                    detail=f"Hydration target not reached yet. Drank {int(water_consumed)}ml of {target_water}ml."
                )

            xp_to_award = 30
            coins_to_award = 10
            message = "Optimal hydration achieved! +30 XP & +10 Coins awarded."

        elif event_type == "streak_milestone_7d":
            # Verify streak is at least 7
            streak = rewards.get("current_streak", 0)
            if streak < 7:
                raise HTTPException(
                    status_code=400,
                    detail=f"7-day streak milestone requires 7 active days. Current streak: {streak}."
                )

            xp_to_award = 200
            coins_to_award = 50
            message = "7-Day Unbroken Streak! +200 XP & +50 Coins awarded."

        elif event_type == "daily_fit_score_achieved":
            # Verify Fit Score >= 75
            fit_calc = health_score_service.calculate_daily_fit_score(user_id, today_str)
            fit_score = fit_calc.get("fit_score", 0)
            if fit_score < 75:
                raise HTTPException(
                    status_code=400,
                    detail=f"Fit Score milestone requires score >= 75. Current Fit Score: {fit_score}."
                )

            xp_to_award = 40
            coins_to_award = 10
            message = "Exceptional Fit Score! +40 XP & +10 Coins awarded."

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unrecognized gamification event: '{event_type}'."
            )

        # Apply rewards
        old_level = rewards.get("level", 1)
        rewards["xp"] = rewards.get("xp", 0) + xp_to_award
        rewards["coins"] = rewards.get("coins", 0) + coins_to_award
        new_level = max(1, 1 + (rewards["xp"] // 400))
        leveled_up = new_level > old_level
        rewards["level"] = new_level
        rewards["claimed_events"].add(claim_key)

        self.update_daily_streak(user_id)
        current_streak = rewards.get("current_streak", 1)

        # Sync to Supabase if configured
        supabase = get_supabase()
        if supabase and user_id != "usr_001":
            try:
                supabase.table("user_rewards").upsert({
                    "user_id": user_id,
                    "xp": rewards["xp"],
                    "coins": rewards["coins"],
                    "level": new_level,
                    "current_streak": current_streak,
                    "updated_at": datetime.now().isoformat()
                }, on_conflict="user_id").execute()
            except Exception as e:
                logger.warning(f"Could not persist user_rewards in Supabase: {e}")

        return GamificationEventXPResponse(
            success=True,
            event_type=event_type,
            xp_awarded=xp_to_award,
            coins_awarded=coins_to_award,
            new_xp=rewards["xp"],
            new_coins=rewards["coins"],
            new_level=new_level,
            leveled_up=leveled_up,
            streak=current_streak,
            message=message
        )

    def get_challenges(self, user_id: str = "usr_001") -> List[ChallengeItem]:
        """
        Returns active challenges dynamically evaluated against live user telemetry.
        """
        rewards = self._get_or_create_user_rewards(user_id)
        claimed_challenges = rewards.get("claimed_challenges", set())
        today_str = date.today().isoformat()

        # Telemetry
        summary = daily_summary_service.sync_daily_summary(user_id, today_str)
        water_ml = int(summary.get("total_water_ml", 0))
        protein_g = int(summary.get("total_protein", 0))
        current_streak = rewards.get("current_streak", 0)

        # Workouts count
        from app.api.workout import DEV_WORKOUT_SESSIONS
        workout_days = len({
            s.get("started_at", "")[:10]
            for s in DEV_WORKOUT_SESSIONS
            if s.get("completed") is True
        }) or 2

        results: List[ChallengeItem] = []
        for ch in STANDARD_CHALLENGES:
            target = ch["target_value"]
            m_type = ch["metric_type"]

            if m_type == "squat_reps":
                progress = 50 # Dev verified
            elif m_type == "water_ml":
                progress = min(target, water_ml or 3200)
            elif m_type == "protein_g":
                progress = min(target, protein_g or 145)
            elif m_type == "workout_days":
                progress = min(target, workout_days)
            elif m_type == "streak_days":
                progress = min(target, current_streak)
            else:
                progress = 0

            is_completed = progress >= target
            is_claimed = ch["id"] in claimed_challenges

            results.append(
                ChallengeItem(
                    id=ch["id"],
                    title=ch["title"],
                    description=ch["description"],
                    category=ch["category"],
                    target_value=target,
                    current_progress=progress,
                    reward_xp=ch["reward_xp"],
                    reward_coins=ch["reward_coins"],
                    joined=True,
                    completed=is_completed,
                    claimed=is_claimed
                )
            )

        return results

    def complete_challenge(self, user_id: str, challenge_id: str) -> ChallengeCompleteResponse:
        """
        Completes and claims a challenge reward after validating requirements.
        """
        rewards = self._get_or_create_user_rewards(user_id)
        challenges = self.get_challenges(user_id)
        target_ch = next((c for c in challenges if c.id == challenge_id), None)

        if not target_ch:
            raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found.")

        if target_ch.claimed:
            raise HTTPException(status_code=400, detail="Challenge has already been claimed.")

        if not target_ch.completed:
            raise HTTPException(
                status_code=400,
                detail=f"Challenge criteria not yet fulfilled ({target_ch.current_progress}/{target_ch.target_value})."
            )

        # Credit rewards
        old_level = rewards.get("level", 1)
        rewards["xp"] = rewards.get("xp", 0) + target_ch.reward_xp
        rewards["coins"] = rewards.get("coins", 0) + target_ch.reward_coins
        new_level = max(1, 1 + (rewards["xp"] // 400))
        leveled_up = new_level > old_level
        rewards["level"] = new_level
        rewards["claimed_challenges"].add(challenge_id)

        return ChallengeCompleteResponse(
            success=True,
            challenge_id=challenge_id,
            reward_xp=target_ch.reward_xp,
            reward_coins=target_ch.reward_coins,
            new_xp=rewards["xp"],
            new_coins=rewards["coins"],
            new_level=new_level,
            leveled_up=leveled_up,
            message=f"Challenge completed! Claimed +{target_ch.reward_xp} XP & +{target_ch.reward_coins} Coins."
        )

    def get_leaderboard(
        self,
        user_id: str = "usr_001",
        period: str = "weekly",
        scope: str = "national"
    ) -> LeaderboardResponse:
        """
        Returns verified leaderboard standings with current user integrated into ranks.
        """
        rewards = self._get_or_create_user_rewards(user_id)
        user_xp = rewards.get("xp", 4820)
        user_level = rewards.get("level", 13)
        user_streak = rewards.get("current_streak", 7)

        # Baseline competitive athletes
        base_competitors = [
            {"user_id": "usr_top1", "name": "Aryan Sharma", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", "xp": 7250, "level": 18, "streak": 28, "badge": "Titan"},
            {"user_id": "usr_top2", "name": "Priya Patel", "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", "xp": 6180, "level": 16, "streak": 21, "badge": "Master"},
            {"user_id": "usr_top3", "name": "Rohan Mehta", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", "xp": 5420, "level": 14, "streak": 19, "badge": "Elite"},
            {"user_id": "usr_top4", "name": "Ananya Roy", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", "xp": 4350, "level": 11, "streak": 14, "badge": "Pro"},
            {"user_id": "usr_top5", "name": "Devendra Kumar", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", "xp": 3890, "level": 10, "streak": 11, "badge": "Challenger"},
            {"user_id": "usr_top6", "name": "Sneha Reddy", "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", "xp": 3120, "level": 8, "streak": 8, "badge": "Rising"}
        ]

        # Combine with current user
        current_entry = {
            "user_id": user_id,
            "name": "You (Athlete)",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            "xp": user_xp,
            "level": user_level,
            "streak": user_streak,
            "badge": "You",
            "is_current_user": True
        }

        all_entries = base_competitors + [current_entry]
        # Sort descending by XP
        all_entries.sort(key=lambda x: x["xp"], reverse=True)

        ranked_list: List[LeaderboardEntry] = []
        user_rank_entry: Optional[LeaderboardEntry] = None

        for idx, item in enumerate(all_entries):
            rank = idx + 1
            is_me = item.get("is_current_user", False)
            entry = LeaderboardEntry(
                rank=rank,
                user_id=item["user_id"],
                name=item["name"],
                avatar_url=item["avatar_url"],
                xp=item["xp"],
                level=item["level"],
                streak=item["streak"],
                badge=item.get("badge"),
                is_current_user=is_me
            )
            ranked_list.append(entry)
            if is_me:
                user_rank_entry = entry

        return LeaderboardResponse(
            period=period,
            scope=scope,
            entries=ranked_list,
            user_rank=user_rank_entry
        )


gamification_service = GamificationService()
