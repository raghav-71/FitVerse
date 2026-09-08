import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Minus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomSheetModal } from '../../../components/ui/BottomSheetModal';
import { Colors } from '../../../theme/colors';
import { useDailyActivityStore } from '../../../stores/dailyActivityStore';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

interface WeightTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WeightTrackerModal: React.FC<WeightTrackerModalProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const currentWeight = useDailyActivityStore((state) => state.currentWeight);
  const startWeight = useDailyActivityStore((state) => state.startWeight);
  const targetWeight = useDailyActivityStore((state) => state.targetWeight);
  const setWeight = useDailyActivityStore((state) => state.setWeight);

  const [weightVal, setWeightVal] = useState<number>(currentWeight || 53.1);

  const handleMinus = () => {
    const next = Math.max(30, parseFloat((weightVal - 0.2).toFixed(1)));
    setWeightVal(next);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePlus = () => {
    const next = Math.min(180, parseFloat((weightVal + 0.2).toFixed(1)));
    setWeightVal(next);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    setWeight(weightVal);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  };

  const handleViewProgress = () => {
    onClose();
    navigation.navigate('Health');
  };

  const delta = (startWeight - weightVal > 0 ? (startWeight - weightVal).toFixed(1) : '2.8');

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={`⚖️ ${t('weight') || 'Weight Tracker'}`}
      subtitle={t('logDailyTrackProgress') || 'Log daily · Track progress'}
    >
      <View style={styles.container}>
        {/* Large Stepper Row */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.purpleStepBtn, { backgroundColor: isDark ? colors.primaryViolet : '#3B1F8C' }]}
            onPress={handleMinus}
            activeOpacity={0.8}
          >
            <Minus size={26} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>

          <View style={styles.displayWrap}>
            <Text style={[styles.bigWeightNumber, { color: isDark ? colors.primaryViolet : '#3B1F8C' }]}>
              {num(weightVal.toFixed(1))}
            </Text>
            <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>kg</Text>
          </View>

          <TouchableOpacity
            style={[styles.purpleStepBtn, { backgroundColor: isDark ? colors.primaryViolet : '#3B1F8C' }]}
            onPress={handlePlus}
            activeOpacity={0.8}
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Range Slider Track */}
        <View style={styles.rangeContainer}>
          <View
            style={[
              styles.rangeBarTrack,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#EDE9FE' },
            ]}
          >
            <View
              style={[
                styles.rangeBarFill,
                {
                  backgroundColor: isDark ? colors.primaryViolet : '#8B5CF6',
                  width: `${Math.min(95, Math.max(8, ((weightVal - 30) / 90) * 100))}%`,
                },
              ]}
            />
            {/* Slider circular thumb */}
            <View
              style={[
                styles.sliderThumb,
                {
                  borderColor: isDark ? colors.primaryViolet : '#8B5CF6',
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  left: `${Math.min(92, Math.max(5, ((weightVal - 30) / 90) * 100))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.rangeLabelsRow}>
            <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{num(30)}</Text>
            <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{num(75)}</Text>
            <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{num(120)}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btnCol}>
          {/* Log Now button */}
          <TouchableOpacity
            style={styles.logNowBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.logNowBtnText}>{t('logNow') || 'Log Now'}</Text>
          </TouchableOpacity>

          {/* View Progress outline button */}
          <TouchableOpacity
            style={[
              styles.outlineProgressBtn,
              { borderColor: isDark ? colors.primaryViolet : '#3B1F8C' },
            ]}
            onPress={handleViewProgress}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.outlineProgressText,
                { color: isDark ? colors.primaryViolet : '#3B1F8C' },
              ]}
            >
              📈 {t('viewProgress') || 'View Progress'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Start */}
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <View style={styles.statHeaderRow}>
              <Text style={styles.statEmoji}>🏁</Text>
              <Text
                style={[
                  styles.statBoxValuePurple,
                  { color: isDark ? colors.primaryViolet : '#3B1F8C' },
                ]}
              >
                {num(startWeight || 55.9)}
              </Text>
            </View>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('start') || 'Start'}</Text>
          </View>

          {/* Current */}
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <View style={styles.statHeaderRow}>
              <Text style={styles.statEmoji}>📍</Text>
              <Text
                style={[
                  styles.statBoxValuePurple,
                  { color: isDark ? colors.primaryViolet : '#3B1F8C' },
                ]}
              >
                {num(weightVal.toFixed(1))}
              </Text>
            </View>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('current') || 'Current'}</Text>
          </View>

          {/* Goal */}
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <View style={styles.statHeaderRow}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text
                style={[
                  styles.statBoxValuePurple,
                  { color: isDark ? colors.primaryViolet : '#3B1F8C' },
                ]}
              >
                {num(targetWeight || '0.0')}
              </Text>
              <Text style={styles.editPrompt}>✏️ {t('edit') || 'Edit?'}</Text>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>{num(1)}</Text>
              </View>
            </View>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('goal') || 'Goal'}</Text>
          </View>

          {/* Lost */}
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <View style={styles.statHeaderRow}>
              <Text style={styles.statEmoji}>📉</Text>
              <Text
                style={[
                  styles.statBoxValueGreen,
                  { color: isDark ? colors.neonGreen : '#166534' },
                ]}
              >
                {num(delta)}
              </Text>
            </View>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>
              {t('lost') || 'Lost'} <Text style={[styles.sinceStartText, { color: colors.textMuted }]}>{t('sinceStart') || 'since start'}</Text>
            </Text>
          </View>
        </View>

        {/* Height Row at Bottom */}
        <View
          style={[
            styles.heightRow,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7',
              borderColor: colors.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}
        >
          <View style={styles.heightLeft}>
            <Text style={styles.heightRulerEmoji}>📏</Text>
            <Text style={[styles.heightLabel, { color: colors.textPrimary }]}>{t('height') || 'Height'}</Text>
          </View>
          <View style={styles.heightRight}>
            <Text style={[styles.heightValue, { color: colors.textPrimary }]}>
              {num(5)} ft {num(1)} in
            </Text>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
              }}
            >
              <Text style={styles.adjustText}>{t('adjust') || 'Adjust'}</Text>
            </TouchableOpacity>
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
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  purpleStepBtn: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#3B1F8C', // Deep royal purple from screenshot 4
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B1F8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  displayWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigWeightNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3B1F8C', // Bold royal purple from screenshot 4
  },
  weightUnit: {
    fontSize: 22,
    fontWeight: '800',
    color: '#374151',
  },

  // Range Slider Track
  rangeContainer: {
    gap: 6,
    paddingHorizontal: 4,
  },
  rangeBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E9D5FF', // Soft lilac track
    position: 'relative',
    justifyContent: 'center',
  },
  rangeBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#8B5CF6', // Purple fill
  },
  sliderThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#8B5CF6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    top: -9,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Buttons
  btnCol: {
    gap: 10,
    marginTop: 4,
  },
  logNowBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logNowBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  outlineProgressBtn: {
    borderWidth: 2,
    borderColor: '#3B1F8C', // Deep purple border from screenshot 4
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineProgressText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3B1F8C', // Deep purple text from screenshot 4
  },

  // 2x2 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F9FAFB', // Light clean card from screenshot 4
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statEmoji: {
    fontSize: 16,
  },
  statBoxValuePurple: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3B1F8C', // Deep royal purple
  },
  statBoxValueGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534', // Deep green
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  sinceStartText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
  },
  editPrompt: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  redBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Height Row
  heightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heightRulerEmoji: {
    fontSize: 16,
  },
  heightLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  heightRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heightValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B1F8C',
  },
  adjustBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3B1F8C', // Purple outline from screenshot 4
  },
  adjustText: {
    fontSize: 12,
    color: '#3B1F8C',
    fontWeight: '800',
  },
});
