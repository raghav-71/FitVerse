import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useWorkoutSessionStore } from '../../../stores/workoutSessionStore';

const COACHING_CUES = [
  'Keep chest upright & core engaged',
  'Good depth! Hips below parallel',
  'Knees tracking slightly outward',
  'Keep your back straighter',
  'Drive upward through heels',
  'Smooth tempo — great cadence',
  'Maintain neutral cervical spine',
];

const FORM_SCORES_POOL = [92, 95, 88, 96, 91, 94, 89, 97, 93];

/**
 * useWorkoutEngine
 * 
 * Modular hook encapsulating the workout session lifecycle, rep-counting,
 * form-scoring, cadence intervals, and biomechanical feedback cues.
 *
 * NOTE FOR AI/CV TEAM:
 * To integrate real computer vision (MediaPipe / MoveNet landmarks):
 * 1. Replace the timer-based rep trigger in this hook with your joint-angle peak-valley detector.
 * 2. Feed calculated real-time form accuracy (0-100) into `recordFormScore(liveScore)`.
 * 3. Feed rule-based biomechanic error messages into `setFeedbackMessage(liveWarning)`.
 * The UI layer in `MirrorScreen` and its subcomponents will immediately respond without changes!
 */
export const useWorkoutEngine = () => {
  const {
    status,
    repCount,
    currentExercise,
    formScore,
    timerSeconds,
    isPersonDetected,
    incrementReps,
    recordFormScore,
    setFeedbackMessage,
    setPersonDetected,
    setStatus,
    incrementTimer,
    completeSession,
  } = useWorkoutSessionStore();

  const [isAutoRepsEnabled, setIsAutoRepsEnabled] = useState(true);
  const feedbackIndexRef = useRef(0);
  const scoreIndexRef = useRef(0);

  // Manual or automatic rep increment with haptics and score update
  const triggerRep = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics safe fallback
    }

    incrementReps();

    // Fluctuating realistic form score
    scoreIndexRef.current = (scoreIndexRef.current + 1) % FORM_SCORES_POOL.length;
    const nextScore = FORM_SCORES_POOL[scoreIndexRef.current];
    recordFormScore(nextScore);

    // Rotating coaching cues
    feedbackIndexRef.current = (feedbackIndexRef.current + 1) % COACHING_CUES.length;
    setFeedbackMessage(COACHING_CUES[feedbackIndexRef.current]);
  }, [incrementReps, recordFormScore, setFeedbackMessage]);

  // Elapsed workout timer
  useEffect(() => {
    if (status !== 'active') return;

    const timer = setInterval(() => {
      incrementTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [status, incrementTimer]);

  // Simulated rep counter interval (fires every 3.8 seconds if auto-reps is enabled)
  useEffect(() => {
    if (status !== 'active' || !isAutoRepsEnabled || !isPersonDetected) return;

    const repInterval = setInterval(() => {
      triggerRep();
    }, 3800);

    return () => clearInterval(repInterval);
  }, [status, isAutoRepsEnabled, isPersonDetected, triggerRep]);

  const pause = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setStatus('paused');
  }, [setStatus]);

  const resume = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setStatus('active');
  }, [setStatus]);

  const toggleAutoReps = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsAutoRepsEnabled((prev) => !prev);
  }, []);

  const togglePersonDetected = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setPersonDetected(!isPersonDetected);
  }, [isPersonDetected, setPersonDetected]);

  const finishEarly = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    return completeSession();
  }, [completeSession]);

  return {
    status,
    repCount,
    currentExercise,
    formScore,
    timerSeconds,
    isPersonDetected,
    isAutoRepsEnabled,
    triggerRep,
    toggleAutoReps,
    togglePersonDetected,
    pause,
    resume,
    finishEarly,
  };
};
