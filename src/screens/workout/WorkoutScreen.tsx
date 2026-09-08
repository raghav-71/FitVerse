import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Play,
  ShieldCheck,
  Award,
  Zap,
  Flame,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/common/GlassCard';
import { GradientButton } from '../../components/common/GradientButton';
import { RadialGauge } from '../../components/common/RadialGauge';
import { CameraPoseView } from '../../components/workout/CameraPoseView';
import { RewardModal } from '../../components/workout/RewardModal';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useExercises, useSubmitWorkout } from '../../services/mock/queries';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';
import { WorkoutService } from '../../services/api/workoutService';

interface WorkoutScreenProps {
  navigation: any;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  const {
    currentExercise,
    phase,
    completedSummary,
    setPhase,
    setExercise,
    resetWorkout,
  } = useWorkoutStore();

  const { data: exercises } = useExercises();
  const { addReward, streak } = useGamificationStore();
  const submitWorkoutMutation = useSubmitWorkout();

  const [showRewardModal, setShowRewardModal] = useState(false);

  const startSession = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    WorkoutService.startWorkout(currentExercise.name, 'medium').catch(() => {});
    setPhase('active');
  };

  const handleFinishSummary = () => {
    if (completedSummary) {
      addReward(completedSummary.xpEarned, completedSummary.coinsEarned);
      submitWorkoutMutation.mutate(completedSummary);
      // Persist workout session to real backend
      WorkoutService.completeWorkout({
        workout_name: completedSummary.exerciseName,
        duration_minutes: +(completedSummary.durationSeconds / 60).toFixed(1),
        calories_burned: Math.round(completedSummary.totalReps * 4),
        intensity: 'medium',
        completed: true,
        form_score: completedSummary.formScore,
        exercises: [
          {
            exercise_name: completedSummary.exerciseName,
            sets: 1,
            reps: completedSummary.totalReps,
            weight_kg: 0,
            duration_seconds: completedSummary.durationSeconds,
            form_score: completedSummary.formScore,
          },
        ],
      }).catch(() => {});
      setShowRewardModal(true);
    }
  };

  const handleClaimAndExit = () => {
    setShowRewardModal(false);
    resetWorkout();
    navigation.navigate('Home');
  };

  // State 2: Active Camera / Biomechanical HUD
  if (phase === 'active') {
    return (
      <View style={styles.container}>
        <CameraPoseView />
      </View>
    );
  }

  // State 3: After Summary
  if (phase === 'summary' && completedSummary) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.summaryScroll} showsVerticalScrollIndicator={false}>
          {/* Summary Header */}
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryBadge, { backgroundColor: isDark ? 'rgba(34, 255, 176, 0.12)' : '#EBF3EA', borderColor: isDark ? 'rgba(34, 255, 176, 0.3)' : '#CFE4CE' }]}>
              <Sparkles size={14} color={Colors.neonGreen} />
              <Text style={styles.summaryBadgeText}>BIOMECHANIC SCAN COMPLETE</Text>
            </View>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{completedSummary.exerciseName}</Text>
            <Text style={[styles.summarySub, { color: colors.textSecondary }]}>AI Biomechanic Performance Diagnostic</Text>
          </View>

          {/* Radial Score Gauge */}
          <GlassCard variant="glow" style={styles.radialCard}>
            <RadialGauge
              score={completedSummary.formScore}
              size={150}
              strokeWidth={14}
              subtitle="FINAL FORM SCORE"
            />
            <Text style={[styles.scoreComment, { color: colors.textPrimary }]}>
              {completedSummary.formScore >= 90
                ? '🌟 Flawless Rep Execution • Competition Standard'
                : '✅ Safe Kinetic Range • Minor Tempo Variance'}
            </Text>
          </GlassCard>

          {/* Stat Metrics Grid */}
          <View style={styles.metricsGrid}>
            <GlassCard style={styles.metricGridItem}>
              <Text style={[styles.metricGridLabel, { color: colors.textSecondary }]}>TOTAL REPS</Text>
              <Text style={[styles.metricGridVal, { color: colors.textPrimary }]}>{num(completedSummary.totalReps)}</Text>
            </GlassCard>

            <GlassCard style={styles.metricGridItem}>
              <Text style={[styles.metricGridLabel, { color: colors.textSecondary }]}>DURATION</Text>
              <Text style={[styles.metricGridVal, { color: colors.textPrimary }]}>{num(completedSummary.durationSeconds)}s</Text>
            </GlassCard>

            <GlassCard style={styles.metricGridItem}>
              <Text style={[styles.metricGridLabel, { color: colors.textSecondary }]}>XP EARNED</Text>
              <Text style={[styles.metricGridVal, { color: '#FBBF24' }]}>
                +{num(completedSummary.xpEarned)}
              </Text>
            </GlassCard>

            <GlassCard style={styles.metricGridItem}>
              <Text style={[styles.metricGridLabel, { color: colors.textSecondary }]}>FIT COINS</Text>
              <Text style={[styles.metricGridVal, { color: Colors.neonGreen }]}>
                +{num(completedSummary.coinsEarned)}
              </Text>
            </GlassCard>
          </View>

          {/* Biomechanical Accuracy Breakdown */}
          <GlassCard style={styles.breakdownCard}>
            <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>AI Sub-Score Diagnostics</Text>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Depth & Hip Mobility</Text>
              <Text style={[styles.breakdownScore, { color: colors.textPrimary }]}>98%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EDE8DC' }]}>
              <View style={[styles.progressFill, { width: '98%', backgroundColor: Colors.neonGreen }]} />
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Spinal Alignment & Neutrality</Text>
              <Text style={[styles.breakdownScore, { color: colors.textPrimary }]}>95%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EDE8DC' }]}>
              <View style={[styles.progressFill, { width: '95%', backgroundColor: Colors.primary }]} />
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Rep Cadence & Tempo Control</Text>
              <Text style={[styles.breakdownScore, { color: colors.textPrimary }]}>92%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EDE8DC' }]}>
              <View style={[styles.progressFill, { width: '92%', backgroundColor: Colors.primaryViolet }]} />
            </View>
          </GlassCard>

          {/* AI Coach Feedback Highlights */}
          <GlassCard style={styles.feedbackCard}>
            <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>Coach Highlights</Text>
            {completedSummary.feedbackHighlights.map((item, idx) => (
              <View key={idx} style={styles.highlightItem}>
                <CheckCircle2 size={16} color={Colors.neonGreen} />
                <Text style={[styles.highlightText, { color: colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Action Button */}
          <GradientButton
            title="Reveal Rewards & Save"
            onPress={handleFinishSummary}
            size="lg"
            style={{ marginTop: 10, width: '100%' }}
          />
        </ScrollView>

        <RewardModal
          visible={showRewardModal}
          xpEarned={completedSummary.xpEarned}
          coinsEarned={completedSummary.coinsEarned}
          streakDays={streak}
          onContinue={handleClaimAndExit}
        />
      </View>
    );
  }

  // State 1: Before Session (Briefing & Exercise Selection)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Home')}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Mirror Calibration</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Exercise Preview */}
        <GlassCard variant="glow" style={styles.exerciseHeroCard}>
          <Image source={{ uri: currentExercise.thumbnailUrl }} style={styles.heroImage} />
          
          <View style={styles.heroBadgeRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: isDark ? 'rgba(34, 255, 176, 0.12)' : '#EBF3EA', borderColor: colors.border }]}>
              <Text style={styles.difficultyText}>{currentExercise.difficulty}</Text>
            </View>
            <Text style={[styles.heroTargetText, { color: colors.textSecondary }]}>
              {num(currentExercise.targetSets)} SETS × {num(currentExercise.targetReps)} REPS
            </Text>
          </View>

          <Text style={[styles.heroExerciseName, { color: colors.textPrimary }]}>{currentExercise.name}</Text>
          <Text style={[styles.heroCategoryText, { color: colors.textSecondary }]}>
            Target Category: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{currentExercise.category}</Text> • {num(currentExercise.caloriesEst)} kcal est.
          </Text>

          {/* Start CTA */}
          <GradientButton
            title="Start AI Fitness Mirror"
            onPress={startSession}
            icon={<Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
            size="lg"
            style={{ width: '100%', marginTop: 14 }}
          />
        </GlassCard>

        {/* Form Cues & AI Keypoints Armed */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionCardTitleRow}>
            <Sparkles size={16} color={Colors.neonGreen} />
            <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>AI Biomechanical Cues</Text>
          </View>
          {currentExercise.formCues.map((cue, i) => (
            <View key={i} style={styles.cueRow}>
              <View style={styles.cueDot} />
              <Text style={[styles.cueText, { color: colors.textSecondary }]}>{cue}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Safety Notes / Restrictions */}
        <GlassCard variant="accent" style={styles.sectionCard}>
          <View style={styles.sectionCardTitleRow}>
            <ShieldCheck size={16} color={Colors.primaryViolet} />
            <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>Injury Prevention Directives</Text>
          </View>
          {currentExercise.safetyNotes.map((note, i) => (
            <View key={i} style={styles.cueRow}>
              <View style={[styles.cueDot, { backgroundColor: Colors.primaryViolet }]} />
              <Text style={[styles.cueText, { color: colors.textSecondary }]}>{note}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Other Exercise Switcher */}
        <Text style={[styles.switchTitle, { color: colors.textSecondary }]}>SWITCH EXERCISE</Text>
        <View style={styles.switchList}>
          {exercises?.map((ex) => {
            const isSelected = ex.id === currentExercise.id;
            return (
              <GlassCard
                key={ex.id}
                onPress={() => setExercise(ex)}
                style={[
                  styles.switchItem,
                  isSelected && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : 'rgba(79, 124, 255, 0.12)' },
                ]}
              >
                <Image source={{ uri: ex.thumbnailUrl }} style={styles.switchThumb} />
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchName, { color: colors.textPrimary }]}>{ex.name}</Text>
                  <Text style={[styles.switchSub, { color: colors.textSecondary }]}>{ex.category} • {num(ex.targetReps)} reps</Text>
                </View>
                {isSelected ? (
                  <CheckCircle2 size={18} color={Colors.neonGreen} />
                ) : (
                  <ChevronRight size={18} color={colors.textSecondary} />
                )}
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 110,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  exerciseHeroCard: {
    padding: 16,
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  difficultyBadge: {
    backgroundColor: '#EBF3EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  difficultyText: {
    color: Colors.neonGreen,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTargetText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  heroExerciseName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  heroCategoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  cueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neonGreen,
    marginRight: 10,
  },
  cueText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 12,
  },
  switchList: {
    gap: 10,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  switchThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  switchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  switchName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryScroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3EA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE4CE',
    gap: 6,
    marginBottom: 8,
  },
  summaryBadgeText: {
    color: Colors.neonGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  summarySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  radialCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  scoreComment: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricGridItem: {
    width: '48%',
    padding: 14,
    alignItems: 'center',
  },
  metricGridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  metricGridVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  breakdownCard: {
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  breakdownScore: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EDE8DC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  feedbackCard: {
    padding: 16,
    marginBottom: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  highlightText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
