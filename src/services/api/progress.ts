import { apiClient } from './client';

export interface SixDimensionsData {
  nutrition: number;
  workout: number;
  hydration: number;
  activity: number;
  sleep: number;
  stress: number;
}

export interface ProgressSummaryData {
  user_id: string;
  streak_days: number;
  total_xp: number;
  avg_form_score: number;
  total_sessions: number;
  six_dimensions: SixDimensionsData;
  weekly_stress: number;
}

export interface FitScoreOverviewData {
  fit_score: number;
  nutrition_score: number;
  workout_score: number;
  hydration_score: number;
  activity_score: number;
  sleep_score: number;
  stress_score: number;
  weekly_average_fit_score: number;
  monthly_trend: Array<{ date: string; fit_score: number }>;
}

export const ProgressApi = {
  async getSummary(): Promise<ProgressSummaryData> {
    return apiClient.get<ProgressSummaryData>('/progress/summary');
  },

  async getFitScore(): Promise<FitScoreOverviewData> {
    return apiClient.get<FitScoreOverviewData>('/progress/fit-score');
  },
};
