import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Play, Pause, Square, Sparkles, CheckCircle2, AlertTriangle, Camera as CameraIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { useWorkoutStore } from '../../stores/workoutStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COACH_CUES = [
  { text: 'Chest upright • Spine neutral', isGood: true, scoreDelta: 2 },
  { text: 'Excellent depth! Hips broke parallel', isGood: true, scoreDelta: 3 },
  { text: 'Knees tracking right over toes', isGood: true, scoreDelta: 1 },
  { text: 'Keep your core braced tight', isGood: true, scoreDelta: 0 },
  { text: 'Watch tempo: 2s down, 1s up', isGood: false, scoreDelta: -2 },
  { text: 'Great power output on concentric phase!', isGood: true, scoreDelta: 2 },
];

export const CameraPoseView: React.FC = () => {
  const {
    currentExercise,
    currentRep,
    targetReps,
    timerSeconds,
    liveFormScore,
    liveFeedback,
    isTrackingGoodForm,
    incrementRep,
    tickTimer,
    setLiveFeedback,
    finishWorkout,
    setPhase,
  } = useWorkoutStore();

  const [isPaused, setIsPaused] = useState(false);
  const [posePhase, setPosePhase] = useState<'standing' | 'bottom'>('standing');
  const [permission, requestPermission] = useCameraPermissions();

  // Timer tick
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, tickTimer]);

  // Simulated AI rep tracking loop & voice cue generator
  const triggerRep = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    const randomCue = COACH_CUES[Math.floor(Math.random() * COACH_CUES.length)];
    setLiveFeedback(randomCue.text, randomCue.isGood);
    incrementRep(randomCue.scoreDelta);

    // Toggle skeletal animation state
    setPosePhase('bottom');
    setTimeout(() => {
      setPosePhase('standing');
    }, 600);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Skeletal coordinates dynamic depending on squat depth animation
  const hipY = posePhase === 'bottom' ? 240 : 180;
  const kneeY = posePhase === 'bottom' ? 275 : 240;
  const kneeL_X = posePhase === 'bottom' ? 70 : 85;
  const kneeR_X = posePhase === 'bottom' ? 170 : 155;
  const ankleL_X = 85;
  const ankleR_X = 155;
  const shoulderY = posePhase === 'bottom' ? 140 : 90;
  const angleDisplay = posePhase === 'bottom' ? '88° (Depth OK)' : '172° (Lockout)';

  return (
    <View style={styles.container}>
      {/* Live Camera Feed Viewfinder */}
      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror={true}
          />
        ) : (
          <LinearGradient
            colors={['#0F172A', '#0B0F19', '#05070B']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {!permission?.granted && (
          <TouchableOpacity
            style={styles.enableCamBtn}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <CameraIcon size={14} color="#FFFFFF" />
            <Text style={styles.enableCamText}>Enable Camera Preview</Text>
          </TouchableOpacity>
        )}

        {/* HUD Scanner Grid Effect */}
        <View style={styles.gridOverlay} pointerEvents="none">
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {/* Biomechanical Skeleton Keypoint Overlay */}
        <View style={styles.skeletonContainer}>
          <Svg width={240} height={360} viewBox="0 0 240 360">
            {/* Spine & Torso */}
            <Line x1={120} y1={shoulderY} x2={120} y2={hipY} stroke={Colors.primary} strokeWidth={4} />
            <Line x1={65} y1={shoulderY} x2={175} y2={shoulderY} stroke={Colors.primary} strokeWidth={4} />
            
            {/* Arms */}
            <Line x1={65} y1={shoulderY} x2={45} y2={shoulderY + 50} stroke={Colors.primary} strokeWidth={3} />
            <Line x1={175} y1={shoulderY} x2={195} y2={shoulderY + 50} stroke={Colors.primary} strokeWidth={3} />

            {/* Pelvis & Legs */}
            <Line x1={85} y1={hipY} x2={155} y2={hipY} stroke={Colors.primary} strokeWidth={4} />
            <Line x1={85} y1={hipY} x2={kneeL_X} y2={kneeY} stroke={isTrackingGoodForm ? Colors.neonGreen : Colors.caution} strokeWidth={4} />
            <Line x1={155} y1={hipY} x2={kneeR_X} y2={kneeY} stroke={isTrackingGoodForm ? Colors.neonGreen : Colors.caution} strokeWidth={4} />
            <Line x1={kneeL_X} y1={kneeY} x2={ankleL_X} y2={320} stroke={isTrackingGoodForm ? Colors.neonGreen : Colors.caution} strokeWidth={4} />
            <Line x1={kneeR_X} y1={kneeY} x2={ankleR_X} y2={320} stroke={isTrackingGoodForm ? Colors.neonGreen : Colors.caution} strokeWidth={4} />

            {/* Head node */}
            <Circle cx={120} cy={shoulderY - 35} r={18} fill="rgba(79, 124, 255, 0.25)" stroke={Colors.primary} strokeWidth={2} />

            {/* Joint Nodes */}
            {[
              { cx: 65, cy: shoulderY },
              { cx: 175, cy: shoulderY },
              { cx: 120, cy: hipY },
              { cx: kneeL_X, cy: kneeY, highlight: true },
              { cx: kneeR_X, cy: kneeY, highlight: true },
              { cx: ankleL_X, cy: 320 },
              { cx: ankleR_X, cy: 320 },
            ].map((node, i) => (
              <Circle
                key={i}
                cx={node.cx}
                cy={node.cy}
                r={node.highlight ? 8 : 6}
                fill={node.highlight ? (isTrackingGoodForm ? Colors.neonGreen : Colors.caution) : Colors.primary}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}

            {/* Angle Indicator Tag */}
            <Rect x={100} y={kneeY - 24} width={100} height={20} rx={10} fill="rgba(0,0,0,0.7)" />
            <SvgText x={150} y={kneeY - 10} fill={Colors.neonGreen} fontSize="10" fontWeight="bold" textAnchor="middle">
              {angleDisplay}
            </SvgText>
          </Svg>
        </View>

        {/* Top HUD: Status, Timer & Exercise Name */}
        <View style={styles.topHud}>
          <View style={styles.statusPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>AI POSE ENGINE • 60 FPS</Text>
          </View>
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>{formatTimer(timerSeconds)}</Text>
          </View>
        </View>

        {/* Live Form Score Gauge HUD */}
        <View style={styles.scoreHud}>
          <View style={styles.scorePill}>
            <Sparkles size={16} color={Colors.neonGreen} />
            <Text style={styles.scoreLabel}>FORM ACCURACY</Text>
            <Text style={styles.scoreValue}>{liveFormScore}%</Text>
          </View>
        </View>

        {/* AI Real-Time Coaching Speech Bubble */}
        <View style={styles.coachBubbleContainer}>
          <LinearGradient
            colors={
              isTrackingGoodForm
                ? ['rgba(34, 255, 176, 0.2)', 'rgba(16, 185, 129, 0.08)']
                : ['rgba(245, 158, 11, 0.25)', 'rgba(239, 68, 68, 0.1)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.coachBubble,
              {
                borderColor: isTrackingGoodForm ? 'rgba(34, 255, 176, 0.4)' : 'rgba(245, 158, 11, 0.5)',
              },
            ]}
          >
            {isTrackingGoodForm ? (
              <CheckCircle2 size={18} color={Colors.neonGreen} />
            ) : (
              <AlertTriangle size={18} color={Colors.caution} />
            )}
            <Text style={styles.coachText}>{liveFeedback}</Text>
          </LinearGradient>
        </View>

        {/* Reps Counter Display */}
        <View style={styles.repCounterContainer}>
          <Text style={styles.repsNumber}>{currentRep}</Text>
          <Text style={styles.repsTarget}>/ {targetReps} REPS</Text>
        </View>
      </View>

      {/* Bottom Action HUD Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsPaused(!isPaused)}
          style={styles.controlBtnSecondary}
        >
          {isPaused ? <Play size={20} color="#FFFFFF" /> : <Pause size={20} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Big Tap to Simulate Rep Increment */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={triggerRep}
          style={styles.simulateRepBtn}
        >
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.simulateRepGradient}
          >
            <Sparkles size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.simulateRepText}>+1 Rep (Simulate Pose)</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            finishWorkout();
          }}
          style={styles.controlBtnFinish}
        >
          <Square size={18} color="#FF4D4D" fill="#FF4D4D" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    justifyContent: 'space-between',
  },
  viewfinder: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  skeletonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHud: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3D00',
    marginRight: 6,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scoreHud: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: Colors.borderActive,
    gap: 6,
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  scoreValue: {
    color: Colors.neonGreen,
    fontSize: 14,
    fontWeight: '900',
  },
  coachBubbleContainer: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
  },
  coachBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.2,
    gap: 10,
    backgroundColor: 'rgba(11, 13, 18, 0.85)',
  },
  coachText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  repCounterContainer: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
  },
  repsNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  repsTarget: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginTop: -4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  controlBtnSecondary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlBtnFinish: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 77, 77, 0.4)',
  },
  simulateRepBtn: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  simulateRepGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  simulateRepText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  enableCamBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(79, 124, 255, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  enableCamText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
