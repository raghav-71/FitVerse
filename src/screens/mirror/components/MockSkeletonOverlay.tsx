import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { AlertTriangle, UserCheck } from 'lucide-react-native';
import { Colors } from '../../../theme/colors';

interface MockSkeletonOverlayProps {
  isPersonDetected?: boolean;
  isPoseAvailable?: boolean;
  repCount?: number;
  exerciseType?: string;
  formScore?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MockSkeletonOverlay: React.FC<MockSkeletonOverlayProps> = ({
  isPersonDetected = true,
  isPoseAvailable = true,
  repCount = 0,
  exerciseType = 'squat',
  formScore = 92,
}) => {
  // Gentle breathing/kinematic motion loop
  const animValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: exerciseType === 'jumping_jack' ? 900 : 1800,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: exerciseType === 'jumping_jack' ? 900 : 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [animValue, exerciseType]);

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
    outputRange: [0, exerciseType === 'plank' ? 3 : 20],
  });

  const svgWidth = Math.min(SCREEN_WIDTH * 0.75, 300);
  const svgHeight = Math.min(SCREEN_HEIGHT * 0.52, 420);

  const isGoodForm = formScore >= 85;
  const jointStroke = isGoodForm ? Colors.success : Colors.warning;
  const jointFillGlow = isGoodForm ? 'rgba(34, 255, 176, 0.2)' : 'rgba(245, 158, 11, 0.2)';

  // Keypoints configuration
  const headX = 150;
  const headY = 48;
  const neckX = 150;
  const neckY = 88;

  const lShoulderX = 110;
  const lShoulderY = 100;
  const rShoulderX = 190;
  const rShoulderY = 100;

  const lElbowX = 85;
  const lElbowY = 155;
  const rElbowX = 215;
  const rElbowY = 155;

  const lWristX = 92;
  const lWristY = 210;
  const rWristX = 208;
  const rWristY = 210;

  const midHipX = 150;
  const midHipY = 205;
  const lHipX = 125;
  const lHipY = 215;
  const rHipX = 175;
  const rHipY = 215;

  const lKneeX = 115;
  const lKneeY = 295;
  const rKneeX = 185;
  const rKneeY = 295;

  const lAnkleX = 105;
  const lAnkleY = 385;
  const rAnkleX = 195;
  const rAnkleY = 385;

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Edge State: Pose Detection Temporarily Unavailable or No Person Detected Warning */}
      {!isPoseAvailable ? (
        <View style={styles.warningBanner}>
          <View style={styles.warningIconCircle}>
            <AlertTriangle size={20} color={Colors.warning} />
          </View>
          <View style={styles.warningTextCol}>
            <Text style={styles.warningTitle}>Pose detection temporarily unavailable</Text>
            <Text style={styles.warningSub}>Camera mirror active • Keep going with your workout</Text>
          </View>
        </View>
      ) : !isPersonDetected ? (
        <View style={styles.warningBanner}>
          <View style={styles.warningIconCircle}>
            <AlertTriangle size={20} color={Colors.warning} />
          </View>
          <View style={styles.warningTextCol}>
            <Text style={styles.warningTitle}>Pose Tracking Paused</Text>
            <Text style={styles.warningSub}>Make sure you're fully visible in frame</Text>
          </View>
        </View>
      ) : null}

      {/* Biomechanical Calibration Status pill */}
      <View style={styles.calibrationPill}>
        <UserCheck size={14} color={!isPoseAvailable ? Colors.warning : isPersonDetected ? Colors.success : Colors.warning} />
        <Text
          style={[
            styles.calibrationText,
            { color: !isPoseAvailable ? Colors.warning : isPersonDetected ? Colors.success : Colors.warning },
          ]}
        >
          {!isPoseAvailable
            ? 'AI VISION MIRROR ACTIVE • POSE STANDBY'
            : isPersonDetected
            ? `AI KINEMATIC LOCK: ${exerciseType.toUpperCase()} (60 FPS)`
            : 'SEARCHING FOR ATHLETE...'}
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
            <Line x1={lHipX} y1={lHipY} x2={lKneeX} y2={lKneeY} stroke={jointStroke} strokeWidth={4} />
            <Line x1={lKneeX} y1={lKneeY} x2={lAnkleX} y2={lAnkleY} stroke={jointStroke} strokeWidth={4} />

            {/* Right Leg */}
            <Line x1={rHipX} y1={rHipY} x2={rKneeX} y2={rKneeY} stroke={jointStroke} strokeWidth={4} />
            <Line x1={rKneeX} y1={rKneeY} x2={rAnkleX} y2={rAnkleY} stroke={jointStroke} strokeWidth={4} />

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
            <Circle cx={lHipX} cy={lHipY} r={7} fill={jointStroke} />
            <Circle cx={rHipX} cy={rHipY} r={7} fill={jointStroke} />

            {/* Knee nodes with depth indicator glow */}
            <Circle cx={lKneeX} cy={lKneeY} r={10} fill={jointFillGlow} stroke={jointStroke} strokeWidth={2} />
            <Circle cx={lKneeX} cy={lKneeY} r={5} fill={jointStroke} />
            <Circle cx={rKneeX} cy={rKneeY} r={10} fill={jointFillGlow} stroke={jointStroke} strokeWidth={2} />
            <Circle cx={rKneeX} cy={rKneeY} r={5} fill={jointStroke} />

            {/* Ankle nodes */}
            <Circle cx={lAnkleX} cy={lAnkleY} r={6} fill="#FFFFFF" stroke={jointStroke} strokeWidth={2} />
            <Circle cx={rAnkleX} cy={rAnkleY} r={6} fill="#FFFFFF" stroke={jointStroke} strokeWidth={2} />

            {/* Kinetic Ray Guide for active target joint */}
            {exerciseType === 'squat' && (
              <G>
                <Line x1={lKneeX} y1={lKneeY} x2={rKneeX} y2={rKneeY} stroke="rgba(34, 255, 176, 0.4)" strokeDasharray="4,4" strokeWidth={1.5} />
                <SvgText x={150} y={285} fill={Colors.success} fontSize={10} textAnchor="middle" fontWeight="bold">
                  VALGUS SAFE
                </SvgText>
              </G>
            )}
            {exerciseType === 'plank' && (
              <G>
                <Line x1={lShoulderX - 20} y1={lShoulderY + 95} x2={rAnkleX + 20} y2={rAnkleY - 95} stroke="rgba(79, 124, 255, 0.4)" strokeDasharray="3,3" strokeWidth={1.5} />
                <SvgText x={150} y={195} fill={Colors.primary} fontSize={10} textAnchor="middle" fontWeight="bold">
                  NEUTRAL SPINE 180°
                </SvgText>
              </G>
            )}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  skeletonWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calibrationPill: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 10,
  },
  calibrationText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  warningBanner: {
    position: 'absolute',
    top: 108,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 14,
    padding: 12,
    zIndex: 10,
  },
  warningIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTextCol: {
    flex: 1,
  },
  warningTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  warningSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
});
