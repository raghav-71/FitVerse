import { apiClient } from './client';

export interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  target_reps: number;
  target_sets: number;
  duration_estimate: string;
  calories_estimate: number;
  target_muscles: string[];
  safety_notes: string[];
  form_cues: string[];
  clearance_status?: 'SAFE' | 'CAUTION' | 'BLOCK';
  clearance_reason?: string;
}

export interface WorkoutExercisePayload {
  workout_session_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
  duration_seconds?: number;
  form_score?: number;
}

export interface WorkoutCompletePayload {
  session_id?: string;
  workout_name?: string;
  exercise_name?: string;
  exercise_type?: string;
  total_reps?: number;
  duration_minutes?: number;
  duration_seconds?: number;
  average_form_score?: number;
  calories_burned?: number;
  intensity?: string;
  form_score?: number;
  common_mistakes?: string[];
  feedback?: string[];
  started_at?: string;
  completed_at?: string;
  exercises?: WorkoutExercisePayload[];
}

export interface WorkoutCompleteResult {
  success: boolean;
  session: any;
  session_id?: string;
  exercises: any[];
  daily_summary: any;
  fit_score: number;
  xp_awarded?: number;
  coins_awarded?: number;
  rewards_earned: {
    xp: number;
    coins: number;
    level: number;
    current_streak: number;
    streak_incremented: boolean;
  };
}

export interface PoseSessionPayload {
  exercise: string;
  reps: number;
  duration_seconds: number;
  average_form_score: number;
  common_mistakes?: string[];
  feedback?: string[];
  joint_angles_summary?: Record<string, any>;
}

export interface PoseSessionResult {
  id?: string;
  exercise: string;
  reps: number;
  average_form_score: number;
  common_mistakes: string[];
  feedback: string[];
}

export interface WorkoutRecommendationsResponse {
  user_id: string;
  caution_level: string;
  monitored_body_part?: string;
  pain_level: number;
  recommended_exercises: ExerciseItem[];
  lower_impact_alternatives: string[];
  medical_disclaimer: string;
}

export const WorkoutApi = {
  async getCatalog(): Promise<ExerciseItem[]> {
    return apiClient.get<ExerciseItem[]>('/workout/catalog');
  },

  async getRecommendations(): Promise<WorkoutRecommendationsResponse> {
    return apiClient.get<WorkoutRecommendationsResponse>('/workout/recommendations');
  },

  async startSession(workoutName: string, intensity: string = 'medium'): Promise<{ session_id: string }> {
    return apiClient.post<{ session_id: string }>('/workout/start', {
      workout_name: workoutName,
      intensity,
    });
  },

  async logExercise(payload: WorkoutExercisePayload): Promise<any> {
    return apiClient.post('/workout/exercise', payload);
  },

  async completeSession(payload: WorkoutCompletePayload): Promise<WorkoutCompleteResult> {
    const durationMinutes = payload.duration_minutes || (payload.duration_seconds ? +(payload.duration_seconds / 60).toFixed(1) : 15);
    const body = {
      ...payload,
      workout_name: payload.workout_name || payload.exercise_name || 'AI Workout Session',
      duration_minutes: durationMinutes,
      form_score: payload.form_score ?? payload.average_form_score ?? 90,
    };
    const res = await apiClient.post<WorkoutCompleteResult>('/workout/complete', body);
    return {
      ...res,
      session_id: res.session?.id || res.session_id || 'ws_completed',
      xp_awarded: res.rewards_earned?.xp || res.xp_awarded || 100,
      coins_awarded: res.rewards_earned?.coins || res.coins_awarded || 25,
    };
  },

  async getTodayWorkouts(): Promise<any> {
    return apiClient.get('/workout/today');
  },

  async getWorkoutHistory(): Promise<any[]> {
    return apiClient.get<any[]>('/workout/history');
  },

  async sendTelemetry(payload: {
    exercise_name: string;
    rep_phase?: string;
    knee_angle?: number;
    back_angle?: number;
    arm_angle?: number;
  }): Promise<any> {
    return apiClient.post('/workout/telemetry', payload);
  },
};

export const PoseApi = {
  async saveSession(payload: PoseSessionPayload): Promise<PoseSessionResult> {
    return apiClient.post<PoseSessionResult>('/pose/session', payload);
  },

  async getHistory(): Promise<any> {
    return apiClient.get('/pose/history');
  },
};

export const WorkoutService = WorkoutApi;
export const PoseService = PoseApi;
