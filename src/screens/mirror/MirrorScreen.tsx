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
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
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
  Camera,
  CameraOff,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useWorkoutSessionStore, CompletedWorkoutSummary } from '../../stores/workoutSessionStore';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { WorkoutService } from '../../services/api/workoutService';
import { PoseService } from '../../services/api/poseService';
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
  const isFocused = useIsFocused();
  const {
    currentExercise,
    targetExercises,
    status,
    repCount,
    formScore,
    timerSeconds,
    feedbackMessage,
    isPersonDetected,
    completedSummary,
    activeSessionId,
    setActiveSessionId,
    setExercise,
    setStatus,
    resetSession,
  } = useWorkoutSessionStore();

  const { selectedPainAreas } = useAuthStore();
  const { addReward } = useGamificationStore();
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  const {
    triggerRep,
    togglePersonDetected,
    pause,
    resume,
    finishEarly,
  } = useWorkoutEngine();

  // Camera permissions hook from Expo SDK 57
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isPoseAvailable, setIsPoseAvailable] = useState(true);
  const [showStopModal, setShowStopModal] = useState(false);
  const [hasAwardedGains, setHasAwardedGains] = useState(false);

  // Proactively request camera permission when focused if not determined yet
  useEffect(() => {
    if (isFocused && permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => {});
    }
  }, [isFocused, permission?.granted]);

  useEffect(() => {
    if (permission?.granted) {
      setCameraReady(true);
    }
  }, [permission?.granted]);

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

    if (permission?.granted) {
      setCameraReady(true);
      transitionToState('active');
      return;
    }

    try {
      const result = await requestPermission();
      if (result.granted) {
        setCameraReady(true);
        transitionToState('active');
      }
    } catch (err) {
      console.warn('Permission request error:', err);
    }
  };

  // Handle Workout Complete (State 3 entry)
  const handleFinishWorkout = () => {
    setShowStopModal(false);
    // finishEarly completes the session and automatically submits to backend API
    const summary = finishEarly();
    if (!hasAwardedGains) {
      setHasAwardedGains(true);
      // Persist AI pose tracking session metrics without duplicate session complete POST
      PoseService.saveSession({
        exercise: summary.exerciseType || 'squat',
        reps: summary.totalReps,
        duration_seconds: summary.durationSeconds,
        average_form_score: summary.averageFormScore,
        common_mistakes: summary.commonMistakes,
        feedback: summary.feedback,
      }).catch(() => {});
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
    return (
      <View style={styles.duringContainer}>
        {/* Full-screen Camera Background Layer (Unmounted when unfocused to release native camera) */}
        {isFocused && permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror={true}
            onCameraReady={() => setCameraReady(true)}
            onMountError={(error) => {
              console.warn('CameraView mount error:', error);
            }}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholderBackground]}>
            <View style={styles.cameraPlaceholderContent}>
              <AlertTriangle size={32} color={Colors.warning} />
              <Text style={styles.cameraPlaceholderTitle}>
                {!permission?.granted ? 'Camera Permission Required' : 'Initializing Camera Mirror...'}
              </Text>
              {!permission?.granted && (
                <TouchableOpacity
                  style={styles.requestPermissionBtn}
                  onPress={requestPermission}
                  activeOpacity={0.8}
                >
                  <Text style={styles.requestPermissionBtnText}>Grant Camera Access</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Dynamic Biomechanical & Workout HUD Overlays */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]} pointerEvents="box-none">

        {/* Biomechanical Skeleton Overlay */}
        <MockSkeletonOverlay
          isPersonDetected={isPersonDetected}
          isPoseAvailable={isPoseAvailable}
          repCount={repCount}
          exerciseType={currentExercise.typeKey}
          formScore={formScore}
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

          {/* Action Toolbar: Manual Rep Logging & Real-time Vision Status */}
          <View style={styles.devBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={triggerRep}
              style={[styles.devChip, { backgroundColor: Colors.primary }]}
            >
              <Dumbbell size={13} color="#FFFFFF" />
              <Text style={[styles.devChipText, { color: '#FFFFFF', fontWeight: '800' }]}>+ Log Rep</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.devChip,
                {
                  borderColor: isPersonDetected ? Colors.success : Colors.warning,
                  backgroundColor: isPersonDetected ? 'rgba(34, 255, 176, 0.15)' : 'rgba(255, 176, 32, 0.15)',
                },
              ]}
            >
              <Sparkles size={12} color={isPersonDetected ? Colors.success : Colors.warning} />
              <Text
                style={[
                  styles.devChipText,
                  { color: isPersonDetected ? Colors.success : Colors.warning },
                ]}
              >
                {isPersonDetected ? `${currentExercise.name.replace('AI ', '')} Active` : 'Searching Athlete'}
              </Text>
            </View>

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
                {isPersonDetected ? 'In Frame' : 'Out of Frame'}
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
      </View>
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

          {/* Common Mistakes Detected */}
          {completedSummary.commonMistakes && completedSummary.commonMistakes.length > 0 && (
            <GlassCard style={[styles.suggestionsCard, { borderColor: Colors.warning }]} padding={18}>
              <View style={styles.suggestionsTitleRow}>
                <AlertTriangle size={18} color={Colors.warning} />
                <Text style={[styles.suggestionsTitle, { color: Colors.warning }]}>Form Diagnostics & Mistakes</Text>
              </View>
              {completedSummary.commonMistakes.map((mistake, idx) => (
                <View key={idx} style={styles.suggestionItem}>
                  <View style={[styles.suggestionDot, { backgroundColor: Colors.warning }]} />
                  <Text style={[styles.suggestionText, { color: colors.textPrimary, fontWeight: '600' }]}>
                    {mistake}
                  </Text>
                </View>
              ))}
            </GlassCard>
          )}

          {/* AI Coaching Directives */}
          <GlassCard style={styles.suggestionsCard} padding={18}>
            <View style={styles.suggestionsTitleRow}>
              <ShieldCheck size={18} color={colors.primaryViolet} />
              <Text style={[styles.suggestionsTitle, { color: colors.textPrimary }]}>AI Coaching Directives</Text>
            </View>
            {(completedSummary.feedback && completedSummary.feedback.length > 0
              ? completedSummary.feedback
              : [
                  'Maintain an upright cervical spine during maximum hip flexion to reduce lower back shearing.',
                  'Great depth consistency! Keep pressing out against the floor through mid-foot drive.',
                ]
            ).map((cue, idx) => (
              <View key={idx} style={styles.suggestionItem}>
                <View style={[styles.suggestionDot, { backgroundColor: colors.primaryViolet }]} />
                <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                  {cue}
                </Text>
              </View>
            ))}
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
  const isPermissionDenied = permission && !permission.granted;

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

        {/* Live Mirror Calibration Preview (Visible immediately when permission granted) */}
        {permission?.granted && isFocused ? (
          <GlassCard style={styles.liveMirrorCard} padding={12}>
            <View style={styles.liveMirrorHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveIndicatorText}>LIVE CAMERA MIRROR ACTIVE</Text>
              </View>
              <Text style={[styles.calibrationTip, { color: colors.textSecondary }]}>Position yourself 6-8 ft back</Text>
            </View>
            <View style={styles.cameraPreviewFrame}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="front"
                mirror={true}
              />
              <View style={styles.cameraFrameGuide} pointerEvents="none">
                <View style={styles.frameCornerTL} />
                <View style={styles.frameCornerTR} />
                <View style={styles.frameCornerBL} />
                <View style={styles.frameCornerBR} />
              </View>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.permissionPromptCard} padding={16}>
            <View style={styles.permissionRow}>
              <Camera size={22} color={colors.primary} />
              <View style={styles.permissionCol}>
                <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>Camera Access Required</Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
                  Enable camera preview to view yourself in the AI Mirror and track real-time reps.
                </Text>
              </View>
            </View>
            <View style={styles.permissionActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => requestPermission()}
                style={[styles.primaryGrantBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryGrantBtnText}>Enable Camera Preview</Text>
              </TouchableOpacity>
              {permission && !permission.granted && !permission.canAskAgain && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Linking.openSettings()}
                  style={styles.settingsBtn}
                >
                  <Text style={styles.settingsBtnText}>Open Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        )}

        {/* 5 Target Movements Quick Selector */}
        <View style={styles.exerciseSelectorRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exerciseSelectorScroll}
          >
            {targetExercises.map((ex) => {
              const isSelected = ex.id === currentExercise.id;
              return (
                <TouchableOpacity
                  key={ex.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setExercise(ex);
                  }}
                  style={[
                    styles.exercisePill,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.exercisePillText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {ex.name.replace('AI ', '')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  liveMirrorCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(79, 124, 255, 0.3)',
    overflow: 'hidden',
  },
  liveMirrorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.neonGreen,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.neonGreen,
    letterSpacing: 0.5,
  },
  calibrationTip: {
    fontSize: 11,
    fontWeight: '600',
  },
  cameraPreviewFrame: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginTop: 4,
  },
  cameraFrameGuide: {
    ...StyleSheet.absoluteFill,
    padding: 12,
  },
  frameCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.neonGreen,
    borderRadius: 3,
  },
  frameCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.neonGreen,
    borderRadius: 3,
  },
  frameCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.neonGreen,
    borderRadius: 3,
  },
  frameCornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.neonGreen,
    borderRadius: 3,
  },
  permissionPromptCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 124, 255, 0.25)',
  },
  primaryGrantBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGrantBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startActionBox: {
    marginTop: 8,
  },

  // ================= STATE 2 STYLES =================
  duringContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPlaceholderBackground: {
    backgroundColor: '#090B10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  cameraPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  requestPermissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  requestPermissionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
  exerciseSelectorRow: {
    marginBottom: 16,
  },
  exerciseSelectorScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  exercisePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  exercisePillText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
