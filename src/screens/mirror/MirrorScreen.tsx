import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Play,
  Pause,
  X,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  Award,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Dumbbell,
  ArrowRight,
  Settings,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useWorkoutSessionStore, CompletedWorkoutSummary } from '../../stores/workoutSessionStore';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { WorkoutService } from '../../services/api/workoutService';
import { useWorkoutEngine } from './hooks/useWorkoutEngine';
import { MockSkeletonOverlay } from './components/MockSkeletonOverlay';
import { FormScoreGauge } from './components/FormScoreGauge';
import { ConfettiCelebration } from './components/ConfettiCelebration';
import { useTranslation } from '../../stores/languageStore';
import { useTheme } from '../../stores/themeStore';

interface MirrorScreenProps {
  navigation: any;
}

export const MirrorScreen: React.FC<MirrorScreenProps> = ({ navigation }) => {
  const {
    currentExercise,
    status,
    repCount,
    formScore,
    timerSeconds,
    feedbackMessage,
    isPersonDetected,
    completedSummary,
    activeSessionId,
    setActiveSessionId,
    setStatus,
    resetSession,
  } = useWorkoutSessionStore();

  const { selectedPainAreas } = useAuthStore();
  const { addReward } = useGamificationStore();
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  const {
    triggerRep,
    toggleAutoReps,
    isAutoRepsEnabled,
    togglePersonDetected,
    pause,
    resume,
    finishEarly,
  } = useWorkoutEngine();

  // Camera permissions hook from Expo SDK 57
  const [permission, requestPermission] = useCameraPermissions();
  const [simulatedCameraFallback, setSimulatedCameraFallback] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [hasAwardedGains, setHasAwardedGains] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const repScaleAnim = useRef(new Animated.Value(1)).current;
  const feedbackFadeAnim = useRef(new Animated.Value(1)).current;
  const feedbackSlideAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation on rep counter increment
  useEffect(() => {
    if (repCount > 0) {
      Animated.sequence([
        Animated.timing(repScaleAnim, {
          toValue: 1.35,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.spring(repScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [repCount, repScaleAnim]);

  // Smooth slide/fade on coaching feedback change
  useEffect(() => {
    if (status === 'active') {
      feedbackSlideAnim.setValue(12);
      feedbackFadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(feedbackSlideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [feedbackMessage, status, feedbackFadeAnim, feedbackSlideAnim]);

  // Smooth screen transitions
  const transitionToState = (nextState: 'idle' | 'active' | 'complete') => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setStatus(nextState);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  // Start workout from State 1 (Before)
  const handleStartWorkout = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    // Initialize workout session on backend
    WorkoutService.startWorkout(currentExercise.name, 'high').then((res) => {
      if (res?.session_id) {
        setActiveSessionId(res.session_id);
      }
    }).catch(() => {});

    if (permission?.granted || simulatedCameraFallback) {
      transitionToState('active');
      return;
    }

    const result = await requestPermission();
    if (result.granted) {
      transitionToState('active');
    } else {
      // Permission not granted; prompt user
    }
  };

  // Handle Workout Complete (State 3 entry)
  const handleFinishWorkout = () => {
    setShowStopModal(false);
    const summary = finishEarly();
    if (!hasAwardedGains) {
      addReward(summary.xpEarned, summary.coinsEarned);
      setHasAwardedGains(true);
      // Persist workout session to backend & Supabase with activeSessionId
      WorkoutService.submitSession(summary, activeSessionId);
    }
    transitionToState('complete');
  };

  // Back to Home from State 3 (After)
  const handleBackToHome = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    resetSession();
    setHasAwardedGains(false);
    navigation.navigate('Home');
  };

  // Format timer seconds into mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check pain areas from auth onboarding for Safety Notes
  const hasKneeOrBackPain =
    selectedPainAreas.includes('Knees') ||
    selectedPainAreas.includes('Lower Back') ||
    selectedPainAreas.includes('Hips') ||
    selectedPainAreas.length > 0;

  // =========================================================================
  // STATE 2: DURING (Live AI Workout Mirror)
  // =========================================================================
  if (status === 'active' || status === 'paused') {
    const isCameraReady = permission?.granted && !simulatedCameraFallback;

    return (
      <Animated.View style={[styles.duringContainer, { opacity: fadeAnim }]}>
        {/* Full-screen Camera Background Layer */}
        {isCameraReady ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.simulatedCameraBackground]}>
            {/* Ambient Biomechanical Grid lines */}
            <View style={styles.gridLineHorizontal} />
            <View style={[styles.gridLineHorizontal, { top: '35%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '65%' }]} />
            <View style={styles.gridLineVertical} />
            <View style={[styles.gridLineVertical, { left: '30%' }]} />
            <View style={[styles.gridLineVertical, { left: '70%' }]} />
          </View>
        )}

        {/* Biomechanical Skeleton Overlay */}
        <MockSkeletonOverlay
          isPersonDetected={isPersonDetected}
          repCount={repCount}
        />

        {/* Top Overlay Bar */}
        <View style={styles.topOverlayBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={status === 'active' ? pause : resume}
            style={styles.topBarBtn}
          >
            {status === 'active' ? (
              <Pause size={18} color="#FFFFFF" />
            ) : (
              <Play size={18} color={Colors.success} />
            )}
          </TouchableOpacity>

          <View style={styles.topBarTitleBox}>
            <Text style={styles.topBarExerciseName}>{currentExercise.name}</Text>
            <View style={styles.topBarTimerRow}>
              <Clock size={12} color={Colors.accentSky} />
              <Text style={styles.topBarTimerText}>{formatTimer(timerSeconds)}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowStopModal(true)}
            style={[styles.topBarBtn, styles.stopBtn]}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Floating Coaching Feedback Bubble */}
        <Animated.View
          style={[
            styles.floatingFeedbackWrapper,
            {
              opacity: feedbackFadeAnim,
              transform: [{ translateY: feedbackSlideAnim }],
            },
          ]}
        >
          <GlassCard variant="glow" style={styles.feedbackCard} padding={12}>
            <View style={styles.feedbackContent}>
              <Sparkles size={15} color={Colors.neonGreen} />
              <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Center-Bottom Overlay HUD */}
        <View style={styles.bottomHud}>
          {/* Large Animated Rep Counter */}
          <Animated.View
            style={[
              styles.repCounterWrapper,
              { transform: [{ scale: repScaleAnim }] },
            ]}
          >
            <Text style={styles.repNumber}>{repCount}</Text>
            <Text style={styles.repLabel}>REPS</Text>
          </Animated.View>

          {/* Live Form Score Gauge */}
          <View style={styles.formGaugeContainer}>
            <FormScoreGauge score={formScore} size={84} strokeWidth={7} />
          </View>

          {/* Subtle Dev Action Toolbar (For Instant Demoing) */}
          <View style={styles.devBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={triggerRep}
              style={styles.devChip}
            >
              <Dumbbell size={12} color="#FFFFFF" />
              <Text style={styles.devChipText}>+ Rep</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleAutoReps}
              style={[
                styles.devChip,
                isAutoRepsEnabled && { borderColor: Colors.primary, backgroundColor: 'rgba(79, 124, 255, 0.2)' },
              ]}
            >
              <RefreshCw size={12} color={isAutoRepsEnabled ? Colors.primary : Colors.textMuted} />
              <Text
                style={[
                  styles.devChipText,
                  isAutoRepsEnabled && { color: Colors.primary },
                ]}
              >
                Auto: {isAutoRepsEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={togglePersonDetected}
              style={[
                styles.devChip,
                !isPersonDetected && { borderColor: Colors.warning, backgroundColor: 'rgba(255, 176, 32, 0.2)' },
              ]}
            >
              {isPersonDetected ? (
                <Eye size={12} color={Colors.success} />
              ) : (
                <EyeOff size={12} color={Colors.warning} />
              )}
              <Text
                style={[
                  styles.devChipText,
                  !isPersonDetected && { color: Colors.warning },
                ]}
              >
                {isPersonDetected ? 'Visible' : 'No Athlete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pause Overlay Backdrop */}
        {status === 'paused' && (
          <View style={styles.pausedBackdrop}>
            <GlassCard variant="accent" style={styles.pausedCard} padding={24}>
              <Text style={styles.pausedTitle}>Workout Paused</Text>
              <Text style={styles.pausedSub}>Take a breath. Ready to jump back in?</Text>

              <View style={styles.pausedMetricsRow}>
                <View style={styles.pausedMetricItem}>
                  <Text style={styles.pausedMetricLabel}>REPS</Text>
                  <Text style={styles.pausedMetricValue}>{repCount}</Text>
                </View>
                <View style={styles.pausedMetricItem}>
                  <Text style={styles.pausedMetricLabel}>TIME</Text>
                  <Text style={styles.pausedMetricValue}>{formatTimer(timerSeconds)}</Text>
                </View>
                <View style={styles.pausedMetricItem}>
                  <Text style={styles.pausedMetricLabel}>AVG FORM</Text>
                  <Text style={[styles.pausedMetricValue, { color: Colors.success }]}>
                    {Math.round(formScore)}%
                  </Text>
                </View>
              </View>

              <GradientButton
                title="Resume Workout"
                onPress={resume}
                icon={<Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
                fullWidth
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowStopModal(true)}
                style={styles.pausedEndBtn}
              >
                <Text style={styles.pausedEndBtnText}>End Session Early</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Stop Confirmation Prompt Modal */}
        <Modal
          visible={showStopModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStopModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <GlassCard style={styles.modalCard} padding={22}>
              <View style={styles.modalIconBox}>
                <AlertTriangle size={24} color={Colors.warning} />
              </View>
              <Text style={styles.modalTitle}>End workout early?</Text>
              <Text style={styles.modalDesc}>
                Your {repCount} completed reps, time, and form diagnostics will still be saved to your profile rewards.
              </Text>

              <View style={styles.modalActions}>
                <GradientButton
                  title="Finish & Save"
                  onPress={handleFinishWorkout}
                  fullWidth
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowStopModal(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Keep Going</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </Animated.View>
    );
  }

  // =========================================================================
  // STATE 3: AFTER (Workout Summary / Reward Screen)
  // =========================================================================
  if (status === 'complete' && completedSummary) {
    const avgScore = completedSummary.averageFormScore;

    return (
      <ScreenContainer>
        {/* Celebration Particle Burst */}
        <ConfettiCelebration />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.afterContainer, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.afterHeader}>
            <View style={styles.afterBadge}>
              <Sparkles size={14} color={colors.success} />
              <Text style={[styles.afterBadgeText, { color: colors.success }]}>SESSION CONCLUDED</Text>
            </View>
            <Text style={[styles.afterTitle, { color: colors.textPrimary }]}>Workout Complete!</Text>
            <Text style={[styles.afterSubtitle, { color: colors.textSecondary }]}>
              {completedSummary.exerciseName} • Biomechanical summary saved
            </Text>
          </View>

          {/* Form Score Radial Spotlight Card */}
          <GlassCard variant="glow" style={styles.radialSpotlightCard} padding={20}>
            <FormScoreGauge score={avgScore} size={130} strokeWidth={11} showLabel={false} />
            <Text style={[styles.radialScoreHeadline, { color: colors.textPrimary }]}>
              {avgScore >= 90
                ? '🌟 Competition Grade Execution'
                : avgScore >= 75
                ? '✅ Solid Form & Kinetic Control'
                : '⚠️ Form Breakdown Under Fatigue'}
            </Text>
            <Text style={[styles.radialScoreSub, { color: colors.textSecondary }]}>
              Average kinetic posture score across {num(completedSummary.totalReps)} tracked repetitions.
            </Text>
          </GlassCard>

          {/* Stat Grid (Total Reps, Duration, XP, Coins) */}
          <View style={styles.statGrid}>
            <GlassCard style={styles.statTile} padding={14}>
              <Dumbbell size={18} color={colors.primary} />
              <Text style={[styles.statTileVal, { color: colors.textPrimary }]}>{num(completedSummary.totalReps)}</Text>
              <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>TOTAL REPS</Text>
            </GlassCard>

            <GlassCard style={styles.statTile} padding={14}>
              <Clock size={18} color={colors.accentSky} />
              <Text style={[styles.statTileVal, { color: colors.textPrimary }]}>{formatTimer(completedSummary.durationSeconds)}</Text>
              <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>DURATION</Text>
            </GlassCard>

            <GlassCard style={styles.statTile} padding={14}>
              <Zap size={18} color={colors.warning} />
              <Text style={[styles.statTileVal, { color: colors.warning }]}>
                +{num(completedSummary.xpEarned)}
              </Text>
              <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>XP GAINED</Text>
            </GlassCard>

            <GlassCard style={styles.statTile} padding={14}>
              <Award size={18} color={colors.success} />
              <Text style={[styles.statTileVal, { color: colors.success }]}>
                +{num(completedSummary.coinsEarned)}
              </Text>
              <Text style={[styles.statTileLabel, { color: colors.textSecondary }]}>COINS</Text>
            </GlassCard>
          </View>

          {/* Trained Areas Chips Row */}
          <View style={styles.trainedAreasSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TRAINED MUSCLE GROUPS</Text>
            <View style={styles.chipsRow}>
              {completedSummary.targetMuscles.map((muscle, idx) => (
                <View key={idx} style={styles.muscleChip}>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={[styles.muscleChipText, { color: colors.textPrimary }]}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Improvement Suggestions Card */}
          <GlassCard style={styles.suggestionsCard} padding={18}>
            <View style={styles.suggestionsTitleRow}>
              <ShieldCheck size={18} color={colors.primaryViolet} />
              <Text style={[styles.suggestionsTitle, { color: colors.textPrimary }]}>Biomechanic Insights</Text>
            </View>
            <View style={styles.suggestionItem}>
              <View style={[styles.suggestionDot, { backgroundColor: colors.primaryViolet }]} />
              <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                Maintain an upright cervical spine during maximum hip flexion to reduce lower back shearing by ~14%.
              </Text>
            </View>
            <View style={styles.suggestionItem}>
              <View style={[styles.suggestionDot, { backgroundColor: colors.primaryViolet }]} />
              <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                Great depth consistency! Keep pressing out against the floor through mid-foot drive on each rep.
              </Text>
            </View>
          </GlassCard>

          {/* Back to Home CTA */}
          <View style={styles.afterAction}>
            <GradientButton
              title="Back to Home"
              onPress={handleBackToHome}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              fullWidth
            />
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

  // =========================================================================
  // STATE 1: BEFORE (Exercise Preview & Calibration)
  // =========================================================================
  const isPermissionDenied = permission && !permission.granted && !simulatedCameraFallback;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.beforeContainer, { opacity: fadeAnim }]}>
        {/* Top Header Row */}
          <View style={styles.beforeHeader}>
            <View style={styles.badgeRow}>
              <Badge label="AI FITNESS MIRROR" variant="primary" />
              <Badge label="60 FPS TRACKING" variant="success" />
            </View>
            <Text style={[styles.screenHeading, { color: colors.textPrimary }]}>{t('mirrorTitle') || 'Smart Workout'}</Text>
            <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
            Align your full body in the front camera for automated repetition counting and joint form diagnostics.
          </Text>
        </View>

        {/* Hero Exercise Area */}
        <GlassCard variant="glow" style={styles.heroCard} padding={20}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconCircle}>
              <Dumbbell size={32} color={colors.primary} />
            </View>
            <View style={styles.heroBadgeBox}>
              <Badge label={currentExercise.difficulty} variant="primary" />
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{currentExercise.name}</Text>
          <Text style={[styles.heroCategory, { color: colors.accentSky }]}>{currentExercise.category}</Text>

          {/* Info Row: Target Reps, Duration, Calories */}
          <View style={[styles.infoRow, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.04)' }]}>
            <View style={styles.infoCol}>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{num(currentExercise.targetReps)}</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1}>{t('targetReps') || 'TARGET REPS'}</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoCol}>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{currentExercise.durationEstimate}</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1}>{t('estDuration') || 'EST. DURATION'}</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoCol}>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{num(currentExercise.caloriesEstimate)}</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1}>{t('calories') || 'CALORIES'}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Safety Notes Card (Injury-screening integrated) */}
        <GlassCard
          variant={hasKneeOrBackPain ? 'accent' : 'default'}
          style={styles.safetyCard}
          padding={18}
        >
          <View style={styles.safetyHeader}>
            {hasKneeOrBackPain ? (
              <AlertTriangle size={20} color={colors.warning} />
            ) : (
              <ShieldCheck size={20} color={colors.success} />
            )}
            <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>{t('safetyDirectives') || 'Safety Directives'}</Text>
          </View>

          {hasKneeOrBackPain ? (
            <View style={styles.safetyAlertContent}>
              <Text style={[styles.safetyText, { color: colors.warning }]}>
                Sensitivity detected in {selectedPainAreas.join(', ') || 'lower kinetic chain'}.
              </Text>
              <Text style={[styles.safetySubText, { color: colors.textSecondary }]}>
                Maintain a strictly upright torso and stop squat depth at parallel to avoid excess compressive load on the lumbar spine and patella.
              </Text>
            </View>
          ) : (
            <View style={styles.safetyAlertContent}>
              <Text style={[styles.safetyText, { color: colors.success }]}>
                No restrictions detected for this exercise.
              </Text>
              <Text style={[styles.safetySubText, { color: colors.textSecondary }]}>
                Full mobility cleared. Focus on steady 3-second descent cadence and knees tracking outward over second toes.
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Form Cues Card */}
        <GlassCard style={styles.cuesCard} padding={18}>
          <View style={styles.cuesHeader}>
            <Sparkles size={16} color={colors.neonGreen} />
            <Text style={[styles.cuesTitle, { color: colors.textPrimary }]}>{t('keyCoachingCues') || 'Key Coaching Cues'}</Text>
          </View>
          {currentExercise.formCues.map((cue, idx) => (
            <View key={idx} style={styles.cueItem}>
              <View style={[styles.cueDot, { backgroundColor: colors.neonGreen }]} />
              <Text style={[styles.cueItemText, { color: colors.textSecondary }]}>{cue}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Camera Permission Alert (if denied) */}
        {isPermissionDenied && (
          <GlassCard style={styles.permissionCard} padding={16}>
            <View style={styles.permissionRow}>
              <Settings size={20} color={Colors.warning} />
              <View style={styles.permissionCol}>
                <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                <Text style={styles.permissionDesc}>
                  Enable camera access to allow the local vision pipeline to track joint keypoints.
                </Text>
              </View>
            </View>

            <View style={styles.permissionActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Linking.openSettings()}
                style={styles.settingsBtn}
              >
                <Text style={styles.settingsBtnText}>Open Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSimulatedCameraFallback(true)}
                style={styles.fallbackBtn}
              >
                <Text style={styles.fallbackBtnText}>Use Simulated Vision</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Start Workout Primary CTA */}
        <View style={styles.startActionBox}>
          <GradientButton
            title={t('startWorkout') || 'Start Workout'}
            onPress={handleStartWorkout}
            icon={<Play size={20} color="#FFFFFF" fill="#FFFFFF" />}
            size="lg"
            fullWidth
          />
        </View>
      </Animated.View>
    </ScrollView>
  </ScreenContainer>
);
};

const styles = StyleSheet.create({
  // ================= STATE 1 STYLES =================
  beforeContainer: {
    paddingBottom: 90,
    gap: theme.spacing.md,
  },
  beforeHeader: {
    gap: 6,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  screenHeading: {
    fontSize: theme.typography.display.fontSize,
    fontFamily: theme.typography.display.fontFamily,
    fontWeight: theme.typography.display.fontWeight,
    color: theme.colors.textPrimary,
  },
  screenSub: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: Colors.borderActive,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 124, 255, 0.15)',
    borderWidth: 1,
    borderColor: Colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeBox: {
    alignItems: 'flex-end',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  heroCategory: {
    fontSize: 13,
    color: Colors.accentSky,
    fontWeight: '600',
    marginTop: -8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginTop: 6,
  },
  infoCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  infoVal: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  infoDivider: {
    width: 1,
    height: 22,
    opacity: 0.35,
  },
  safetyCard: {
    gap: 10,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  safetyAlertContent: {
    gap: 4,
  },
  safetyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  safetySubText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  cuesCard: {
    gap: 10,
  },
  cuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cuesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neonGreen,
  },
  cueItemText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  permissionCard: {
    borderWidth: 1,
    borderColor: Colors.warning,
    gap: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionCol: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
  },
  permissionDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  permissionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 176, 32, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
  },
  fallbackBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  startActionBox: {
    marginTop: 8,
  },

  // ================= STATE 2 STYLES =================
  duringContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  simulatedCameraBackground: {
    backgroundColor: '#090B10',
    overflow: 'hidden',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(79, 124, 255, 0.08)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(79, 124, 255, 0.08)',
  },
  topOverlayBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    left: 16,
    right: 16,
    height: 52,
    backgroundColor: 'rgba(22, 46, 28, 0.88)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 40,
  },
  topBarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    backgroundColor: 'rgba(255, 77, 77, 0.25)',
  },
  topBarTitleBox: {
    alignItems: 'center',
  },
  topBarExerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  topBarTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  topBarTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSky,
  },
  floatingFeedbackWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 88,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 35,
  },
  feedbackCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderActive,
    maxWidth: 320,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomHud: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 12,
    zIndex: 40,
  },
  repCounterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 13, 18, 0.85)',
    borderWidth: 2,
    borderColor: Colors.borderGlow,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 28,
    shadowColor: Colors.primaryViolet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  repNumber: {
    fontSize: 58,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: theme.typography.display.fontFamily,
    lineHeight: 62,
    letterSpacing: -1,
  },
  repLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.neonGreen,
    letterSpacing: 2,
    marginTop: -4,
  },
  formGaugeContainer: {
    backgroundColor: 'rgba(11, 13, 18, 0.75)',
    padding: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devBar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(11, 13, 18, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  devChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  pausedBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 13, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 60,
  },
  pausedCard: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  pausedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  pausedSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: -8,
  },
  pausedMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
  },
  pausedMetricItem: {
    alignItems: 'center',
  },
  pausedMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  pausedMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  pausedEndBtn: {
    paddingVertical: 8,
  },
  pausedEndBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActions: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },

  // ================= STATE 3 STYLES =================
  afterContainer: {
    paddingBottom: 90,
    gap: theme.spacing.md,
  },
  afterHeader: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  afterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 255, 176, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 255, 176, 0.3)',
  },
  afterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 1,
  },
  afterTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.display.fontFamily,
  },
  afterSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  radialSpotlightCard: {
    alignItems: 'center',
    gap: 12,
  },
  radialScoreHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  radialScoreSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  statTile: {
    width: '48%',
    alignItems: 'center',
    gap: 4,
  },
  statTileVal: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  trainedAreasSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 124, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.borderActive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  muscleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  suggestionsCard: {
    gap: 10,
  },
  suggestionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryViolet,
    marginTop: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  afterAction: {
    marginTop: 6,
  },
});
