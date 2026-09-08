import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Flame, Zap, ShieldCheck, HeartPulse, ArrowRight, Check } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/common/GlassCard';
import { GradientButton } from '../../components/common/GradientButton';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

const GOALS = [
  {
    id: 'hypertrophy',
    title: 'Muscle Growth (Hypertrophy)',
    desc: 'Target mechanical tension, AI rep tempo, and muscle volume.',
    icon: Dumbbell,
    accent: Colors.primary,
  },
  {
    id: 'fat_loss',
    title: 'Fat Loss & High Caloric Burn',
    desc: 'High metabolic output circuits and fast recovery sets.',
    icon: Flame,
    accent: '#FF6B00',
  },
  {
    id: 'athleticism',
    title: 'Athletic Power & Speed',
    desc: 'Explosive compound kinetics and joint resilience.',
    icon: Zap,
    accent: Colors.neonGreen,
  },
  {
    id: 'mobility',
    title: 'Zero Injury & Posture Repair',
    desc: 'Biomechanical alignment, core stability, and pain-free joints.',
    icon: ShieldCheck,
    accent: Colors.primaryViolet,
  },
];

const ACTIVITY_LEVELS = [
  { id: 'beginner', label: 'Rookie (0-1 yrs)', sub: 'Building baseline form' },
  { id: 'intermediate', label: 'Athlete (1-3 yrs)', sub: 'Consistent training' },
  { id: 'advanced', label: 'Titan (3+ yrs)', sub: 'Advanced biomechanics' },
];

interface GoalSelectionScreenProps {
  onNext: () => void;
}

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ onNext }) => {
  const { selectedGoal, activityLevel, setGoal, setActivityLevel } = useAuthStore();
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  const handleContinue = () => {
    onNext();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: colors.primary }]}>STEP 1 OF 2 • TARGET METRICS</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('primaryGoalQuestion') || 'What is your primary fitness quest?'}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          FitVerse AI customizes pose sensitivity and volume to your goal.
        </Text>

        {/* Goal Cards */}
        <View style={styles.goalsContainer}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            const IconComp = goal.icon;
            return (
              <GlassCard
                key={goal.id}
                onPress={() => setGoal(goal.id)}
                variant={isSelected ? 'glow' : 'default'}
                style={[
                  styles.goalCard,
                  { backgroundColor: colors.cardBackground, borderColor: isSelected ? goal.accent : colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: `${goal.accent}25` },
                    ]}
                  >
                    <IconComp size={22} color={goal.accent} />
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: goal.accent, borderColor: goal.accent },
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                  </View>
                </View>

                <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>{goal.title}</Text>
                <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>{goal.desc}</Text>
              </GlassCard>
            );
          })}
        </View>

        {/* Activity Level Selector */}
        <Text style={[styles.title, { fontSize: 18, marginTop: 24, color: colors.textPrimary }]}>
          Experience Level
        </Text>
        <View style={styles.levelsRow}>
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = activityLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                activeOpacity={0.8}
                onPress={() => setActivityLevel(level.id)}
                style={[
                  styles.levelButton,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(34, 255, 176, 0.15)'
                        : '#EBF3EA'
                      : colors.cardBackground,
                    borderColor: isSelected ? colors.neonGreen : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelLabel,
                    { color: isSelected ? colors.neonGreen : colors.textPrimary },
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={[styles.levelSub, { color: colors.textSecondary }]}>{level.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.tabBarBg, borderTopColor: colors.border }]}>
        <GradientButton
          title={t('continue') || 'Proceed to Safety Screening'}
          onPress={handleContinue}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F7F5EE
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  stepIndicator: {
    backgroundColor: '#EBF3EA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CFE4CE',
  },
  stepText: {
    color: Colors.neonGreen,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  goalDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  levelsRow: {
    gap: 10,
    marginTop: 12,
  },
  levelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
  },
  levelButtonSelected: {
    backgroundColor: '#EBF3EA',
    borderColor: Colors.neonGreen,
  },
  levelLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  levelLabelSelected: {
    color: Colors.neonGreen,
    fontWeight: '800',
  },
  levelSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
