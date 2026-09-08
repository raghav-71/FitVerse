import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FormScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const FormScoreGauge: React.FC<FormScoreGaugeProps> = ({
  score,
  size = 90,
  strokeWidth = 7,
  showLabel = true,
}) => {
  const animatedScore = useRef(new Animated.Value(score)).current;

  useEffect(() => {
    Animated.timing(animatedScore, {
      toValue: Math.min(100, Math.max(0, score)),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [score, animatedScore]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animatedScore.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Determine color based on score thresholds
  const getColor = (val: number) => {
    if (val >= 80) return Colors.success;
    if (val >= 50) return Colors.warning;
    return Colors.danger;
  };

  const currentColor = getColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated active score ring */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Center score readout */}
      <View style={styles.centerContent}>
        <Text style={[styles.scoreValue, { color: currentColor }]}>
          {Math.round(score)}
          <Text style={styles.percentSign}>%</Text>
        </Text>
        {showLabel && <Text style={styles.labelText}>FORM</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  percentSign: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: -2,
  },
});
