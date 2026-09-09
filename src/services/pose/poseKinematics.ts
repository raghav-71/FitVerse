/**
 * FitVerse On-Device Kinematics & Pose Biomechanics Engine
 * 
 * Provides trigonometric joint-angle computation, real-time exercise classification,
 * hysteresis-based rep counting, and biomechanical safety rule evaluation for:
 * 1. Squat
 * 2. Push Up
 * 3. Lunge
 * 4. Plank
 * 5. Jumping Jack
 */

export type ExerciseType = 'squat' | 'push_up' | 'lunge' | 'plank' | 'jumping_jack';

export interface Keypoint2D {
  x: number;
  y: number;
  score?: number;
}

export interface PoseLandmarks {
  nose?: Keypoint2D;
  leftEye?: Keypoint2D;
  rightEye?: Keypoint2D;
  leftEar?: Keypoint2D;
  rightEar?: Keypoint2D;
  leftShoulder?: Keypoint2D;
  rightShoulder?: Keypoint2D;
  leftElbow?: Keypoint2D;
  rightElbow?: Keypoint2D;
  leftWrist?: Keypoint2D;
  rightWrist?: Keypoint2D;
  leftHip?: Keypoint2D;
  rightHip?: Keypoint2D;
  leftKnee?: Keypoint2D;
  rightKnee?: Keypoint2D;
  leftAnkle?: Keypoint2D;
  rightAnkle?: Keypoint2D;
}

export interface JointAngles {
  kneeAngle: number;
  hipAngle: number;
  elbowAngle: number;
  shoulderAngle: number;
  torsoInclination: number;
}

export interface KinematicFrameResult {
  repIncremented: boolean;
  repsTotal: number;
  currentPhase: 'top' | 'inflection' | 'bottom' | 'hold' | 'in' | 'out';
  liveFormScore: number;
  feedbackMessage: string;
  isGoodForm: boolean;
  detectedMistake?: string;
  angles: JointAngles;
}

/**
 * Calculates angle in degrees at vertex B formed by vectors BA and BC
 */
export function calculateAngle(a: Keypoint2D, b: Keypoint2D, c: Keypoint2D): number {
  if (!a || !b || !c) return 180;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle * 10) / 10;
}

/**
 * Calculates Euclidean distance between two 2D points
 */
export function calculateDistance(a: Keypoint2D, b: Keypoint2D): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * State Machine for rep-tracking and form evaluation across target exercises
 */
export class ExerciseStateMachine {
  public exercise: ExerciseType;
  public reps: number = 0;
  public phase: 'top' | 'inflection' | 'bottom' | 'hold' | 'in' | 'out' = 'top';
  public holdSeconds: number = 0;
  public formScoresHistory: number[] = [];
  public commonMistakes: Set<string> = new Set();
  public feedbackHistory: string[] = [];

  private lastRepTimestamp: number = 0;
  private holdStartTimestamp: number = 0;

  constructor(exercise: ExerciseType = 'squat') {
    this.exercise = exercise;
    this.reset();
  }

  public setExercise(exercise: ExerciseType) {
    this.exercise = exercise;
    this.reset();
  }

  public reset() {
    this.reps = 0;
    this.phase = this.exercise === 'plank' ? 'hold' : this.exercise === 'jumping_jack' ? 'in' : 'top';
    this.holdSeconds = 0;
    this.formScoresHistory = [];
    this.commonMistakes.clear();
    this.feedbackHistory = [];
    this.lastRepTimestamp = 0;
    this.holdStartTimestamp = Date.now();
  }

  /**
   * Process a single pose landmark frame and evaluate biomechanics
   */
  public processFrame(landmarks: PoseLandmarks): KinematicFrameResult {
    const defaultAngles: JointAngles = {
      kneeAngle: 175,
      hipAngle: 175,
      elbowAngle: 175,
      shoulderAngle: 30,
      torsoInclination: 85,
    };

    if (!landmarks.leftHip && !landmarks.rightHip) {
      return {
        repIncremented: false,
        repsTotal: this.reps,
        currentPhase: this.phase,
        liveFormScore: 90,
        feedbackMessage: 'Step fully into camera frame',
        isGoodForm: true,
        angles: defaultAngles,
      };
    }

    // Extract primary joints (prefer left side or mirror average)
    const shoulder = landmarks.leftShoulder || landmarks.rightShoulder!;
    const hip = landmarks.leftHip || landmarks.rightHip!;
    const knee = landmarks.leftKnee || landmarks.rightKnee!;
    const ankle = landmarks.leftAnkle || landmarks.rightAnkle!;
    const elbow = landmarks.leftElbow || landmarks.rightElbow!;
    const wrist = landmarks.leftWrist || landmarks.rightWrist!;

    // Compute joint angles
    const kneeAngle = knee && hip && ankle ? calculateAngle(hip, knee, ankle) : 175;
    const hipAngle = shoulder && hip && knee ? calculateAngle(shoulder, hip, knee) : 175;
    const elbowAngle = shoulder && elbow && wrist ? calculateAngle(shoulder, elbow, wrist) : 175;
    const shoulderAngle = hip && shoulder && elbow ? calculateAngle(hip, shoulder, elbow) : 30;
    const torsoInclination = shoulder && hip ? Math.abs(Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * 180 / Math.PI) : 90;

    const angles: JointAngles = {
      kneeAngle,
      hipAngle,
      elbowAngle,
      shoulderAngle,
      torsoInclination,
    };

    switch (this.exercise) {
      case 'squat':
        return this.evaluateSquat(landmarks, angles);
      case 'push_up':
        return this.evaluatePushUp(landmarks, angles);
      case 'lunge':
        return this.evaluateLunge(landmarks, angles);
      case 'plank':
        return this.evaluatePlank(landmarks, angles);
      case 'jumping_jack':
        return this.evaluateJumpingJack(landmarks, angles);
      default:
        return this.evaluateSquat(landmarks, angles);
    }
  }

  // 1. SQUAT EVALUATOR
  private evaluateSquat(landmarks: PoseLandmarks, angles: JointAngles): KinematicFrameResult {
    const { kneeAngle, hipAngle } = angles;
    let repIncremented = false;
    let feedback = 'Keep knees aligned';
    let isGood = true;
    let liveScore = 95;
    let detectedMistake: string | undefined;

    // Knee valgus detection (knees caving inward relative to ankles)
    if (landmarks.leftKnee && landmarks.rightKnee && landmarks.leftAnkle && landmarks.rightAnkle) {
      const kneeDist = calculateDistance(landmarks.leftKnee, landmarks.rightKnee);
      const ankleDist = calculateDistance(landmarks.leftAnkle, landmarks.rightAnkle);
      if (kneeDist < ankleDist * 0.78 && kneeAngle < 120) {
        detectedMistake = 'Knees moving inward';
        feedback = 'Keep knees aligned';
        isGood = false;
        liveScore -= 8;
        this.commonMistakes.add('Keep knees aligned');
      }
    }

    // Spine lean fault
    if (hipAngle < 65 && kneeAngle < 110) {
      detectedMistake = 'Excessive torso forward lean';
      feedback = 'Keep your back straight';
      isGood = false;
      liveScore -= 6;
      this.commonMistakes.add('Keep your back straight');
    }

    // Rep State Machine: TOP (>= 150 deg) -> BOTTOM (<= 95 deg) -> TOP
    const now = Date.now();
    if (this.phase === 'top' && kneeAngle <= 95) {
      this.phase = 'bottom';
      feedback = 'Good depth! Below parallel';
      liveScore = Math.min(100, liveScore + 3);
    } else if (this.phase === 'top' && kneeAngle <= 120) {
      this.phase = 'inflection';
      feedback = 'Go slightly lower';
    } else if (this.phase === 'inflection') {
      if (kneeAngle <= 95) {
        this.phase = 'bottom';
        feedback = 'Good depth! Below parallel';
        liveScore = Math.min(100, liveScore + 3);
      } else if (kneeAngle >= 150) {
        detectedMistake = 'Shallow squat depth';
        feedback = 'Go slightly lower';
        this.commonMistakes.add('Go slightly lower');
        this.phase = 'top';
      }
    } else if (this.phase === 'bottom') {
      if (kneeAngle >= 145 && (now - this.lastRepTimestamp > 400 || this.lastRepTimestamp === 0)) {
        this.reps += 1;
        repIncremented = true;
        this.lastRepTimestamp = now;
        this.phase = 'top';
        feedback = `Rep ${this.reps} complete`;
      }
    }

    this.recordScore(liveScore, feedback);

    return {
      repIncremented,
      repsTotal: this.reps,
      currentPhase: this.phase,
      liveFormScore: liveScore,
      feedbackMessage: feedback,
      isGoodForm: isGood,
      detectedMistake,
      angles,
    };
  }

  // 2. PUSH UP EVALUATOR
  private evaluatePushUp(landmarks: PoseLandmarks, angles: JointAngles): KinematicFrameResult {
    const { elbowAngle, hipAngle } = angles;
    let repIncremented = false;
    let feedback = 'Good form';
    let isGood = true;
    let liveScore = 93;
    let detectedMistake: string | undefined;

    // Hip sag or pike detection (shoulder-hip-knee line)
    if (hipAngle < 155) {
      detectedMistake = 'Hips sagging downward';
      feedback = 'Keep your body straight';
      isGood = false;
      liveScore -= 9;
      this.commonMistakes.add('Keep your body straight');
    } else if (hipAngle > 195) {
      detectedMistake = 'Hips piked too high';
      feedback = 'Keep your body straight';
      isGood = false;
      liveScore -= 5;
      this.commonMistakes.add('Keep your body straight');
    }

    // Rep State Machine: TOP (>= 150 deg) -> BOTTOM (<= 92 deg) -> TOP
    const now = Date.now();
    if (this.phase === 'top' && elbowAngle <= 92) {
      this.phase = 'bottom';
      feedback = 'Good form';
      liveScore = Math.min(100, liveScore + 4);
    } else if (this.phase === 'top' && elbowAngle <= 120) {
      this.phase = 'inflection';
      feedback = 'Lower your chest';
    } else if (this.phase === 'inflection') {
      if (elbowAngle <= 92) {
        this.phase = 'bottom';
        feedback = 'Good form';
        liveScore = Math.min(100, liveScore + 4);
      } else if (elbowAngle >= 148) {
        this.phase = 'top';
      }
    } else if (this.phase === 'bottom') {
      if (elbowAngle >= 145 && (now - this.lastRepTimestamp > 400 || this.lastRepTimestamp === 0)) {
        this.reps += 1;
        repIncremented = true;
        this.lastRepTimestamp = now;
        this.phase = 'top';
        feedback = `Rep ${this.reps} complete`;
      }
    }

    this.recordScore(liveScore, feedback);

    return {
      repIncremented,
      repsTotal: this.reps,
      currentPhase: this.phase,
      liveFormScore: liveScore,
      feedbackMessage: feedback,
      isGoodForm: isGood,
      detectedMistake,
      angles,
    };
  }

  // 3. LUNGE EVALUATOR
  private evaluateLunge(landmarks: PoseLandmarks, angles: JointAngles): KinematicFrameResult {
    const { kneeAngle, torsoInclination } = angles;
    let repIncremented = false;
    let feedback = 'Keep chest upright & hips square';
    let isGood = true;
    let liveScore = 92;
    let detectedMistake: string | undefined;

    if (torsoInclination < 65) {
      detectedMistake = 'Torso leaning too far forward';
      feedback = 'Keep chest upright & hips square';
      isGood = false;
      liveScore -= 6;
      this.commonMistakes.add('Keep chest upright & hips square');
    }

    const now = Date.now();
    if (this.phase === 'top' && kneeAngle <= 95) {
      this.phase = 'bottom';
      feedback = 'Good form';
      liveScore = Math.min(100, liveScore + 3);
    } else if (this.phase === 'top' && kneeAngle <= 120) {
      this.phase = 'inflection';
      feedback = 'Drop back knee towards floor';
    } else if (this.phase === 'inflection') {
      if (kneeAngle <= 95) {
        this.phase = 'bottom';
        feedback = 'Good form';
        liveScore = Math.min(100, liveScore + 3);
      } else if (kneeAngle >= 150) {
        this.phase = 'top';
      }
    } else if (this.phase === 'bottom') {
      if (kneeAngle >= 145 && (now - this.lastRepTimestamp > 400 || this.lastRepTimestamp === 0)) {
        this.reps += 1;
        repIncremented = true;
        this.lastRepTimestamp = now;
        this.phase = 'top';
        feedback = `Rep ${this.reps} complete`;
      }
    }

    this.recordScore(liveScore, feedback);

    return {
      repIncremented,
      repsTotal: this.reps,
      currentPhase: this.phase,
      liveFormScore: liveScore,
      feedbackMessage: feedback,
      isGoodForm: isGood,
      detectedMistake,
      angles,
    };
  }

  // 4. PLANK EVALUATOR (Isometric Hold Seconds)
  private evaluatePlank(landmarks: PoseLandmarks, angles: JointAngles): KinematicFrameResult {
    const { hipAngle } = angles;
    let isGood = true;
    let liveScore = 96;
    let feedback = 'Hold strong • Core engaged';
    let detectedMistake: string | undefined;

    if (hipAngle < 160) {
      detectedMistake = 'Hips dropping below line';
      feedback = 'Lift hips into straight plank';
      isGood = false;
      liveScore -= 8;
      this.commonMistakes.add('Keep your body straight');
    } else if (hipAngle > 195) {
      detectedMistake = 'Hips piked up';
      feedback = 'Keep your body straight';
      isGood = false;
      liveScore -= 6;
      this.commonMistakes.add('Keep your body straight');
    }

    const now = Date.now();
    if (now - this.holdStartTimestamp >= 1000) {
      if (isGood) {
        this.holdSeconds += 1;
        this.reps = this.holdSeconds; // Reps for plank represents held seconds
      }
      this.holdStartTimestamp = now;
    }

    this.recordScore(liveScore, feedback);

    return {
      repIncremented: false,
      repsTotal: this.reps,
      currentPhase: 'hold',
      liveFormScore: liveScore,
      feedbackMessage: feedback,
      isGoodForm: isGood,
      detectedMistake,
      angles,
    };
  }

  // 5. JUMPING JACK EVALUATOR
  private evaluateJumpingJack(landmarks: PoseLandmarks, angles: JointAngles): KinematicFrameResult {
    const { shoulderAngle } = angles;
    let repIncremented = false;
    let feedback = 'Full arm extension overhead';
    let isGood = true;
    let liveScore = 94;
    let detectedMistake: string | undefined;

    // Check arm reach overhead (shoulder angle > 135 deg)
    const now = Date.now();
    if (this.phase === 'in' && shoulderAngle >= 120) {
      this.phase = 'out';
      feedback = 'Full arm extension overhead';
    } else if (this.phase === 'out' && shoulderAngle <= 45) {
      if (now - this.lastRepTimestamp > 450) {
        this.reps += 1;
        repIncremented = true;
        this.lastRepTimestamp = now;
        this.phase = 'in';
        feedback = `Rep ${this.reps} complete`;
      }
    }

    this.recordScore(liveScore, feedback);

    return {
      repIncremented,
      repsTotal: this.reps,
      currentPhase: this.phase,
      liveFormScore: liveScore,
      feedbackMessage: feedback,
      isGoodForm: isGood,
      detectedMistake,
      angles,
    };
  }

  private recordScore(score: number, feedback: string) {
    this.formScoresHistory.push(score);
    if (this.formScoresHistory.length > 50) {
      this.formScoresHistory.shift();
    }
    if (!this.feedbackHistory.includes(feedback)) {
      this.feedbackHistory.push(feedback);
      if (this.feedbackHistory.length > 8) {
        this.feedbackHistory.shift();
      }
    }
  }

  public getAverageFormScore(): number {
    if (this.formScoresHistory.length === 0) return 90;
    const sum = this.formScoresHistory.reduce((acc, s) => acc + s, 0);
    return Math.round(sum / this.formScoresHistory.length);
  }

  public getSummary() {
    return {
      exercise: this.exercise,
      reps: this.reps,
      average_form_score: this.getAverageFormScore(),
      common_mistakes: Array.from(this.commonMistakes),
      feedback: this.feedbackHistory.length > 0 ? this.feedbackHistory : ['Keep your back straight'],
    };
  }
}
