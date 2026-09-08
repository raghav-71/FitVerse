import { create } from 'zustand';
import { FoodService } from '../services/api/foodService';
import { ActivityService, DailyNutritionSummary } from '../services/api/activityService';
import { AiService, DietPlanParams, DietPlanResponse, DailyAnalysisResponse, WeeklyReportData } from '../services/api/aiService';
import { useDailyActivityStore } from './dailyActivityStore';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface LoggedMeal {
  id: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

export interface DietState {
  meals: LoggedMeal[];
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterTarget: number;
  bmr: number;
  tdee: number;
  planReasoning: string;
  mealDistribution: any;
  isLoading: boolean;
  dailySummary: DailyNutritionSummary | null;
  dailyAnalysis: DailyAnalysisResponse | null;
  weeklyReport: WeeklyReportData | null;

  addMeal: (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => void;
  removeMeal: (id: string) => void;
  getTotals: () => { calories: number; protein: number; carbs: number; fat: number };
  resetDay: () => void;
  syncTodayWithBackend: () => Promise<void>;
  fetchDailyAnalysis: () => Promise<DailyAnalysisResponse | null>;
  fetchWeeklyReport: (weekOffset?: number) => Promise<WeeklyReportData | null>;
  applyDietPlan: (plan: DietPlanResponse) => void;
  generateDietPlan: (params: DietPlanParams) => Promise<DietPlanResponse | null>;
}

const INITIAL_MEALS: LoggedMeal[] = [
  {
    id: 'meal_1',
    mealType: 'Breakfast',
    name: 'Oatmeal with Almonds & Whey',
    calories: 480,
    protein: 38,
    carbs: 56,
    fat: 12,
    loggedAt: '8:15 AM',
  },
  {
    id: 'meal_2',
    mealType: 'Lunch',
    name: 'Paneer Tikka Bowl & Brown Rice',
    calories: 680,
    protein: 44,
    carbs: 72,
    fat: 18,
    loggedAt: '1:30 PM',
  },
  {
    id: 'meal_3',
    mealType: 'Snack',
    name: 'Greek Yogurt & Mixed Berries',
    calories: 220,
    protein: 20,
    carbs: 26,
    fat: 4,
    loggedAt: '5:00 PM',
  },
];

export const useDietStore = create<DietState>((set, get) => ({
  meals: INITIAL_MEALS,
  calorieTarget: 2200,
  proteinTarget: 140,
  carbsTarget: 250,
  fatTarget: 70,
  waterTarget: 8,
  bmr: 1800,
  tdee: 2700,
  planReasoning: 'Targeted macros based on your fitness goals.',
  mealDistribution: null,
  isLoading: false,
  dailySummary: null,
  dailyAnalysis: null,
  weeklyReport: null,

  applyDietPlan: (plan: DietPlanResponse) => {
    const targets = plan.daily_targets;
    const waterGlasses = Math.min(14, Math.max(8, Math.round(targets.water_ml / 250)));

    set({
      calorieTarget: targets.calories,
      proteinTarget: targets.protein_g,
      carbsTarget: targets.carbs_g,
      fatTarget: targets.fat_g,
      waterTarget: waterGlasses,
      bmr: plan.bmr,
      tdee: plan.tdee,
      planReasoning: plan.reasoning,
      mealDistribution: plan.meal_distribution,
    });

    // Also synchronize dailyActivityStore (water target & max glasses)
    try {
      useDailyActivityStore.setState({
        dailyWaterTargetMl: targets.water_ml,
        maxGlasses: waterGlasses,
      });
    } catch {
      // Safe fallback
    }
  },

  generateDietPlan: async (params: DietPlanParams) => {
    set({ isLoading: true });
    try {
      const plan = await AiService.generateDietPlan(params);
      if (plan) {
        get().applyDietPlan(plan);
        return plan;
      }
    } catch (err) {
      console.warn('generateDietPlan failed:', err);
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  addMeal: (meal) => {
    const newMeal: LoggedMeal = {
      ...meal,
      id: `meal_${Date.now()}`,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Instant optimistic local UI update
    set((state) => ({
      meals: [...state.meals, newMeal],
    }));

    // 2. Background sync to real backend API & update daily summary
    FoodService.logMeal(meal)
      .then(async () => {
        const summary = await ActivityService.getDailyNutritionSummary();
        if (summary) {
          set({
            dailySummary: summary,
            calorieTarget: summary.calories.target || get().calorieTarget,
            proteinTarget: summary.protein.target || get().proteinTarget,
            carbsTarget: summary.carbs.target || get().carbsTarget,
            fatTarget: summary.fat.target || get().fatTarget,
          });
        }
      })
      .catch((err) => {
        console.warn('DietStore: Background meal sync failed:', err);
      });
  },

  removeMeal: (id) => {
    // 1. Optimistic removal
    set((state) => ({
      meals: state.meals.filter((m) => m.id !== id),
    }));

    // 2. Background sync
    FoodService.deleteMeal(id)
      .then(async () => {
        const summary = await ActivityService.getDailyNutritionSummary();
        if (summary) {
          set({ dailySummary: summary });
        }
      })
      .catch((err) => {
        console.warn('DietStore: Background delete failed:', err);
      });
  },

  getTotals: () => {
    const { meals } = get();
    return meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  resetDay: () => set({ meals: INITIAL_MEALS }),

  fetchDailyAnalysis: async () => {
    try {
      const analysis = await AiService.getDailyAnalysis();
      if (analysis) {
        set({ dailyAnalysis: analysis });
        return analysis;
      }
    } catch (err) {
      console.warn('fetchDailyAnalysis failed:', err);
    }
    return null;
  },

  fetchWeeklyReport: async (weekOffset: number = 0) => {
    try {
      const report = await AiService.getWeeklyReport(weekOffset);
      if (report) {
        set({ weeklyReport: report });
        return report;
      }
    } catch (err) {
      console.warn('fetchWeeklyReport failed:', err);
    }
    return null;
  },

  syncTodayWithBackend: async () => {
    set({ isLoading: true });
    try {
      const [foodData, summary, analysis, weekly] = await Promise.all([
        FoodService.getTodayMeals(),
        ActivityService.getDailyNutritionSummary(),
        AiService.getDailyAnalysis(),
        AiService.getWeeklyReport(0),
      ]);

      if (foodData && foodData.meals && foodData.meals.length > 0) {
        const formatted: LoggedMeal[] = foodData.meals.map((m: any) => ({
          id: m.id,
          mealType: m.meal_type || 'Breakfast',
          name: m.food_name || m.name,
          calories: m.calories || 0,
          protein: m.protein || 0,
          carbs: m.carbs || 0,
          fat: m.fat || 0,
          loggedAt: m.logged_at || 'Just now',
        }));
        set({ meals: formatted });
      }

      if (summary) {
        set({
          dailySummary: summary,
          calorieTarget: summary.calories.target || get().calorieTarget,
          proteinTarget: summary.protein.target || get().proteinTarget,
          carbsTarget: summary.carbs.target || get().carbsTarget,
          fatTarget: summary.fat.target || get().fatTarget,
          waterTarget: Math.round(summary.water.target_ml / 250),
        });
      }

      if (analysis) {
        set({ dailyAnalysis: analysis });
      }

      if (weekly) {
        set({ weeklyReport: weekly });
      }
    } catch (e) {
      console.warn('Failed to sync today diet from backend:', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
