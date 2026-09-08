import { create } from 'zustand';
import { Exercise, WorkoutSummary } from '../services/mock/types';
import { MOCK_EXERCISES } from '../services/mock/data';

export type WorkoutPhase = 'idle' | 'before' | 'active' | 'paused' | 'summary';

interface WorkoutStoreState {
  currentExercise: Exercise;
  phase: WorkoutPhase;
  currentRep: number;
  targetReps: number;
  timerSeconds: number;
  liveFormScore: number;
  liveFeedback: string;
  feedbackHistory: string[];
  isTrackingGoodForm: boolean;
  completedSummary: WorkoutSummary | null;

  setExercise: (exercise: Exercise) => void;
  setPhase: (phase: WorkoutPhase) => void;
  incrementRep: (formScoreDelta?: number) => void;
  tickTimer: () => void;
  setLiveFeedback: (feedback: string, isGood?: boolean) => void;
  resetWorkout: () => void;
  finishWorkout: () => WorkoutSummary;
}

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  currentExercise: MOCK_EXERCISES[0],
  phase: 'idle',
  currentRep: 0,
  targetReps: 12,
  timerSeconds: 0,
  liveFormScore: 96,
  liveFeedback: 'AI Camera Active • Scanning biomechanics...',
  feedbackHistory: ['Joint calibration locked', 'Spine angle optimal'],
  isTrackingGoodForm: true,
  completedSummary: null,

  setExercise: (exercise) =>
    set({
      currentExercise: exercise,
      targetReps: exercise.targetReps,
      currentRep: 0,
      timerSeconds: 0,
      liveFormScore: 96,
      liveFeedback: 'Stand in frame • Keep hips visible',
      feedbackHistory: [],
      isTrackingGoodForm: true,
      completedSummary: null,
    }),

  setPhase: (phase) => set({ phase }),

  incrementRep: (formScoreDelta = 0) => {
    const { currentRep, targetReps, liveFormScore } = get();
    const newRep = currentRep + 1;
    const newScore = Math.min(100, Math.max(82, liveFormScore + formScoreDelta));
    
    set({
      currentRep: newRep,
      liveFormScore: newScore,
    });
  },

  tickTimer: () => set((state) => ({ timerSeconds: state.timerSeconds + 1 })),

  setLiveFeedback: (feedback, isGood = true) =>
    set((state) => ({
      liveFeedback: feedback,
      isTrackingGoodForm: isGood,
      feedbackHistory: [feedback, ...state.feedbackHistory.slice(0, 4)],
    })),

  resetWorkout: () =>
    set({
      phase: 'idle',
      currentRep: 0,
      timerSeconds: 0,
      liveFormScore: 95,
      liveFeedback: 'Ready',
      feedbackHistory: [],
      completedSummary: null,
    }),

  finishWorkout: () => {
    const { currentExercise, currentRep, timerSeconds, liveFormScore, feedbackHistory } = get();
    const xp = Math.round(currentRep * 25 + (liveFormScore / 100) * 80);
    const coins = Math.round(currentRep * 8 + 30);

    const summary: WorkoutSummary = {
      id: `wrk_${Date.now()}`,
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      date: 'Today',
      totalReps: currentRep || 12,
      durationSeconds: Math.max(timerSeconds, 45),
      formScore: Math.round(liveFormScore),
      xpEarned: xp,
      coinsEarned: coins,
      accuracyBreakdown: {
        depth: 98,
        tempo: 92,
        alignment: 95,
      },
      feedbackHighlights: [
        'Exceptional hip hinge angle maintained throughout',
        'Consistently broke parallel depth on reps 4 through 12',
        'Minimal knee valgus deviation',
      ],
      muscleGroups: currentExercise.musclesTargeted,
    };

    set({ phase: 'summary', completedSummary: summary });
    return summary;
  },
}));
