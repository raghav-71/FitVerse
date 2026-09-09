import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../../theme/colors';

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
  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 90;
  const animatedScore = useRef(new Animated.Value(safeScore)).current;
  const [currentAnimatedScore, setCurrentAnimatedScore] = useState(safeScore);

  useEffect(() => {
    const targetVal = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 90;
    const anim = Animated.timing(animatedScore, {
      toValue: targetVal,
      duration: 500,
      useNativeDriver: false,
    });
    const id = animatedScore.addListener(({ value }) => {
      if (Number.isFinite(value)) {
        setCurrentAnimatedScore(value);
      }
    });
    anim.start();
    return () => {
      try {
        if (typeof animatedScore.removeListener === 'function') {
          animatedScore.removeListener(id);
        } else if (typeof (animatedScore as any).removeAllListeners === 'function') {
          (animatedScore as any).removeAllListeners();
        }
      } catch {}
    };
  }, [score, animatedScore]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validScore = Number.isFinite(currentAnimatedScore) ? currentAnimatedScore : safeScore;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(100, validScore)) / 100);

  // Determine color based on score thresholds
  const getColor = (val: number) => {
    const num = Number.isFinite(val) ? val : 80;
    if (num >= 80) return Colors.success;
    if (num >= 50) return Colors.warning;
    return Colors.danger;
  };

  const currentColor = getColor(safeScore);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={[styles.svg, { transform: [{ rotate: '-90deg' }] }]}
      >
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active score ring */}
        <Circle
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
