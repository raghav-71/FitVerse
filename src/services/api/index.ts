export { apiClient, ApiError } from './client';
export type { RequestOptions } from './client';

export { AuthApi } from './auth';
export type { AuthLoginPayload, AuthRegisterPayload, AuthResponse } from './auth';

export { UserApi } from './user';
export type { UserProfileData, UserProfileUpdatePayload } from './user';

export { FoodApi, FoodService } from './food';
export type { ParsedFoodItem, FoodAnalyzeResponse, FoodLogPayload, TodayFoodLogsResponse } from './food';

export { WaterApi } from './water';
export type { WaterLogResponse } from './water';

export { NutritionApi } from './nutrition';
export type { DailyNutritionSummary, MetricWithPercentage, MetricSimple, WaterMetric } from './nutrition';

export { WorkoutApi, PoseApi, WorkoutService, PoseService } from './workout';
export type {
  ExerciseItem,
  WorkoutExercisePayload,
  WorkoutCompletePayload,
  WorkoutCompleteResult,
  PoseSessionPayload,
  PoseSessionResult,
  WorkoutRecommendationsResponse,
} from './workout';

export { ProgressApi } from './progress';
export type { ProgressSummaryData, FitScoreOverviewData, SixDimensionsData } from './progress';

export { InjuryApi, InjuryService } from './injury';
export type {
  InjuryAnalyzeInput,
  InjuryAnalyzeResponse,
  ExerciseClearance,
  InjuryProfileInput,
  InjuryProfileResponse,
} from './injury';

export { GamificationApi, GamificationService } from './gamification';
export type {
  GamificationProfile,
  GamificationEventXPResult,
  BackendChallenge,
  BackendLeaderboardUser,
  BackendLeaderboardResponse,
  StreakCriteria,
  AchievementItem,
} from './gamification';

export { AiApi, AiService } from './ai';
export type {
  InjuryScreenResponse,
  DietPlanParams,
  DietPlanResponse,
  MealItemDetail,
  DailyAnalysisResponse,
  WeeklyReportResponse,
} from './ai';
