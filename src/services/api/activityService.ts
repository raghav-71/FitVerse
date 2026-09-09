import { apiClient } from './client';

export interface DailySummaryResponse {
  user_id: string;
  date: string;
  exercise_logged: boolean;
  logged_activities: string[];
  week_workouts_count: number;
  streak_days: number;
  water_glasses: number;
  max_glasses: number;
  current_weight_kg: number;
  target_weight_kg: number;
}

export interface WeightHistoryEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  logged_at: string;
}

export interface WeightHistoryResponse {
  current_weight_kg: number;
  start_weight_kg: number;
  target_weight_kg: number;
  history: WeightHistoryEntry[];
  total_logged_days: number;
}

export interface WaterLogResult {
  today_total_ml: number;
  daily_target_ml: number;
  progress_percentage: number;
  glasses?: number;
  max_glasses?: number;
}

export interface DailyNutritionSummary {
  date: string;
  calories: {
    consumed: number;
    target: number;
    percentage: number;
  };
  protein: {
    consumed: number;
    target: number;
    percentage: number;
  };
  carbs: {
    consumed: number;
    target: number;
  };
  fat: {
    consumed: number;
    target: number;
  };
  water: {
    consumed_ml: number;
    target_ml: number;
    percentage: number;
  };
}

export const ActivityService = {
  /**
   * Fetch Today's Daily Activity Summary
   * GET /api/v1/activity/daily-summary
   */
  async getDailySummary(): Promise<DailySummaryResponse | null> {
    try {
      return await apiClient.get<DailySummaryResponse>('/activity/daily-summary');
    } catch (err) {
      console.warn('Failed to fetch daily summary from backend:', err);
      return null;
    }
  },

  /**
   * Log Manual Exercise Activity
   * POST /api/v1/activity/exercise
   */
  async logExercise(activities: string[], durationMinutes: number = 45): Promise<boolean> {
    try {
      await apiClient.post('/activity/exercise', { activities, duration_minutes: durationMinutes });
      return true;
    } catch (err) {
      console.warn('Failed to log exercise to backend:', err);
      return false;
    }
  },

  /**
   * Fetch Today's Water Consumption
   * GET /api/v1/water/today
   */
  async getTodayWater(): Promise<{
    today_total_ml: number;
    daily_target_ml: number;
    progress_percentage: number;
    glasses: number;
    max_glasses: number;
    yesterday_liters: number;
    avg_liters_per_day: number;
    streak_days: number;
  } | null> {
    try {
      return await apiClient.get<any>('/water/today');
    } catch (err) {
      console.warn('Failed to fetch water data from backend:', err);
      return null;
    }
  },

  /**
   * Log Water Consumption
   * POST /api/v1/water/log
   */
  async logWater(amountMl: number = 250): Promise<WaterLogResult | null> {
    try {
      return await apiClient.post<WaterLogResult>('/water/log', { amount_ml: amountMl });
    } catch (err) {
      console.warn('Failed to log water to backend:', err);
      return null;
    }
  },

  /**
   * Backward-compatible alias for logWaterGlass
   */
  async logWaterGlass(amountMl: number = 250): Promise<boolean> {
    const res = await this.logWater(amountMl);
    return res !== null;
  },

  /**
   * Delete Water Log Entry
   * DELETE /api/v1/water/{id}
   */
  async deleteWater(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/water/${id}`);
      return true;
    } catch (err) {
      console.warn('Failed to delete water log:', err);
      return false;
    }
  },

  /**
   * Get Daily Nutrition Summary
   * GET /api/v1/nutrition/daily-summary
   */
  async getDailyNutritionSummary(dateStr?: string): Promise<DailyNutritionSummary | null> {
    const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    try {
      return await apiClient.get<DailyNutritionSummary>(`/nutrition/daily-summary${query}`);
    } catch (err) {
      console.warn('Failed to fetch daily nutrition summary:', err);
      return null;
    }
  },

  /**
   * Fetch Weight History
   * GET /api/v1/weight/history
   */
  async getWeightHistory(): Promise<WeightHistoryResponse | null> {
    try {
      return await apiClient.get<WeightHistoryResponse>('/weight/history');
    } catch (err) {
      console.warn('Failed to fetch weight history from backend:', err);
      return null;
    }
  },

  /**
   * Log Weight Entry
   * POST /api/v1/weight/log
   */
  async logWeight(weightKg: number, bodyFat?: number, muscleMass?: number): Promise<boolean> {
    try {
      await apiClient.post('/weight/log', {
        weight_kg: weightKg,
        body_fat_percentage: bodyFat,
        muscle_mass: muscleMass,
      });
      return true;
    } catch (err) {
      console.warn('Failed to log weight entry to backend:', err);
      return false;
    }
  },

  /**
   * Update Target Weight
   * PUT /api/v1/weight/target
   */
  async updateTargetWeight(targetWeightKg: number): Promise<boolean> {
    try {
      await apiClient.put('/weight/target', { target_weight_kg: targetWeightKg });
      return true;
    } catch (err) {
      console.warn('Failed to update target weight in backend:', err);
      return false;
    }
  },

  /**
   * Fetch Holistic Fit Score System Data
   * GET /api/v1/progress/fit-score
   */
  async getFitScore(): Promise<FitScoreData | null> {
    try {
      return await apiClient.get<FitScoreData>('/progress/fit-score');
    } catch (err) {
      console.warn('Failed to fetch fit score from backend, using baseline fallback:', err);
    }
    return {
      fit_score: 82,
      nutrition_score: 85,
      workout_score: 90,
      hydration_score: 75,
      activity_score: 80,
      sleep_score: 70,
      stress_score: 88,
      daily_fit_score: {
        fit_score: 82,
        nutrition_score: 85,
        workout_score: 90,
        hydration_score: 75,
        activity_score: 80,
        sleep_score: 70,
        stress_score: 88,
        date: new Date().toISOString().split('T')[0],
      },
      weekly_average_fit_score: 80,
      monthly_trend: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        fit_score: 75 + Math.round(Math.sin(i * 0.4) * 8),
      })),
      category_weights: {
        nutrition: 0.25,
        workout: 0.20,
        hydration: 0.15,
        activity: 0.15,
        sleep: 0.15,
        stress: 0.10,
      },
    };
  },
};

export interface FitScoreData {
  fit_score: number;
  nutrition_score: number;
  workout_score: number;
  hydration_score: number;
  activity_score: number;
  sleep_score: number;
  stress_score: number;
  daily_fit_score: {
    fit_score: number;
    nutrition_score: number;
    workout_score: number;
    hydration_score: number;
    activity_score: number;
    sleep_score: number;
    stress_score: number;
    date: string;
  };
  weekly_average_fit_score: number;
  monthly_trend: Array<{
    date: string;
    fit_score: number;
  }>;
  category_weights: {
    nutrition: number;
    workout: number;
    hydration: number;
    activity: number;
    sleep: number;
    stress: number;
  };
}

