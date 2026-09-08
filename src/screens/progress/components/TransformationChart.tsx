import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
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
const CHART_W = Math.min(SCREEN_WIDTH - 64, 380);

interface TransformationChartProps {
  timeframe: 30 | 60 | 90 | 180;
  currentWeight?: number;
  targetWeight?: number;
  weeklyWeightChange?: number;
}

export const TransformationChart: React.FC<TransformationChartProps> = ({
  timeframe,
  currentWeight = 75.8,
  targetWeight = 72.0,
  weeklyWeightChange,
}) => {
  const [metric, setMetric] = useState<'weight' | 'bodyFat'>('weight');
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  const handleToggleMetric = (m: 'weight' | 'bodyFat') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setMetric(m);
  };

  // Projected trajectories based on selected days (30, 60, 90, 180)
  // Each step has day, upper bound, median, lower bound
  const getTrajectoryData = () => {
    if (metric === 'weight') {
      const start = currentWeight;
      const target = targetWeight;
      const step1 = start + (target - start) * 0.33;
      const step2 = start + (target - start) * 0.66;
      const final = target;
      return [
        { day: 'Day 0', upper: start + 0.3, median: Number(start.toFixed(1)), lower: start - 0.3 },
        { day: `Day ${Math.round(timeframe * 0.33)}`, upper: step1 + 0.6, median: Number(step1.toFixed(1)), lower: step1 - 0.6 },
        { day: `Day ${Math.round(timeframe * 0.66)}`, upper: step2 + 0.9, median: Number(step2.toFixed(1)), lower: step2 - 0.9 },
        { day: `Day ${timeframe}`, upper: final + 1.2, median: Number(final.toFixed(1)), lower: final - 1.2 },
      ];
    } else {
      // Body fat %: current 19.2%
      return [
        { day: 'Day 0', upper: 19.5, median: 19.2, lower: 18.9 },
        { day: `Day ${Math.round(timeframe * 0.33)}`, upper: 17.8, median: 17.2, lower: 16.5 },
        { day: `Day ${Math.round(timeframe * 0.66)}`, upper: 16.2, median: 15.3, lower: 14.4 },
        { day: `Day ${timeframe}`, upper: 14.8, median: 13.6, lower: 12.5 },
      ];
    }
  };

  const data = getTrajectoryData();
  const isWeight = metric === 'weight';
  const themeColor = isWeight ? colors.primary : colors.primaryViolet;

  const minVal = isWeight ? Math.min(68.0, Math.min(currentWeight, targetWeight) - 2) : 11.0;
  const maxVal = isWeight ? Math.max(80.0, Math.max(currentWeight, targetWeight) + 2) : 21.0;
  const chartH = 95;
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Compute coordinates for Upper, Median, Lower
  const slotW = (CHART_W - 40) / (data.length - 1);
  const upperPts = data.map((d, i) => ({
    x: 20 + i * slotW,
    y: 110 - ((d.upper - minVal) / (maxVal - minVal)) * chartH,
  }));

  const medianPts = data.map((d, i) => ({
    x: 20 + i * slotW,
    y: 110 - ((d.median - minVal) / (maxVal - minVal)) * chartH,
    val: d.median,
    label: d.day,
  }));

  const lowerPts = data.map((d, i) => ({
    x: 20 + i * slotW,
    y: 110 - ((d.lower - minVal) / (maxVal - minVal)) * chartH,
  }));

  // Build shaded band path (Upper curve forward, Lower curve backward)
  const upperPathStr = upperPts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const lowerRev = [...lowerPts].reverse();
  const lowerPathStr = lowerRev.reduce((acc, p) => `${acc} L ${p.x} ${p.y}`, '');
  const bandAreaPath = `${upperPathStr} ${lowerPathStr} Z`;

  const medianPathStr = medianPts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <GlassCard style={styles.card} padding={16}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('confidenceBandForecast') || 'CONFIDENCE BAND FORECAST'}</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {num(timeframe)}-Day Projected Trajectory
          </Text>
        </View>

        {/* Metric Selector Pills */}
        <View style={[styles.metricSwitcher, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleToggleMetric('weight')}
            style={[styles.metricBtn, isWeight && [styles.metricBtnActive, { backgroundColor: colors.primary }]]}
          >
            <Text style={[styles.metricBtnText, { color: isWeight ? '#FFFFFF' : colors.textSecondary }]}>
              Weight (kg)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleToggleMetric('bodyFat')}
            style={[styles.metricBtn, !isWeight && [styles.metricBtnActiveViolet, { backgroundColor: colors.primaryViolet }]]}
          >
            <Text style={[styles.metricBtnText, { color: !isWeight ? '#FFFFFF' : colors.textSecondary }]}>
              Body Fat (%)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SVG Shaded Band Chart */}
      <View style={styles.svgWrapper}>
        <Svg width={CHART_W} height={145} viewBox={`0 0 ${CHART_W} 145`}>
          <Defs>
            <LinearGradient id="bandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={themeColor} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={themeColor} stopOpacity={0.08} />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          <Line x1={0} y1={25} x2={CHART_W} y2={25} stroke={gridStroke} />
          <Line x1={0} y1={65} x2={CHART_W} y2={65} stroke={gridStroke} />
          <Line x1={0} y1={110} x2={CHART_W} y2={110} stroke={gridStroke} />

          {/* Shaded Confidence Band */}
          <Path d={bandAreaPath} fill="url(#bandGrad)" />

          {/* Upper bound dashed guideline */}
          <Path
            d={upperPathStr}
            fill="none"
            stroke={themeColor}
            strokeDasharray="4, 3"
            strokeWidth={1}
            opacity={0.6}
          />

          {/* Lower bound dashed guideline */}
          <Path
            d={lowerPts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
            fill="none"
            stroke={themeColor}
            strokeDasharray="4, 3"
            strokeWidth={1}
            opacity={0.6}
          />

          {/* Median Trajectory Line */}
          <Path d={medianPathStr} fill="none" stroke={themeColor} strokeWidth={3} strokeLinecap="round" />

          {/* Landmark points with projection value callout */}
          {medianPts.map((p, idx) => (
            <G key={idx}>
              <Circle cx={p.x} cy={p.y} r={4.5} fill={themeColor} stroke={colors.cardBackground} strokeWidth={2} />
              <SvgText
                x={p.x}
                y={p.y - 7}
                fill={themeColor}
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
              >
                {num(p.val)}{isWeight ? 'kg' : '%'}
              </SvgText>
              <SvgText
                x={p.x}
                y={130}
                fill={colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {p.label}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>

      {/* Legend & Confidence description */}
      <View style={[styles.legendBar, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
        <View style={styles.legendRow}>
          <View style={[styles.bandIndicator, { backgroundColor: themeColor }]} />
          <Text style={[styles.legendDesc, { color: colors.textSecondary }]}>{t('shadedBandDesc') || 'Shaded Band: ±90% Confidence Interval'}</Text>
        </View>
        <Text style={[styles.rateText, { color: colors.neonGreen }]}>
          {isWeight ? 'Avg Rate: ~0.45kg / week' : 'Est. Loss: -5.6% Body Fat'}
        </Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 12,
    marginBottom: 14,
  },
  headerRow: {
    gap: 8,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
    alignSelf: 'flex-start',
  },
  metricBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  metricBtnActive: {
    backgroundColor: Colors.primary,
  },
  metricBtnActiveViolet: {
    backgroundColor: Colors.primaryViolet,
  },
  metricBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  metricBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  svgWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bandIndicator: {
    width: 14,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  legendDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  rateText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neonGreen,
  },
});
