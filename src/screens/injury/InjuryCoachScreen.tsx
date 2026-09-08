import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Repeat,
  Sparkles,
  ChevronRight,
  Activity,
  Check,
  RotateCcw,
} from 'lucide-react-native';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { MOCK_EXERCISES } from '../../services/mock/data';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';
import { AiService } from '../../services/api/aiService';

interface BodyAreaOption {
  id: string;
  name: string;
  subtext: string;
}

const BODY_AREAS: BodyAreaOption[] = [
  { id: 'Knee', name: 'Knee Joint', subtext: 'Patellar tendon & meniscus' },
  { id: 'Shoulder', name: 'Shoulder', subtext: 'Rotator cuff & acromion' },
  { id: 'Back', name: 'Lower Back', subtext: 'Lumbar spine & erectors' },
  { id: 'Neck', name: 'Cervical Neck', subtext: 'Traps & cervical spine' },
  { id: 'Wrist', name: 'Wrist & Forearm', subtext: 'Carpal tunnel & extensor strain' },
  { id: 'Ankle', name: 'Ankle & Achilles', subtext: 'Talar joint & plantar tendon' },
  { id: 'Other', name: 'Other Joint', subtext: 'General tendon or muscle tightness' },
];

type ConditionLevel = 'no_pain' | 'previous_injury' | 'current_discomfort';

const SEVERITY_OPTIONS: { id: ConditionLevel; label: string; color: string }[] = [
  { id: 'no_pain', label: 'No Pain', color: Colors.success },
  { id: 'previous_injury', label: 'Previous Injury', color: Colors.warning },
  { id: 'current_discomfort', label: 'Current Discomfort', color: Colors.danger },
];

interface ExerciseClearance {
  name: string;
  target: string;
  status: 'SAFE' | 'CAUTION' | 'BLOCK';
  reason: string;
  alternative?: string;
  benefit?: string;
}

export const InjuryCoachScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const selectedPainAreas = useAuthStore((state) => state.selectedPainAreas);
  const safetyConditions = useAuthStore((state) => state.safetyConditions);
  const togglePainArea = useAuthStore((state) => state.togglePainArea);
  const setSafetyCondition = useAuthStore((state) => state.setSafetyCondition);
  const setPainSelection = useAuthStore((state) => state.setPainSelection);

  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    selectedPainAreas.length > 0 ? selectedPainAreas : ['Knee']
  );
  const [conditions, setConditions] = useState<Record<string, ConditionLevel>>(
    Object.keys(safetyConditions).length > 0
      ? safetyConditions
      : { Knee: 'current_discomfort' }
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(true);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleToggleArea = (areaId: string) => {
    haptic();
    if (selectedAreas.includes(areaId)) {
      if (selectedAreas.length > 1) {
        setSelectedAreas(selectedAreas.filter((a) => a !== areaId));
      }
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
      if (!conditions[areaId]) {
        setConditions({ ...conditions, [areaId]: 'previous_injury' });
      }
    }
  };

  const handleSetCondition = (areaId: string, level: ConditionLevel) => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    setConditions({ ...conditions, [areaId]: level });
  };

  // Evaluate Exercise Clearances dynamically
  const getExerciseClearances = (): ExerciseClearance[] => {
    const hasKnee = selectedAreas.includes('Knee');
    const kneeLvl = conditions['Knee'] || 'no_pain';

    const hasShoulder = selectedAreas.includes('Shoulder');
    const shoulderLvl = conditions['Shoulder'] || 'no_pain';

    const hasBack = selectedAreas.includes('Back');
    const backLvl = conditions['Back'] || 'no_pain';

    const hasWrist = selectedAreas.includes('Wrist');
    const hasAnkle = selectedAreas.includes('Ankle');
    const hasNeck = selectedAreas.includes('Neck');

    const results: ExerciseClearance[] = [];

    // 1. Barbell Squat
    if (hasKnee && kneeLvl === 'current_discomfort') {
      results.push({
        name: 'Barbell Back Squat',
        target: 'Quads & Glutes',
        status: 'BLOCK',
        reason: 'Axial compressive load & patellar shear exceed safe recovery limits.',
        alternative: 'High Box Squat',
        benefit: 'Limits joint flexion past 90° while maintaining full quad recruitment',
      });
    } else if (hasKnee && kneeLvl === 'previous_injury') {
      results.push({
        name: 'Barbell Back Squat',
        target: 'Quads & Glutes',
        status: 'CAUTION',
        reason: 'Real-time AI pose engine will enforce 90° knee tracking depth limit.',
        alternative: 'Supported Glute Bridge',
        benefit: 'Replaces axial load with posterior chain focus',
      });
    } else {
      results.push({
        name: 'Barbell Back Squat',
        target: 'Quads & Glutes',
        status: 'SAFE',
        reason: 'Full biomechanical clearance. Unrestricted squat depth permitted.',
      });
    }

    // 2. Romanian Deadlift
    if (hasBack && backLvl === 'current_discomfort') {
      results.push({
        name: 'Romanian Deadlift',
        target: 'Hamstrings & Lumbar',
        status: 'BLOCK',
        reason: 'Acute lumbar shear risk detected under hip hinge torsion.',
        alternative: 'Chest-Supported Row',
        benefit: 'Decompresses lumbar spine with zero axial torque',
      });
    } else if (hasBack || hasKnee) {
      results.push({
        name: 'Romanian Deadlift',
        target: 'Hamstrings & Lumbar',
        status: 'CAUTION',
        reason: 'AI spine keypoints will alert on lumbar rounding exceeding 8°.',
        alternative: 'Cable Pull-Through',
        benefit: 'Glute & hamstring activation with zero spine shear',
      });
    } else {
      results.push({
        name: 'Romanian Deadlift',
        target: 'Hamstrings & Lumbar',
        status: 'SAFE',
        reason: 'Spine and pelvic alignment verified. Full kinetic chain unlocked.',
      });
    }

    // 3. Overhead Shoulder Press
    if (hasShoulder && shoulderLvl === 'current_discomfort') {
      results.push({
        name: 'Overhead Barbell Press',
        target: 'Anterior Delts',
        status: 'BLOCK',
        reason: 'High impingement vulnerability detected at lockout.',
        alternative: 'Incline Landmine Press',
        benefit: 'Preserves scapular rhythm at comfortable 45° angle',
      });
    } else if (hasShoulder && shoulderLvl === 'previous_injury') {
      results.push({
        name: 'Overhead Barbell Press',
        target: 'Anterior Delts',
        status: 'CAUTION',
        reason: 'AI elbow angle monitored to prevent excessive flaring beyond 70°.',
        alternative: 'Neutral Grip DB Press',
        benefit: 'Reduces subacromial friction',
      });
    } else {
      results.push({
        name: 'Overhead Barbell Press',
        target: 'Anterior Delts',
        status: 'SAFE',
        reason: 'Shoulder girdle mobility cleared for complete vertical lockout.',
      });
    }

    // 4. Dynamic Lunges
    if (hasKnee || hasAnkle) {
      results.push({
        name: 'Walking Dynamic Lunges',
        target: 'Quads & Balance',
        status: 'CAUTION',
        reason: 'Deceleration impact produces high patellar & Achilles shear.',
        alternative: 'Reverse Static Lunge',
        benefit: 'Eliminates deceleration force on patellar tendon',
      });
    } else {
      results.push({
        name: 'Walking Dynamic Lunges',
        target: 'Quads & Balance',
        status: 'SAFE',
        reason: 'Knee and ankle stability cleared for explosive dynamic lunging.',
      });
    }

    // 5. Dumbbell Bench Press
    if (hasWrist) {
      results.push({
        name: 'Barbell Flat Bench',
        target: 'Chest & Triceps',
        status: 'CAUTION',
        reason: 'Fixed bar position produces ulnar wrist extension strain.',
        alternative: 'Neutral Grip DB Bench',
        benefit: 'Allows natural wrist stack over forearm',
      });
    } else {
      results.push({
        name: 'Dumbbell Bench Press',
        target: 'Pectorals & Triceps',
        status: 'SAFE',
        reason: 'Optimal horizontal pressing mechanics with no joint bottlenecks.',
      });
    }

    return results;
  };

  const clearances = getExerciseClearances();

  const handleApplyToWorkouts = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Update store state
    setPainSelection(selectedAreas, 'moderate');
    selectedAreas.forEach((area) => {
      setSafetyCondition(area, conditions[area] || 'previous_injury');
    });

    // Synchronize injury screening with AI backend
    AiService.screenInjury(selectedAreas, 'moderate', 'joint_strain');

    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      navigation.goBack();
    }, 1200);
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header Row */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('injuryCoachTitle') || 'Injury Prevention Coach'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Kinetic Safety Guard</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Headline & Safety Badge */}
        <View style={styles.headlineBlock}>
          <View style={styles.badgeRow}>
            <Badge label="AI FORM GUARD ACTIVE" variant="success" size="sm" />
            <Badge label="BIOMECHANIC CLEARANCE" variant="primary" size="sm" />
          </View>

          <Text style={[styles.headline, { color: colors.textPrimary }]}>{t('letsKeepYouSafe') || "Let's keep you safe"}</Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            {t('injuryCoachDesc') || 'Personalize your AI vision form guard and joint protection. We dynamically adjust rep depth, barbell velocity limits, and recommend safe alternatives.'}
          </Text>
        </View>

        {/* ============================================================ */}
        {/* SECTION 1: BODY AREAS MULTI-SELECT & SEGMENTED CONTROLS      */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SENSITIVE JOINT ZONES</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            {num(selectedAreas.length)} {selectedAreas.length === 1 ? 'Area' : 'Areas'} Monitored
          </Text>
        </View>

        <View style={styles.bodyAreasGrid}>
          {BODY_AREAS.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            const currentCondition = conditions[area.id] || 'previous_injury';

            return (
              <GlassCard
                key={area.id}
                style={[
                  styles.areaCard,
                  isSelected && styles.areaCardSelected,
                ]}
              >
                {/* Chip Header Row */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleToggleArea(area.id)}
                  style={styles.areaTouchHeader}
                >
                  <View style={styles.areaHeaderLeft}>
                    <View
                      style={[
                        styles.areaIconWrap,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.cardBackground },
                        isSelected && styles.areaIconWrapActive,
                      ]}
                    >
                      {isSelected ? (
                        <ShieldAlert size={18} color={colors.warning} />
                      ) : (
                        <ShieldCheck size={18} color={colors.textSecondary} />
                      )}
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.areaName,
                          { color: colors.textPrimary },
                          isSelected && styles.areaNameActive,
                        ]}
                      >
                        {area.name}
                      </Text>
                      <Text style={[styles.areaSubtext, { color: colors.textSecondary }]}>{area.subtext}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkCircle,
                      isSelected && styles.checkCircleActive,
                    ]}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                {/* Segmented Control for Selected Area */}
                {isSelected && (
                  <View style={styles.segmentedContainer}>
                    <Text style={[styles.segmentedLabel, { color: colors.textSecondary }]}>Discomfort Level:</Text>
                    <View style={styles.segmentedControl}>
                      {SEVERITY_OPTIONS.map((opt) => {
                        const isOptActive = currentCondition === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[
                              styles.segmentTab,
                              isOptActive && {
                                backgroundColor:
                                  opt.id === 'current_discomfort'
                                    ? 'rgba(255, 77, 77, 0.25)'
                                    : opt.id === 'previous_injury'
                                    ? 'rgba(255, 176, 32, 0.25)'
                                    : 'rgba(34, 255, 176, 0.25)',
                                borderColor: opt.color,
                              },
                            ]}
                            activeOpacity={0.8}
                            onPress={() => handleSetCondition(area.id, opt.id)}
                          >
                            <Text
                              style={[
                                styles.segmentTabText,
                                isOptActive && {
                                  color: opt.color,
                                  fontWeight: '800',
                                },
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>

        {/* ============================================================ */}
        {/* SECTION 2: RESULTS VIEW (EXERCISE STATUS & ALTERNATIVES)      */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BIOMECHANIC EXERCISE CLEARANCE</Text>
          <Badge
            label={`${num(clearances.filter((c) => c.status === 'BLOCK').length)} BLOCKED`}
            variant={clearances.some((c) => c.status === 'BLOCK') ? 'danger' : 'success'}
            size="sm"
          />
        </View>

        <View style={styles.clearanceList}>
          {clearances.map((ex, idx) => {
            const badgeVariant =
              ex.status === 'SAFE'
                ? 'success'
                : ex.status === 'CAUTION'
                ? 'warning'
                : 'danger';

            return (
              <GlassCard key={idx} style={styles.exerciseRowCard}>
                <View style={styles.exerciseTopRow}>
                  <View style={styles.exerciseTitleWrap}>
                    <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{ex.name}</Text>
                    <Text style={[styles.exerciseTarget, { color: colors.textSecondary }]}>{ex.target}</Text>
                  </View>

                  <Badge label={ex.status} variant={badgeVariant} size="sm" />
                </View>

                <Text style={[styles.exerciseReason, { color: colors.textSecondary }]}>{ex.reason}</Text>

                {/* Suggested Alternative Chip on the Same Row */}
                {ex.alternative && (
                  <View style={styles.altRow}>
                    <View style={[styles.altChip, { backgroundColor: isDark ? 'rgba(34, 255, 176, 0.12)' : '#EBF3EA' }]}>
                      <Repeat size={13} color={colors.neonGreen} />
                      <Text style={[styles.altChipLabel, { color: colors.neonGreen }]}>SUGGESTED SWAP:</Text>
                      <Text style={[styles.altChipName, { color: colors.textPrimary }]}>{ex.alternative}</Text>
                    </View>
                    {ex.benefit && (
                      <Text style={[styles.altBenefitText, { color: colors.textSecondary }]}>🛡️ {ex.benefit}</Text>
                    )}
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>

        {/* ============================================================ */}
        {/* SECTION 3: VISIBLE DISCLAIMER CARD                           */}
        {/* ============================================================ */}
        <GlassCard style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={[styles.disclaimerTitle, { color: colors.textPrimary }]}>Medical Guidance Disclaimer</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            This tool does not diagnose medical conditions. Consult a professional for
            persistent pain or acute structural symptoms. FitVerse AI adapts workout
            recommendations based on user-reported mobility constraints.
          </Text>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 4: APPLY TO MY WORKOUTS BUTTON                       */}
        {/* ============================================================ */}
        <View style={styles.applyWrapper}>
          <GradientButton
            title={appliedNotice ? 'Kinetic Safety Applied! ✓' : 'Apply to My Workouts'}
            icon={<ShieldCheck size={18} color="#FFFFFF" />}
            onPress={handleApplyToWorkouts}
            fullWidth
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 110,
    gap: 16,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  headlineBlock: {
    gap: 8,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Body Areas Grid
  bodyAreasGrid: {
    gap: 10,
  },
  areaCard: {
    padding: 12,
    gap: 10,
  },
  areaCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  areaTouchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  areaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  areaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaIconWrapActive: {
    borderColor: Colors.warning,
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
  },
  areaName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  areaNameActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  areaSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Segmented Control
  segmentedContainer: {
    backgroundColor: Colors.cardBackground,
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Exercise Clearances
  clearanceList: {
    gap: 10,
  },
  exerciseRowCard: {
    padding: 14,
    gap: 8,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseTitleWrap: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  exerciseTarget: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  exerciseReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  altRow: {
    marginTop: 4,
    gap: 4,
    backgroundColor: Colors.coachMiniCardBg,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardSageBorder,
  },
  altChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  altChipLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  altChipName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  altBenefitText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },

  // Disclaimer Card
  disclaimerCard: {
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    backgroundColor: Colors.prepCardBg,
    borderWidth: 1,
    borderColor: Colors.prepCardBorder,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.warning,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // Apply Button
  applyWrapper: {
    marginTop: 4,
  },
});
