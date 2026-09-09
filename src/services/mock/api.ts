import {
  UserProfile,
  Exercise,
  WorkoutSummary,
  SafetyScreeningResult,
  Achievement,
  LeaderboardUser,
  Challenge,
  TransformationPrediction,
  AppNotification,
} from './types';
import {
  MOCK_USER,
  MOCK_EXERCISES,
  MOCK_ACHIEVEMENTS,
  MOCK_LEADERBOARD,
  MOCK_CHALLENGES,
  MOCK_TRANSFORMATION,
  MOCK_NOTIFICATIONS,
} from './data';
import { apiClient } from '../api/client';
import { UserApi } from '../api/user';
import { WorkoutApi } from '../api/workout';
import { GamificationApi } from '../api/gamification';
import { InjuryApi } from '../api/injury';

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let userState: UserProfile = { ...MOCK_USER };
let exercisesState: Exercise[] = [...MOCK_EXERCISES];
let achievementsState: Achievement[] = [...MOCK_ACHIEVEMENTS];
let leaderboardState: LeaderboardUser[] = [...MOCK_LEADERBOARD];
let challengesState: Challenge[] = [...MOCK_CHALLENGES];
let notificationsState: AppNotification[] = [...MOCK_NOTIFICATIONS];

export const MockApi = {
  // Auth & Profile - Live Backend Connection with Fallback
  async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await UserApi.getProfile();
      if (data) {
        userState = {
          ...userState,
          id: data.id || userState.id,
          name: data.full_name || userState.name,
          email: data.email || userState.email,
          age: data.age ?? userState.age,
          gender: (data.gender as any) || userState.gender,
          heightCm: data.height_cm ?? userState.heightCm,
          weightKg: data.weight_kg ?? userState.weightKg,
          selectedGoal: (data.selected_goal as any) || userState.selectedGoal,
          activityLevel: (data.activity_level as any) || userState.activityLevel,
          streak: data.current_streak ?? userState.streak,
          streakDays: data.current_streak ?? userState.streakDays,
          xp: data.xp ?? userState.xp,
          coins: data.coins ?? userState.coins,
          level: data.level ?? userState.level,
        };
        return { ...userState };
      }
    } catch {
      // Graceful offline fallback
    }
    await delay(100);
    return { ...userState };
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    userState = { ...userState, ...updates };
    try {
      await UserApi.updateProfile({
        full_name: updates.name,
        age: updates.age,
        weight_kg: updates.weightKg,
        height_cm: updates.heightCm,
        selected_goal: updates.selectedGoal,
        activity_level: updates.activityLevel,
      });
    } catch {
      // Graceful offline fallback
    }
    return { ...userState };
  },

  // Exercises - Live Catalog from Backend with Fallback
  async getExercises(): Promise<Exercise[]> {
    try {
      const catalog = await WorkoutApi.getCatalog();
      if (catalog && catalog.length > 0) {
        return catalog.map((c: any) => ({
          id: c.id,
          name: c.name,
          category: (c.category?.toLowerCase().includes('leg') ? 'Legs' : c.category?.toLowerCase().includes('chest') ? 'Chest' : 'Core') as any,
          difficulty: (c.difficulty === 'Easy' ? 'Beginner' : c.difficulty === 'Hard' ? 'Advanced' : 'Intermediate') as any,
          targetReps: c.target_reps || 12,
          targetSets: c.target_sets || 3,
          durationMin: 3,
          caloriesEst: c.calories_estimate || 45,
          musclesTargeted: c.target_muscles || ['Full Body'],
          safetyNotes: c.safety_notes || [],
          formCues: c.form_cues || [],
          aiPoseKeypoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
          thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
        }));
      }
    } catch {
      // Fallback
    }
    await delay(200);
    return [...exercisesState];
  },

  async getExerciseById(id: string): Promise<Exercise | undefined> {
    const list = await this.getExercises();
    return list.find((e) => e.id === id);
  },

  // Workout Session & Completion
  async submitWorkout(summary: Omit<WorkoutSummary, 'id' | 'date'>): Promise<WorkoutSummary> {
    const newSummary: WorkoutSummary = {
      ...summary,
      id: `wrk_${Date.now()}`,
      date: 'Just now',
    };

    try {
      await WorkoutApi.completeSession({
        session_id: newSummary.id,
        workout_name: summary.exerciseName,
        duration_seconds: summary.durationSeconds,
        duration_minutes: +(summary.durationSeconds / 60).toFixed(1),
        calories_burned: Math.round(summary.totalReps * 4),
        form_score: summary.formScore,
      });
    } catch {
      // Fallback optimistic update
    }

    userState.xp += summary.xpEarned;
    userState.coins += summary.coinsEarned;
    userState.stats.totalWorkouts += 1;
    userState.stats.totalReps += summary.totalReps;
    userState.streakActiveToday = true;

    return newSummary;
  },

  // Injury & Safety Screening - Live Backend Intelligence
  async screenSafety(bodyParts: string[], painType: string, painLevel: 'mild' | 'moderate' | 'severe'): Promise<SafetyScreeningResult> {
    try {
      const primaryPart = (bodyParts[0] || 'knee').toLowerCase();
      const numLevel = painLevel === 'severe' ? 8 : painLevel === 'moderate' ? 5 : 2;
      const res = await InjuryApi.analyzeInjury({
        body_part: primaryPart,
        pain_level: numLevel,
      });

      return {
        status: res.caution_level === 'high' ? 'BLOCK' : res.caution_level === 'moderate' ? 'CAUTION' : 'SAFE',
        affectedBodyParts: bodyParts,
        painLevel,
        painType,
        assessmentReason: res.general_recommendations[0] || 'Kinetic chain screened.',
        restrictedExercises: res.avoid_or_modify,
        recommendedAlternatives: res.exercise_clearances.map((c) => ({
          originalExercise: c.name,
          alternativeExercise: c.alternative || 'Low Box Squat',
          reason: c.reason,
        })),
      };
    } catch {
      // Offline fallback
    }

    await delay(200);
    return {
      status: painLevel === 'severe' ? 'BLOCK' : 'SAFE',
      affectedBodyParts: bodyParts,
      painLevel,
      painType,
      assessmentReason: 'Screened offline.',
      restrictedExercises: [],
      recommendedAlternatives: [],
    };
  },

  // Gamification & Leaderboard - Live Backend Connection
  async getGamificationProfile() {
    try {
      const profile = await GamificationApi.getProfile();
      if (profile) {
        return {
          xp: profile.xp,
          xpToNextLevel: profile.xp_to_next_level ?? 400,
          level: profile.level,
          coins: profile.coins,
          streakDays: profile.current_streak,
          streakActiveToday: profile.streak_criteria?.streak_eligible ?? true,
        };
      }
    } catch {
      // Fallback
    }
    await delay(150);
    return {
      xp: userState.xp,
      xpToNextLevel: userState.xpToNextLevel,
      level: userState.level,
      coins: userState.coins,
      streakDays: userState.streakDays,
      streakActiveToday: userState.streakActiveToday,
    };
  },

  async getAchievements(): Promise<Achievement[]> {
    await delay(200);
    return [...achievementsState];
  },

  async getLeaderboard(): Promise<LeaderboardUser[]> {
    try {
      const res = await GamificationApi.getLeaderboard('weekly', 'national');
      const entries = res?.rankings || res?.entries;
      if (entries && entries.length > 0) {
        return entries.map((e: any) => ({
          rank: e.rank,
          previousRank: e.previous_rank ?? e.rank,
          id: e.user_id,
          name: e.name,
          avatarUrl: e.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          xp: e.score ?? e.xp ?? 0,
          level: Math.max(1, Math.floor((e.score ?? e.xp ?? 0) / 400)),
          streak: 5,
          badge: e.badge,
          isCurrentUser: e.is_current_user ?? false,
        }));
      }
    } catch {
      // Fallback
    }
    await delay(200);
    return [...leaderboardState];
  },

  // Challenges - Live Backend Connection
  async getChallenges(): Promise<Challenge[]> {
    try {
      const backendList = await GamificationApi.getChallenges();
      if (backendList && backendList.length > 0) {
        return backendList.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          type: (b.category || 'daily') as any,
          category: (b.category || 'daily').toUpperCase(),
          rewardXp: b.reward_xp ?? b.xp_reward ?? 100,
          rewardCoins: b.reward_coins ?? b.coins_reward ?? 20,
          currentProgress: b.current_progress ?? b.current_value ?? 0,
          targetProgress: b.target_value ?? 100,
          unit: b.id.includes('water') ? 'ml' : b.id.includes('squat') ? 'reps' : b.id.includes('protein') ? 'g' : 'days',
          joined: b.joined ?? true,
          completed: b.completed ?? false,
          expiresInHours: b.category === 'daily' ? 14 : 96,
          participantsCount: 1420,
          badgeIcon: b.id.includes('squat') ? 'ShieldCheck' : b.id.includes('water') ? 'Zap' : 'Flame',
        }));
      }
    } catch {
      // Fallback
    }
    await delay(200);
    return [...challengesState];
  },

  async toggleJoinChallenge(challengeId: string): Promise<Challenge> {
    const challenge = challengesState.find((c) => c.id === challengeId);
    if (challenge) {
      challenge.joined = !challenge.joined;
      challenge.participantsCount += challenge.joined ? 1 : -1;
      return { ...challenge };
    }
    throw new Error('Challenge not found');
  },

  // Transformation Predictor
  async getTransformationPrediction(): Promise<TransformationPrediction> {
    try {
      const weight = userState.weightKg ?? 75.8;
      const res = await apiClient.post<any>('/progress/transformation-predict', {
        weight_kg: weight,
        target_weight_kg: weight - 4,
        goal: userState.selectedGoal || 'muscle_gain',
      });
      if (res && res.timeframes) {
        return res;
      }
    } catch {
      // Fallback
    }
    await delay(200);
    return { ...MOCK_TRANSFORMATION };
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    await delay(150);
    return [...notificationsState];
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
    const n = notificationsState.find((item) => item.id === id);
    if (n) n.read = true;
  },
};
