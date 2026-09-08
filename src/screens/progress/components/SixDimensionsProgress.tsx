import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { useTranslation } from '../../../stores/languageStore';
import { useTheme } from '../../../stores/themeStore';

export interface DimensionItem {
  id: string;
  titleKey: string;
  defaultTitle: string;
  emoji: string;
  current: number;
  total: number;
  color?: string;
}

const DEFAULT_DIMENSIONS: DimensionItem[] = [
  {
    id: 'health_check',
    titleKey: 'healthCheck',
    defaultTitle: 'Health check',
    emoji: '🩺',
    current: 0,
    total: 20,
    color: '#38BDF8',
  },
  {
    id: 'habits',
    titleKey: 'habits',
    defaultTitle: 'Habits',
    emoji: '🔁',
    current: 4,
    total: 14,
    color: '#DFAB24',
  },
  {
    id: 'mindfulness',
    titleKey: 'mindfulness',
    defaultTitle: 'Mindfulness',
    emoji: '🧘',
    current: 8,
    total: 10,
    color: '#8B5CF6',
  },
  {
    id: 'fitness_form',
    titleKey: 'fitnessForm',
    defaultTitle: 'Fitness form',
    emoji: '🏋️',
    current: 12,
    total: 15,
    color: '#4F7CFF',
  },
  {
    id: 'daily_water',
    titleKey: 'dailyWater',
    defaultTitle: 'Daily hydration',
    emoji: '💧',
    current: 6,
    total: 8,
    color: '#06B6D4',
  },
  {
    id: 'nutrition_goals',
    titleKey: 'nutritionGoals',
    defaultTitle: 'Nutrition goals',
    emoji: '🥗',
    current: 14,
    total: 18,
    color: '#276738',
  },
];

interface SixDimensionsProgressProps {
  onPressDimension?: (item: DimensionItem) => void;
  categoryScores?: {
    nutrition: number;
    hydration: number;
    workout: number;
    activity: number;
    sleep: number;
    stress: number;
  };
  dailyScore?: number;
}

export const SixDimensionsProgress: React.FC<SixDimensionsProgressProps> = ({
  onPressDimension,
  categoryScores,
  dailyScore,
}) => {
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  const dimensions: DimensionItem[] = categoryScores
    ? [
        {
          id: 'health_check',
          titleKey: 'healthCheck',
          defaultTitle: 'Health check',
          emoji: '🩺',
          current: Math.round(((dailyScore || 75) / 100) * 20),
          total: 20,
          color: '#38BDF8',
        },
        {
          id: 'habits',
          titleKey: 'habits',
          defaultTitle: 'Habits',
          emoji: '🔁',
          current: Math.round((categoryScores.activity / 100) * 14),
          total: 14,
          color: '#DFAB24',
        },
        {
          id: 'mindfulness',
          titleKey: 'mindfulness',
          defaultTitle: 'Mindfulness',
          emoji: '🧘',
          current: Math.round((categoryScores.stress / 100) * 10),
          total: 10,
          color: '#8B5CF6',
        },
        {
          id: 'fitness_form',
          titleKey: 'fitnessForm',
          defaultTitle: 'Fitness form',
          emoji: '🏋️',
          current: Math.round((categoryScores.workout / 100) * 15),
          total: 15,
          color: '#4F7CFF',
        },
        {
          id: 'daily_water',
          titleKey: 'dailyWater',
          defaultTitle: 'Daily hydration',
          emoji: '💧',
          current: Math.round((categoryScores.hydration / 100) * 8),
          total: 8,
          color: '#06B6D4',
        },
        {
          id: 'nutrition_goals',
          titleKey: 'nutritionGoals',
          defaultTitle: 'Nutrition goals',
          emoji: '🥗',
          current: Math.round((categoryScores.nutrition / 100) * 18),
          total: 18,
          color: '#276738',
        },
      ]
    : DEFAULT_DIMENSIONS;

  const handlePress = (item: DimensionItem) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onPressDimension?.(item);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('the6Dimensions') || 'THE 6 DIMENSIONS'}</Text>
        <Text style={[styles.sectionSub, { color: colors.success }]}>
          {dailyScore ? `Score: ${num(dailyScore)}/100` : 'Overall Progress'}
        </Text>
      </View>

      {/* 2-Column Responsive Grid */}
      <View style={styles.grid}>
        {dimensions.map((item) => {
          const progressPercent = item.total > 0 ? (item.current / item.total) * 100 : 0;
          const displayTitle = t(item.titleKey as any) || item.defaultTitle;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => handlePress(item)}
              style={styles.cardWrapper}
            >
              <GlassCard style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {/* Top Row: Emoji Icon + Score */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
                    {num(item.current)}/{num(item.total)}
                  </Text>
                </View>

                {/* Dimension Title */}
                <Text style={[styles.dimensionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {displayTitle}
                </Text>

                {/* Progress Bar */}
                <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5EFE7' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                        backgroundColor: item.color || colors.primary,
                      },
                    ]}
                  />
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 11,
    color: '#276738',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    maxWidth: 380,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 22,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '800',
  },
  dimensionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5EFE7',
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
