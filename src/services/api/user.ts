import { apiClient } from './client';

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: string;
  activity_level?: string;
  selected_goal?: string;
  target_weight?: number;
  target_weight_kg?: number;
  diet_preference?: string;
  avatar_url?: string;
  xp?: number;
  coins?: number;
  level?: number;
  current_streak?: number;
  created_at?: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: string;
  experience_level?: string;
  activity_level?: string;
  selected_goal?: string;
  goal?: string;
  target_weight?: number;
  target_weight_kg?: number;
  diet_preference?: string;
  avatar_url?: string;
}

export const UserApi = {
  async getProfile(): Promise<UserProfileData> {
    return apiClient.get<UserProfileData>('/user/profile');
  },

  async updateProfile(updates: UserProfileUpdatePayload): Promise<UserProfileData> {
    const payload: UserProfileUpdatePayload = {
      ...updates,
      full_name: updates.full_name || updates.name,
      selected_goal: updates.selected_goal || updates.goal,
      fitness_level: updates.fitness_level || updates.experience_level,
    };
    return apiClient.put<UserProfileData>('/user/profile', payload);
  },
};
