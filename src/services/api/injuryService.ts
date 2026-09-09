import { apiClient } from './client';

export interface ExerciseClearance {
  name: string;
  target: string;
  status: 'SAFE' | 'CAUTION' | 'BLOCK';
  reason: string;
  alternative?: string;
  benefit?: string;
}

export interface InjuryAnalyzeInput {
  body_part: string;
  pain_level: number;
  pain_description?: string;
  recent_injury?: string;
  goal?: string;
}

export interface InjuryAnalyzeResponse {
  caution_level: 'low' | 'moderate' | 'high';
  avoid_or_modify: string[];
  lower_impact_alternatives: string[];
  general_recommendations: string[];
  medical_disclaimer: string;
  body_part?: string;
  pain_level?: number;
  goal?: string;
  exercise_clearances: ExerciseClearance[];
}

export interface InjuryProfileInput {
  body_part: string;
  body_parts?: string[];
  pain_level: number;
  pain_description?: string;
  recent_injury?: string;
  goal?: string;
}

export interface InjuryProfileResponse {
  id: string;
  user_id: string;
  body_part: string;
  body_parts: string[];
  pain_level: number;
  pain_description?: string;
  recent_injury?: string;
  goal?: string;
  caution_level: string;
  analysis: InjuryAnalyzeResponse;
  created_at: string;
  updated_at: string;
}

export const InjuryService = {
  /**
   * POST /api/v1/injury/analyze
   * Evaluate biomechanical safety, restrictions, and lower-impact alternatives
   */
  async analyzeInjury(input: InjuryAnalyzeInput): Promise<InjuryAnalyzeResponse> {
    try {
      return await apiClient.post<InjuryAnalyzeResponse>('/injury/analyze', input);
    } catch (err) {
      console.warn('InjuryService.analyzeInjury failed, using client fallback:', err);
    }

    // Client fallback
    const isHigh = input.pain_level >= 7;
    return {
      caution_level: isHigh ? 'high' : input.pain_level >= 4 ? 'moderate' : 'low',
      avoid_or_modify: isHigh
        ? ['Heavy Compound Squats', 'Dynamic Lunges', 'High-Impact Jumping']
        : ['Full-depth movements'],
      lower_impact_alternatives: ['High Box Squat', 'Supported Glute Bridge', 'Swimming'],
      general_recommendations: isHigh
        ? [
            'Immediately discontinue high-load and impact exercises.',
            'CRITICAL: High pain requires clinical evaluation by a medical doctor or physical therapist.',
          ]
        : ['Perform light mobility and stay within pain-free ranges.'],
      medical_disclaimer:
        'FitVerse Injury Prevention Coach provides general fitness guidance and exercise modifications for educational purposes only. It is not a medical device or diagnosis.',
      body_part: input.body_part,
      pain_level: input.pain_level,
      goal: input.goal,
      exercise_clearances: [],
    };
  },

  /**
   * POST /api/v1/injury/profile
   * Save user injury concern to backend profile
   */
  async saveInjuryProfile(input: InjuryProfileInput): Promise<InjuryProfileResponse | null> {
    try {
      return await apiClient.post<InjuryProfileResponse>('/injury/profile', input);
    } catch (err) {
      console.warn('InjuryService.saveInjuryProfile failed:', err);
      return null;
    }
  },

  /**
   * GET /api/v1/injury/recommendations
   * Fetch active injury precautions and workout recommendations
   */
  async getRecommendations(params?: {
    body_part?: string;
    pain_level?: number;
    goal?: string;
  }): Promise<InjuryAnalyzeResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.body_part) query.append('body_part', params.body_part);
      if (params?.pain_level !== undefined) query.append('pain_level', params.pain_level.toString());
      if (params?.goal) query.append('goal', params.goal);

      const qs = query.toString();
      return await apiClient.get<InjuryAnalyzeResponse>(`/injury/recommendations${qs ? `?${qs}` : ''}`);
    } catch (err) {
      console.warn('InjuryService.getRecommendations failed:', err);
    }

    return this.analyzeInjury({
      body_part: params?.body_part || 'knee',
      pain_level: params?.pain_level ?? 4,
      goal: params?.goal || 'general_fitness',
    });
  },
};
