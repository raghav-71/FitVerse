import { create } from 'zustand';
import { apiClient } from '../services/api/client';
import { AuthApi } from '../services/api/auth';
import { UserApi } from '../services/api/user';
import { InjuryApi } from '../services/api/injury';

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

const STORAGE_KEYS = {
  HAS_ONBOARDED: 'fitverse_has_completed_onboarding',
  USER_GOAL: 'fitverse_selected_goal',
  USER_PROFILE: 'fitverse_cached_user',
};

const getStoredBool = (key: string): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) === 'true';
    }
  } catch {}
  return false;
};

const setStoredBool = (key: string, val: boolean) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val ? 'true' : 'false');
    }
  } catch {}
};

const getStoredString = (key: string, fallback: string): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val) return val;
    }
  } catch {}
  return fallback;
};

const setStoredString = (key: string, val: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch {}
};

export const normalizeGoalName = (goal?: string): 'Fat Loss' | 'Muscle Gain' | 'Maintenance' | 'General Fitness' => {
  if (!goal) return 'General Fitness';
  const g = goal.toLowerCase();
  if (g.includes('muscle') || g.includes('gain') || g.includes('hypertrophy') || g.includes('build')) {
    return 'Muscle Gain';
  }
  if (g.includes('fat') || g.includes('loss') || g.includes('lose') || g.includes('lean') || g.includes('weight loss')) {
    return 'Fat Loss';
  }
  if (g.includes('maintain') || g.includes('maintenance')) {
    return 'Maintenance';
  }
  return 'General Fitness';
};

export const calculateNutritionTargets = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string
) => {
  // Mifflin-St Jeor equation
  const isFemale = (gender || '').toLowerCase() === 'female';
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * (age || 26) + (isFemale ? -161 : 5);

  let multiplier = 1.55; // default moderate
  const act = (activityLevel || '').toLowerCase();
  if (act.includes('sedentary')) multiplier = 1.2;
  else if (act.includes('light')) multiplier = 1.375;
  else if (act.includes('moderate')) multiplier = 1.55;
  else if (act.includes('very') || act.includes('heavy') || act.includes('athlete')) multiplier = 1.725;

  const tdee = Math.round(bmr * multiplier);

  let calories = tdee;
  let proteinRatio = 2.0; // g per kg
  const g = (goal || '').toLowerCase();
  if (g.includes('muscle') || g.includes('hypertrophy') || g.includes('gain')) {
    calories = tdee + 350;
    proteinRatio = 2.2;
  } else if (g.includes('fat') || g.includes('loss') || g.includes('lose') || g.includes('lean')) {
    calories = Math.max(1400, tdee - 450);
    proteinRatio = 2.3;
  } else if (g.includes('endurance') || g.includes('stamina')) {
    calories = tdee + 150;
    proteinRatio = 1.8;
  } else {
    calories = tdee;
    proteinRatio = 1.9;
  }

  const proteinG = Math.round(weightKg * proteinRatio);
  const fatCalories = calories * 0.25;
  const fatG = Math.round(fatCalories / 9);
  const remainingCalories = calories - (proteinG * 4 + fatCalories);
  const carbsG = Math.max(50, Math.round(remainingCalories / 4));
  const waterGlasses = Math.min(16, Math.max(8, Math.round((weightKg * 35) / 250)));

  return {
    bmr: Math.round(bmr),
    tdee,
    calories,
    proteinG,
    carbsG,
    fatG,
    waterGlasses,
  };
};

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
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  dietPreference: string;
  isLeaderboardPublic: boolean;
  isDataSharingEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  selectedPainAreas: string[];
  painLevel: 'mild' | 'moderate' | 'severe';
  safetyConditions: Record<string, 'no_pain' | 'previous_injury' | 'current_discomfort'>;
  isNewUser: boolean;
  login: (email?: string, name?: string) => Promise<void> | void;
  register: (name: string, email: string) => Promise<void> | void;
  logout: () => void;
  completeOnboarding: () => void;
  setOnboarding: (status: boolean) => void;
  setHasSeenSlides: (seen: boolean) => void;
  setGoal: (goal: string) => void;
  setActivityLevel: (level: string) => void;
  updateProfileDetails: (details: Partial<{
    name: string;
    age: number;
    gender: string;
    selectedGoal: string;
    activityLevel: string;
    experienceLevel: string;
    equipmentPreferences: string[];
    heightCm: number;
    weightKg: number;
    targetWeightKg: number;
    dietPreference: string;
  }>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<{ isLeaderboardPublic: boolean; isDataSharingEnabled: boolean }>) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  togglePainArea: (area: string) => void;
  setSafetyCondition: (area: string, condition: 'no_pain' | 'previous_injury' | 'current_discomfort') => void;
  setPainSelection: (areas: string[], level: any, notes?: any) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: getStoredBool(STORAGE_KEYS.HAS_ONBOARDED),
  isOnboarded: getStoredBool(STORAGE_KEYS.HAS_ONBOARDED),
  hasSeenSlides: false,
  isNewUser: false,
  user: null,
  selectedGoal: getStoredString(STORAGE_KEYS.USER_GOAL, 'Build Muscle'),
  activityLevel: 'Moderately Active',
  experienceLevel: 'Intermediate',
  equipmentPreferences: ['Dumbbells', 'Barbell', 'Resistance Bands'],
  age: 26,
  gender: 'Male',
  heightCm: 178,
  weightKg: 75.8,
  targetWeightKg: 72.0,
  dietPreference: 'Vegetarian',
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

  login: async (email, name) => {
    const userEmail = email || 'athlete@fitverse.ai';
    const userName = name || 'Aryan Sharma';

    // Returning users are marked as completed onboarding to bypass repeated goal asks
    setStoredBool(STORAGE_KEYS.HAS_ONBOARDED, true);

    // Immediate optimistic state update
    set({
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      isOnboarded: true,
      isNewUser: false,
      user: {
        id: 'usr_001',
        name: userName,
        email: userEmail,
        age: 26,
        gender: 'Male',
        heightCm: 178,
        weightKg: 75.8,
      },
    });

    try {
      const res = await AuthApi.login({ email: userEmail, password: 'password123' });
      if (res?.access_token) {
        apiClient.setAuthToken(res.access_token);
        // Query server profile to restore existing goals and metrics
        try {
          const profile = await UserApi.getProfile();
          if (profile) {
            if (profile.selected_goal) {
              set({ selectedGoal: profile.selected_goal });
              setStoredString(STORAGE_KEYS.USER_GOAL, profile.selected_goal);
            }
            set((state) => ({
              hasCompletedOnboarding: true,
              isOnboarded: true,
              user: {
                ...state.user,
                id: profile.id || state.user?.id || 'usr_001',
                name: profile.full_name || (profile as any).name || state.user?.name || userName,
                email: profile.email || state.user?.email || userEmail,
                age: profile.age ?? state.age,
                gender: profile.gender ?? state.gender,
                heightCm: profile.height_cm ?? state.heightCm,
                weightKg: profile.weight_kg ?? state.weightKg,
              },
              age: profile.age ?? state.age,
              gender: profile.gender ?? state.gender,
              heightCm: profile.height_cm ?? state.heightCm,
              weightKg: profile.weight_kg ?? state.weightKg,
              targetWeightKg: profile.target_weight_kg ?? profile.target_weight ?? state.targetWeightKg,
              dietPreference: profile.diet_preference ?? state.dietPreference,
              selectedGoal: profile.selected_goal ?? state.selectedGoal,
              activityLevel: profile.activity_level ?? state.activityLevel,
              experienceLevel: profile.fitness_level ?? state.experienceLevel,
            }));
          }
        } catch {}
      }
    } catch {
      // Offline fallback: continue with local user session
    }
  },

  register: async (name, email) => {
    const userName = name || 'Aryan Sharma';
    const userEmail = email || 'athlete@fitverse.ai';

    set({
      isAuthenticated: true,
      hasCompletedOnboarding: false,
      isOnboarded: false,
      isNewUser: true,
      user: {
        id: `usr_${Date.now()}`,
        name: userName,
        email: userEmail,
      },
    });

    try {
      const res = await AuthApi.register({ name: userName, email: userEmail, password: 'password123' });
      if (res?.access_token) {
        apiClient.setAuthToken(res.access_token);
        if (res.user) {
          set({
            user: {
              id: res.user.id || `usr_${Date.now()}`,
              name: res.user.name || userName,
              email: res.user.email || userEmail,
            },
          });
        }
      }
    } catch {
      // Offline fallback
    }
  },

  logout: () => {
    apiClient.setAuthToken(null);
    setStoredBool(STORAGE_KEYS.HAS_ONBOARDED, false);
    set({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isOnboarded: false,
      isNewUser: false,
      user: null,
    });
  },

  completeOnboarding: () => {
    setStoredBool(STORAGE_KEYS.HAS_ONBOARDED, true);
    const goal = get().selectedGoal;
    if (goal) setStoredString(STORAGE_KEYS.USER_GOAL, goal);
    set({
      hasCompletedOnboarding: true,
      isOnboarded: true,
    });

    // Sync onboarding preferences to backend
    UserApi.updateProfile({
      selected_goal: goal,
      activity_level: get().activityLevel,
      fitness_level: get().experienceLevel,
      experience_level: get().experienceLevel,
      height_cm: get().heightCm,
      weight_kg: get().weightKg,
      target_weight_kg: get().targetWeightKg,
      diet_preference: get().dietPreference,
    }).catch(() => {});
  },

  setOnboarding: (status: boolean) => {
    setStoredBool(STORAGE_KEYS.HAS_ONBOARDED, status);
    set({
      hasCompletedOnboarding: status,
      isOnboarded: status,
    });
  },

  setHasSeenSlides: (seen: boolean) => set({ hasSeenSlides: seen }),
  setGoal: (goal: string) => {
    setStoredString(STORAGE_KEYS.USER_GOAL, goal);
    set({ selectedGoal: goal });
  },
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

  updateProfileDetails: async (details) => {
    // 1. Optimistic store update
    set((state) => ({
      ...state,
      ...details,
      user: state.user
        ? {
            ...state.user,
            name: details.name ?? state.user.name,
            age: details.age ?? state.user.age ?? state.age,
            gender: details.gender ?? state.user.gender ?? state.gender,
            heightCm: details.heightCm ?? state.user.heightCm ?? state.heightCm,
            weightKg: details.weightKg ?? state.user.weightKg ?? state.weightKg,
          }
        : null,
      selectedGoal: details.selectedGoal ?? state.selectedGoal,
      activityLevel: details.activityLevel ?? state.activityLevel,
      experienceLevel: details.experienceLevel ?? state.experienceLevel,
      equipmentPreferences: details.equipmentPreferences ?? state.equipmentPreferences,
      heightCm: details.heightCm ?? state.heightCm,
      weightKg: details.weightKg ?? state.weightKg,
      age: details.age ?? state.age,
      gender: details.gender ?? state.gender,
      targetWeightKg: details.targetWeightKg ?? state.targetWeightKg,
      dietPreference: details.dietPreference ?? state.dietPreference,
    }));

    const currentState = get();
    if (details.selectedGoal) {
      setStoredString(STORAGE_KEYS.USER_GOAL, details.selectedGoal);
    }

    // 2. Recalculate daily calorie and macro targets immediately
    const newTargets = calculateNutritionTargets(
      currentState.weightKg,
      currentState.heightCm,
      currentState.age,
      currentState.gender,
      currentState.activityLevel,
      currentState.selectedGoal
    );

    // Sync targets with dietStore and dailyActivityStore
    try {
      const dietStore = (await import('./dietStore')).useDietStore;
      dietStore.setState({
        calorieTarget: newTargets.calories,
        proteinTarget: newTargets.proteinG,
        carbsTarget: newTargets.carbsG,
        fatTarget: newTargets.fatG,
        waterTarget: newTargets.waterGlasses,
        bmr: newTargets.bmr,
        tdee: newTargets.tdee,
      });

      const activityStore = (await import('./dailyActivityStore')).useDailyActivityStore;
      activityStore.setState({
        currentWeight: currentState.weightKg,
        targetWeight: currentState.targetWeightKg,
        maxGlasses: newTargets.waterGlasses,
      });
    } catch {}

    // 3. Sync with backend API
    try {
      await UserApi.updateProfile({
        name: details.name,
        age: currentState.age,
        gender: currentState.gender,
        height_cm: currentState.heightCm,
        weight_kg: currentState.weightKg,
        target_weight: currentState.targetWeightKg,
        target_weight_kg: currentState.targetWeightKg,
        diet_preference: currentState.dietPreference,
        selected_goal: currentState.selectedGoal,
        activity_level: currentState.activityLevel,
        fitness_level: currentState.experienceLevel,
        experience_level: currentState.experienceLevel,
      });
    } catch {}
  },

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

  setPainSelection: (areas: string[], level: any, notes?: any) => {
    set({ selectedPainAreas: areas, painLevel: level });
    if (areas.length > 0) {
      const painMap: Record<string, number> = { mild: 3, moderate: 6, severe: 9 };
      const numericPain = typeof level === 'number' ? level : (painMap[level] || 4);
      InjuryApi.saveProfile({
        body_part: areas[0],
        pain_level: numericPain,
        pain_description: typeof notes === 'string' ? notes : `Reported pain in ${areas.join(', ')}`,
      }).catch(() => {});
    }
  },
}));
