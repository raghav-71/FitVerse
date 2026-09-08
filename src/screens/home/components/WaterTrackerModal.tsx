import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Droplet, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomSheetModal } from '../../../components/ui/BottomSheetModal';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Colors } from '../../../theme/colors';
import { useDailyActivityStore } from '../../../stores/dailyActivityStore';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

interface WaterTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WaterTrackerModal: React.FC<WaterTrackerModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const count = useDailyActivityStore((state) => state.waterGlasses);
  const maxGlasses = useDailyActivityStore((state) => state.maxGlasses);
  const yesterdayLiters = useDailyActivityStore((state) => state.yesterdayLiters);
  const avgLitersPerDay = useDailyActivityStore((state) => state.avgLitersPerDay);
  const waterStreak = useDailyActivityStore((state) => state.waterStreak);
  const addWaterGlass = useDailyActivityStore((state) => state.addWaterGlass);
  const setWaterGlasses = useDailyActivityStore((state) => state.setWaterGlasses);

  const progress = Math.min(count / maxGlasses, 1);

  const handleAddOne = () => {
    if (count < maxGlasses) {
      addWaterGlass();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const handleGlassTap = (index: number) => {
    const target = index + 1;
    setWaterGlasses(target);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getStatusHeadline = () => {
    if (count >= 8) return t('goalCompleted') || 'Goal Completed! 🏆';
    if (count >= 6) return t('almostThere') || 'Almost there! ⚡';
    if (count >= 4) return t('halfDone') || 'Half done! 🔥';
    if (count >= 2) return t('goodStart') || 'Good start! 💧';
    return t('trackHydration') || 'Track your hydration! 🧊';
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={`💧 ${t('water') || 'Water Tracker'}`}
      subtitle={t('clickToTrackWater') || 'Click to track your daily water intake!'}
    >
      <View style={styles.container}>
        {/* Top Status Card */}
        <View
          style={[
            styles.topStatusCard,
            {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#EBF6FF',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#D4E9FC',
            },
          ]}
        >
          {/* Circular Gauge */}
          <View
            style={[
              styles.gaugeWrap,
              { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#F0F8FF' },
            ]}
          >
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugeNumber}>{num(count)}</Text>
            </View>
          </View>

          {/* Right Status Info */}
          <View style={styles.statusInfoWrap}>
            <Text style={[styles.statusHeadline, { color: colors.textPrimary }]}>
              {getStatusHeadline()}
            </Text>
            <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
              {num(count)} {t('of') || 'of'} {num(maxGlasses)} {t('glassesDone') || 'glasses done'}
            </Text>
            <View style={styles.progressBarWrap}>
              <ProgressBar progress={progress} color="#38BDF8" height={6} />
            </View>
          </View>
        </View>

        {/* 2 Rows x 4 Glass Pill Tiles */}
        <View style={styles.glassGrid}>
          {Array.from({ length: maxGlasses }).map((_, idx) => {
            const isFilled = idx < count;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleGlassTap(idx)}
                activeOpacity={0.8}
                style={[
                  styles.glassTile,
                  isFilled
                    ? styles.glassTileFilled
                    : [
                        styles.glassTileEmpty,
                        {
                          backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                          borderColor: isDark ? colors.border : '#E5E7EB',
                        },
                      ],
                ]}
              >
                <Droplet
                  size={20}
                  color={isFilled ? '#FFFFFF' : colors.textSecondary}
                  fill={isFilled ? '#FFFFFF' : 'none'}
                />
                <Text
                  style={[
                    styles.glassNumber,
                    isFilled
                      ? styles.glassNumberFilled
                      : [styles.glassNumberEmpty, { color: colors.textSecondary }],
                  ]}
                >
                  {num(idx + 1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA Button (+ Add one glass) */}
        <TouchableOpacity
          style={[styles.addButton, count >= maxGlasses && styles.buttonDisabled]}
          onPress={handleAddOne}
          disabled={count >= maxGlasses}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>
            {count >= maxGlasses ? `✓ ${t('dailyGoalReached') || 'Daily Goal Reached'}` : `+ ${t('addOneGlass') || 'Add one glass'}`}
          </Text>
        </TouchableOpacity>

        {/* Footer Stats Row */}
        <View style={styles.footerRow}>
          <View
            style={[
              styles.footerPill,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.footerNumGreen,
                { color: isDark ? colors.neonGreen : '#166534' },
              ]}
            >
              {num(yesterdayLiters || '1.0')}L
            </Text>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{t('yesterday') || 'Yesterday'}</Text>
          </View>

          <View
            style={[
              styles.footerPill,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.footerNumGreen,
                { color: isDark ? colors.neonGreen : '#166534' },
              ]}
            >
              {num(avgLitersPerDay || '1.3')}L
            </Text>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{t('avgPerDay') || 'Avg / day'}</Text>
          </View>

          <View
            style={[
              styles.footerPill,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <View style={styles.streakInline}>
              <Text
                style={[
                  styles.streakNum,
                  { color: isDark ? colors.neonGreen : '#166534' },
                ]}
              >
                {num(waterStreak || 7)}
              </Text>
              <Text style={styles.fireEmoji}>🔥</Text>
            </View>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{t('streakBadge') || 'Streak'}</Text>
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  topStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF6FF', // Soft light blue from screenshot 3
    padding: 16,
    borderRadius: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: '#D4E9FC',
  },
  gaugeWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
  },
  gaugeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0284C7',
  },
  statusInfoWrap: {
    flex: 1,
    gap: 4,
  },
  statusHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarWrap: {
    marginTop: 6,
  },

  // 8 Glass Tiles (2 rows of 4)
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  glassTile: {
    width: '22.5%',
    aspectRatio: 0.95,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  glassTileFilled: {
    backgroundColor: '#38BDF8', // Cyan-blue from screenshot 3
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  glassTileEmpty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  glassNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  glassNumberFilled: {
    color: '#FFFFFF',
  },
  glassNumberEmpty: {
    color: '#475569',
  },

  // Add Button
  addButton: {
    backgroundColor: '#29B6F6', // Bright sky blue button from screenshot 3
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#29B6F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Footer Row
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  footerPill: {
    flex: 1,
    backgroundColor: '#F3F5F7',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  footerNumGreen: {
    fontSize: 16,
    fontWeight: '900',
    color: '#166534',
  },
  footerLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#166534',
  },
  fireEmoji: {
    fontSize: 15,
  },
});
