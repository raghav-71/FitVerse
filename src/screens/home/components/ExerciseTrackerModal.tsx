import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  Dumbbell,
  Footprints,
  Flame,
  Activity,
  Music,
  Bike,
  Home,
  Sparkles,
  CheckCircle2,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomSheetModal } from '../../../components/ui/BottomSheetModal';
import { Colors } from '../../../theme/colors';
import { useDailyActivityStore } from '../../../stores/dailyActivityStore';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

interface ExerciseTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ActivityType {
  id: string;
  name: string;
  emoji: string;
}

const ACTIVITIES: ActivityType[] = [
  { id: 'Walk', name: 'Walk', emoji: '🚶' },
  { id: 'Gym', name: 'Gym', emoji: '💪' },
  { id: 'Yoga', name: 'Yoga', emoji: '🧘' },
  { id: 'Dance', name: 'Dance', emoji: '💃' },
  { id: 'Sports', name: 'Sports', emoji: '⚽' },
  { id: 'Cycling', name: 'Cycling', emoji: '🚴' },
  { id: 'Home Workout', name: 'Home\nWorkout', emoji: '🏠' },
  { id: 'Other', name: 'Other', emoji: '✨' },
];

export const ExerciseTrackerModal: React.FC<ExerciseTrackerModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const loggedActivities = useDailyActivityStore((state) => state.loggedActivities);
  const logExercise = useDailyActivityStore((state) => state.logExercise);
  const weekCount = useDailyActivityStore((state) => state.weekWorkoutsCount);
  const streakDays = useDailyActivityStore((state) => state.streakDays);

  const [localSelected, setLocalSelected] = useState<string[]>(
    loggedActivities.length > 0 ? loggedActivities : ['Gym', 'Walk']
  );

  const handleToggle = (id: string) => {
    const exists = localSelected.includes(id);
    const updated = exists
      ? localSelected.filter((item) => item !== id)
      : [...localSelected, id];
    setLocalSelected(updated);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    logExercise(localSelected);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={`🏃 ${t('exercise') || 'Exercise Tracker'}`}
      subtitle={t('whatDidYouDoToday') || 'What did you do today?'}
    >
      <View style={styles.container}>
        {/* Active Summary Chip */}
        <View
          style={[
            styles.activeSummaryCard,
            {
              backgroundColor: isDark ? 'rgba(43, 143, 244, 0.15)' : '#EDF4FC',
              borderColor: isDark ? 'rgba(43, 143, 244, 0.3)' : '#DCE8F7',
            },
          ]}
        >
          <View style={styles.checkIconWrap}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text
            style={[
              styles.activeSummaryText,
              { color: isDark ? colors.textPrimary : '#1E3A8A' },
            ]}
          >
            {localSelected.length > 0
              ? localSelected
                  .map((act) => `${act === 'Gym' ? `💪 ${t('gym') || 'Gym'} ${num(30)}m` : act === 'Walk' ? `🚶 ${t('walk') || 'Walk'} ${num(30)}m` : `⚡ ${act} ${num(30)}m`}`)
                  .join('  ·  ')
              : (t('tapActivitiesToLog') || 'Tap activities below to log')}
          </Text>
        </View>

        {/* 2 Rows x 4 Activity Grid */}
        <View style={styles.grid}>
          {ACTIVITIES.map((act) => {
            const isSelected = localSelected.includes(act.id);
            return (
              <TouchableOpacity
                key={act.id}
                onPress={() => handleToggle(act.id)}
                activeOpacity={0.8}
                style={[
                  styles.gridItem,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#E5E7EB',
                  },
                  isSelected && styles.gridItemSelected,
                ]}
              >
                <Text style={styles.emoji}>{act.emoji}</Text>
                <Text
                  style={[
                    styles.itemLabel,
                    { color: isDark ? colors.textSecondary : '#4B5563' },
                    isSelected && styles.itemLabelSelected,
                  ]}
                  numberOfLines={2}
                >
                  {act.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Log Action Button */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.logButtonText}>✓ {t('logExercise') || 'Log Exercise'}</Text>
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
              {num(weekCount || 6)}/{num(7)}
            </Text>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{t('thisWeek') || 'This Week'}</Text>
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
            <View style={styles.todayPillContent}>
              <Text style={styles.todayEmoji}>💪</Text>
              <Text style={[styles.plusSign, { color: colors.textPrimary }]}>+</Text>
              <Text style={styles.todayEmoji}>🚶</Text>
            </View>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{t('today') || 'Today'}</Text>
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
                {num(streakDays || 6)}
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
  activeSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF4FC', // Soft light blue from screenshot 1
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCE8F7',
  },
  checkIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSummaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '22.5%',
    aspectRatio: 0.95,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemSelected: {
    backgroundColor: '#3B82F6', // Sky Blue matching screenshot 1
    borderColor: '#3B82F6',
  },
  emoji: {
    fontSize: 24,
  },
  itemLabel: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    textAlign: 'center',
  },
  itemLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  logButton: {
    backgroundColor: '#2B8FF4', // Bright blue button from screenshot 1
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B8FF4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  footerPill: {
    flex: 1,
    backgroundColor: '#F3F5F7', // Soft light gray pill card from screenshot 1
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
  todayPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayEmoji: {
    fontSize: 16,
  },
  plusSign: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
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
