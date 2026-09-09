import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Flame,
  Bell,
  Check,
  Dumbbell,
  Droplet,
  Droplets,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info,
  Sun,
  Moon,
  Utensils,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Zap,
  Award,
  Target,
  Plus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import {
  ScreenContainer,
  GlassCard,
  GradientButton,
  Badge,
  ProgressBar,
  Avatar,
} from '../../components/ui';
import { Colors } from '../../theme/colors';
import { useAuthStore, normalizeGoalName } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useDailyActivityStore } from '../../stores/dailyActivityStore';
import { useDietStore } from '../../stores/dietStore';
import { useHomeDashboard } from '../../services/mock/hooks/useHomeDashboard';

import { ExerciseTrackerModal } from './components/ExerciseTrackerModal';
import { WaterTrackerModal } from './components/WaterTrackerModal';
import { WeightTrackerModal } from './components/WeightTrackerModal';
import { DietPlanModal } from './components/DietPlanModal';
import { useTranslation } from '../../stores/languageStore';
import { useTheme } from '../../stores/themeStore';

interface ActivityTileConfig {
  id: 'exercise' | 'water' | 'weight';
  title: string;
  icon: (color: string, size: number) => React.ReactNode;
  accentColor: string;
  getStatusText: () => string;
  renderExtra?: () => React.ReactNode;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Stores
  const user = useAuthStore((state) => state.user);
  const selectedGoal = useAuthStore((state) => state.selectedGoal);
  const normalizedGoal = normalizeGoalName(selectedGoal || (user as any)?.selected_goal);
  const isNewUser = useAuthStore((state) => state.isNewUser);
  const xp = useGamificationStore((state) => state.xp);
  const userLevel = useGamificationStore((state) => state.level);
  const streak = useGamificationStore((state) => state.streak);

  // Daily Activity Store
  const exerciseLogged = useDailyActivityStore((state) => state.exerciseLogged);
  const loggedActivities = useDailyActivityStore((state) => state.loggedActivities);
  const hasWorkedOutToday = useDailyActivityStore((state) => state.hasWorkedOutToday);
  const todayWorkoutDurationMinutes = useDailyActivityStore((state) => state.todayWorkoutDurationMinutes);
  const todayWorkoutCaloriesBurned = useDailyActivityStore((state) => state.todayWorkoutCaloriesBurned);
  const totalPastWorkouts = useDailyActivityStore((state) => state.totalPastWorkouts);
  const waterCount = useDailyActivityStore((state) => state.waterGlasses);
  const maxGlasses = useDailyActivityStore((state) => state.maxGlasses);
  const todayWaterMl = useDailyActivityStore((state) => state.todayWaterMl);
  const dailyWaterTargetMl = useDailyActivityStore((state) => state.dailyWaterTargetMl || 3500);
  const addWaterGlass = useDailyActivityStore((state) => state.addWaterGlass);
  const currentWeight = useDailyActivityStore((state) => state.currentWeight);
  const weightLoggedToday = useDailyActivityStore((state) => state.weightLoggedToday);
  const fitScoreData = useDailyActivityStore((state) => state.fitScoreData);
  const steps = useDailyActivityStore((state) => state.steps || 0);
  const stepsTarget = useDailyActivityStore((state) => state.stepsTarget || 10000);
  const syncWithBackend = useDailyActivityStore((state) => state.syncWithBackend);

  // Diet Store
  const meals = useDietStore((state) => state.meals);
  const calorieTarget = useDietStore((state) => state.calorieTarget || 2200);
  const proteinTarget = useDietStore((state) => state.proteinTarget || 140);
  const getTotals = useDietStore((state) => state.getTotals);
  const dailyAnalysis = useDietStore((state) => state.dailyAnalysis);
  const weeklyReport = useDietStore((state) => state.weeklyReport);
  const syncDietWithBackend = useDietStore((state) => state.syncTodayWithBackend);

  useEffect(() => {
    syncWithBackend();
    syncDietWithBackend();
  }, [syncWithBackend, syncDietWithBackend]);

  const totals = getTotals();
  const hasMealsLogged = meals.length > 0 && totals.calories > 0;
  const currentFitScore = fitScoreData?.fit_score ?? (hasWorkedOutToday || hasMealsLogged ? 78 : 70);

  // Language & Theme hooks
  const { t, num } = useTranslation();
  const { colors, isDark, toggleThemeMode } = useTheme();

  // 1. Time-based User Greeting (Requirement 1)
  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const userName = user?.name || 'Athlete';
  const greetingText = `${getTimeGreeting()}, ${userName}`;

  // 8. Daily AI Insight (Requirement 8)
  const getDailyAiInsight = (): string => {
    if (dailyAnalysis?.headline) return dailyAnalysis.headline;
    if (dailyAnalysis?.tomorrow_recommendations && dailyAnalysis.tomorrow_recommendations.length > 0) {
      return dailyAnalysis.tomorrow_recommendations[0];
    }
    const proteinNeeded = Math.max(0, proteinTarget - totals.protein);
    const waterCurrentL = (todayWaterMl / 1000).toFixed(1);
    const waterTargetL = (dailyWaterTargetMl / 1000).toFixed(1);

    if (todayWaterMl >= dailyWaterTargetMl * 0.4 && proteinNeeded > 0) {
      return `Your hydration is good today. You need approximately ${proteinNeeded}g more protein to reach your target.`;
    }
    if (!hasMealsLogged && todayWaterMl === 0) {
      return 'Log your first meal and glass of water today to unlock your personalized AI daily coaching insights.';
    }
    if (totals.protein >= proteinTarget) {
      return `Phenomenal discipline! You've achieved 100% of your daily protein target with ${totals.protein}g.`;
    }
    return `Tracking at ${totals.calories} kcal so far today. Remember to stay hydrated and hit your target macros.`;
  };

  // 9. Weekly Preview Validation (Requirement 9)
  const hasWeeklyData = Boolean(
    weeklyReport &&
    weeklyReport.has_data !== false &&
    ((weeklyReport.workout?.workout_days ?? 0) > 0 || (weeklyReport.nutrition?.average_protein ?? 0) > 0)
  );

  // 7. Quick Actions Handlers (Requirement 7)
  const handleQuickLogFood = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPlanModal(true);
  };

  const handleQuickAddWater = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWaterGlass();
  };

  const handleQuickStartWorkout = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Mirror');
  };

  const handleQuickAiCoach = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('InjuryCoach');
  };

  // TanStack Query Mock Hook
  const { data: dashboard, refetch, isRefetching } = useHomeDashboard();

  // Active Modal State
  const [activeModal, setActiveModal] = useState<'exercise' | 'water' | 'weight' | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Entrance Stagger Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim]);

  // Rank Progress calculation
  const xpToNextLevel = userLevel * 400;
  const currentLevelBase = (userLevel - 1) * 400;
  const progressInLevel = Math.max(0, xp - currentLevelBase);
  const rankPercent = Math.min(
    100,
    Math.round((progressInLevel / (xpToNextLevel - currentLevelBase || 400)) * 100)
  );

  // Mappable Activity Tiles configuration
  const ACTIVITY_TILES: ActivityTileConfig[] = [
    {
      id: 'exercise',
      title: t('exercise'),
      icon: (c, s) => <Dumbbell size={s} color={c} />,
      accentColor: colors.primary,
      getStatusText: () => {
        if (loggedActivities.length > 0) {
          return loggedActivities.slice(0, 2).join(', ');
        }
        return exerciseLogged ? (t('workoutLogged') || 'Workout Logged') : (t('logNow') || 'Log now →');
      },
      renderExtra: () => (
        <View style={styles.tileIndicatorRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: loggedActivities.length > 0 ? colors.success : colors.primary },
            ]}
          />
          <Text style={[styles.tileStatusCaption, { color: colors.textSecondary }]}>
            {loggedActivities.length > 0
              ? `${num(loggedActivities.length)} ${t('logsText') || 'logs'}`
              : (t('gymHomeWorkout') || 'Gym, Home Workout')}
          </Text>
        </View>
      ),
    },
    {
      id: 'water',
      title: t('water'),
      icon: (c, s) => <Droplets size={s} color={c} />,
      accentColor: colors.accentSky,
      getStatusText: () => `${num(waterCount)}/${num(maxGlasses)}`,
      renderExtra: () => (
        <View style={styles.tileProgressBarContainer}>
          <ProgressBar progress={waterCount / maxGlasses} color={colors.accentSky} />
        </View>
      ),
    },
    {
      id: 'weight',
      title: t('weight'),
      icon: (c, s) => <Scale size={s} color={c} />,
      accentColor: colors.warning,
      getStatusText: () => `${num(currentWeight.toFixed(1))} kg`,
      renderExtra: () => (
        <View style={styles.tileIndicatorRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.tileStatusCaption, { color: colors.textSecondary }]}>
            {weightLoggedToday ? t('recorded') : t('logNow')}
          </Text>
        </View>
      ),
    },
  ];

  const handleTilePress = (tileId: 'exercise' | 'water' | 'weight') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveModal(tileId);
  };

  const handleWorkoutCardPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('Mirror');
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              syncWithBackend();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {/* ============================================================ */}
          {/* 1. HEADER CARD (Deep Forest Green from Screenshot 2)         */}
          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* 1. HEADER CARD (Deep Forest Green with Live User & Goal)      */}
          {/* ============================================================ */}
          <View style={styles.headerCard}>
            {/* Top User Row */}
            <View style={styles.headerTopRow}>
              <View style={styles.userInfoLeft}>
                <View style={styles.userTextWrap}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.greetingTitle}>
                      {greetingText}
                    </Text>
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                    <View style={styles.goalBadge}>
                      <Target size={10} color="#162E1C" />
                      <Text style={styles.goalBadgeText}>{normalizedGoal.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.programSubtitle} numberOfLines={1}>
                    {`Goal: ${normalizedGoal} · ${hasWorkedOutToday ? 'Workout Completed Today' : (totalPastWorkouts === 0 ? 'Ready for First Session' : "Ready for Today's Workout")}`}
                  </Text>
                </View>
              </View>

              <View style={styles.headerTopRight}>
                {/* Quick Theme Toggle Button in Header */}
                <TouchableOpacity
                  style={[styles.seeDay90Circle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.12)' }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    toggleThemeMode();
                  }}
                  accessibilityLabel="Toggle Dark / Light Theme"
                >
                  {isDark ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#FFFFFF" />}
                  <Text style={styles.seeDay90Label}>{isDark ? 'Light' : 'Dark'}</Text>
                </TouchableOpacity>

                {/* Streak and Fit Score Badges */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.fitScoreBadge}>
                    <ShieldCheck size={12} color="#22FFB0" />
                    <Text style={styles.fitScoreText}>{num(currentFitScore)} FIT</Text>
                  </View>

                  <View style={styles.streakBadge}>
                    <Text style={styles.streakFlame}>🔥</Text>
                    <Text style={styles.streakText}>{num(streak)} {t('daysUnit') || 'days'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Week Tracker Row */}
            <View style={styles.weekTrackerContainer}>
              <View style={styles.weekCirclesRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, idx) => {
                  const isCompleted = idx < (weeklyReport?.workout?.workout_days ?? (hasWorkedOutToday ? 1 : 0));
                  const isToday = idx === ((new Date().getDay() + 6) % 7);

                  return (
                    <View key={idx} style={styles.dayCircleWrap}>
                      {isCompleted ? (
                        <View style={styles.completedDayCircle}>
                          <Check size={14} color="#162E1C" strokeWidth={3} />
                        </View>
                      ) : isToday ? (
                        <View style={styles.todayGoldCircle}>
                          <Check size={14} color="#F0BF38" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={styles.emptyDayCircle} />
                      )}
                      <Text
                        style={[
                          styles.dayKeyLabel,
                          isToday && styles.dayKeyToday,
                        ]}
                      >
                        {dayChar}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 2. TODAY'S FIT SCORE (0 - 100 with 6 Dimensions Breakdown)   */}
          {/* ============================================================ */}
          <GlassCard style={[styles.fitScoreCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.fitScoreHeaderRow}>
              <View>
                <Text style={[styles.cardSectionTag, { color: colors.textSecondary }]}>TODAY'S FIT SCORE</Text>
                <View style={styles.scoreNumberRow}>
                  <Text style={[styles.bigFitScoreNumber, { color: colors.primary }]}>{num(currentFitScore)}</Text>
                  <Text style={[styles.scoreOutOf, { color: colors.textMuted }]}>/ 100</Text>
                </View>
              </View>
              <View style={[styles.scoreQualityPill, {
                backgroundColor: currentFitScore >= 80 ? 'rgba(34, 255, 176, 0.15)' : currentFitScore >= 60 ? 'rgba(240, 191, 56, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: currentFitScore >= 80 ? colors.success : currentFitScore >= 60 ? '#F0BF38' : colors.danger
              }]}>
                <ShieldCheck size={14} color={currentFitScore >= 80 ? colors.success : currentFitScore >= 60 ? '#F0BF38' : colors.danger} />
                <Text style={[styles.scoreQualityText, { color: currentFitScore >= 80 ? colors.success : currentFitScore >= 60 ? '#F0BF38' : colors.danger }]}>
                  {currentFitScore >= 80 ? 'OPTIMAL' : currentFitScore >= 60 ? 'ON TRACK' : 'NEEDS FOCUS'}
                </Text>
              </View>
            </View>

            {/* 6 Dimensions Breakdown Chips */}
            <View style={styles.dimensionsGrid}>
              {[
                { label: 'Nutrition', val: fitScoreData?.nutrition_score ?? (hasMealsLogged ? 82 : 70), icon: '🥗' },
                { label: 'Workout', val: fitScoreData?.workout_score ?? (hasWorkedOutToday ? 95 : 60), icon: '🏋️' },
                { label: 'Water', val: fitScoreData?.hydration_score ?? (todayWaterMl > 0 ? 80 : 50), icon: '💧' },
                { label: 'Activity', val: fitScoreData?.activity_score ?? 75, icon: '🏃' },
                { label: 'Sleep', val: fitScoreData?.sleep_score ?? 75, icon: '🌙' },
                { label: 'Stress', val: fitScoreData?.stress_score ?? 75, icon: '🧘' },
              ].map((dim, idx) => (
                <View key={idx} style={[styles.dimensionChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <Text style={styles.dimensionIcon}>{dim.icon}</Text>
                  <Text style={[styles.dimensionLabel, { color: colors.textSecondary }]}>{dim.label}</Text>
                  <Text style={[styles.dimensionVal, { color: colors.textPrimary }]}>{num(dim.val)}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* ============================================================ */}
          {/* 3. CORE METRICS & WORKOUT STATUS (Calories, Protein, Water, Workout) */}
          {/* ============================================================ */}
          <View style={styles.coreMetricsGrid}>
            {/* Calories (Requirement 3) */}
            <GlassCard style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.metricCardHeader}>
                <Flame size={18} color="#EA580C" />
                <Text style={[styles.metricCardTitle, { color: colors.textSecondary }]}>CALORIES</Text>
              </View>
              <Text style={[styles.metricCardPrimary, { color: colors.textPrimary }]}>
                {hasMealsLogged
                  ? `${num(totals.calories)} / ${num(calorieTarget)}`
                  : 'No meals logged yet'}
              </Text>
              <Text style={[styles.metricCardSub, { color: colors.textMuted }]}>
                {hasMealsLogged ? 'kcal consumed today' : 'Tap Log Food below'}
              </Text>
            </GlassCard>

            {/* Protein (Requirement 4) */}
            <GlassCard style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.metricCardHeader}>
                <Zap size={18} color={colors.primary} />
                <Text style={[styles.metricCardTitle, { color: colors.textSecondary }]}>PROTEIN</Text>
              </View>
              <Text style={[styles.metricCardPrimary, { color: colors.textPrimary }]}>
                {num(totals.protein)} / {num(proteinTarget)}g
              </Text>
              <Text style={[styles.metricCardSub, { color: colors.textMuted }]}>
                {Math.round((totals.protein / (proteinTarget || 1)) * 100)}% of daily target
              </Text>
            </GlassCard>

            {/* Water (Requirement 5) */}
            <GlassCard style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.metricCardHeader}>
                <Droplets size={18} color="#38BDF8" />
                <Text style={[styles.metricCardTitle, { color: colors.textSecondary }]}>WATER</Text>
              </View>
              <Text style={[styles.metricCardPrimary, { color: colors.textPrimary }]}>
                {num((todayWaterMl / 1000).toFixed(1))} / {num((dailyWaterTargetMl / 1000).toFixed(1))}L
              </Text>
              <Text style={[styles.metricCardSub, { color: colors.textMuted }]}>
                {waterCount} glasses logged
              </Text>
            </GlassCard>

            {/* Workout Status (Requirement 6) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleQuickStartWorkout}
              style={{ flex: 1 }}
            >
              <GlassCard style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: hasWorkedOutToday ? colors.success : colors.border }]}>
                <View style={styles.metricCardHeader}>
                  <Dumbbell size={18} color={hasWorkedOutToday ? colors.success : colors.primary} />
                  <Text style={[styles.metricCardTitle, { color: colors.textSecondary }]}>WORKOUT</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {hasWorkedOutToday && <CheckCircle2 size={16} color={colors.success} />}
                  <Text style={[styles.metricCardPrimary, { color: hasWorkedOutToday ? colors.success : colors.textPrimary }]}>
                    {hasWorkedOutToday
                      ? 'Completed'
                      : totalPastWorkouts === 0
                      ? 'Start your first workout'
                      : "Start Today's Workout"}
                  </Text>
                </View>
                <Text style={[styles.metricCardSub, { color: colors.textMuted }]}>
                  {hasWorkedOutToday
                    ? `${todayWorkoutDurationMinutes > 0 ? todayWorkoutDurationMinutes : 25} min · ${todayWorkoutCaloriesBurned > 0 ? todayWorkoutCaloriesBurned : 180} kcal`
                    : 'AI Mirror guidance →'}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* 7. QUICK ACTIONS ROW (Requirement 7)                          */}
          {/* ============================================================ */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 8 }]}>QUICK ACTIONS</Text>
            <View style={styles.quickActionsRow}>
              {/* Log Food */}
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={handleQuickLogFood}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(234, 88, 12, 0.12)' }]}>
                  <Utensils size={20} color="#EA580C" />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Log Food</Text>
              </TouchableOpacity>

              {/* Add Water */}
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={handleQuickAddWater}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                  <Droplets size={20} color="#38BDF8" />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Add Water</Text>
              </TouchableOpacity>

              {/* Start Workout */}
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={handleQuickStartWorkout}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(34, 255, 176, 0.12)' }]}>
                  <Dumbbell size={20} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Start Workout</Text>
              </TouchableOpacity>

              {/* AI Coach */}
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={handleQuickAiCoach}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                  <Sparkles size={20} color="#A855F7" />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>AI Coach</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 8. DAILY AI INSIGHT CARD (Requirement 8)                      */}
          {/* ============================================================ */}
          <View style={[styles.tonightPrepCard, { backgroundColor: colors.prepCardBg, borderColor: colors.prepCardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="#7C5315" />
              <Text style={[styles.prepHeadline, { color: colors.prepCardTitle }]}>DAILY AI INSIGHT</Text>
            </View>
            <View style={[styles.coachMiniCard, { backgroundColor: colors.coachMiniCardBg }]}>
              <Avatar
                name="AI Coach"
                size="sm"
                borderColor="#CFE4CE"
              />
              <Text style={[styles.coachTipText, { color: colors.coachMiniCardText }]}>
                {getDailyAiInsight()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.viewPlanButton, { backgroundColor: colors.primaryForest }]}
              onPress={() => setShowPlanModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewPlanButtonText}>{t('viewPlan') || 'View Nutrition & Health Plan'}</Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* 9. WEEKLY PREVIEW CARD (Requirement 9)                        */}
          {/* ============================================================ */}
          <GlassCard style={[styles.weeklyPreviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WEEKLY PREVIEW</Text>
              </View>
              {hasWeeklyData && (
                <Badge label="7-DAY REPORT" variant="success" size="sm" />
              )}
            </View>

            {hasWeeklyData ? (
              <View style={styles.weeklyGrid}>
                {/* Weekly Fit Score */}
                <View style={[styles.weeklyMetricBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' }]}>
                  <Text style={[styles.weeklyBoxLabel, { color: colors.textSecondary }]}>Weekly Fit Score</Text>
                  <Text style={[styles.weeklyBoxValue, { color: colors.primary }]}>{num(weeklyReport?.weekly_score ?? 84)}</Text>
                  <Text style={[styles.weeklyBoxSub, { color: colors.textMuted }]}>Out of 100</Text>
                </View>

                {/* Workout Days */}
                <View style={[styles.weeklyMetricBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' }]}>
                  <Text style={[styles.weeklyBoxLabel, { color: colors.textSecondary }]}>Workout Days</Text>
                  <Text style={[styles.weeklyBoxValue, { color: colors.textPrimary }]}>{num(weeklyReport?.workout?.workout_days ?? 0)} days</Text>
                  <Text style={[styles.weeklyBoxSub, { color: colors.textMuted }]}>This week</Text>
                </View>

                {/* Average Protein */}
                <View style={[styles.weeklyMetricBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' }]}>
                  <Text style={[styles.weeklyBoxLabel, { color: colors.textSecondary }]}>Average Protein</Text>
                  <Text style={[styles.weeklyBoxValue, { color: colors.textPrimary }]}>{num(weeklyReport?.nutrition?.average_protein ?? 0)}g</Text>
                  <Text style={[styles.weeklyBoxSub, { color: colors.textMuted }]}>Per active day</Text>
                </View>

                {/* Average Water */}
                <View style={[styles.weeklyMetricBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' }]}>
                  <Text style={[styles.weeklyBoxLabel, { color: colors.textSecondary }]}>Average Water</Text>
                  <Text style={[styles.weeklyBoxValue, { color: colors.textPrimary }]}>
                    {num(((weeklyReport?.hydration?.daily_average_ml ?? 0) / 1000).toFixed(1))}L
                  </Text>
                  <Text style={[styles.weeklyBoxSub, { color: colors.textMuted }]}>Daily hydration</Text>
                </View>
              </View>
            ) : (
              <View style={styles.weeklyEmptyWrap}>
                <View style={[styles.weeklyEmptyIconCircle, { backgroundColor: 'rgba(240, 191, 56, 0.12)' }]}>
                  <Sparkles size={24} color="#F0BF38" />
                </View>
                <Text style={[styles.weeklyEmptyTitle, { color: colors.textPrimary }]}>
                  Start tracking to unlock your weekly insights
                </Text>
                <Text style={[styles.weeklyEmptyDesc, { color: colors.textSecondary }]}>
                  Log meals, water, and workouts to see your full 7-day biomechanical trend analysis.
                </Text>
              </View>
            )}
          </GlassCard>

          {/* Injury Coach Quick Action Banner */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
              }
              navigation.navigate('InjuryCoach');
            }}
          >
            <GlassCard style={[styles.injuryCoachBanner, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.injuryBannerLeft}>
                <View style={styles.injuryIconCircle}>
                  <ShieldCheck size={20} color={colors.success} />
                </View>
                <View style={styles.injuryTextWrap}>
                  <View style={styles.injuryTitleRow}>
                    <Text style={[styles.injuryBannerTitle, { color: colors.textPrimary }]}>
                      {t('injuryCoachTitle') || 'Injury Prevention Coach'}
                    </Text>
                    <Badge label={t('aiGuardBadge') || 'AI GUARD'} variant="success" size="sm" />
                  </View>
                  <Text style={[styles.injuryBannerSub, { color: colors.textSecondary }]}>
                    {t('injuryCoachDesc') || 'Screen joint tension & get tailored exercise swaps'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </GlassCard>
          </TouchableOpacity>

          {/* ============================================================ */}
          {/* 3. TODAY'S ACTIVITY — 3 TILES (mappable array)              */}
          {/* ============================================================ */}
          <View style={styles.activitySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('todayActivity')}</Text>
              <Text style={[styles.sectionSubCaption, { color: colors.textMuted }]}>{t('quickLog')}</Text>
            </View>

            <View style={styles.tilesRow}>
              {ACTIVITY_TILES.map((tile) => (
                <TouchableOpacity
                  key={tile.id}
                  onPress={() => handleTilePress(tile.id)}
                  activeOpacity={0.8}
                  style={styles.tileWrapper}
                >
                  <GlassCard style={[styles.activityTileCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, tile.id === 'exercise' && styles.exerciseCardSelected]}>
                    {tile.id === 'exercise' && (
                      <View style={styles.tileStreakTag}>
                        <Text style={styles.tileStreakTagText}>{t('streakBadge') || 'STREAK'}</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.tileIconCircle,
                        { backgroundColor: `${tile.accentColor}18` },
                      ]}
                    >
                      {tile.icon(tile.accentColor, 20)}
                    </View>

                    <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>{tile.title}</Text>
                    <Text style={[styles.tileStatusText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {tile.getStatusText()}
                    </Text>

                    {tile.renderExtra && tile.renderExtra()}
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* 4. MY COACHES SECTION (Matching Screenshot 2)                 */}
          {/* ============================================================ */}
          <View style={styles.coachesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('myCoaches')}</Text>
            </View>

            {/* Coach Arjun */}
            <GlassCard style={[styles.coachCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.coachCardLeft}>
                <Avatar name="Coach Arjun" size="md" />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.coachNameRow}>
                    <Text style={[styles.coachCardName, { color: colors.textPrimary }]}>{t('coachArjun')}</Text>
                    <View style={styles.coachTag}>
                      <Text style={[styles.coachTagText, { color: colors.textSecondary }]}>{t('fitnessCoach')}</Text>
                    </View>
                  </View>
                  <Text style={[styles.coachMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t('coachArjunMsg')}
                  </Text>
                </View>
              </View>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>{num(1)}</Text>
              </View>
            </GlassCard>

            {/* Counsellor Sneha */}
            <GlassCard style={[styles.coachCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.coachCardLeft}>
                <Avatar name="Sneha" size="md" />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.coachNameRow}>
                    <Text style={[styles.coachCardName, { color: colors.textPrimary }]}>{t('counsellorSneha')}</Text>
                    <View style={styles.coachTag}>
                      <Text style={[styles.coachTagText, { color: colors.textSecondary }]}>{t('stressCoach')}</Text>
                    </View>
                  </View>
                  <Text style={[styles.coachMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t('counsellorSnehaMsg')}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* ============================================================ */}
          {/* 5. ARENA RANK PROGRESS (plain section on background)          */}
          {/* ============================================================ */}
          <View style={styles.rankProgressSection}>
            <View style={styles.rankHeaderRow}>
              <Text style={[styles.rankLabel, { color: colors.textSecondary }]}>{t('arenaRankProgress') || 'ARENA RANK PROGRESS'}</Text>
              <Text style={[styles.rankStats, { color: colors.textPrimary }]}>
                {num(xp.toLocaleString())} / {num(xpToNextLevel.toLocaleString())} XP{' '}
                <Text style={[styles.rankPercentage, { color: colors.primary }]}>({num(rankPercent)}%)</Text>
              </Text>
            </View>

            <ProgressBar
              progress={rankPercent / 100}
              color={colors.primary}
            />
          </View>

          {/* ============================================================ */}
          {/* 5. AI RECOMMENDED WORKOUT CARD (GlassCard)                   */}
          {/* ============================================================ */}
          <TouchableOpacity
            onPress={handleWorkoutCardPress}
            activeOpacity={0.88}
          >
            <GlassCard style={[styles.aiWorkoutCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.workoutHeaderRow}>
                <Badge
                  label={dashboard?.aiRecommendation.badge || t('aiMatchBadge') || 'AI BIOMECHANIC MATCH'}
                  variant="success"
                  size="sm"
                />
                <Text style={[styles.workoutMetaTag, { color: colors.textSecondary }]}>
                  {t('durationCalories') || '8 MIN · 140 KCAL'}
                </Text>
              </View>

              <View style={styles.workoutBodyRow}>
                <View style={styles.workoutIconWrap}>
                  <Dumbbell size={26} color={colors.success} />
                </View>
                <View style={styles.workoutTitleWrap}>
                  <Text style={[styles.workoutExerciseName, { color: colors.textPrimary }]}>
                    {t('aiBarbellSquat') || dashboard?.aiRecommendation.name || 'AI Barbell Squat'}
                  </Text>
                  <Text style={[styles.workoutTargetSub, { color: colors.textSecondary }]}>
                    {t('aiWorkoutTarget') || dashboard?.aiRecommendation.targetDescription ||
                      'Targeting Quads, Glutes & Core with Zero Valgus'}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <ChevronRight size={18} color={colors.textPrimary} />
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ============================================================ */}
      {/* BOTTOM SHEET MODALS                                          */}
      {/* ============================================================ */}
      <ExerciseTrackerModal
        visible={activeModal === 'exercise'}
        onClose={() => setActiveModal(null)}
      />

      <WaterTrackerModal
        visible={activeModal === 'water'}
        onClose={() => setActiveModal(null)}
      />

      <WeightTrackerModal
        visible={activeModal === 'weight'}
        onClose={() => setActiveModal(null)}
      />

      <DietPlanModal
        visible={showPlanModal}
        onClose={() => setShowPlanModal(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 110, // Generous clearance for floating pill bottom tab bar
  },
  animatedContainer: {
    gap: 18,
  },

  // 1. Header Card (Deep Forest Green from Screenshot 2)
  headerCard: {
    backgroundColor: '#162E1C', // Deep forest green
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#24452C',
    shadowColor: '#162E1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfoLeft: {
    flex: 1,
  },
  userTextWrap: {
    gap: 3,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  proBadge: {
    backgroundColor: '#F0BF38', // Gold badge from screenshot 2
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#162E1C',
    letterSpacing: 0.5,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C5DEC8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goalBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#162E1C',
    letterSpacing: 0.5,
  },
  programSubtitle: {
    fontSize: 12,
    color: '#B3C7B6', // Light sage
    lineHeight: 16,
    marginTop: 2,
  },
  headerTopRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  seeDay90Circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#D9A726',
    backgroundColor: '#112416',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  seeDay90Label: {
    fontSize: 8,
    fontWeight: '800',
    color: '#B3C7B6',
    textAlign: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1.5,
    borderColor: '#D9A726',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  streakFlame: {
    fontSize: 13,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F0BF38',
  },
  fitScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 255, 176, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(34, 255, 176, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  fitScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22FFB0',
    letterSpacing: 0.5,
  },
  headerKpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerKpiItem: {
    alignItems: 'center',
    flex: 1,
  },
  headerKpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B3C7B6',
    letterSpacing: 0.5,
  },
  headerKpiValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerKpiDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Week Tracker inside Header
  weekTrackerContainer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  weekCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCircleWrap: {
    alignItems: 'center',
    gap: 6,
  },
  dayKeyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8BA18E',
  },
  dayKeyToday: {
    color: '#F0BF38',
    fontWeight: '900',
  },
  completedDayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B9CEBA', // Light sage green completed circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayGoldCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F0BF38', // Gold ring for today
    backgroundColor: '#162E1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'transparent',
  },

  // 2. Tonight's Prep Card (Warm Butter-Cream from Screenshot 2)
  tonightPrepCard: {
    backgroundColor: '#FFF9E6',
    borderColor: '#F5E5B8',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  prepHeadline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C5315',
  },
  prepDescription: {
    fontSize: 13,
    color: '#423724',
    lineHeight: 18,
    fontWeight: '500',
  },
  coachMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3EA',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#CFE4CE',
  },
  coachTipText: {
    fontSize: 12,
    color: '#2E3A2E',
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  viewPlanButton: {
    backgroundColor: '#18331E', // Solid deep forest green button from screenshot 2
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPlanButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3. Activity Section & Tiles
  activitySection: {
    gap: 10,
  },
  sectionHeaderRow: {
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
  sectionSubCaption: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  tileWrapper: {
    flex: 1,
    position: 'relative',
  },
  activityTileCard: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DD',
    borderRadius: 20,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  exerciseCardSelected: {
    borderColor: '#FDBA74',
  },
  tileStreakTag: {
    position: 'absolute',
    top: -7,
    left: 8,
    backgroundColor: '#EA580C', // Orange pill from screenshot 2
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  tileStreakTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 2,
    textAlign: 'center',
  },
  tileStatusText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  tileProgressBarContainer: {
    width: '100%',
    paddingTop: 4,
  },
  tileIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tileStatusCaption: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },

  // 4. My Coaches Section (Screenshot 2)
  coachesSection: {
    gap: 10,
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  coachCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  coachTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coachTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  coachMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  redBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // 4. Arena Rank Progress
  rankProgressSection: {
    gap: 8,
    paddingHorizontal: 2,
  },
  rankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  rankStats: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rankPercentage: {
    color: Colors.success,
    fontWeight: '800',
  },

  // 5. AI Recommended Workout Card
  aiWorkoutCard: {
    padding: 16,
    gap: 12,
    borderColor: 'rgba(34, 255, 176, 0.25)',
  },
  workoutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutMetaTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  workoutBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 255, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTitleWrap: {
    flex: 1,
    gap: 2,
  },
  workoutExerciseName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  workoutTargetSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  injuryCoachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderColor: 'rgba(34, 255, 176, 0.25)',
  },
  injuryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  injuryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 255, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  injuryTextWrap: {
    flex: 1,
    gap: 2,
  },
  injuryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  injuryBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  injuryBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  // Fit Score Card (0-100 & 6 Dimensions)
  fitScoreCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  fitScoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  bigFitScoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreOutOf: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreQualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreQualityText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexBasis: '31%',
    flexGrow: 1,
  },
  dimensionIcon: {
    fontSize: 13,
  },
  dimensionLabel: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  dimensionVal: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Core Metrics Grid (Calories, Protein, Water, Workout)
  coreMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minHeight: 96,
    justifyContent: 'center',
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  metricCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricCardPrimary: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  metricCardSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // Quick Actions Section
  quickActionsSection: {
    gap: 6,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Weekly Preview Card
  weeklyPreviewCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weeklyMetricBox: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    gap: 2,
  },
  weeklyBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  weeklyBoxValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  weeklyBoxSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  weeklyEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  weeklyEmptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  weeklyEmptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
});
