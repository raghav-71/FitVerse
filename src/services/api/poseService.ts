import { apiClient } from './client';

export interface PoseSessionData {
  exercise: string;
  reps: number;
  duration_seconds: number;
  average_form_score: number;
  common_mistakes?: string[];
  feedback?: string[];
  joint_angles_summary?: Record<string, any>;
}

export interface PoseSessionResult {
  exercise: string;
  reps: number;
  average_form_score: number;
  common_mistakes: string[];
  feedback: string[];
}

export interface PoseHistorySession {
  id: string;
  exercise: string;
  reps: number;
  duration_seconds: number;
  average_form_score: number;
  common_mistakes: string[];
  feedback: string[];
  created_at: string;
}

export interface PoseHistoryData {
  total_sessions: number;
  average_overall_form_score: number;
  sessions: PoseHistorySession[];
}

export const PoseService = {
  /**
   * Save AI Pose Detection & Form Analysis Session
   * POST /api/v1/pose/session
   */
  async saveSession(session: PoseSessionData): Promise<PoseSessionResult | null> {
    try {
      return await apiClient.post<PoseSessionResult>('/pose/session', session);
    } catch (err) {
      console.warn('PoseService.saveSession failed, using offline fallback:', err);
    }

    // Graceful offline fallback
    return {
      exercise: session.exercise,
      reps: session.reps,
      average_form_score: session.average_form_score,
      common_mistakes: session.common_mistakes || ['Knees moving inward'],
      feedback: session.feedback || ['Keep your back straight'],
    };
  },

  /**
   * Retrieve Pose History
   * GET /api/v1/pose/history
   */
  async getHistory(): Promise<PoseHistoryData | null> {
    try {
      return await apiClient.get<PoseHistoryData>('/pose/history');
    } catch (err) {
      console.warn('PoseService.getHistory failed:', err);
      return null;
    }
  },
};
