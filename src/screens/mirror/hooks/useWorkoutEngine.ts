import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useWorkoutSessionStore } from '../../../stores/workoutSessionStore';
import {
  ExerciseStateMachine,
  PoseLandmarks,
  KinematicFrameResult,
  ExerciseType,
} from '../../../services/pose/poseKinematics';

/**
 * useWorkoutEngine
 * 
 * Modular hook driving the AI Fitness Mirror session lifecycle, real-time kinematic
 * pose evaluation, exercise-specific state machines, rep-counting with hysteresis,
 * and rule-based biomechanical coaching cues.
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
    addMistake,
    setPersonDetected,
    setStatus,
    incrementTimer,
    setLiveAngles,
    completeSession,
  } = useWorkoutSessionStore();

  const [isAutoRepsEnabled, setIsAutoRepsEnabled] = useState(true);

  // Dedicated Exercise State Machine instance
  const stateMachineRef = useRef<ExerciseStateMachine>(
    new ExerciseStateMachine(currentExercise.typeKey as ExerciseType)
  );

  // Sync state machine when exercise changes
  useEffect(() => {
    stateMachineRef.current.setExercise(currentExercise.typeKey as ExerciseType);
  }, [currentExercise.typeKey]);

  // Evaluate raw or camera-detected landmarks through kinematics engine
  const evaluatePoseLandmarks = useCallback(
    (landmarks: PoseLandmarks): KinematicFrameResult => {
      const result = stateMachineRef.current.processFrame(landmarks);

      setLiveAngles(result.angles);

      if (result.repIncremented) {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
        incrementReps();
      }

      recordFormScore(result.liveFormScore);
      setFeedbackMessage(result.feedbackMessage);

      if (result.detectedMistake) {
        addMistake(result.detectedMistake);
      }

      return result;
    },
    [incrementReps, recordFormScore, setFeedbackMessage, addMistake, setLiveAngles]
  );

  // Manual or simulated rep trigger utilizing the active exercise state machine
  const triggerRep = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const sm = stateMachineRef.current;
    const exerciseType = currentExercise.typeKey;

    // Generate dynamic kinematic landmarks matching the peak flexion of the selected movement
    let bottomLandmarks: PoseLandmarks = {};

    switch (exerciseType) {
      case 'squat':
        bottomLandmarks = {
          leftHip: { x: 140, y: 220 },
          rightHip: { x: 160, y: 220 },
          leftKnee: { x: 130, y: 255 },
          rightKnee: { x: 170, y: 255 },
          leftAnkle: { x: 132, y: 310 },
          rightAnkle: { x: 168, y: 310 },
          leftShoulder: { x: 135, y: 140 },
          rightShoulder: { x: 165, y: 140 },
        };
        break;
      case 'push_up':
        bottomLandmarks = {
          leftShoulder: { x: 90, y: 190 },
          leftElbow: { x: 75, y: 175 },
          leftWrist: { x: 75, y: 210 },
          leftHip: { x: 160, y: 190 },
          leftKnee: { x: 210, y: 190 },
          leftAnkle: { x: 260, y: 190 },
        };
        break;
      case 'lunge':
        bottomLandmarks = {
          leftHip: { x: 140, y: 210 },
          leftKnee: { x: 110, y: 250 },
          leftAnkle: { x: 110, y: 300 },
          rightKnee: { x: 190, y: 280 },
          rightAnkle: { x: 220, y: 300 },
          leftShoulder: { x: 140, y: 130 },
        };
        break;
      case 'plank':
        bottomLandmarks = {
          leftShoulder: { x: 90, y: 180 },
          leftElbow: { x: 90, y: 210 },
          leftHip: { x: 160, y: 180 },
          leftKnee: { x: 210, y: 180 },
          leftAnkle: { x: 260, y: 180 },
        };
        break;
      case 'jumping_jack':
        bottomLandmarks = {
          leftShoulder: { x: 130, y: 130 },
          leftElbow: { x: 100, y: 80 },
          leftWrist: { x: 85, y: 40 },
          rightShoulder: { x: 170, y: 130 },
          rightElbow: { x: 200, y: 80 },
          rightWrist: { x: 215, y: 40 },
          leftHip: { x: 135, y: 200 },
          rightHip: { x: 165, y: 200 },
          leftAnkle: { x: 100, y: 310 },
          rightAnkle: { x: 200, y: 310 },
        };
        break;
    }

    // Step 1: Reach inflection/bottom
    evaluatePoseLandmarks(bottomLandmarks);

    // Step 2: Return to upright/start to complete rep
    setTimeout(() => {
      const topLandmarks: PoseLandmarks = {
        leftHip: { x: 140, y: 190 },
        rightHip: { x: 160, y: 190 },
        leftKnee: { x: 140, y: 250 },
        rightKnee: { x: 160, y: 250 },
        leftAnkle: { x: 140, y: 310 },
        rightAnkle: { x: 160, y: 310 },
        leftShoulder: { x: 135, y: 120 },
        rightShoulder: { x: 165, y: 120 },
        leftElbow: { x: 120, y: 155 },
        leftWrist: { x: 120, y: 195 },
      };
      evaluatePoseLandmarks(topLandmarks);
    }, 450);
  }, [currentExercise.typeKey, evaluatePoseLandmarks]);

  // Elapsed workout timer
  useEffect(() => {
    if (status !== 'active') return;

    const timer = setInterval(() => {
      incrementTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [status, incrementTimer]);

  // Plank isometric hold timer (strictly for isometric exercises when active & athlete detected)
  useEffect(() => {
    if (status !== 'active' || currentExercise.typeKey !== 'plank' || !isPersonDetected) return;

    const interval = setInterval(() => {
      incrementReps();
    }, 1000);

    return () => clearInterval(interval);
  }, [status, currentExercise.typeKey, isPersonDetected, incrementReps]);

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
    stateMachine: stateMachineRef.current,
    evaluatePoseLandmarks,
    triggerRep,
    toggleAutoReps,
    togglePersonDetected,
    pause,
    resume,
    finishEarly,
  };
};
