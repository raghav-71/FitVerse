import { apiClient } from './client';
import { CompletedWorkoutSummary, ExerciseItem } from '../../stores/workoutSessionStore';

export interface TelemetryFeedback {
  form_score: number;
  status: 'OPTIMAL' | 'WARNING' | 'DANGER';
  feedback_cue: string;
  depth_reached: boolean;
  rep_counted: boolean;
}

export interface WorkoutStartPayload {
  workout_name: string;
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  scheduled_duration_minutes?: number;
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
  session_id?: string | null;
  workout_name: string;
  duration_minutes: number;
  calories_burned?: number;
  intensity?: string;
  completed?: boolean;
  form_score?: number;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    weight_kg?: number;
    duration_seconds?: number;
    form_score?: number;
  }>;
}

export const WorkoutService = {
  /**
   * Start Workout Session
   * POST /api/v1/workout/start
   */
  async startWorkout(workoutName: string, intensity: string = 'medium'): Promise<any> {
    try {
      return await apiClient.post('/workout/start', {
        workout_name: workoutName,
        intensity,
        scheduled_duration_minutes: 15.0,
      });
    } catch (err) {
      console.warn('Backend start workout failed, running offline:', err);
      return null;
    }
  },

  /**
   * Log Exercise in Workout Session
   * POST /api/v1/workout/exercise
   */
  async logExercise(payload: WorkoutExercisePayload): Promise<any> {
    try {
      return await apiClient.post('/workout/exercise', payload);
    } catch (err) {
      console.warn('Backend log exercise failed:', err);
      return null;
    }
  },

  /**
   * Complete Workout Session & Trigger 7-Step Persistence Matrix
   * POST /api/v1/workout/complete
   */
  async completeWorkout(payload: WorkoutCompletePayload): Promise<any> {
    try {
      return await apiClient.post('/workout/complete', payload);
    } catch (err) {
      console.warn('Backend complete workout failed, saved locally:', err);
      return null;
    }
  },

  /**
   * Submit Completed Workout Session from legacy summary
   * POST /api/v1/workout/complete
   */
  async submitSession(summary: CompletedWorkoutSummary, sessionId?: string | null): Promise<any> {
    const payload: WorkoutCompletePayload = {
      session_id: sessionId,
      workout_name: summary.exerciseName,
      duration_minutes: +(summary.durationSeconds / 60).toFixed(1),
      calories_burned: Math.round(summary.totalReps * 4),
      intensity: 'medium',
      completed: true,
      form_score: summary.averageFormScore,
      exercises: [
        {
          exercise_name: summary.exerciseName,
          sets: 1,
          reps: summary.totalReps,
          weight_kg: 0.0,
          duration_seconds: summary.durationSeconds,
          form_score: summary.averageFormScore,
        },
      ],
    };

    return await this.completeWorkout(payload);
  },

  /**
   * Fetch Today's Workout Summary
   * GET /api/v1/workout/today
   */
  async getTodayWorkout(): Promise<any> {
    try {
      return await apiClient.get('/workout/today');
    } catch (err) {
      console.warn('Failed to fetch today workout:', err);
      return null;
    }
  },

  /**
   * Fetch Workout History
   * GET /api/v1/workout/history
   */
  async getWorkoutHistory(): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>('/workout/history');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Failed to fetch workout history:', err);
      return [];
    }
  },

  /**
   * Send Real-Time Biomechanical Landmark Telemetry
   * POST /api/v1/workout/telemetry
   */
  async sendTelemetry(data: {
    exercise_name: string;
    knee_angle?: number;
    hip_angle?: number;
    back_angle?: number;
    current_rep: number;
    rep_phase?: string;
  }): Promise<TelemetryFeedback | null> {
    try {
      return await apiClient.post<TelemetryFeedback>('/workout/telemetry', data);
    } catch (err) {
      // Return null silently for fast fallback to client heuristics
      return null;
    }
  },

  /**
   * Fetch Exercise Catalog
   * GET /api/v1/workout/catalog
   */
  async getCatalog(): Promise<ExerciseItem[]> {
    try {
      const raw = await apiClient.get<any[]>('/workout/catalog');
      if (Array.isArray(raw)) {
        return raw.map((item: any) => ({
          id: item.id,
          typeKey: (item.typeKey || item.type_key || (item.id?.includes('squat') ? 'squat' : item.id?.includes('push') ? 'push_up' : item.id?.includes('lunge') ? 'lunge' : item.id?.includes('plank') ? 'plank' : 'jumping_jack')) as any,
          name: item.name,
          category: item.category,
          difficulty: item.difficulty,
          targetReps: item.target_reps,
          targetSets: item.target_sets,
          durationEstimate: item.duration_estimate,
          caloriesEstimate: item.calories_estimate,
          targetMuscles: item.target_muscles,
          safetyNotes: item.safety_notes,
          formCues: item.form_cues,
        }));
      }
    } catch (err) {
      console.warn('Using default exercise catalog offline:', err);
    }
    return [];
  },
};
