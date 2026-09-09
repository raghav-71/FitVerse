import { apiClient } from './client';

export interface StreakCriteria {
  workout_logged_today: boolean;
  nutrition_target_met: boolean;
  water_target_met: boolean;
  daily_fit_score_calculated: boolean;
  streak_eligible: boolean;
  streak_maintained?: boolean;
}

export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  badge_url?: string;
  unlocked_at?: string;
}

export interface GamificationProfile {
  user_id: string;
  xp: number;
  coins: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  xp_to_next_level?: number;
  streak_criteria: StreakCriteria;
  achievements: AchievementItem[];
}

export interface GamificationEventXPResult {
  success: boolean;
  event_type: string;
  xp_awarded: number;
  coins_awarded: number;
  new_xp: number;
  new_coins: number;
  new_level: number;
  leveled_up: boolean;
  streak: number;
  streak_incremented: boolean;
  message: string;
}

export interface BackendChallenge {
  id: string;
  title: string;
  description: string;
  target_type: string;
  target_value: number;
  current_value: number;
  current_progress?: number;
  completed: boolean;
  claimed: boolean;
  joined?: boolean;
  xp_reward: number;
  coins_reward: number;
  reward_xp?: number;
  reward_coins?: number;
  category: string;
  expires_at: string;
}

export interface BackendLeaderboardUser {
  rank: number;
  previous_rank?: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  badge?: string;
  score: number;
  change: number;
  is_current_user?: boolean;
}

export interface BackendLeaderboardResponse {
  period: string;
  scope: string;
  rankings: BackendLeaderboardUser[];
  entries?: BackendLeaderboardUser[];
  user_rank?: number;
  user_score?: number;
}

export const GamificationService = {
  /**
   * GET /api/v1/gamification/profile
   * Fetch verified XP, Coins, Level, and Streak criteria
   */
  async getProfile(): Promise<GamificationProfile | null> {
    try {
      return await apiClient.get<GamificationProfile>('/gamification/profile');
    } catch (err) {
      console.warn('GamificationService.getProfile failed, using store cache:', err);
      return null;
    }
  },

  /**
   * POST /api/v1/gamification/xp
   * Claim server-validated event XP (anti-cheat protected)
   */
  async claimEventXp(
    eventType: 'workout_completed' | 'protein_target_completed' | 'water_target_completed' | 'streak_milestone_7d' | 'daily_fit_score_achieved' | string,
    referenceId?: string
  ): Promise<GamificationEventXPResult | null> {
    try {
      return await apiClient.post<GamificationEventXPResult>('/gamification/xp', {
        event_type: eventType,
        reference_id: referenceId,
      });
    } catch (err) {
      console.warn('GamificationService.claimEventXp failed:', err);
      return null;
    }
  },

  /**
   * GET /api/v1/gamification/challenges
   * Fetch active challenges with server-computed progress
   */
  async getChallenges(): Promise<BackendChallenge[]> {
    try {
      const res = await apiClient.get<BackendChallenge[]>('/gamification/challenges');
      if (Array.isArray(res)) {
        return res.map((c) => ({
          ...c,
          current_progress: c.current_progress ?? c.current_value ?? 0,
          reward_xp: c.reward_xp ?? c.xp_reward ?? 0,
          reward_coins: c.reward_coins ?? c.coins_reward ?? 0,
          joined: c.joined ?? true,
        }));
      }
      return [];
    } catch (err) {
      console.warn('GamificationService.getChallenges failed:', err);
      return [];
    }
  },

  /**
   * POST /api/v1/gamification/challenge/complete
   * Claim completed challenge rewards
   */
  async completeChallenge(challengeId: string): Promise<any | null> {
    try {
      return await apiClient.post<any>('/gamification/challenge/complete', { challenge_id: challengeId });
    } catch (err) {
      console.warn('GamificationService.completeChallenge failed:', err);
      return null;
    }
  },

  /**
   * GET /api/v1/leaderboard
   * Fetch verified national or friend standings
   */
  async getLeaderboard(
    period: string = 'weekly',
    scope: string = 'national'
  ): Promise<BackendLeaderboardResponse | null> {
    try {
      const data = await apiClient.get<BackendLeaderboardResponse>(`/leaderboard?period=${period}&scope=${scope}`);
      if (data) {
        return {
          ...data,
          entries: data.entries || data.rankings || [],
          rankings: data.rankings || data.entries || [],
        };
      }
      return null;
    } catch (err) {
      console.warn('GamificationService.getLeaderboard failed:', err);
      return null;
    }
  },
};
