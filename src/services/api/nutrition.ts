import { apiClient } from './client';

export interface MetricWithPercentage {
  consumed: number;
  target: number;
  percentage: number;
}

export interface MetricSimple {
  consumed: number;
  target: number;
}

export interface WaterMetric {
  consumed_ml: number;
  target_ml: number;
  percentage: number;
}

export interface DailyNutritionSummary {
  date: string;
  calories: MetricWithPercentage;
  protein: MetricWithPercentage;
  carbs: MetricSimple;
  fat: MetricSimple;
  water: WaterMetric;
}

export const NutritionApi = {
  async getDailyNutritionSummary(date?: string): Promise<DailyNutritionSummary> {
    const qs = date ? `?date=${date}` : '';
    return apiClient.get<DailyNutritionSummary>(`/nutrition/daily-summary${qs}`);
  },
};
