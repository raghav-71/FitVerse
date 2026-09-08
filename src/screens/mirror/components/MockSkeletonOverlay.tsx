import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';
import { AlertTriangle, UserCheck } from 'lucide-react-native';
import { Colors } from '../../../theme/colors';

interface MockSkeletonOverlayProps {
  isPersonDetected?: boolean;
  repCount?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MockSkeletonOverlay: React.FC<MockSkeletonOverlayProps> = ({
  isPersonDetected = true,
  repCount = 0,
}) => {
  // Gentle breathing/squatting animation loop
  const animValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous subtle biomechanic tracking motion
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [animValue]);

  // Pulse when rep increments
  useEffect(() => {
    if (repCount > 0) {
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.15,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(pulseValue, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [repCount, pulseValue]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20], // subtle vertical squat displacement
  });

  const svgWidth = Math.min(SCREEN_WIDTH * 0.75, 300);
  const svgHeight = Math.min(SCREEN_HEIGHT * 0.52, 420);

  // Normalized keypoints centered in the box (300 x 420)
  const headX = 150;
  const headY = 48;
  const neckX = 150;
  const neckY = 88;

  // Shoulders
  const lShoulderX = 110;
  const lShoulderY = 100;
  const rShoulderX = 190;
  const rShoulderY = 100;

  // Elbows
  const lElbowX = 85;
  const lElbowY = 155;
  const rElbowX = 215;
  const rElbowY = 155;

  // Wrists
  const lWristX = 92;
  const lWristY = 210;
  const rWristX = 208;
  const rWristY = 210;

  // Hips
  const midHipX = 150;
  const midHipY = 205;
  const lHipX = 125;
  const lHipY = 215;
  const rHipX = 175;
  const rHipY = 215;

  // Knees
  const lKneeX = 115;
  const lKneeY = 295;
  const rKneeX = 185;
  const rKneeY = 295;

  // Ankles
  const lAnkleX = 105;
  const lAnkleY = 385;
  const rAnkleX = 195;
  const rAnkleY = 385;

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Edge State: No Person Detected Warning */}
      {!isPersonDetected && (
        <View style={styles.warningBanner}>
          <View style={styles.warningIconCircle}>
            <AlertTriangle size={20} color={Colors.warning} />
          </View>
          <View style={styles.warningTextCol}>
            <Text style={styles.warningTitle}>Pose Tracking Paused</Text>
            <Text style={styles.warningSub}>Make sure you're fully visible in frame</Text>
          </View>
        </View>
      )}

      {/* Biomechanical Calibration Status pill */}
      <View style={styles.calibrationPill}>
        <UserCheck size={14} color={isPersonDetected ? Colors.success : Colors.warning} />
        <Text
          style={[
            styles.calibrationText,
            { color: isPersonDetected ? Colors.success : Colors.warning },
          ]}
        >
          {isPersonDetected ? '17-KEYPOINT KINETIC LOCK: 60 FPS' : 'SEARCHING FOR ATHLETE...'}
        </Text>
      </View>

      {/* Animated Biomechanical Skeleton Graphic */}
      <Animated.View
        style={[
          styles.skeletonWrapper,
          {
            opacity: isPersonDetected ? 0.85 : 0.25,
            transform: [{ translateY }, { scale: pulseValue }],
          },
        ]}
      >
        <Svg width={svgWidth} height={svgHeight} viewBox="0 0 300 420">
          <G strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
            {/* Spine & Torso Lines */}
            <Line x1={headX} y1={headY + 12} x2={neckX} y2={neckY} stroke={Colors.primaryViolet} />
            <Line x1={neckX} y1={neckY} x2={midHipX} y2={midHipY} stroke={Colors.primary} />
            <Line x1={lShoulderX} y1={lShoulderY} x2={rShoulderX} y2={rShoulderY} stroke={Colors.primaryViolet} />
            <Line x1={lHipX} y1={lHipY} x2={rHipX} y2={rHipY} stroke={Colors.primaryViolet} />

            {/* Left Arm */}
            <Line x1={lShoulderX} y1={lShoulderY} x2={lElbowX} y2={lElbowY} stroke={Colors.primary} />
            <Line x1={lElbowX} y1={lElbowY} x2={lWristX} y2={lWristY} stroke={Colors.primary} />

            {/* Right Arm */}
            <Line x1={rShoulderX} y1={rShoulderY} x2={rElbowX} y2={rElbowY} stroke={Colors.primary} />
            <Line x1={rElbowX} y1={rElbowY} x2={rWristX} y2={rWristY} stroke={Colors.primary} />

            {/* Left Leg */}
            <Line x1={lHipX} y1={lHipY} x2={lKneeX} y2={lKneeY} stroke={Colors.success} strokeWidth={4} />
            <Line x1={lKneeX} y1={lKneeY} x2={lAnkleX} y2={lAnkleY} stroke={Colors.success} strokeWidth={4} />

            {/* Right Leg */}
            <Line x1={rHipX} y1={rHipY} x2={rKneeX} y2={rKneeY} stroke={Colors.success} strokeWidth={4} />
            <Line x1={rKneeX} y1={rKneeY} x2={rAnkleX} y2={rAnkleY} stroke={Colors.success} strokeWidth={4} />

            {/* Joints & Landmarks */}
            {/* Head node */}
            <Circle cx={headX} cy={headY} r={14} fill="rgba(168, 85, 247, 0.25)" stroke={Colors.primaryViolet} strokeWidth={2.5} />
            <Circle cx={headX} cy={headY} r={4} fill="#FFFFFF" />

            {/* Upper body nodes */}
            <Circle cx={neckX} cy={neckY} r={5} fill={Colors.primary} />
            <Circle cx={lShoulderX} cy={lShoulderY} r={6} fill={Colors.primaryViolet} />
            <Circle cx={rShoulderX} cy={rShoulderY} r={6} fill={Colors.primaryViolet} />
            <Circle cx={lElbowX} cy={lElbowY} r={5} fill={Colors.primary} />
            <Circle cx={rElbowX} cy={rElbowY} r={5} fill={Colors.primary} />
            <Circle cx={lWristX} cy={lWristY} r={5} fill="#FFFFFF" stroke={Colors.primary} strokeWidth={2} />
            <Circle cx={rWristX} cy={rWristY} r={5} fill="#FFFFFF" stroke={Colors.primary} strokeWidth={2} />

            {/* Hip nodes */}
            <Circle cx={midHipX} cy={midHipY} r={6} fill={Colors.primaryViolet} />
            <Circle cx={lHipX} cy={lHipY} r={7} fill={Colors.success} />
            <Circle cx={rHipX} cy={rHipY} r={7} fill={Colors.success} />

            {/* Knee nodes with depth indicator glow */}
            <Circle cx={lKneeX} cy={lKneeY} r={10} fill="rgba(34, 255, 176, 0.2)" stroke={Colors.success} strokeWidth={2} />
            <Circle cx={lKneeX} cy={lKneeY} r={5} fill={Colors.success} />
            <Circle cx={rKneeX} cy={rKneeY} r={10} fill="rgba(34, 255, 176, 0.2)" stroke={Colors.success} strokeWidth={2} />
            <Circle cx={rKneeX} cy={rKneeY} r={5} fill={Colors.success} />

            {/* Ankle nodes */}
            <Circle cx={lAnkleX} cy={lAnkleY} r={6} fill="#FFFFFF" stroke={Colors.success} strokeWidth={2} />
            <Circle cx={rAnkleX} cy={rAnkleY} r={6} fill="#FFFFFF" stroke={Colors.success} strokeWidth={2} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  calibrationPill: {
    position: 'absolute',
    top: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 13, 18, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calibrationText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  skeletonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    position: 'absolute',
    top: 108,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 46, 28, 0.94)',
    borderWidth: 1.5,
    borderColor: Colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 24,
    gap: 12,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  warningIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTextCol: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.warning,
  },
  warningSub: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 2,
  },
});
