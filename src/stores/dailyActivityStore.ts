import { create } from 'zustand';
import { ActivityService, FitScoreData } from '../services/api/activityService';

export interface DailyActivityState {
  // Exercise
  exerciseLogged: boolean;
  loggedActivities: string[];
  weekWorkoutsCount: number;
  streakDays: number;
  toggleActivity: (activity: string) => void;
  logExercise: (activities?: string[]) => void;

  // Water (Paani)
  waterGlasses: number;
  maxGlasses: number;
  todayWaterMl: number;
  dailyWaterTargetMl: number;
  waterProgressPercentage: number;
  yesterdayLiters: number;
  avgLitersPerDay: number;
  waterStreak: number;
  addWaterGlass: () => void;
  setWaterGlasses: (count: number) => void;

  // Weight (Wazan)
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
  heightCm: number;
  weightLoggedToday: boolean;
  setWeight: (weight: number) => void;
  setTargetWeight: (weight: number) => void;
  setHeight: (height: number) => void;

  // Fit Score System
  fitScoreData: FitScoreData | null;
  fetchFitScore: () => Promise<FitScoreData | null>;

  // Backend Synchronization
  syncWithBackend: () => Promise<void>;
}

export const useDailyActivityStore = create<DailyActivityState>((set, get) => ({
  // Exercise
  exerciseLogged: true,
  loggedActivities: ['Gym', 'Home Workout'],
  weekWorkoutsCount: 6,
  streakDays: 18,
  toggleActivity: (activity: string) =>
    set((state) => {
      const exists = state.loggedActivities.includes(activity);
      const updated = exists
        ? state.loggedActivities.filter((a) => a !== activity)
        : [...state.loggedActivities, activity];
      return { loggedActivities: updated };
    }),
  logExercise: (activities) => {
    const list = activities || get().loggedActivities;
    set({
      exerciseLogged: true,
      loggedActivities: list,
    });
    // Async background sync
    ActivityService.logExercise(list);
  },

  // Water
  waterGlasses: 4,
  maxGlasses: 8,
  todayWaterMl: 1000,
  dailyWaterTargetMl: 3500,
  waterProgressPercentage: 29,
  yesterdayLiters: 1.0,
  avgLitersPerDay: 1.3,
  waterStreak: 12,
  addWaterGlass: () => {
    const current = get().waterGlasses;
    const max = get().maxGlasses;
    if (current < max) {
      set({ waterGlasses: current + 1 });
      // Async background sync with backend /api/v1/water/log
      ActivityService.logWater(250).then((res) => {
        if (res) {
          set({
            todayWaterMl: res.today_total_ml,
            dailyWaterTargetMl: res.daily_target_ml,
            waterProgressPercentage: res.progress_percentage,
            waterGlasses: Math.min(max, Math.max(current + 1, res.glasses ?? current + 1)),
          });
        }
      });
    }
  },
  setWaterGlasses: (count: number) => {
    const prev = get().waterGlasses;
    const clamped = Math.max(0, Math.min(count, 8));
    set({ waterGlasses: clamped });
    const diff = clamped - prev;
    if (diff > 0) {
      ActivityService.logWater(diff * 250).then((res) => {
        if (res) {
          set({
            todayWaterMl: res.today_total_ml,
            dailyWaterTargetMl: res.daily_target_ml,
            waterProgressPercentage: res.progress_percentage,
          });
        }
      });
    }
  },

  // Weight
  currentWeight: 75.8,
  startWeight: 78.4,
  targetWeight: 72.0,
  heightCm: 178,
  weightLoggedToday: true,
  setWeight: (weight: number) => {
    const rounded = parseFloat(weight.toFixed(1));
    set({
      currentWeight: rounded,
      weightLoggedToday: true,
    });
    // Async background sync with backend
    ActivityService.logWeight(rounded);
  },
  setTargetWeight: (targetWeight: number) => {
    set({ targetWeight });
    ActivityService.updateTargetWeight(targetWeight);
  },
  setHeight: (heightCm: number) => set({ heightCm }),

  // Fit Score System
  fitScoreData: null,
  fetchFitScore: async () => {
    try {
      const data = await ActivityService.getFitScore();
      if (data) {
        set({ fitScoreData: data });
        return data;
      }
    } catch (e) {
      console.warn('fetchFitScore failed:', e);
    }
    return null;
  },

  // Sync state from backend
  syncWithBackend: async () => {
    try {
      const [summary, waterData, weightHistory, fitScore] = await Promise.all([
        ActivityService.getDailySummary(),
        ActivityService.getTodayWater(),
        ActivityService.getWeightHistory(),
        ActivityService.getFitScore(),
      ]);

      if (summary) {
        set({
          exerciseLogged: summary.exercise_logged,
          loggedActivities: summary.logged_activities || get().loggedActivities,
          weekWorkoutsCount: summary.week_workouts_count ?? get().weekWorkoutsCount,
          streakDays: summary.streak_days ?? get().streakDays,
        });
      }

      if (waterData) {
        set({
          waterGlasses: waterData.glasses,
          maxGlasses: waterData.max_glasses || 8,
          todayWaterMl: waterData.today_total_ml || get().todayWaterMl,
          dailyWaterTargetMl: waterData.daily_target_ml || get().dailyWaterTargetMl,
          waterProgressPercentage: waterData.progress_percentage ?? get().waterProgressPercentage,
          yesterdayLiters: waterData.yesterday_liters ?? get().yesterdayLiters,
          avgLitersPerDay: waterData.avg_liters_per_day ?? get().avgLitersPerDay,
          waterStreak: waterData.streak_days ?? get().waterStreak,
        });
      }

      if (weightHistory) {
        set({
          currentWeight: weightHistory.current_weight_kg,
          startWeight: weightHistory.start_weight_kg,
          targetWeight: weightHistory.target_weight_kg,
        });
      }

      if (fitScore) {
        set({ fitScoreData: fitScore });
      }
    } catch (err) {
      console.warn('Sync daily activity with backend failed, using local cache:', err);
    }
  },
}));
