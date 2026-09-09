import { create } from 'zustand';
import { WorkoutApi } from '../services/api/workout';
import { useGamificationStore } from './gamificationStore';
import { useDailyActivityStore } from './dailyActivityStore';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'complete';
export type ExerciseTypeKey = 'squat' | 'push_up' | 'lunge' | 'plank' | 'jumping_jack';

export interface ExerciseItem {
  id: string;
  typeKey: ExerciseTypeKey;
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
  exerciseType: ExerciseTypeKey;
  totalReps: number;
  durationSeconds: number;
  averageFormScore: number;
  commonMistakes: string[];
  feedback: string[];
  xpEarned: number;
  coinsEarned: number;
  targetMuscles: string[];
  completedAt: string;
}

export interface WorkoutSessionState {
  currentExercise: ExerciseItem;
  targetExercises: ExerciseItem[];
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
  commonMistakes: string[];
  coachingFeedbackList: string[];
  liveAngles: {
    kneeAngle: number;
    hipAngle: number;
    elbowAngle: number;
    shoulderAngle: number;
    torsoInclination: number;
  };

  setActiveSessionId: (id: string | null) => void;
  setExercise: (exercise: ExerciseItem) => void;
  setExerciseByType: (typeKey: ExerciseTypeKey) => void;
  setStatus: (status: SessionStatus) => void;
  setRepCount: (reps: number) => void;
  incrementReps: () => void;
  setFormScore: (score: number) => void;
  recordFormScore: (score: number) => void;
  setFeedbackMessage: (message: string) => void;
  addMistake: (mistake: string) => void;
  setPersonDetected: (detected: boolean) => void;
  setCameraPermissionGranted: (granted: boolean) => void;
  setTimerSeconds: (seconds: number) => void;
  incrementTimer: () => void;
  setLiveAngles: (angles: {
    kneeAngle: number;
    hipAngle: number;
    elbowAngle: number;
    shoulderAngle: number;
    torsoInclination: number;
  }) => void;
  completeSession: () => CompletedWorkoutSummary;
  resetSession: () => void;
}

export const TARGET_EXERCISES: ExerciseItem[] = [
  {
    id: 'ex_squats',
    typeKey: 'squat',
    name: 'AI Squat',
    category: 'Legs & Glutes',
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
      'Chest proud & upright',
      'Break parallel depth (hips below knees)',
      'Drive upward through heels',
    ],
  },
  {
    id: 'ex_pushups',
    typeKey: 'push_up',
    name: 'AI Push Up',
    category: 'Chest & Arms',
    difficulty: 'Intermediate',
    targetReps: 15,
    targetSets: 3,
    durationEstimate: '2 min',
    caloriesEstimate: 42,
    targetMuscles: ['Pectorals', 'Triceps', 'Anterior Deltoid', 'Core'],
    safetyNotes: [
      'Avoid sagging your hips or overarching your spine.',
      'Elbows should tuck back at 45 degrees, not flared out.',
    ],
    formCues: [
      'Rigid plank line from neck to heels',
      'Chest to floor (90° elbow depth)',
      'Lock out at peak',
    ],
  },
  {
    id: 'ex_lunges',
    typeKey: 'lunge',
    name: 'AI Lunge',
    category: 'Legs & Stability',
    difficulty: 'Intermediate',
    targetReps: 10,
    targetSets: 3,
    durationEstimate: '3 min',
    caloriesEstimate: 45,
    targetMuscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
    safetyNotes: [
      'Keep front knee directly stacked over ankle, not past toes.',
      'Keep torso upright without forward torso lean.',
    ],
    formCues: [
      'Front knee 90° angle',
      'Back knee hovers above floor',
      'Core braced and upright',
    ],
  },
  {
    id: 'ex_plank',
    typeKey: 'plank',
    name: 'AI Plank',
    category: 'Core & Endurance',
    difficulty: 'Medium',
    targetReps: 45, // Target seconds
    targetSets: 3,
    durationEstimate: '2 min',
    caloriesEstimate: 35,
    targetMuscles: ['Transverse Abdominis', 'Rectus Abdominis', 'Glutes', 'Deltoids'],
    safetyNotes: [
      'Do not let lower back sag or belly drop towards the floor.',
      'Do not pike hips towards the ceiling.',
    ],
    formCues: [
      'Shoulders stacked over elbows',
      'Squeeze glutes & pull belly button inward',
      'Breathe steadily',
    ],
  },
  {
    id: 'ex_jumping_jacks',
    typeKey: 'jumping_jack',
    name: 'AI Jumping Jack',
    category: 'Full Body Cardio',
    difficulty: 'Easy',
    targetReps: 30,
    targetSets: 3,
    durationEstimate: '2 min',
    caloriesEstimate: 50,
    targetMuscles: ['Calves', 'Deltoids', 'Core', 'Cardiovascular'],
    safetyNotes: [
      'Land softly on the balls of your feet to protect knees and ankles.',
      'Keep knees softly bent upon landing.',
    ],
    formCues: [
      'Reach fully overhead',
      'Wide foot stance on jump',
      'Maintain steady tempo',
    ],
  },
];

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  currentExercise: TARGET_EXERCISES[0],
  targetExercises: TARGET_EXERCISES,
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
  commonMistakes: [],
  coachingFeedbackList: ['Keep your back straight'],
  liveAngles: {
    kneeAngle: 175,
    hipAngle: 175,
    elbowAngle: 175,
    shoulderAngle: 30,
    torsoInclination: 85,
  },

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
      commonMistakes: [],
      coachingFeedbackList: exercise.formCues,
      feedbackMessage: exercise.formCues[0] || 'Get ready!',
    }),

  setExerciseByType: (typeKey) => {
    const found = TARGET_EXERCISES.find((e) => e.typeKey === typeKey) || TARGET_EXERCISES[0];
    get().setExercise(found);
  },

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

  setFeedbackMessage: (feedbackMessage) =>
    set((state) => {
      const updatedList = state.coachingFeedbackList.includes(feedbackMessage)
        ? state.coachingFeedbackList
        : [feedbackMessage, ...state.coachingFeedbackList.slice(0, 5)];
      return {
        feedbackMessage,
        coachingFeedbackList: updatedList,
      };
    }),

  addMistake: (mistake) =>
    set((state) => {
      if (!state.commonMistakes.includes(mistake)) {
        return { commonMistakes: [...state.commonMistakes, mistake] };
      }
      return state;
    }),

  setPersonDetected: (isPersonDetected) => set({ isPersonDetected }),
  setCameraPermissionGranted: (cameraPermissionGranted) => set({ cameraPermissionGranted }),
  setTimerSeconds: (timerSeconds) => set({ timerSeconds }),
  incrementTimer: () => set((state) => ({ timerSeconds: state.timerSeconds + 1 })),

  setLiveAngles: (liveAngles) => set({ liveAngles }),

  completeSession: () => {
    const { currentExercise, repCount, timerSeconds, formScoreHistory, commonMistakes, coachingFeedbackList } = get();
    const validScores = formScoreHistory.length > 0 ? formScoreHistory : [90];
    const avgScore = Math.round(
      validScores.reduce((sum, val) => sum + val, 0) / validScores.length
    );

    const xpEarned = Math.max(50, repCount * 10);
    const coinsEarned = Math.max(10, Math.floor(repCount * 1.5));

    const summary: CompletedWorkoutSummary = {
      exerciseName: currentExercise.name,
      exerciseType: currentExercise.typeKey,
      totalReps: repCount,
      durationSeconds: timerSeconds,
      averageFormScore: avgScore,
      commonMistakes: commonMistakes.length > 0 ? commonMistakes : ['Knees moving inward slightly'],
      feedback: coachingFeedbackList.length > 0 ? coachingFeedbackList : ['Keep your back straight'],
      xpEarned,
      coinsEarned,
      targetMuscles: currentExercise.targetMuscles,
      completedAt: new Date().toISOString(),
    };

    set({
      status: 'complete',
      completedSummary: summary,
    });

    // Real backend API synchronization with anti-cheat XP validation
    const durationMinutes = Math.max(0.2, +(timerSeconds / 60).toFixed(1));
    const caloriesBurned = Math.max(5, Math.round(repCount * 4));
    WorkoutApi.completeSession({
      session_id: get().activeSessionId || undefined,
      workout_name: currentExercise.name,
      exercise_name: currentExercise.name,
      exercise_type: currentExercise.typeKey,
      total_reps: repCount,
      duration_minutes: durationMinutes,
      duration_seconds: timerSeconds,
      calories_burned: caloriesBurned,
      form_score: avgScore,
      average_form_score: avgScore,
      common_mistakes: summary.commonMistakes,
      feedback: summary.feedback,
      exercises: [
        {
          workout_session_id: get().activeSessionId || '',
          exercise_name: currentExercise.name,
          sets: 1,
          reps: repCount,
          weight_kg: 0,
          duration_seconds: timerSeconds,
          form_score: avgScore,
        },
      ],
    })
      .then((res) => {
        if (res && res.xp_awarded) {
          try {
            useGamificationStore.getState().claimEventXp('workout_completed', res.session_id);
          } catch {
            useGamificationStore.getState().addReward(res.xp_awarded, res.coins_awarded ?? coinsEarned);
          }
        }
        // Immediately sync Daily Activity Store to refresh Dashboard, Progress, and Weekly reports
        try {
          useDailyActivityStore.getState().syncWithBackend();
        } catch {}
      })
      .catch((err) => {
        console.warn('Backend completeSession failed (offline safe fallback active):', err);
        // Fallback: reward locally
        try {
          useGamificationStore.getState().addReward(xpEarned, coinsEarned);
        } catch {}
        try {
          useDailyActivityStore.getState().syncWithBackend();
        } catch {}
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
      commonMistakes: [],
      coachingFeedbackList: ['Keep your back straight'],
    }),
}));
