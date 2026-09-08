/**
 * FitVerse AI - Mock Data
 * Realistic seed data for all domains required across Parts 1 through 7.
 */

export interface ExerciseItem {
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  targetMuscles: string[];
  targetReps?: number;
  durationMin?: number;
  calories?: number;
  instructions?: string[];
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  streakDays: number;
  fitnessGoal: string;
  activityLevel: string;
  safetyRestrictions: string[];
  stats: {
    totalWorkouts: number;
    totalReps: number;
    avgFormScore: number;
    hoursTrained: number;
    caloriesBurned: number;
  };
}

export interface WorkoutSessionSummary {
  id: string;
  exerciseName: string;
  date: string;
  repsCompleted: number;
  durationMinutes: number;
  avgFormScore: number;
  xpEarned: number;
  caloriesBurned: number;
  feedback: string;
}

export interface GamificationProfileData {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  rankTitle: string;
  nextMilestoneXp: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
  rewardXp: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarUrl: string;
  xp: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface ChallengeItem {
  id: string;
  title: string;
  type: 'daily' | 'weekly';
  description: string;
  progress: number;
  target: number;
  unit: string;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
}

export interface ProgressSummaryData {
  weeklyWorkouts: { day: string; count: number; completed: boolean }[];
  weightTrend: { date: string; weightKg: number }[];
  formAccuracyTrend: { date: string; score: number }[];
}

export interface TransformationPredictionData {
  timeframeDays: number; // 30, 60, 90, 180
  projectedWeightKg: number;
  projectedMuscleGainKg: number;
  projectedFatLossPercentage: number;
  confidenceScore: number;
  aiInsights: string;
}

export interface HomeDashboardData {
  programName: string;
  currentDay: number;
  totalProgramDays: number;
  hasUnreadNotifications: boolean;
  tonightPrep: {
    title: string;
    description: string;
    coachName: string;
    coachAvatar: string;
    coachTip: string;
  };
  weekTracker: {
    dayKey: string;
    dayLabel: string;
    completed: boolean;
    isToday: boolean;
  }[];
  aiRecommendation: {
    exerciseId: string;
    name: string;
    duration: string;
    calories: string;
    badge: string;
    targetDescription: string;
  };
}

export const mockHomeDashboard: HomeDashboardData = {
  programName: '6-Month Full Body Transformation',
  currentDay: 11,
  totalProgramDays: 180,
  hasUnreadNotifications: true,
  tonightPrep: {
    title: 'Pre-Hydration & Knee Foam Rolling',
    description: 'Prepare joint ligaments for tomorrow’s kinetic AI squats session.',
    coachName: 'Coach Vikram',
    coachAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    coachTip: 'Focus on 90° pelvic tilt during morning activation stretches to minimize patellar friction.',
  },
  weekTracker: [
    { dayKey: 'M', dayLabel: 'Mon', completed: true, isToday: false },
    { dayKey: 'T', dayLabel: 'Tue', completed: true, isToday: false },
    { dayKey: 'W', dayLabel: 'Wed', completed: true, isToday: false },
    { dayKey: 'T', dayLabel: 'Thu', completed: true, isToday: false },
    { dayKey: 'F', dayLabel: 'Fri', completed: true, isToday: false },
    { dayKey: 'S', dayLabel: 'Sat', completed: true, isToday: true },
    { dayKey: 'S', dayLabel: 'Sun', completed: false, isToday: false },
  ],
  aiRecommendation: {
    exerciseId: 'ex_squats',
    name: 'AI Barbell Squat',
    duration: '8 MIN',
    calories: '140 KCAL',
    badge: 'AI BIOMECHANIC MATCH',
    targetDescription: 'Targeting Quadriceps, Glutes & Core Stability with Zero Knee Valgus',
  },
};

// 1. User Profile
export const mockUserProfile: UserProfileData = {
  id: 'usr_001',
  name: 'Aryan Sharma',
  email: 'athlete@fitverse.ai',
  username: 'aryans_fit',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  level: 14,
  xp: 4820,
  xpToNextLevel: 6000,
  coins: 1450,
  streakDays: 18,
  fitnessGoal: 'Hypertrophy & Posture Correction',
  activityLevel: 'Intermediate',
  safetyRestrictions: ['Mild Right Patellar Tendonitis'],
  stats: {
    totalWorkouts: 42,
    totalReps: 1840,
    avgFormScore: 94.2,
    hoursTrained: 28.5,
    caloriesBurned: 14200,
  },
};

// 2. Exercises List (squat, push-up, jumping jack, lunges, plank)
export const mockExercises: ExerciseItem[] = [
  {
    id: 'ex_squats',
    name: 'AI Barbell Squat',
    difficulty: 'Intermediate',
    category: 'Lower Body',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    targetReps: 12,
    durationMin: 8,
    calories: 140,
    instructions: ['Keep chest lifted', 'Knees aligned with toes', 'Depth parallel to ground'],
  },
  {
    id: 'ex_pushups',
    name: 'AI Perfect Pushup',
    difficulty: 'Beginner',
    category: 'Chest & Arms',
    targetMuscles: ['Pectoralis Major', 'Triceps', 'Anterior Deltoids', 'Core'],
    targetReps: 15,
    durationMin: 6,
    calories: 95,
    instructions: ['Elbows at 45 degree angle', 'Core firmly engaged', 'Full chest-to-deck range'],
  },
  {
    id: 'ex_jumping_jacks',
    name: 'AI Dynamic Jumping Jacks',
    difficulty: 'Beginner',
    category: 'Cardio & Agility',
    targetMuscles: ['Calves', 'Deltoids', 'Core', 'Cardiovascular'],
    targetReps: 40,
    durationMin: 5,
    calories: 75,
    instructions: ['Soft landing on ball of feet', 'Full overhead arm clap', 'Maintain brisk tempo'],
  },
  {
    id: 'ex_lunges',
    name: 'AI Forward Lunges',
    difficulty: 'Intermediate',
    category: 'Lower Body',
    targetMuscles: ['Quadriceps', 'Glutes', 'Calves', 'Hip Stabilizers'],
    targetReps: 12,
    durationMin: 7,
    calories: 110,
    instructions: ['Torso erect', '90-degree bend front & rear knee', 'Knee stays behind toes'],
  },
  {
    id: 'ex_plank',
    name: 'AI Strict Core Plank',
    difficulty: 'Intermediate',
    category: 'Core Stability',
    targetMuscles: ['Transverse Abdominis', 'Rectus Abdominis', 'Obliques', 'Lower Back'],
    targetReps: 1,
    durationMin: 5,
    calories: 60,
    instructions: ['Neutral spine from head to heels', 'Forearms firmly anchored', 'Breathe evenly'],
  },
];

// 3. Workout History (5–6 past sessions)
export const mockWorkoutHistory: WorkoutSessionSummary[] = [
  {
    id: 'wkt_001',
    exerciseName: 'AI Barbell Squat',
    date: 'Yesterday, 6:30 PM',
    repsCompleted: 36,
    durationMinutes: 18,
    avgFormScore: 96,
    xpEarned: 240,
    caloriesBurned: 180,
    feedback: 'Flawless hip hinge and zero knee valgus detected!',
  },
  {
    id: 'wkt_002',
    exerciseName: 'AI Perfect Pushup',
    date: '3 days ago, 7:15 AM',
    repsCompleted: 45,
    durationMinutes: 14,
    avgFormScore: 92,
    xpEarned: 190,
    caloriesBurned: 135,
    feedback: 'Solid cadence. Keep core tight on the final reps.',
  },
  {
    id: 'wkt_003',
    exerciseName: 'AI Dynamic Lunges',
    date: '4 days ago, 5:45 PM',
    repsCompleted: 30,
    durationMinutes: 16,
    avgFormScore: 89,
    xpEarned: 175,
    caloriesBurned: 150,
    feedback: 'Minor left knee instability corrected by AI posture voice cue.',
  },
  {
    id: 'wkt_004',
    exerciseName: 'AI Strict Core Plank',
    date: '6 days ago, 8:00 AM',
    repsCompleted: 3,
    durationMinutes: 12,
    avgFormScore: 97,
    xpEarned: 160,
    caloriesBurned: 90,
    feedback: 'Exceptional neutral pelvis lock throughout the duration.',
  },
  {
    id: 'wkt_005',
    exerciseName: 'AI Jumping Jacks',
    date: '8 days ago, 6:00 PM',
    repsCompleted: 120,
    durationMinutes: 15,
    avgFormScore: 95,
    xpEarned: 210,
    caloriesBurned: 165,
    feedback: 'Consistent cadence and great aerobic exertion.',
  },
];

// 4. Gamification Profile
export const mockGamificationProfile: GamificationProfileData = {
  xp: 4820,
  coins: 1450,
  level: 14,
  streak: 18,
  rankTitle: 'Elite Cyber Athlete',
  nextMilestoneXp: 5600,
};

// 5. Achievements List (8–10, mix of locked/unlocked)
export const mockAchievements: AchievementItem[] = [
  {
    id: 'ach_first_blood',
    title: 'First Calibration',
    description: 'Complete your first AI computer vision mirror workout',
    icon: 'Sparkles',
    unlocked: true,
    unlockedDate: '18 days ago',
    progress: 1,
    maxProgress: 1,
    rewardXp: 100,
  },
  {
    id: 'ach_streak_7',
    title: '7-Day Kinetic Streak',
    description: 'Workout with AI validation for 7 consecutive days',
    icon: 'Flame',
    unlocked: true,
    unlockedDate: '11 days ago',
    progress: 7,
    maxProgress: 7,
    rewardXp: 250,
  },
  {
    id: 'ach_streak_14',
    title: 'Fortnight Titan',
    description: 'Maintain 14 consecutive active training days',
    icon: 'Zap',
    unlocked: true,
    unlockedDate: '4 days ago',
    progress: 14,
    maxProgress: 14,
    rewardXp: 500,
  },
  {
    id: 'ach_perfect_form',
    title: 'Kinetic Perfection',
    description: 'Score 95%+ AI biomechanics score across an entire set',
    icon: 'Award',
    unlocked: true,
    unlockedDate: 'Yesterday',
    progress: 1,
    maxProgress: 1,
    rewardXp: 300,
  },
  {
    id: 'ach_1000_reps',
    title: 'Millennium Rep Master',
    description: 'Log 1,000 AI-validated repetitions',
    icon: 'Dumbbell',
    unlocked: true,
    unlockedDate: '2 days ago',
    progress: 1840,
    maxProgress: 1000,
    rewardXp: 600,
  },
  {
    id: 'ach_streak_30',
    title: 'Monthly Cyber Legend',
    description: 'Reach a 30-day continuous workout streak',
    icon: 'Crown',
    unlocked: false,
    progress: 18,
    maxProgress: 30,
    rewardXp: 1000,
  },
  {
    id: 'ach_form_god',
    title: 'Biomechanics Guru',
    description: 'Log 5 consecutive workouts with 98%+ form accuracy',
    icon: 'Target',
    unlocked: false,
    progress: 2,
    maxProgress: 5,
    rewardXp: 750,
  },
  {
    id: 'ach_iron_lungs',
    title: 'Infinite Engine',
    description: 'Burn 5,000 total active calories through FitVerse',
    icon: 'HeartPulse',
    unlocked: false,
    progress: 3200,
    maxProgress: 5000,
    rewardXp: 800,
  },
  {
    id: 'ach_quest_slayer',
    title: 'Apex Quest Slayer',
    description: 'Complete 25 daily or weekly quests',
    icon: 'Trophy',
    unlocked: false,
    progress: 19,
    maxProgress: 25,
    rewardXp: 650,
  },
];

// 6. Leaderboard (12 fake users with names/avatars/XP/rank)
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: 'usr_top1',
    rank: 1,
    name: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    xp: 9840,
    streak: 42,
    isCurrentUser: false,
  },
  {
    id: 'usr_top2',
    rank: 2,
    name: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    xp: 8920,
    streak: 35,
    isCurrentUser: false,
  },
  {
    id: 'usr_top3',
    rank: 3,
    name: 'Kai Takahashi',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    xp: 8150,
    streak: 29,
    isCurrentUser: false,
  },
  {
    id: 'usr_001',
    rank: 4,
    name: 'Aryan Sharma (You)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    xp: 4820,
    streak: 18,
    isCurrentUser: true,
  },
  {
    id: 'usr_top5',
    rank: 5,
    name: 'Chloe Bennett',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    xp: 4610,
    streak: 16,
    isCurrentUser: false,
  },
  {
    id: 'usr_top6',
    rank: 6,
    name: 'David Okafor',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    xp: 4280,
    streak: 14,
    isCurrentUser: false,
  },
  {
    id: 'usr_top7',
    rank: 7,
    name: 'Zoe Sterling',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    xp: 3950,
    streak: 12,
    isCurrentUser: false,
  },
  {
    id: 'usr_top8',
    rank: 8,
    name: 'Liam Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    xp: 3620,
    streak: 10,
    isCurrentUser: false,
  },
  {
    id: 'usr_top9',
    rank: 9,
    name: 'Sophia Martinez',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    xp: 3410,
    streak: 9,
    isCurrentUser: false,
  },
  {
    id: 'usr_top10',
    rank: 10,
    name: 'Viktor Hansen',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    xp: 3100,
    streak: 8,
    isCurrentUser: false,
  },
  {
    id: 'usr_top11',
    rank: 11,
    name: 'Amina El-Sayed',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    xp: 2890,
    streak: 6,
    isCurrentUser: false,
  },
  {
    id: 'usr_top12',
    rank: 12,
    name: 'Lucas Dupont',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    xp: 2650,
    streak: 5,
    isCurrentUser: false,
  },
];

// 7. Challenges (3 daily + 3 weekly with progress)
export const mockChallenges: ChallengeItem[] = [
  // Daily
  {
    id: 'ch_daily_1',
    title: 'Morning Rep Activation',
    type: 'daily',
    description: 'Complete 30 validated Squats with form > 90%',
    progress: 24,
    target: 30,
    unit: 'reps',
    rewardXp: 120,
    rewardCoins: 50,
    completed: false,
  },
  {
    id: 'ch_daily_2',
    title: 'Core Precision Guard',
    type: 'daily',
    description: 'Hold strict plank posture for 3 cumulative minutes',
    progress: 3,
    target: 3,
    unit: 'mins',
    rewardXp: 100,
    rewardCoins: 40,
    completed: true,
  },
  {
    id: 'ch_daily_3',
    title: 'Calorie Burn Velocity',
    type: 'daily',
    description: 'Burn 200 active calories in any AI mirror session',
    progress: 140,
    target: 200,
    unit: 'kcal',
    rewardXp: 150,
    rewardCoins: 60,
    completed: false,
  },
  // Weekly
  {
    id: 'ch_weekly_1',
    title: 'Weekly Centurion Reps',
    type: 'weekly',
    description: 'Hit 250 verified reps across all muscle groups',
    progress: 190,
    target: 250,
    unit: 'reps',
    rewardXp: 500,
    rewardCoins: 200,
    completed: false,
  },
  {
    id: 'ch_weekly_2',
    title: 'Biomechanic Consistency',
    type: 'weekly',
    description: 'Complete 4 workouts keeping average form above 92%',
    progress: 3,
    target: 4,
    unit: 'sessions',
    rewardXp: 450,
    rewardCoins: 180,
    completed: false,
  },
  {
    id: 'ch_weekly_3',
    title: 'Endurance Mastery',
    type: 'weekly',
    description: 'Accumulate 90 total minutes inside FitVerse Vision Mirror',
    progress: 75,
    target: 90,
    unit: 'mins',
    rewardXp: 600,
    rewardCoins: 250,
    completed: false,
  },
];

// 8. Progress Summary (weekly workout counts, weight trend array)
export const mockProgressSummary: ProgressSummaryData = {
  weeklyWorkouts: [
    { day: 'Mon', count: 1, completed: true },
    { day: 'Tue', count: 1, completed: true },
    { day: 'Wed', count: 0, completed: false },
    { day: 'Thu', count: 2, completed: true },
    { day: 'Fri', count: 1, completed: true },
    { day: 'Sat', count: 1, completed: true },
    { day: 'Sun', count: 0, completed: false },
  ],
  weightTrend: [
    { date: 'Week 1', weightKg: 78.4 },
    { date: 'Week 2', weightKg: 77.9 },
    { date: 'Week 3', weightKg: 77.2 },
    { date: 'Week 4', weightKg: 76.8 },
    { date: 'Week 5', weightKg: 76.3 },
    { date: 'Current', weightKg: 75.8 },
  ],
  formAccuracyTrend: [
    { date: 'Week 1', score: 84.5 },
    { date: 'Week 2', score: 88.0 },
    { date: 'Week 3', score: 91.2 },
    { date: 'Week 4', score: 93.4 },
    { date: 'Current', score: 95.8 },
  ],
};

// 9. Transformation Prediction (30/60/90/180-day ranges)
export const mockTransformationPrediction: TransformationPredictionData[] = [
  {
    timeframeDays: 30,
    projectedWeightKg: 74.8,
    projectedMuscleGainKg: 0.8,
    projectedFatLossPercentage: 1.4,
    confidenceScore: 94,
    aiInsights: 'Optimized metabolic conditioning with your knee safety constraints.',
  },
  {
    timeframeDays: 60,
    projectedWeightKg: 73.9,
    projectedMuscleGainKg: 1.6,
    projectedFatLossPercentage: 2.8,
    confidenceScore: 89,
    aiInsights: 'Hypertrophic adaptations in delts and quads peaking safely.',
  },
  {
    timeframeDays: 90,
    projectedWeightKg: 73.0,
    projectedMuscleGainKg: 2.4,
    projectedFatLossPercentage: 4.1,
    confidenceScore: 84,
    aiInsights: 'Core stability score projected at 98% with posture asymmetry corrected.',
  },
  {
    timeframeDays: 180,
    projectedWeightKg: 71.5,
    projectedMuscleGainKg: 4.2,
    projectedFatLossPercentage: 6.8,
    confidenceScore: 78,
    aiInsights: 'Elite athlete kinetic profile reached with minimal joint strain.',
  },
];
