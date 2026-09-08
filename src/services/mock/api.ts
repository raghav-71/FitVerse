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
import { API_CONFIG } from '../api/config';

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let userState: UserProfile = { ...MOCK_USER };
let exercisesState: Exercise[] = [...MOCK_EXERCISES];
let achievementsState: Achievement[] = [...MOCK_ACHIEVEMENTS];
let leaderboardState: LeaderboardUser[] = [...MOCK_LEADERBOARD];
let challengesState: Challenge[] = [...MOCK_CHALLENGES];
let notificationsState: AppNotification[] = [...MOCK_NOTIFICATIONS];

export const MockApi = {
  // Auth & Profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_CONFIG.getApiV1Url()}/user/profile`);
      if (res.ok) {
        const data = await res.json();
        userState = {
          ...userState,
          id: data.id || userState.id,
          name: data.name || userState.name,
          email: data.email || userState.email,
          age: data.age ?? userState.age,
          gender: data.gender || userState.gender,
          heightCm: data.height_cm ?? userState.heightCm,
          weightKg: data.weight_kg ?? userState.weightKg,
          selectedGoal: data.selected_goal || userState.selectedGoal,
          activityLevel: data.activity_level || userState.activityLevel,
          streak: data.current_streak ?? userState.streak,
          xp: data.xp ?? userState.xp,
          coins: data.coins ?? userState.coins,
          level: data.level ?? userState.level,
        };
        return { ...userState };
      }
    } catch {
      // Graceful offline fallback
    }
    await delay(150);
    return { ...userState };
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    userState = { ...userState, ...updates };
    try {
      await fetch(`${API_CONFIG.getApiV1Url()}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          age: updates.age,
          weight_kg: updates.weightKg,
          height_cm: updates.heightCm,
          selected_goal: updates.selectedGoal,
          activity_level: updates.activityLevel,
        }),
      });
    } catch {
      // Graceful offline fallback
    }
    return { ...userState };
  },

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    await delay(300);
    return [...exercisesState];
  },

  async getExerciseById(id: string): Promise<Exercise | undefined> {
    await delay(200);
    return exercisesState.find((e) => e.id === id);
  },

  // Workout Session & Completion
  async submitWorkout(summary: Omit<WorkoutSummary, 'id' | 'date'>): Promise<WorkoutSummary> {
    await delay(450);
    const newSummary: WorkoutSummary = {
      ...summary,
      id: `wrk_${Date.now()}`,
      date: 'Just now',
    };

    // Update user gamification & stats optimistically
    userState.xp += summary.xpEarned;
    userState.coins += summary.coinsEarned;
    userState.stats.totalWorkouts += 1;
    userState.stats.totalReps += summary.totalReps;
    userState.streakActiveToday = true;

    // Check level up (e.g. 1000 XP per level)
    if (userState.xp >= userState.xpToNextLevel) {
      userState.level += 1;
      userState.xpToNextLevel += 1500;
    }

    return newSummary;
  },

  // Injury & Safety Screening
  async screenSafety(bodyParts: string[], painType: string, painLevel: 'mild' | 'moderate' | 'severe'): Promise<SafetyScreeningResult> {
    await delay(400);
    const hasKnee = bodyParts.some((p) => p.toLowerCase().includes('knee'));
    const hasBack = bodyParts.some((p) => p.toLowerCase().includes('back'));
    const hasShoulder = bodyParts.some((p) => p.toLowerCase().includes('shoulder'));

    let status: 'SAFE' | 'CAUTION' | 'BLOCK' = 'SAFE';
    let assessmentReason = 'Musculoskeletal alignment is optimal for high-intensity training.';
    let restrictedExercises: string[] = [];
    const alternatives: SafetyScreeningResult['recommendedAlternatives'] = [];

    if (painLevel === 'severe' || bodyParts.length >= 3) {
      status = 'BLOCK';
      assessmentReason = 'Multiple severe stress signals detected. Heavy spinal loading and explosive plyometrics are temporarily locked for injury prevention.';
      restrictedExercises = ['Barbell Squat', 'Romanian Deadlift', 'Dynamic Lunges'];
      alternatives.push(
        { originalExercise: 'Barbell Squat', alternativeExercise: 'Supported Glute Bridge', reason: 'Zero axial spine compression with target glute recruitment' },
        { originalExercise: 'Roman Deadlift', alternativeExercise: 'Seated Hamstring Slider', reason: 'Guards lumbar spine while strengthening posterior chain' }
      );
    } else if (hasKnee || hasBack || hasShoulder || painLevel === 'moderate') {
      status = 'CAUTION';
      assessmentReason = `Mild strain reported on ${bodyParts.join(', ')}. AI Real-time Form Guard will enforce slower tempo and 10% reduced range of motion.`;
      if (hasKnee) {
        restrictedExercises.push('Dynamic Lunges');
        alternatives.push({ originalExercise: 'Dynamic Lunges', alternativeExercise: 'High Box Squat', reason: 'Relieves patellar tendon shear stress' });
      }
      if (hasBack) {
        restrictedExercises.push('Romanian Deadlift');
        alternatives.push({ originalExercise: 'Romanian Deadlift', alternativeExercise: 'Chest Supported Dumbbell Row', reason: 'Zero lower back load' });
      }
    }

    return {
      status,
      affectedBodyParts: bodyParts,
      painLevel,
      painType,
      assessmentReason,
      restrictedExercises,
      recommendedAlternatives: alternatives,
    };
  },

  // Gamification & Leaderboard
  async getGamificationProfile() {
    await delay(250);
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
    await delay(300);
    return [...achievementsState];
  },

  async getLeaderboard(): Promise<LeaderboardUser[]> {
    await delay(350);
    return [...leaderboardState];
  },

  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    await delay(300);
    return [...challengesState];
  },

  async toggleJoinChallenge(challengeId: string): Promise<Challenge> {
    await delay(300);
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
    await delay(350);
    return { ...MOCK_TRANSFORMATION };
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    await delay(200);
    return [...notificationsState];
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(150);
    const n = notificationsState.find((item) => item.id === id);
    if (n) n.read = true;
  },
};
