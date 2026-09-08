import { API_CONFIG } from './config';
import { MealType, LoggedMeal } from '../../stores/dietStore';

export interface ParsedFoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence: number;
  needs_confirmation: boolean;
  notes?: string;
}

export interface FoodAnalyzeResponse {
  success: boolean;
  detected_meal_type?: MealType;
  foods: ParsedFoodItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  needs_confirmation: boolean;
  confirmation_prompt?: string | null;
  disclaimer: string;
}

export const FoodService = {
  /**
   * Natural Language Food Analysis
   * POST /api/v1/food/analyze
   */
  async analyzeFood(text: string): Promise<FoodAnalyzeResponse> {
    const url = `${API_CONFIG.getApiV1Url()}/food/analyze`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Backend food analyze failed, using offline fallback estimator:', error);

      // Offline client fallback
      const lower = text.toLowerCase();
      let detectedMeal: MealType = 'Breakfast';
      if (lower.includes('lunch')) detectedMeal = 'Lunch';
      else if (lower.includes('dinner')) detectedMeal = 'Dinner';
      else if (lower.includes('snack')) detectedMeal = 'Snack';

      return {
        success: true,
        detected_meal_type: detectedMeal,
        foods: [
          {
            name: text.trim(),
            quantity: 1,
            unit: 'serving',
            calories: 350,
            protein: 20,
            carbs: 45,
            fat: 10,
            fiber: 4,
            confidence: 0.65,
            needs_confirmation: true,
            notes: 'Estimated offline. Connect to FitVerse AI backend for precision analysis.',
          },
        ],
        total: {
          calories: 350,
          protein: 20,
          carbs: 45,
          fat: 10,
          fiber: 4,
        },
        needs_confirmation: true,
        confirmation_prompt: 'Portion estimated offline. Adjust calories & protein if needed.',
        disclaimer: 'Offline estimate.',
      };
    }
  },

  /**
   * Log Meal Entry to Backend
   * POST /api/v1/food/log
   */
  async logMeal(meal: Omit<LoggedMeal, 'id' | 'loggedAt'>): Promise<any> {
    const url = `${API_CONFIG.getApiV1Url()}/food/log`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          food_name: meal.name,
          meal_type: meal.mealType,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Backend log meal request failed, queued locally:', err);
    }
    return null;
  },

  /**
   * Get Today's Logged Meals
   * GET /api/v1/food/today
   */
  async getTodayMeals(): Promise<any> {
    const url = `${API_CONFIG.getApiV1Url()}/food/today`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Failed to fetch today meals from backend:', err);
    }
    return null;
  },

  /**
   * Delete Meal Entry
   * DELETE /api/v1/food/{id}
   */
  async deleteMeal(id: string): Promise<boolean> {
    const url = `${API_CONFIG.getApiV1Url()}/food/${id}`;
    try {
      const response = await fetch(url, { method: 'DELETE' });
      return response.ok;
    } catch (err) {
      console.warn('Backend delete meal failed:', err);
      return false;
    }
  },
};
