import { create } from 'zustand';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'complete';

export interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Intermediate';
  targetReps: number;
  targetSets: number;
  durationEstimate: string;
  caloriesEstimate: number;
  targetMuscles: string[];
  safetyNotes: string[];
  formCues: string[];
}

export interface CompletedWorkoutSummary {
  exerciseName: string;
  totalReps: number;
  durationSeconds: number;
  averageFormScore: number;
  xpEarned: number;
  coinsEarned: number;
  targetMuscles: string[];
  completedAt: string;
}

export interface WorkoutSessionState {
  currentExercise: ExerciseItem;
  repCount: number;
  formScore: number;
  formScoreHistory: number[];
  feedbackMessage: string;
  isPersonDetected: boolean;
  cameraPermissionGranted: boolean | null;
  timerSeconds: number;
  status: SessionStatus;
  completedSummary: CompletedWorkoutSummary | null;
  activeSessionId: string | null;

  setActiveSessionId: (id: string | null) => void;
  setExercise: (exercise: ExerciseItem) => void;
  setStatus: (status: SessionStatus) => void;
  setRepCount: (reps: number) => void;
  incrementReps: () => void;
  setFormScore: (score: number) => void;
  recordFormScore: (score: number) => void;
  setFeedbackMessage: (message: string) => void;
  setPersonDetected: (detected: boolean) => void;
  setCameraPermissionGranted: (granted: boolean) => void;
  setTimerSeconds: (seconds: number) => void;
  incrementTimer: () => void;
  completeSession: () => CompletedWorkoutSummary;
  resetSession: () => void;
}

const DEFAULT_EXERCISE: ExerciseItem = {
  id: 'ex_squats',
  name: 'AI Barbell Squat',
  category: 'Legs & Core',
  difficulty: 'Intermediate',
  targetReps: 12,
  targetSets: 3,
  durationEstimate: '3 min',
  caloriesEstimate: 48,
  targetMuscles: ['Quadriceps', 'Glutes', 'Core', 'Hamstrings'],
  safetyNotes: [
    'Keep your spine aligned and avoid arching the lower back.',
    'Ensure knees track slightly outward, inline with toes.',
    'Do not let knees buckle inward during ascent.',
  ],
  formCues: [
    'Maintain chest upright',
    'Hit parallel squat depth (hips below knees)',
    'Drive upward through midfoot & heels',
  ],
};

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  currentExercise: DEFAULT_EXERCISE,
  repCount: 0,
  formScore: 94,
  formScoreHistory: [94],
  feedbackMessage: 'Keep chest upright & core engaged',
  isPersonDetected: true,
  cameraPermissionGranted: null,
  timerSeconds: 0,
  status: 'idle',
  completedSummary: null,
  activeSessionId: null,

  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

  setExercise: (exercise) =>
    set({
      currentExercise: exercise,
      repCount: 0,
      formScore: 94,
      formScoreHistory: [94],
      timerSeconds: 0,
      status: 'idle',
      completedSummary: null,
      activeSessionId: null,
    }),

  setStatus: (status) => set({ status }),
  setRepCount: (repCount) => set({ repCount }),
  
  incrementReps: () =>
    set((state) => ({
      repCount: state.repCount + 1,
    })),

  setFormScore: (formScore) => set({ formScore }),

  recordFormScore: (score) =>
    set((state) => ({
      formScore: score,
      formScoreHistory: [...state.formScoreHistory, score],
    })),

  setFeedbackMessage: (feedbackMessage) => set({ feedbackMessage }),
  setPersonDetected: (isPersonDetected) => set({ isPersonDetected }),
  setCameraPermissionGranted: (cameraPermissionGranted) => set({ cameraPermissionGranted }),
  setTimerSeconds: (timerSeconds) => set({ timerSeconds }),
  incrementTimer: () => set((state) => ({ timerSeconds: state.timerSeconds + 1 })),

  completeSession: () => {
    const { currentExercise, repCount, timerSeconds, formScoreHistory } = get();
    const validScores = formScoreHistory.length > 0 ? formScoreHistory : [92];
    const avgScore = Math.round(
      validScores.reduce((sum, val) => sum + val, 0) / validScores.length
    );

    const xpEarned = 120;
    const coinsEarned = 15;

    const summary: CompletedWorkoutSummary = {
      exerciseName: currentExercise.name,
      totalReps: repCount,
      durationSeconds: timerSeconds,
      averageFormScore: avgScore,
      xpEarned,
      coinsEarned,
      targetMuscles: currentExercise.targetMuscles,
      completedAt: new Date().toISOString(),
    };

    set({
      status: 'complete',
      completedSummary: summary,
    });

    return summary;
  },

  resetSession: () =>
    set({
      repCount: 0,
      formScore: 94,
      formScoreHistory: [94],
      feedbackMessage: 'Keep chest upright & core engaged',
      isPersonDetected: true,
      timerSeconds: 0,
      status: 'idle',
      completedSummary: null,
      activeSessionId: null,
    }),
}));
