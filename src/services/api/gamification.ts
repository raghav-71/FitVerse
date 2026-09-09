import {
  GamificationService,
  GamificationProfile,
  GamificationEventXPResult,
  BackendChallenge,
  BackendLeaderboardUser,
  BackendLeaderboardResponse,
  StreakCriteria,
  AchievementItem,
} from './gamificationService';

export const GamificationApi = GamificationService;
export { GamificationService };

export type {
  GamificationProfile,
  GamificationEventXPResult,
  BackendChallenge,
  BackendLeaderboardUser,
  BackendLeaderboardResponse,
  StreakCriteria,
  AchievementItem,
};
