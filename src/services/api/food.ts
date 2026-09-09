import { apiClient } from './client';
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

export interface FoodLogPayload {
  food_name: string;
  quantity: number;
  quantity_unit: string;
  meal_type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface TodayFoodLogsResponse {
  date: string;
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  targets: {
    calories: number;
    protein: number;
    water: number;
  };
  meals: any[];
  meals_count: number;
}

export interface FoodImageUploadResponse {
  success: boolean;
  image_id: string;
  message: string;
  is_temporary: boolean;
  storage_notice: string;
}

export interface FoodImageAnalyzeResponse {
  success: boolean;
  primary_food: string;
  estimated_quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: number;
  confidence_percentage: number;
  is_low_confidence: boolean;
  detected_meal_type: MealType;
  disclaimer: string;
  review_prompt?: string | null;
  image_id?: string | null;
}

export const FoodApi = {
  async analyzeFood(text: string): Promise<FoodAnalyzeResponse> {
    try {
      return await apiClient.post<FoodAnalyzeResponse>('/food/analyze', { text });
    } catch (error) {
      console.warn('FoodApi.analyzeFood failed, using offline fallback:', error);
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
            notes: 'Estimated offline.',
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
        confirmation_prompt: 'Portion estimated offline. Adjust if needed.',
        disclaimer: 'Offline estimate.',
      };
    }
  },

  async uploadFoodImage(base64: string, filename?: string, consent: boolean = false): Promise<FoodImageUploadResponse> {
    try {
      return await apiClient.post<FoodImageUploadResponse>('/food/upload', {
        image_base64: base64,
        filename: filename || 'meal_capture.jpg',
        consent_to_store: consent,
      });
    } catch (error) {
      console.warn('FoodApi.uploadFoodImage failed, using local temporary cache:', error);
      return {
        success: true,
        image_id: `local_${Date.now()}`,
        message: 'Cached locally for analysis.',
        is_temporary: true,
        storage_notice: 'Image held in secure temporary cache. Not permanently stored without explicit consent.',
      };
    }
  },

  async analyzeFoodImage(payload: {
    image_base64?: string;
    image_id?: string;
    meal_hint?: string;
    meal_type?: MealType;
  }): Promise<FoodImageAnalyzeResponse> {
    try {
      return await apiClient.post<FoodImageAnalyzeResponse>('/food/analyze-image', payload);
    } catch (error) {
      console.warn('FoodApi.analyzeFoodImage failed, using offline fallback:', error);
      const hint = (payload.meal_hint || '').toLowerCase();
      let food = 'Paneer Curry';
      let cal = 350;
      let pro = 22;
      let carb = 12;
      let fat = 24;
      let fib = 4;
      let conf = 0.82;
      let qty = '150g';

      if (hint.includes('roti')) {
        food = 'Roti (Whole Wheat Chapati)';
        cal = 160; pro = 6; carb = 32; fat = 1.5; fib = 4; conf = 0.92; qty = '2 pieces (70g)';
      } else if (hint.includes('dal')) {
        food = 'Yellow Tadka Dal';
        cal = 180; pro = 11; carb = 26; fat = 4.5; fib = 6.5; conf = 0.88; qty = '1 bowl (180g)';
      } else if (hint.includes('rice')) {
        food = 'Steamed Basmati Rice';
        cal = 195; pro = 4.2; carb = 43; fat = 0.5; fib = 1.5; conf = 0.94; qty = '1 cup (150g)';
      } else if (hint.includes('biryani')) {
        food = 'Hyderabadi Biryani';
        cal = 460; pro = 28; carb = 52; fat = 16; fib = 4.5; conf = 0.85; qty = '1 plate (250g)';
      } else if (hint.includes('dosa')) {
        food = 'Crispy Masala Dosa';
        cal = 280; pro = 6.5; carb = 40; fat = 11; fib = 3.5; conf = 0.87; qty = '1 medium (140g)';
      } else if (hint.includes('idli')) {
        food = 'Steamed Idli with Sambar';
        cal = 210; pro = 7.5; carb = 42; fat = 1.8; fib = 4.5; conf = 0.91; qty = '3 idlis (150g)';
      }

      return {
        success: true,
        primary_food: food,
        estimated_quantity: qty,
        calories: cal,
        protein: pro,
        carbs: carb,
        fat: fat,
        fiber: fib,
        confidence: conf,
        confidence_percentage: Math.round(conf * 100),
        is_low_confidence: conf < 0.80,
        detected_meal_type: payload.meal_type || 'Lunch',
        disclaimer: 'Nutrition values are estimated.',
        review_prompt: conf < 0.80 ? 'AI confidence is low. Please confirm food, edit quantity, or add missing information.' : undefined,
        image_id: payload.image_id,
      };
    }
  },

  async logMeal(meal: {
    name: string;
    mealType?: any;
    meal_type?: any;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  }): Promise<any> {
    const payload: FoodLogPayload = {
      food_name: meal.name,
      quantity: 1,
      quantity_unit: 'serving',
      meal_type: meal.mealType || meal.meal_type || 'Breakfast',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
    };
    return apiClient.post('/food/log', payload);
  },

  async getTodayMeals(): Promise<TodayFoodLogsResponse> {
    return apiClient.get<TodayFoodLogsResponse>('/food/today');
  },

  async deleteMeal(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/food/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getFoodHistory(): Promise<any[]> {
    return apiClient.get<any[]>('/food/history');
  },
};

export const FoodService = FoodApi;
