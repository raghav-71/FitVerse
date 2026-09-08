import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface RadialGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  title?: string;
  subtitle?: string;
  gradientColors?: [string, string];
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  score,
  size = 130,
  strokeWidth = 10,
  title,
  subtitle = 'FORM ACCURACY',
  gradientColors = [Colors.accentSky, Colors.neonGreen],
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="100%" stopColor={gradientColors[1]} />
          </SvgGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAE6DC"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.content}>
        <Text style={styles.scoreNumber}>{Math.round(score)}%</Text>
        <Text style={styles.scoreSubtitle}>{subtitle}</Text>
        {title ? <Text style={styles.scoreTitle}>{title}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  scoreSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.neonGreen,
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  scoreTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
