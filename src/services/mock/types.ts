export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  streakDays: number;
  streakActiveToday: boolean;
  fitnessGoal: 'hypertrophy' | 'fat_loss' | 'athleticism' | 'endurance' | 'mobility';
  activityLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  safetyRestrictions: string[];
  email?: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  selectedGoal?: string;
  streak?: number;
  stats: {
    totalWorkouts: number;
    totalReps: number;
    avgFormScore: number;
    hoursTrained: number;
    caloriesBurned: number;
  };
}

export interface Exercise {
  id: string;
  name: string;
  category: 'Legs' | 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetReps: number;
  targetSets: number;
  caloriesEst: number;
  durationMin: number;
  thumbnailUrl: string;
  safetyNotes: string[];
  formCues: string[];
  musclesTargeted: string[];
  aiPoseKeypoints: string[];
}

export interface WorkoutSummary {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  totalReps: number;
  durationSeconds: number;
  formScore: number;
  xpEarned: number;
  coinsEarned: number;
  accuracyBreakdown: {
    depth: number;
    tempo: number;
    alignment: number;
  };
  feedbackHighlights: string[];
  muscleGroups: string[];
}

export interface SafetyScreeningResult {
  status: 'SAFE' | 'CAUTION' | 'BLOCK';
  affectedBodyParts: string[];
  painLevel: 'mild' | 'moderate' | 'severe';
  painType: string;
  assessmentReason: string;
  restrictedExercises: string[];
  recommendedAlternatives: {
    originalExercise: string;
    alternativeExercise: string;
    reason: string;
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rewardXp: number;
  rewardCoins: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  previousRank: number;
  name: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
  dailyXp?: number;
  challengeScore?: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'friend';
  category: string;
  rewardXp: number;
  rewardCoins: number;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  joined: boolean;
  completed: boolean;
  expiresInHours: number;
  participantsCount: number;
  badgeIcon: string;
}

export interface TransformationPrediction {
  currentMetrics: {
    weightKg: number;
    bodyFatPct: number;
    muscleMassKg: number;
  };
  timeframes: {
    days: 30 | 60 | 90 | 180;
    projectedWeightKg: number;
    projectedBodyFatPct: number;
    projectedMuscleMassKg: number;
    confidenceScore: number;
    visualMilestone: string;
    keyBenefits: string[];
  }[];
  disclaimer: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'workout_reminder' | 'streak_reminder' | 'challenge_reminder' | 'achievement' | 'weekly_progress' | 'streak' | 'challenge' | 'reward' | 'coach';
}
