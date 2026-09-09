import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Repeat,
  Sparkles,
  ChevronRight,
  Activity,
  Check,
  Info,
  Sliders,
  Target,
  FileText,
} from 'lucide-react-native';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { InteractiveBodyMap } from '../../components/body/InteractiveBodyMap';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';
import {
  InjuryService,
  InjuryAnalyzeResponse,
  ExerciseClearance,
} from '../../services/api/injuryService';

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

const GOAL_OPTIONS = [
  { id: 'fat_loss', label: 'Fat Loss' },
  { id: 'muscle_gain', label: 'Muscle Gain' },
  { id: 'strength', label: 'Strength' },
  { id: 'general_fitness', label: 'General Fitness' },
];

export const InjuryCoachScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const selectedPainAreas = useAuthStore((state) => state.selectedPainAreas);
  const safetyConditions = useAuthStore((state) => state.safetyConditions);
  const setSafetyCondition = useAuthStore((state) => state.setSafetyCondition);
  const setPainSelection = useAuthStore((state) => state.setPainSelection);

  // Form states
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    selectedPainAreas.length > 0 ? selectedPainAreas : ['Knee']
  );
  const [conditions, setConditions] = useState<Record<string, ConditionLevel>>(
    Object.keys(safetyConditions).length > 0
      ? safetyConditions
      : { Knee: 'current_discomfort' }
  );
  const [painLevel, setPainLevel] = useState<number>(5);
  const [painDescription, setPainDescription] = useState<string>('');
  const [recentInjury, setRecentInjury] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('fat_loss');
  const [showBodyMap, setShowBodyMap] = useState<boolean>(true);

  // Backend Intelligence states
  const [backendAnalysis, setBackendAnalysis] = useState<InjuryAnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  // Convert InteractiveBodyMap names to BODY_AREAS IDs
  const mapPointNameToAreaId = (pointName: string): string => {
    const p = pointName.toLowerCase();
    if (p.includes('knee')) return 'Knee';
    if (p.includes('shoulder')) return 'Shoulder';
    if (p.includes('back') || p.includes('spine')) return 'Back';
    if (p.includes('neck') || p.includes('traps')) return 'Neck';
    if (p.includes('elbow') || p.includes('arm')) return 'Wrist';
    if (p.includes('ankle') || p.includes('foot')) return 'Ankle';
    return 'Other';
  };

  // Convert BODY_AREAS to InteractiveBodyMap point names for visual highlights
  const getMapPointsForAreas = (areas: string[]): string[] => {
    const points: string[] = [];
    if (areas.includes('Knee')) points.push('Left Knee', 'Right Knee');
    if (areas.includes('Shoulder')) points.push('Left Shoulder', 'Right Shoulder');
    if (areas.includes('Back')) points.push('Lower Back & Spine');
    if (areas.includes('Neck')) points.push('Neck & Traps');
    if (areas.includes('Wrist')) points.push('Left Elbow / Arm', 'Right Elbow / Arm');
    if (areas.includes('Ankle')) points.push('Left Ankle / Foot', 'Right Ankle / Foot');
    if (areas.includes('Other')) points.push('Chest / Sternum', 'Hips / Pelvis');
    return points;
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

  const handleToggleFromMap = (partName: string) => {
    const areaId = mapPointNameToAreaId(partName);
    handleToggleArea(areaId);
  };

  const handleSetCondition = (areaId: string, level: ConditionLevel) => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    setConditions({ ...conditions, [areaId]: level });
  };

  // Run Backend AI Analysis
  const fetchBackendAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const primaryArea = (selectedAreas[0] || 'knee').toLowerCase();
      const res = await InjuryService.analyzeInjury({
        body_part: primaryArea,
        pain_level: painLevel,
        pain_description: painDescription || undefined,
        recent_injury: recentInjury || undefined,
        goal: selectedGoal,
      });
      setBackendAnalysis(res);
    } catch (e) {
      console.warn('Analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedAreas, painLevel, painDescription, recentInjury, selectedGoal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBackendAnalysis();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchBackendAnalysis]);

  // Fallback clearances if backend analysis pending
  const getExerciseClearances = (): ExerciseClearance[] => {
    if (backendAnalysis?.exercise_clearances && backendAnalysis.exercise_clearances.length > 0) {
      return backendAnalysis.exercise_clearances;
    }

    const hasKnee = selectedAreas.includes('Knee');
    const kneeLvl = conditions['Knee'] || (painLevel >= 7 ? 'current_discomfort' : 'previous_injury');
    const hasBack = selectedAreas.includes('Back');
    const backLvl = conditions['Back'] || (painLevel >= 7 ? 'current_discomfort' : 'previous_injury');
    const hasShoulder = selectedAreas.includes('Shoulder');
    const shoulderLvl = conditions['Shoulder'] || (painLevel >= 7 ? 'current_discomfort' : 'previous_injury');

    const results: ExerciseClearance[] = [];

    // 1. Barbell Squat
    if (hasKnee && (kneeLvl === 'current_discomfort' || painLevel >= 7)) {
      results.push({
        name: 'Barbell Back Squat',
        target: 'Quads & Glutes',
        status: 'BLOCK',
        reason: 'Axial compressive load & patellar shear exceed safe recovery limits.',
        alternative: 'High Box Squat',
        benefit: 'Limits joint flexion past 90° while maintaining full quad recruitment',
      });
    } else if (hasKnee) {
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
    if (hasBack && (backLvl === 'current_discomfort' || painLevel >= 7)) {
      results.push({
        name: 'Romanian Deadlift',
        target: 'Hamstrings & Lumbar',
        status: 'BLOCK',
        reason: 'Acute lumbar shear risk detected under hip hinge torsion.',
        alternative: 'Chest-Supported Row',
        benefit: 'Decompresses lumbar spine with zero axial torque',
      });
    } else if (hasBack) {
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

    // 3. Overhead Press
    if (hasShoulder && (shoulderLvl === 'current_discomfort' || painLevel >= 7)) {
      results.push({
        name: 'Overhead Barbell Press',
        target: 'Anterior Delts',
        status: 'BLOCK',
        reason: 'High impingement vulnerability detected at lockout.',
        alternative: 'Incline Landmine Press',
        benefit: 'Preserves scapular rhythm at comfortable 45° angle',
      });
    } else if (hasShoulder) {
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

    return results;
  };

  const clearances = getExerciseClearances();

  const handleApplyToWorkouts = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const primaryArea = selectedAreas[0] || 'knee';

    // 1. Save profile to backend
    await InjuryService.saveInjuryProfile({
      body_part: primaryArea.toLowerCase(),
      body_parts: selectedAreas,
      pain_level: painLevel,
      pain_description: painDescription || undefined,
      recent_injury: recentInjury || undefined,
      goal: selectedGoal,
    });

    // 2. Update local store
    setPainSelection(selectedAreas, painLevel >= 7 ? 'severe' : painLevel >= 4 ? 'moderate' : 'mild');
    selectedAreas.forEach((area) => {
      setSafetyCondition(area, conditions[area] || (painLevel >= 7 ? 'current_discomfort' : 'previous_injury'));
    });

    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      navigation.goBack();
    }, 1200);
  };

  const cautionLevel = backendAnalysis?.caution_level || (painLevel >= 7 ? 'high' : painLevel >= 4 ? 'moderate' : 'low');

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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t('injuryCoachTitle') || 'Injury Prevention Coach'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Kinetic Safety Guard
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Headline & Safety Badge */}
        <View style={styles.headlineBlock}>
          <View style={styles.badgeRow}>
            <Badge label="AI FORM GUARD ACTIVE" variant="success" size="sm" />
            <Badge
              label={`CAUTION LEVEL: ${cautionLevel.toUpperCase()}`}
              variant={cautionLevel === 'high' ? 'danger' : cautionLevel === 'moderate' ? 'warning' : 'primary'}
              size="sm"
            />
          </View>

          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            {t('letsKeepYouSafe') || "Let's keep you safe"}
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            Select your sensitive body areas and discomfort level. FitVerse dynamically screens exercises, suggests low-impact alternatives, and guards joint safety.
          </Text>
        </View>

        {/* ============================================================ */}
        {/* VIEW TOGGLE: INTERACTIVE BODY MAP / QUICK CARDS              */}
        {/* ============================================================ */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabButton, showBodyMap && styles.tabButtonActive]}
            onPress={() => setShowBodyMap(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, showBodyMap && styles.tabButtonTextActive]}>
              Interactive Body Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !showBodyMap && styles.tabButtonActive]}
            onPress={() => setShowBodyMap(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, !showBodyMap && styles.tabButtonTextActive]}>
              Joint Cards ({selectedAreas.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* INTERACTIVE BODY MAP COMPONENT */}
        {showBodyMap && (
          <GlassCard style={styles.bodyMapCard}>
            <InteractiveBodyMap
              selectedParts={getMapPointsForAreas(selectedAreas)}
              onTogglePart={handleToggleFromMap}
            />
          </GlassCard>
        )}

        {/* ============================================================ */}
        {/* SECTION 1: BODY AREAS SELECTION                              */}
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
                      <Text style={[styles.areaSubtext, { color: colors.textSecondary }]}>
                        {area.subtext}
                      </Text>
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
        {/* SECTION 2: PAIN LEVEL SCALE (0-10)                           */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAIN LEVEL SCALE (0 - 10)</Text>
          <Badge
            label={`LEVEL ${painLevel}/10: ${painLevel >= 7 ? 'SEVERE' : painLevel >= 4 ? 'MODERATE' : 'MILD'}`}
            variant={painLevel >= 7 ? 'danger' : painLevel >= 4 ? 'warning' : 'success'}
            size="sm"
          />
        </View>

        <GlassCard style={styles.painCard}>
          <View style={styles.painPillRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
              const isSelected = painLevel === level;
              const isHigh = level >= 7;
              const isMod = level >= 4 && level < 7;
              const pillColor = isHigh ? Colors.danger : isMod ? Colors.warning : Colors.success;

              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.painPill,
                    isSelected && {
                      backgroundColor: pillColor,
                      borderColor: pillColor,
                      transform: [{ scale: 1.08 }],
                    },
                  ]}
                  onPress={() => {
                    haptic(Haptics.ImpactFeedbackStyle.Light);
                    setPainLevel(level);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.painPillText,
                      isSelected && { color: '#FFFFFF', fontWeight: '900' },
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Severe Pain Warning Notice */}
          {painLevel >= 7 && (
            <View style={styles.severeNoticeBox}>
              <AlertTriangle size={16} color={Colors.danger} />
              <Text style={styles.severeNoticeText}>
                ⚠️ Pain level 7 or higher indicates acute irritation. Cease high-load exercises and consult a healthcare professional.
              </Text>
            </View>
          )}
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 3: QUALITATIVE DETAILS (DESCRIPTION & RECENT INJURY)  */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INJURY HISTORY & DETAILS</Text>
          {isAnalyzing && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <GlassCard style={styles.inputCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pain Description:</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F5' },
              ]}
              placeholder="e.g. Sharp pinch at bottom of squat, dull ache after running"
              placeholderTextColor={colors.textMuted}
              value={painDescription}
              onChangeText={setPainDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Recent Injury or Trauma:</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F5' },
              ]}
              placeholder="e.g. Mild meniscus sprain 4 weeks ago, rotator cuff strain"
              placeholderTextColor={colors.textMuted}
              value={recentInjury}
              onChangeText={setRecentInjury}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Exercise Goal:</Text>
            <View style={styles.goalRow}>
              {GOAL_OPTIONS.map((g) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.goalPill,
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      haptic();
                      setSelectedGoal(g.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.goalPillText,
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 4: EXERCISES TO AVOID OR MODIFY                      */}
        {/* ============================================================ */}
        {backendAnalysis?.avoid_or_modify && backendAnalysis.avoid_or_modify.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                EXERCISES TO AVOID OR MODIFY
              </Text>
              <Badge label={`${backendAnalysis.avoid_or_modify.length} RESTRICTED`} variant="danger" size="sm" />
            </View>

            <GlassCard style={styles.avoidCard}>
              {backendAnalysis.avoid_or_modify.map((item, idx) => (
                <View key={idx} style={styles.avoidRow}>
                  <AlertTriangle size={14} color={Colors.danger} />
                  <Text style={[styles.avoidText, { color: colors.textPrimary }]}>{item}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: LOWER-IMPACT ALTERNATIVES                         */}
        {/* ============================================================ */}
        {backendAnalysis?.lower_impact_alternatives && backendAnalysis.lower_impact_alternatives.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                SUGGESTED LOWER-IMPACT ALTERNATIVES
              </Text>
              <Badge label="SAFE REPLACEMENTS" variant="success" size="sm" />
            </View>

            <GlassCard style={styles.altCardList}>
              {backendAnalysis.lower_impact_alternatives.map((alt, idx) => (
                <View key={idx} style={styles.altItemRow}>
                  <Repeat size={14} color={Colors.success} />
                  <Text style={[styles.altItemText, { color: colors.textPrimary }]}>{alt}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* ============================================================ */}
        {/* SECTION 6: BIOMECHANIC EXERCISE CLEARANCE LIST               */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BIOMECHANIC CLEARANCE MATRIX</Text>
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
        {/* SECTION 7: GENERAL RECOMMENDATIONS                           */}
        {/* ============================================================ */}
        {backendAnalysis?.general_recommendations && backendAnalysis.general_recommendations.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COACHING RECOMMENDATIONS</Text>
            </View>

            <GlassCard style={styles.recCard}>
              {backendAnalysis.general_recommendations.map((rec, idx) => (
                <View key={idx} style={styles.recRow}>
                  <Info size={14} color={colors.primary} />
                  <Text style={[styles.recText, { color: colors.textPrimary }]}>{rec}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* ============================================================ */}
        {/* SECTION 8: MANDATORY MEDICAL DISCLAIMER CARD                 */}
        {/* ============================================================ */}
        <GlassCard style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={[styles.disclaimerTitle, { color: colors.textPrimary }]}>Medical Guidance Disclaimer</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            {backendAnalysis?.medical_disclaimer ||
              'FitVerse Injury Prevention Coach provides general fitness guidance and exercise modifications for educational purposes only. It does not diagnose medical conditions or prescribe clinical treatments. If you experience severe, sharp, or persistent pain, discontinue exercise immediately and seek professional medical evaluation from a licensed physician or physical therapist.'}
          </Text>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 9: APPLY TO MY WORKOUTS BUTTON                       */}
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

  // Toggle Row
  tabToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  bodyMapCard: {
    padding: 12,
    alignItems: 'center',
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

  // Pain Level Selector
  painCard: {
    padding: 12,
    gap: 12,
  },
  painPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  painPill: {
    width: 28,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  painPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  severeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  severeNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.danger,
    lineHeight: 15,
    fontWeight: '600',
  },

  // Form Input Card
  inputCard: {
    padding: 14,
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  goalPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  goalPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Avoid Card
  avoidCard: {
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  avoidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avoidText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Alternatives Card
  altCardList: {
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(34, 255, 176, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  altItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  altItemText: {
    fontSize: 12,
    fontWeight: '700',
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

  // Recommendations Card
  recCard: {
    padding: 12,
    gap: 8,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
