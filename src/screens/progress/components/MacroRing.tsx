import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../../theme/colors';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroRingProps {
  current: number;
  target: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  current,
  target,
  label,
  unit,
  color,
  size = 86,
  strokeWidth = 7,
}) => {
  const { colors, isDark } = useTheme();
  const { num } = useTranslation();

  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: ratio,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [ratio, animProgress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={styles.svg}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </G>
        </Svg>

        <View style={styles.centerTextContainer}>
          <Text style={[styles.valueText, { color: colors.textPrimary }]}>{num(current)}</Text>
          <Text style={[styles.unitText, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
      </View>

      <Text style={[styles.labelText, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[styles.targetText, { color: colors.textMuted }]}>Target: {num(target)}{unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  svg: {
    position: 'absolute',
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  targetText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
