import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Utensils, Droplets, Flame, Info, Check, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomSheetModal } from '../../../components/ui/BottomSheetModal';
import { GlassCard, Badge } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { useDietStore } from '../../../stores/dietStore';
import { useDailyActivityStore } from '../../../stores/dailyActivityStore';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

interface DietPlanModalProps {
  visible: boolean;
  onClose: () => void;
}

const GOALS = [
  { id: 'fat_loss', label: 'Fat Loss' },
  { id: 'muscle_gain', label: 'Muscle Gain' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'general_fitness', label: 'General Fitness' },
];

const PREFERENCES = [
  { id: 'vegetarian', label: 'Vegetarian 🥦' },
  { id: 'non_vegetarian', label: 'Non-Veg 🍗' },
  { id: 'eggetarian', label: 'Eggetarian 🥚' },
  { id: 'vegan', label: 'Vegan 🌱' },
];

export const DietPlanModal: React.FC<DietPlanModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    calorieTarget,
    proteinTarget,
    carbsTarget,
    fatTarget,
    waterTarget,
    bmr,
    tdee,
    planReasoning,
    mealDistribution,
    isLoading,
    generateDietPlan,
  } = useDietStore();

  const currentWeight = useDailyActivityStore((state) => state.currentWeight);
  const heightCm = useDailyActivityStore((state) => state.heightCm);

  const [selectedGoal, setSelectedGoal] = useState<string>('fat_loss');
  const [selectedPref, setSelectedPref] = useState<string>('vegetarian');

  const handleRecalculate = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await generateDietPlan({
      age: user?.age || 24,
      gender: user?.gender || 'male',
      height_cm: heightCm || user?.heightCm || 175,
      weight_kg: currentWeight || user?.weightKg || 75.8,
      goal: selectedGoal,
      activity_level: 'moderate',
      diet_preference: selectedPref,
      target_weight: 72.0,
    });
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="🥗 AI Personalized Diet Plan"
      subtitle="Calibrated nutrition targets & meal timing"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Selector */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TARGET GOAL</Text>
        <View style={styles.pillRow}>
          {GOALS.map((g) => {
            const isSel = selectedGoal === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => {
                  setSelectedGoal(g.id);
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
                style={[
                  styles.selectorPill,
                  isSel
                    ? [styles.selectorPillActive, { backgroundColor: colors.primary }]
                    : [styles.selectorPillInactive, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.selectorPillText,
                    { color: isSel ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Diet Preference Selector */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 12 }]}>
          DIET PREFERENCE
        </Text>
        <View style={styles.pillRow}>
          {PREFERENCES.map((p) => {
            const isSel = selectedPref === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setSelectedPref(p.id);
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
                style={[
                  styles.selectorPill,
                  isSel
                    ? [styles.selectorPillActive, { backgroundColor: colors.primaryForest }]
                    : [styles.selectorPillInactive, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.selectorPillText,
                    { color: isSel ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Metabolic Diagnostics Row (BMR & TDEE) */}
        <View style={styles.metabolicRow}>
          <View style={[styles.metabolicBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.metabolicLabel, { color: colors.textSecondary }]}>Basal Metabolic Rate</Text>
            <Text style={[styles.metabolicVal, { color: colors.textPrimary }]}>{num(bmr || 1800)} kcal</Text>
            <Text style={[styles.metabolicSub, { color: colors.textMuted }]}>Resting calorie expenditure</Text>
          </View>
          <View style={[styles.metabolicBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.metabolicLabel, { color: colors.textSecondary }]}>Total Energy (TDEE)</Text>
            <Text style={[styles.metabolicVal, { color: colors.primary }]}>{num(tdee || 2700)} kcal</Text>
            <Text style={[styles.metabolicSub, { color: colors.textMuted }]}>With moderate training</Text>
          </View>
        </View>

        {/* Daily Targets Card */}
        <GlassCard style={styles.targetsCard} padding={16}>
          <View style={styles.targetsHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Recommended Daily Targets</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Updates MacroRing & daily activity trackers
              </Text>
            </View>
            <Badge label="OPTIMAL" variant="success" size="sm" />
          </View>

          <View style={styles.macrosGrid}>
            <View style={styles.macroCol}>
              <Text style={[styles.macroNumber, { color: colors.primary }]}>{num(calorieTarget)}</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Calories (kcal)</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroNumber, { color: colors.primaryViolet }]}>{num(proteinTarget)}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroNumber, { color: colors.warning }]}>{num(carbsTarget)}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroNumber, { color: colors.accentSky }]}>{num(fatTarget)}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fat</Text>
            </View>
          </View>

          {/* Reasoning box */}
          {planReasoning ? (
            <View style={[styles.reasoningBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
              <Sparkles size={16} color={colors.neonGreen} />
              <Text style={[styles.reasoningText, { color: colors.textSecondary }]}>
                {planReasoning}
              </Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Meal Breakdown Preview if available */}
        {mealDistribution && (
          <View style={styles.mealDistContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>MEAL DISTRIBUTION</Text>
            {Object.keys(mealDistribution).map((key) => {
              const meal = mealDistribution[key];
              return (
                <View
                  key={key}
                  style={[
                    styles.mealRowCard,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mealRowName, { color: colors.textPrimary }]}>{meal.meal_name}</Text>
                    <Text style={[styles.mealRowSub, { color: colors.textSecondary }]}>
                      {meal.calories} kcal · {meal.protein_g}g Protein · {meal.carbs_g}g Carbs
                    </Text>
                    {meal.suggested_foods && (
                      <Text style={[styles.mealSuggested, { color: colors.textMuted }]} numberOfLines={1}>
                        💡 {meal.suggested_foods.join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.recalcButton, { backgroundColor: colors.primaryForest }]}
          onPress={handleRecalculate}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.recalcButtonText}>⚡ Recalculate AI Nutrition Targets</Text>
          )}
        </TouchableOpacity>

        {/* Mandatory Medical Disclaimer */}
        <View style={styles.disclaimerRow}>
          <ShieldAlert size={14} color={colors.textMuted} />
          <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
            Targets are mathematical sports-nutrition estimates, not clinical or medical advice.
          </Text>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectorPillActive: {
    borderColor: 'transparent',
  },
  selectorPillInactive: {},
  selectorPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metabolicRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metabolicBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  metabolicLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metabolicVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  metabolicSub: {
    fontSize: 10,
  },
  targetsCard: {
    borderRadius: 18,
    gap: 12,
    marginTop: 4,
  },
  targetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  macroCol: {
    alignItems: 'center',
    gap: 2,
  },
  macroNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  reasoningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  reasoningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  mealDistContainer: {
    gap: 8,
    marginTop: 6,
  },
  mealRowCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  mealRowName: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealRowSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  mealSuggested: {
    fontSize: 11,
    marginTop: 4,
  },
  recalcButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  recalcButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    flex: 1,
  },
});
