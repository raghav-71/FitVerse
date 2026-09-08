import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
}

export interface NotificationPreferences {
  workoutReminders: boolean;
  streakReminders: boolean;
  challengeReminders: boolean;
  achievements: boolean;
  weeklyProgress: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isOnboarded: boolean;
  hasSeenSlides: boolean;
  user: User | null;
  selectedGoal: string;
  activityLevel: string;
  experienceLevel: string;
  equipmentPreferences: string[];
  heightCm: number;
  weightKg: number;
  isLeaderboardPublic: boolean;
  isDataSharingEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  selectedPainAreas: string[];
  painLevel: 'mild' | 'moderate' | 'severe';
  safetyConditions: Record<string, 'no_pain' | 'previous_injury' | 'current_discomfort'>;
  isNewUser: boolean;
  login: (email?: string, name?: string) => void;
  register: (name: string, email: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  setOnboarding: (status: boolean) => void;
  setHasSeenSlides: (seen: boolean) => void;
  setGoal: (goal: string) => void;
  setActivityLevel: (level: string) => void;
  updateProfileDetails: (details: Partial<{
    selectedGoal: string;
    activityLevel: string;
    experienceLevel: string;
    equipmentPreferences: string[];
    heightCm: number;
    weightKg: number;
  }>) => void;
  updatePrivacySettings: (settings: Partial<{ isLeaderboardPublic: boolean; isDataSharingEnabled: boolean }>) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  togglePainArea: (area: string) => void;
  setSafetyCondition: (area: string, condition: 'no_pain' | 'previous_injury' | 'current_discomfort') => void;
  setPainSelection: (areas: string[], level: any, notes?: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isOnboarded: false,
  hasSeenSlides: false,
  isNewUser: false,
  user: null,
  selectedGoal: 'Build Muscle',
  activityLevel: 'Moderately Active',
  experienceLevel: 'Intermediate',
  equipmentPreferences: ['Dumbbells', 'Barbell', 'Resistance Bands'],
  heightCm: 178,
  weightKg: 75.8,
  isLeaderboardPublic: true,
  isDataSharingEnabled: true,
  notificationPreferences: {
    workoutReminders: true,
    streakReminders: true,
    challengeReminders: true,
    achievements: true,
    weeklyProgress: true,
  },
  selectedPainAreas: [],
  painLevel: 'mild',
  safetyConditions: {},

  login: (email, name) =>
    set({
      isAuthenticated: true,
      isNewUser: false,
      user: {
        id: 'usr_001',
        name: name || 'Aryan Sharma',
        email: email || 'athlete@fitverse.ai',
      },
    }),

  register: (name, email) =>
    set({
      isAuthenticated: true,
      hasCompletedOnboarding: false,
      isNewUser: true,
      user: {
        id: `usr_${Date.now()}`,
        name: name || 'Aryan Sharma',
        email: email || 'athlete@fitverse.ai',
      },
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isOnboarded: false,
      isNewUser: false,
      user: null,
    }),

  completeOnboarding: () =>
    set({
      hasCompletedOnboarding: true,
      isOnboarded: true,
    }),

  setOnboarding: (status: boolean) =>
    set({
      hasCompletedOnboarding: status,
      isOnboarded: status,
    }),

  setHasSeenSlides: (seen: boolean) => set({ hasSeenSlides: seen }),
  setGoal: (goal: string) => set({ selectedGoal: goal }),
  setActivityLevel: (level: string) => set({ activityLevel: level }),

  togglePainArea: (area: string) =>
    set((state) => {
      const exists = state.selectedPainAreas.includes(area);
      const updated = exists
        ? state.selectedPainAreas.filter((a) => a !== area)
        : [...state.selectedPainAreas, area];
      const newConditions = { ...state.safetyConditions };
      if (!exists && !newConditions[area]) {
        newConditions[area] = 'previous_injury';
      } else if (exists) {
        delete newConditions[area];
      }
      return { selectedPainAreas: updated, safetyConditions: newConditions };
    }),

  setSafetyCondition: (area, condition) =>
    set((state) => ({
      safetyConditions: {
        ...state.safetyConditions,
        [area]: condition,
      },
    })),

  updateProfileDetails: (details) =>
    set((state) => ({
      ...state,
      ...details,
    })),

  updatePrivacySettings: (settings) =>
    set((state) => ({
      ...state,
      ...settings,
    })),

  updateNotificationPreferences: (prefs) =>
    set((state) => ({
      ...state,
      notificationPreferences: {
        ...state.notificationPreferences,
        ...prefs,
      },
    })),

  setPainSelection: (areas: string[], level: any, notes?: any) =>
    set({ selectedPainAreas: areas, painLevel: level }),
}));
