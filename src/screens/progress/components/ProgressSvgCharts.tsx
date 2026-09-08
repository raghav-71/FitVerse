import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, {
  Path,
  Rect,
  Line,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 64, 380);

// =========================================================================
// 1. WORKOUT FREQUENCY BAR CHART (7d / 30d Toggle)
// =========================================================================
export const WorkoutFrequencyChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const animHeight = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  useEffect(() => {
    animHeight.setValue(0);
    Animated.timing(animHeight, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [timeframe, animHeight]);

  const days7 = [
    { label: 'Mon', mins: 45 },
    { label: 'Tue', mins: 60 },
    { label: 'Wed', mins: 30 },
    { label: 'Thu', mins: 75 },
    { label: 'Fri', mins: 50 },
    { label: 'Sat', mins: 90 },
    { label: 'Sun', mins: 65 },
  ];

  const days30Weeks = [
    { label: 'Wk 1', mins: 280 },
    { label: 'Wk 2', mins: 340 },
    { label: 'Wk 3', mins: 310 },
    { label: 'Wk 4', mins: 385 },
  ];

  const dataset = timeframe === '7d' ? days7 : days30Weeks;
  const maxVal = timeframe === '7d' ? 100 : 450;
  const chartH = 110;
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <GlassCard style={styles.chartCard} padding={16}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartSub, { color: colors.textSecondary }]}>{t('trainingCadence') || 'TRAINING CADENCE'}</Text>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t('workoutFrequency') || 'Workout Frequency'}</Text>
        </View>

        {/* 7d / 30d Switcher */}
        <View style={[styles.toggleRow, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
          {(['7d', '30d'] as const).map((tVal) => {
            const isSel = timeframe === tVal;
            return (
              <TouchableOpacity
                key={tVal}
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setTimeframe(tVal);
                }}
                style={[styles.toggleBtn, isSel && [styles.toggleBtnActive, { backgroundColor: colors.primary }]]}
              >
                <Text style={[styles.toggleText, { color: isSel ? '#FFFFFF' : colors.textSecondary }]}>
                  {tVal.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SVG Bar Chart */}
      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={145} viewBox={`0 0 ${CHART_WIDTH} 145`}>
          <Defs>
            <LinearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.primaryViolet} stopOpacity={0.85} />
            </LinearGradient>
            <LinearGradient id="todayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.neonGreen} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.85} />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          <Line x1={0} y1={20} x2={CHART_WIDTH} y2={20} stroke={gridStroke} strokeWidth={1} />
          <Line x1={0} y1={65} x2={CHART_WIDTH} y2={65} stroke={gridStroke} strokeWidth={1} />
          <Line x1={0} y1={110} x2={CHART_WIDTH} y2={110} stroke={gridStroke} strokeWidth={1} />

          {/* Bars */}
          {dataset.map((item, idx) => {
            const slotWidth = CHART_WIDTH / dataset.length;
            const barW = timeframe === '7d' ? 14 : 26;
            const x = idx * slotWidth + (slotWidth - barW) / 2;
            const barHeight = Math.max(8, (item.mins / maxVal) * chartH);
            const y = 110 - barHeight;
            const isHighlight = idx === dataset.length - 2;

            return (
              <G key={idx}>
                {/* Bar */}
                <Rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barHeight}
                  rx={barW / 2}
                  fill={isHighlight ? 'url(#todayGrad)' : 'url(#barGrad)'}
                />

                {/* Top value */}
                <SvgText
                  x={x + barW / 2}
                  y={y - 5}
                  fill={colors.textSecondary}
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {num(item.mins)}m
                </SvgText>

                {/* X-axis label */}
                <SvgText
                  x={x + barW / 2}
                  y={130}
                  fill={isHighlight ? colors.neonGreen : colors.textSecondary}
                  fontSize="10"
                  fontWeight={isHighlight ? '800' : '600'}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </GlassCard>
  );
};

// =========================================================================
// 2. REPS OVER TIME LINE CHART (Success Green with Area Fill)
// =========================================================================
export const RepsOverTimeChart: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  const points = [
    { label: 'W1', reps: 140 },
    { label: 'W2', reps: 220 },
    { label: 'W3', reps: 190 },
    { label: 'W4', reps: 310 },
    { label: 'W5', reps: 280 },
    { label: 'W6', reps: 420 },
  ];

  const maxReps = 500;
  const chartH = 90;
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Build SVG Path
  const coords = points.map((p, i) => {
    const slotW = (CHART_WIDTH - 40) / (points.length - 1);
    const x = 20 + i * slotW;
    const y = 100 - (p.reps / maxReps) * chartH;
    return { x, y, reps: p.reps, label: p.label };
  });

  const linePath = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} 105 L ${coords[0].x} 105 Z`;

  return (
    <GlassCard style={styles.chartCard} padding={16}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartSub, { color: colors.textSecondary }]}>{t('volumeProgression') || 'VOLUME PROGRESSION'}</Text>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t('cumulativeReps') || 'Cumulative Reps Tracked'}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.neonGreen }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('validatedReps') || 'Validated Reps'}</Text>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={135} viewBox={`0 0 ${CHART_WIDTH} 135`}>
          <Defs>
            <LinearGradient id="repAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.neonGreen} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={colors.neonGreen} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Horizontal lines */}
          <Line x1={0} y1={20} x2={CHART_WIDTH} y2={20} stroke={gridStroke} />
          <Line x1={0} y1={60} x2={CHART_WIDTH} y2={60} stroke={gridStroke} />
          <Line x1={0} y1={105} x2={CHART_WIDTH} y2={105} stroke={gridStroke} />

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#repAreaGrad)" />

          {/* Line */}
          <Path d={linePath} fill="none" stroke={colors.neonGreen} strokeWidth={3} strokeLinecap="round" />

          {/* Coordinate Circles & Labels */}
          {coords.map((c, idx) => (
            <G key={idx}>
              <Circle cx={c.x} cy={c.y} r={4.5} fill={colors.neonGreen} stroke={colors.cardBackground} strokeWidth={2} />
              <SvgText
                x={c.x}
                y={122}
                fill={colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {c.label}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>
    </GlassCard>
  );
};

// =========================================================================
// 3. FORM-SCORE TREND (Color Tiers: Green >= 80, Amber 50-79, Red < 50)
// =========================================================================
interface FormScoreTrendChartProps {
  scores?: Array<{ session: string; score: number }>;
}

export const FormScoreTrendChart: React.FC<FormScoreTrendChartProps> = ({ scores: propScores }) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  const defaultScores = [
    { session: 'S1', score: 76 },
    { session: 'S2', score: 82 },
    { session: 'S3', score: 86 },
    { session: 'S4', score: 91 },
    { session: 'S5', score: 89 },
    { session: 'S6', score: 95 },
    { session: 'S7', score: 96 },
  ];

  const scores = propScores && propScores.length > 0 ? propScores : defaultScores;

  const chartH = 80;
  const coords = scores.map((s, i) => {
    const slotW = (CHART_WIDTH - 40) / Math.max(1, scores.length - 1);
    const x = 20 + i * slotW;
    const y = 100 - ((s.score - 40) / 60) * chartH;
    return { x, y, score: s.score, session: s.session };
  });

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return colors.success;
    if (sc >= 50) return colors.warning;
    return colors.danger;
  };

  const linePath = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');

  return (
    <GlassCard style={styles.chartCard} padding={16}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartSub, { color: colors.textSecondary }]}>{t('biomechanicAccuracy') || 'BIOMECHANIC ACCURACY'}</Text>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t('formScoreTrend') || 'Form-Score Trend'}</Text>
        </View>
        <View style={[styles.scoreTiersPill, { backgroundColor: isDark ? 'rgba(34, 255, 176, 0.15)' : 'rgba(34, 255, 176, 0.1)' }]}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.success }]}>≥80% Elite Tier</Text>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={135} viewBox={`0 0 ${CHART_WIDTH} 135`}>
          {/* Target 90% reference guide */}
          <Line
            x1={0}
            y1={100 - ((90 - 40) / 60) * chartH}
            x2={CHART_WIDTH}
            y2={100 - ((90 - 40) / 60) * chartH}
            stroke={isDark ? 'rgba(34, 255, 176, 0.35)' : 'rgba(39, 103, 56, 0.3)'}
            strokeDasharray="4, 4"
            strokeWidth={1}
          />

          {/* Trend Line */}
          <Path d={linePath} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" />

          {/* Individual Points Colored by Quality */}
          {coords.map((c, idx) => {
            const ptColor = getScoreColor(c.score);
            return (
              <G key={idx}>
                <Circle cx={c.x} cy={c.y} r={5} fill={ptColor} stroke={colors.cardBackground} strokeWidth={2} />
                <SvgText
                  x={c.x}
                  y={c.y - 7}
                  fill={ptColor}
                  fontSize="9"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {num(c.score)}%
                </SvgText>
                <SvgText
                  x={c.x}
                  y={122}
                  fill={colors.textSecondary}
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {c.session}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </GlassCard>
  );
};

// =========================================================================
// 4. WEIGHT TREND CHART (With Dashed Goal-Line Marker)
// =========================================================================
export const WeightTrendChart: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  const weightLogs = [
    { date: 'Aug 10', weight: 78.4 },
    { date: 'Aug 17', weight: 77.8 },
    { date: 'Aug 24', weight: 77.1 },
    { date: 'Aug 31', weight: 76.5 },
    { date: 'Sep 05', weight: 75.8 },
  ];

  const goalWeight = 72.0;
  const minW = 70.0;
  const maxW = 80.0;
  const chartH = 85;

  const coords = weightLogs.map((w, i) => {
    const slotW = (CHART_WIDTH - 40) / (weightLogs.length - 1);
    const x = 20 + i * slotW;
    const y = 100 - ((w.weight - minW) / (maxW - minW)) * chartH;
    return { x, y, weight: w.weight, date: w.date };
  });

  const linePath = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');
  const goalY = 100 - ((goalWeight - minW) / (maxW - minW)) * chartH;

  return (
    <GlassCard style={styles.chartCard} padding={16}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartSub, { color: colors.textSecondary }]}>{t('bodyComposition') || 'BODY COMPOSITION'}</Text>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t('weightTrendGoal') || 'Weight Trend & Goal'}</Text>
        </View>

        <View style={styles.legendGroup}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.accentSky }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Actual (kg)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendText, { color: colors.warning }]}>Goal ({num(72.0)} kg)</Text>
          </View>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={135} viewBox={`0 0 ${CHART_WIDTH} 135`}>
          {/* Dashed Goal Marker Line */}
          <Line
            x1={10}
            y1={goalY}
            x2={CHART_WIDTH - 10}
            y2={goalY}
            stroke={colors.warning}
            strokeDasharray="6, 4"
            strokeWidth={1.5}
          />
          <SvgText
            x={CHART_WIDTH - 15}
            y={goalY - 5}
            fill={colors.warning}
            fontSize="9"
            fontWeight="800"
            textAnchor="end"
          >
            GOAL: {num(72.0)} kg
          </SvgText>

          {/* Actual Weight Line */}
          <Path d={linePath} fill="none" stroke={colors.accentSky} strokeWidth={3} strokeLinecap="round" />

          {/* Points */}
          {coords.map((c, idx) => (
            <G key={idx}>
              <Circle cx={c.x} cy={c.y} r={4.5} fill={colors.accentSky} stroke={colors.cardBackground} strokeWidth={2} />
              <SvgText
                x={c.x}
                y={c.y - 7}
                fill={colors.textPrimary}
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
              >
                {num(c.weight)}
              </SvgText>
              <SvgText
                x={c.x}
                y={122}
                fill={colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {c.date}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    gap: 12,
    marginBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartSub: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  legendGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scoreTiersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 255, 176, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  svgWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
});
