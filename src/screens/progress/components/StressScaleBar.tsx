import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, HeartPulse } from 'lucide-react-native';
import { Colors } from '../../../theme/colors';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

interface StressScaleBarProps {
  score: number; // 1 to 5
}

export const StressScaleBar: React.FC<StressScaleBarProps> = ({ score = 2 }) => {
  const { colors, isDark } = useTheme();
  const { num } = useTranslation();

  const levels = [
    { num: 1, label: 'Optimal', color: colors.success, text: 'Peak Recovery' },
    { num: 2, label: 'Mild', color: colors.neonGreen, text: 'Good Balance' },
    { num: 3, label: 'Moderate', color: colors.warning, text: 'Manage Fatigue' },
    { num: 4, label: 'High', color: '#F97316', text: 'Elevated Strain' },
    { num: 5, label: 'Severe', color: colors.danger, text: 'Deload Needed' },
  ];

  const current = levels[Math.max(0, Math.min(score - 1, 4))];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', borderColor: colors.border }]}>
      {/* Header status */}
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <HeartPulse size={16} color={current.color} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Weekly Autonomic Stress</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${current.color}20`, borderColor: `${current.color}50` }]}>
          <Text style={[styles.statusText, { color: current.color }]}>
            Level {num(score)}: {current.text}
          </Text>
        </View>
      </View>

      {/* Segmented Bar (5 steps) */}
      <View style={styles.segmentTrack}>
        {levels.map((lvl) => {
          const isActive = score === lvl.num;
          return (
            <View key={lvl.num} style={styles.segmentCol}>
              <View
                style={[
                  styles.segmentBar,
                  {
                    backgroundColor: lvl.color,
                    opacity: lvl.num <= score ? 0.9 : 0.2,
                    height: isActive ? 10 : 6,
                  },
                ]}
              />
              <Text
                style={[
                  styles.segmentNum,
                  { color: colors.textSecondary },
                  isActive && { color: colors.textPrimary, fontWeight: '900' },
                ]}
              >
                {num(lvl.num)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer scale labels */}
      <View style={styles.scaleLabelsRow}>
        <Text style={[styles.scaleLabelLow, { color: colors.success }]}>Low Stress (Fresh)</Text>
        <Text style={[styles.scaleLabelHigh, { color: colors.danger }]}>High Stress (Fatigued)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  segmentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  segmentCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  segmentBar: {
    width: '100%',
    borderRadius: 3,
  },
  segmentNum: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  scaleLabelLow: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '600',
  },
  scaleLabelHigh: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '600',
  },
});
