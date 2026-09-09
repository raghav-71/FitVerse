import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import {
  Activity,
  Sparkles,
  Flame,
  Award,
  Utensils,
  Plus,
  Scale,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Dumbbell,
  Droplets,
  Edit3,
  Trash2,
  Camera,
  Sliders,
  Zap,
  Minus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useDailyActivityStore } from '../../stores/dailyActivityStore';
import { useDietStore, MealType } from '../../stores/dietStore';

import { SegmentedTabControl } from '../challenges/components/SegmentedTabControl';
import {
  WorkoutFrequencyChart,
  RepsOverTimeChart,
  FormScoreTrendChart,
  WeightTrendChart,
} from './components/ProgressSvgCharts';
import { MacroRing } from './components/MacroRing';
import { LogFoodModal, LogFoodTab } from './components/LogFoodModal';
import { DietPlanModal } from '../home/components/DietPlanModal';
import { TransformationChart } from './components/TransformationChart';
import { StressScaleBar } from './components/StressScaleBar';
import { SixDimensionsProgress } from './components/SixDimensionsProgress';
import { YourJourneyCard } from './components/YourJourneyCard';
import { useTranslation } from '../../stores/languageStore';
import { useTheme } from '../../stores/themeStore';

interface ProgressScreenProps {
  navigation?: any;
}

type HealthTab = 'progress' | 'diet' | 'transformation' | 'weeklyReview';

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<HealthTab>('progress');
  const [refreshing, setRefreshing] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);

  // Section 3: Transformation timeframe
  const [transformDays, setTransformDays] = useState<30 | 60 | 90 | 180>(90);

  // Section 4: Week index (0 = This Week, 1 = Last Week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Diet Logging & Plan Modals
  const [logFoodTab, setLogFoodTab] = useState<LogFoodTab>('text');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [dietPlanModalVisible, setDietPlanModalVisible] = useState(false);

  // Language Translation & Theme
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  // Stores
  const { xp, streak } = useGamificationStore();
  const {
    currentWeight,
    targetWeight,
    waterGlasses,
    addWaterGlass,
    setWaterGlasses,
    fitScoreData,
    exerciseLogged,
    loggedActivities,
    syncWithBackend: syncDailyActivity,
  } = useDailyActivityStore();

  const {
    meals,
    calorieTarget,
    proteinTarget,
    carbsTarget,
    fatTarget,
    fiberTarget,
    waterTarget,
    bmr,
    tdee,
    planReasoning,
    dailyAnalysis,
    weeklyReport,
    getTotals,
    removeMeal,
    syncTodayWithBackend,
    fetchDailyAnalysis,
    fetchWeeklyReport,
  } = useDietStore();

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    syncTodayWithBackend();
    syncDailyActivity();
  }, [syncTodayWithBackend, syncDailyActivity]);

  useEffect(() => {
    fetchWeeklyReport(weekOffset);
  }, [weekOffset, fetchWeeklyReport]);

  // Animate tab switch
  const handleTabChange = (tab: HealthTab) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    try {
      await Promise.all([syncTodayWithBackend(), syncDailyActivity()]);
    } catch {}
    setRefreshing(false);
  };

  const totals = getTotals();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const hasAnyActivity = exerciseLogged || waterGlasses > 0 || meals.length > 0;
  const daysTracked = (weeklyReport && weeklyReport.workout.workout_days > 0)
    ? weeklyReport.workout.workout_days
    : hasAnyActivity ? 1 : 0;

  const realBreakdown = daysOfWeek.map((dayName, idx) => {
    if (idx === todayDayIndex) {
      return {
        day: dayName,
        done: exerciseLogged || waterGlasses >= 4,
        water: waterGlasses,
        kcal: totals.calories,
        note: loggedActivities.length > 0 ? loggedActivities.join(' • ') : exerciseLogged ? 'AI Workout Logged' : meals.length > 0 ? 'Nutrition Logged' : 'Today',
      };
    }
    const isPastDay = idx < todayDayIndex;
    const hasPastWorkout = weeklyReport && isPastDay && idx < (weeklyReport.workout.workout_days || 0);
    return {
      day: dayName,
      done: !!hasPastWorkout,
      water: hasPastWorkout ? Math.round(weeklyReport.hydration.daily_average_ml / 250) : 0,
      kcal: hasPastWorkout ? weeklyReport.nutrition.average_calories : 0,
      note: hasPastWorkout ? 'Session Complete' : isPastDay ? 'Rest / Active Recovery' : 'Upcoming',
    };
  });

  const weekLabels = ['This Week (Current)', 'Last Week (Aug 25 - 31)', '2 Weeks Ago (Aug 18 - 24)'];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary, Colors.primaryViolet]}
          />
        }
      >
        {/* Header Title */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge label="BIOMETRICS & HEALTH" variant="primary" size="sm" />
            <Badge label="AI ENGINE v2.4" variant="success" size="sm" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('healthBiometricsTitle') || 'Health & Analytics'}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Precision tracking across workouts, nutrition, and kinetic transformations
          </Text>
        </View>

        {/* 4-Section Top Segmented Switcher */}
        <View style={styles.mainTabSwitcher}>
          <SegmentedTabControl<HealthTab>
            options={[
              { key: 'progress', label: t('progress') || 'Progress' },
              { key: 'diet', label: t('diet') || 'Diet' },
              { key: 'transformation', label: t('forecast') || 'Forecast' },
              { key: 'weeklyReview', label: t('review') || 'Review' },
            ]}
            selectedTab={activeTab}
            onSelectTab={handleTabChange}
          />
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* =================================================================== */}
          {/* SECTION 1: PROGRESS CHARTS & KPIS                                   */}
          {/* =================================================================== */}
          {activeTab === 'progress' && (
            <View style={styles.sectionContainer}>
              {/* Your Journey Transformation Stepper Card (Screenshot) */}
              <YourJourneyCard
                totalWorkoutMinutes={250}
                dailyScore={dailyAnalysis?.daily_score}
              />

              {/* The 6 Dimensions Progress Poll (Screenshot) */}
              <SixDimensionsProgress
                categoryScores={
                  fitScoreData
                    ? {
                        nutrition: fitScoreData.nutrition_score,
                        workout: fitScoreData.workout_score,
                        hydration: fitScoreData.hydration_score,
                        activity: fitScoreData.activity_score,
                        sleep: fitScoreData.sleep_score,
                        stress: fitScoreData.stress_score,
                      }
                    : dailyAnalysis?.category_scores
                }
                dailyScore={fitScoreData?.fit_score ?? dailyAnalysis?.daily_score}
              />

              {/* Summary Stat Grid */}
              <View style={styles.kpiGrid}>
                <GlassCard style={[styles.kpiTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} padding={12}>
                  <Activity size={18} color={colors.primary} />
                  <Text style={[styles.kpiVal, { color: colors.textPrimary }]}>{num(42)}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('totalSessions') || 'TOTAL SESSIONS'}</Text>
                </GlassCard>

                <GlassCard style={[styles.kpiTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} padding={12}>
                  <Flame size={18} color={colors.warning} />
                  <Text style={[styles.kpiVal, { color: colors.warning }]}>{num(streak)}d</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('streak') || 'STREAK'}</Text>
                </GlassCard>

                <GlassCard style={[styles.kpiTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} padding={12}>
                  <Sparkles size={18} color={colors.neonGreen} />
                  <Text style={[styles.kpiVal, { color: colors.neonGreen }]}>
                    {fitScoreData?.fit_score ? `${num(fitScoreData.fit_score)}` : `${num('94.2')}%`}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                    {fitScoreData?.fit_score ? 'FIT SCORE' : 'AVG FORM SCORE'}
                  </Text>
                </GlassCard>

                <GlassCard style={[styles.kpiTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} padding={12}>
                  <Award size={18} color={colors.accentSky} />
                  <Text style={[styles.kpiVal, { color: colors.accentSky }]}>
                    {num(xp.toLocaleString())}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>TOTAL XP</Text>
                </GlassCard>
              </View>

              {/* 1. Workout Frequency Bar Chart (7d / 30d) */}
              <WorkoutFrequencyChart />

              {/* 2. Reps Over Time Line Chart */}
              <RepsOverTimeChart />

              {/* 3. Form-Score / Fit-Score Trend Chart */}
              <FormScoreTrendChart
                scores={
                  fitScoreData?.monthly_trend && fitScoreData.monthly_trend.length >= 7
                    ? fitScoreData.monthly_trend.slice(-7).map((item, idx) => ({
                        session: `D${idx + 1}`,
                        score: item.fit_score,
                      }))
                    : undefined
                }
              />

              {/* 4. Weight Trend Chart with Goal-Line */}
              <WeightTrendChart />
            </View>
          )}

          {/* =================================================================== */}
          {/* SECTION 2: DIET & NUTRITION (NEW MODULE)                            */}
          {/* =================================================================== */}
          {/* =================================================================== */}
          {/* SECTION 2: DIET & NUTRITION                                         */}
          {/* =================================================================== */}
          {activeTab === 'diet' && (
            <View style={styles.sectionContainer}>
              {/* Top Header & 8. Food Logging Action Buttons (Text, Manual, Photo) */}
              <View style={styles.dietTopHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moduleSectionTitle, { color: colors.textPrimary }]}>
                    {t('dailyNutrition') || 'Diet & Nutrition'}
                  </Text>
                  <Text style={[styles.moduleSectionSub, { color: colors.textSecondary }]}>
                    Personalized targets & AI nutrient tracking
                  </Text>
                </View>
              </View>

              {/* 8. Food Logging 3-Action Bar */}
              <View style={styles.quickLogButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setLogFoodTab('text');
                    setLogModalVisible(true);
                  }}
                  style={[styles.quickLogBtn, { backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : 'rgba(79, 124, 255, 0.1)', borderColor: colors.primary }]}
                >
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={[styles.quickLogBtnText, { color: colors.primary }]}>Text Input</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setLogFoodTab('manual');
                    setLogModalVisible(true);
                  }}
                  style={[styles.quickLogBtn, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)', borderColor: colors.primaryViolet }]}
                >
                  <Sliders size={14} color={colors.primaryViolet} />
                  <Text style={[styles.quickLogBtnText, { color: colors.primaryViolet }]}>Manual Input</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setLogFoodTab('photo');
                    setLogModalVisible(true);
                  }}
                  style={[styles.quickLogBtn, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)', borderColor: colors.neonGreen }]}
                >
                  <Camera size={14} color={colors.neonGreen} />
                  <Text style={[styles.quickLogBtnText, { color: colors.neonGreen }]}>Photo Upload</Text>
                </TouchableOpacity>
              </View>

              {/* 1. Today's Calories Hero Card */}
              <GlassCard variant="glow" style={styles.calorieHeroCard} padding={16}>
                <View style={styles.calorieHeroHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricHeaderLabel, { color: colors.textSecondary }]}>TODAY'S CALORIES</Text>
                    <View style={styles.calorieNumberRow}>
                      <Text style={[styles.calorieBigNumber, { color: colors.textPrimary }]}>
                        {num(totals.calories.toLocaleString())}
                      </Text>
                      <Text style={[styles.calorieTargetDivider, { color: colors.textMuted }]}>/</Text>
                      <Text style={[styles.calorieTargetNumber, { color: colors.textSecondary }]}>
                        {num(calorieTarget.toLocaleString())} kcal
                      </Text>
                    </View>
                  </View>

                  <View style={styles.calorieBadgeWrap}>
                    <Badge
                      label={
                        totals.calories > calorieTarget
                          ? `+${num(totals.calories - calorieTarget)} over`
                          : `${num(Math.max(0, calorieTarget - totals.calories))} kcal left`
                      }
                      variant={totals.calories > calorieTarget ? 'warning' : 'primary'}
                      size="sm"
                    />
                  </View>
                </View>

                {/* Calorie Progress Bar */}
                <View style={[styles.calorieProgressBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <View
                    style={[
                      styles.calorieProgressBarFill,
                      {
                        width: `${Math.min(100, Math.round((totals.calories / (calorieTarget || 1)) * 100))}%`,
                        backgroundColor: totals.calories > calorieTarget ? Colors.warning : colors.primary,
                      },
                    ]}
                  />
                </View>
              </GlassCard>

              {/* 2, 3, 4, 5: Macronutrients Grid (Protein, Carbs, Fat, Fiber) */}
              <View style={styles.macroCardsGrid}>
                {/* 2. Protein */}
                <GlassCard style={styles.macroCardItem} padding={12}>
                  <View style={styles.macroCardHeader}>
                    <Text style={[styles.macroCardTitle, { color: colors.textSecondary }]}>PROTEIN</Text>
                    <Text style={[styles.macroCardPct, { color: colors.primaryViolet }]}>
                      {Math.min(100, Math.round((totals.protein / (proteinTarget || 1)) * 100))}%
                    </Text>
                  </View>
                  <View style={styles.macroValueRow}>
                    <Text style={[styles.macroValueBig, { color: colors.textPrimary }]}>{num(totals.protein)}</Text>
                    <Text style={[styles.macroValueTarget, { color: colors.textMuted }]}>/ {num(proteinTarget)}g</Text>
                  </View>
                  <View style={[styles.macroBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(100, Math.round((totals.protein / (proteinTarget || 1)) * 100))}%`,
                          backgroundColor: colors.primaryViolet,
                        },
                      ]}
                    />
                  </View>
                </GlassCard>

                {/* 3. Carbs */}
                <GlassCard style={styles.macroCardItem} padding={12}>
                  <View style={styles.macroCardHeader}>
                    <Text style={[styles.macroCardTitle, { color: colors.textSecondary }]}>CARBS</Text>
                    <Text style={[styles.macroCardPct, { color: colors.accentSky }]}>
                      {Math.min(100, Math.round((totals.carbs / (carbsTarget || 1)) * 100))}%
                    </Text>
                  </View>
                  <View style={styles.macroValueRow}>
                    <Text style={[styles.macroValueBig, { color: colors.textPrimary }]}>{num(totals.carbs)}</Text>
                    <Text style={[styles.macroValueTarget, { color: colors.textMuted }]}>/ {num(carbsTarget)}g</Text>
                  </View>
                  <View style={[styles.macroBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(100, Math.round((totals.carbs / (carbsTarget || 1)) * 100))}%`,
                          backgroundColor: colors.accentSky,
                        },
                      ]}
                    />
                  </View>
                </GlassCard>

                {/* 4. Fat */}
                <GlassCard style={styles.macroCardItem} padding={12}>
                  <View style={styles.macroCardHeader}>
                    <Text style={[styles.macroCardTitle, { color: colors.textSecondary }]}>FAT</Text>
                    <Text style={[styles.macroCardPct, { color: '#EAB308' }]}>
                      {Math.min(100, Math.round((totals.fat / (fatTarget || 1)) * 100))}%
                    </Text>
                  </View>
                  <View style={styles.macroValueRow}>
                    <Text style={[styles.macroValueBig, { color: colors.textPrimary }]}>{num(totals.fat)}</Text>
                    <Text style={[styles.macroValueTarget, { color: colors.textMuted }]}>/ {num(fatTarget)}g</Text>
                  </View>
                  <View style={[styles.macroBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(100, Math.round((totals.fat / (fatTarget || 1)) * 100))}%`,
                          backgroundColor: '#EAB308',
                        },
                      ]}
                    />
                  </View>
                </GlassCard>

                {/* 5. Fiber */}
                <GlassCard style={styles.macroCardItem} padding={12}>
                  <View style={styles.macroCardHeader}>
                    <Text style={[styles.macroCardTitle, { color: colors.textSecondary }]}>FIBER</Text>
                    <Text style={[styles.macroCardPct, { color: colors.neonGreen }]}>
                      {Math.min(100, Math.round(((totals.fiber || 0) / (fiberTarget || 1)) * 100))}%
                    </Text>
                  </View>
                  <View style={styles.macroValueRow}>
                    <Text style={[styles.macroValueBig, { color: colors.textPrimary }]}>{num(totals.fiber || 0)}</Text>
                    <Text style={[styles.macroValueTarget, { color: colors.textMuted }]}>/ {num(fiberTarget)}g</Text>
                  </View>
                  <View style={[styles.macroBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(100, Math.round(((totals.fiber || 0) / (fiberTarget || 1)) * 100))}%`,
                          backgroundColor: colors.neonGreen,
                        },
                      ]}
                    />
                  </View>
                </GlassCard>
              </View>

              {/* 6. Water Card with interactive inline quick controls */}
              <GlassCard style={styles.waterCard} padding={14}>
                <View style={styles.waterCardHeader}>
                  <View style={styles.waterLeft}>
                    <Droplets size={20} color={colors.accentSky} />
                    <View>
                      <Text style={[styles.waterTitle, { color: colors.textPrimary }]}>WATER / HYDRATION</Text>
                      <Text style={[styles.waterSubtitle, { color: colors.textSecondary }]}>
                        {num((waterGlasses * 0.25).toFixed(1))}L / {num((waterTarget * 0.25).toFixed(1))}L ({num(waterGlasses)} / {num(waterTarget)} glasses)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.waterActions}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        setWaterGlasses(Math.max(0, waterGlasses - 1));
                      }}
                      style={[styles.waterIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                    >
                      <Minus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch {}
                        addWaterGlass();
                      }}
                      style={[styles.waterIconBtn, { backgroundColor: colors.accentSky }]}
                    >
                      <Plus size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.calorieProgressBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginTop: 10 }]}>
                  <View
                    style={[
                      styles.calorieProgressBarFill,
                      {
                        width: `${Math.min(100, Math.round((waterGlasses / (waterTarget || 1)) * 100))}%`,
                        backgroundColor: colors.accentSky,
                      },
                    ]}
                  />
                </View>
              </GlassCard>

              {/* 7. Today's Meals (Breakfast, Lunch, Snacks, Dinner) */}
              <View style={styles.mealsHeaderRow}>
                <Text style={[styles.sectionHeadingSmall, { color: colors.textSecondary }]}>TODAY'S MEALS</Text>
                <Text style={[styles.mealsCount, { color: colors.textMuted }]}>{num(meals.length)} items logged</Text>
              </View>

              {/* Render 4 Meal Categories */}
              {(
                [
                  { type: 'Breakfast', icon: '🌅', label: 'Breakfast' },
                  { type: 'Lunch', icon: '☀️', label: 'Lunch' },
                  { type: 'Snack', icon: '🍎', label: 'Snacks' },
                  { type: 'Dinner', icon: '🌙', label: 'Dinner' },
                ] as const
              ).map(({ type, icon, label }) => {
                const categoryMeals = meals.filter((m) => m.mealType === type);
                const catCalories = categoryMeals.reduce((acc, m) => acc + m.calories, 0);
                const catProtein = categoryMeals.reduce((acc, m) => acc + m.protein, 0);

                return (
                  <GlassCard key={type} style={styles.mealSectionCard} padding={12}>
                    <View style={styles.mealSectionTop}>
                      <View style={styles.mealSectionTitleRow}>
                        <Text style={styles.mealSectionEmoji}>{icon}</Text>
                        <Text style={[styles.mealSectionLabel, { color: colors.textPrimary }]}>{label}</Text>
                        <Text style={[styles.mealSectionSubtotal, { color: colors.textMuted }]}>
                          • {num(catCalories)} kcal ({num(catProtein)}g P)
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedMealType(type as MealType);
                          setLogFoodTab('text');
                          setLogModalVisible(true);
                        }}
                        style={[styles.addMealPill, { backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : 'rgba(79, 124, 255, 0.08)' }]}
                      >
                        <Plus size={12} color={colors.primary} />
                        <Text style={[styles.addMealPillText, { color: colors.primary }]}>Add</Text>
                      </TouchableOpacity>
                    </View>

                    {categoryMeals.length > 0 ? (
                      <View style={styles.mealItemsCol}>
                        {categoryMeals.map((meal) => (
                          <View key={meal.id} style={[styles.mealRowItem, { borderBottomColor: colors.border }]}>
                            <View style={styles.mealLeft}>
                              <Text style={[styles.mealName, { color: colors.textPrimary }]}>{meal.name}</Text>
                              <Text style={[styles.mealTime, { color: colors.textMuted }]}>
                                {meal.loggedAt} • {meal.carbs}g C • {meal.fat}g F{meal.fiber ? ` • ${meal.fiber}g Fib` : ''}
                              </Text>
                            </View>

                            <View style={styles.mealRowRight}>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.mealCalories, { color: colors.textPrimary }]}>
                                  {num(meal.calories)} kcal
                                </Text>
                                <Text style={[styles.mealProtein, { color: colors.primaryViolet }]}>
                                  {num(meal.protein)}g P
                                </Text>
                              </View>

                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => removeMeal(meal.id)}
                                style={styles.deleteMealBtn}
                              >
                                <Trash2 size={13} color={colors.textMuted} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.emptyMealBox}>
                        <Text style={[styles.emptyMealText, { color: colors.textMuted }]}>
                          No items logged for {label.toLowerCase()} yet.
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                );
              })}

              {/* 9. AI Diet Analysis */}
              <GlassCard style={styles.aiAnalysisCard} padding={16}>
                <View style={styles.aiAnalysisHeader}>
                  <View style={styles.aiAnalysisHeaderLeft}>
                    <Sparkles size={18} color={colors.neonGreen} />
                    <Text style={[styles.aiAnalysisTitle, { color: colors.textPrimary }]}>
                      AI Diet & Nutrition Analysis
                    </Text>
                  </View>
                  <Badge
                    label={`${dailyAnalysis?.daily_score ? num(dailyAnalysis.daily_score) : 88}/100 SCORE`}
                    variant="success"
                    size="sm"
                  />
                </View>

                <Text style={[styles.aiAnalysisBody, { color: colors.textSecondary }]}>
                  {dailyAnalysis?.nutrition_analysis ||
                    planReasoning ||
                    `Your nutritional distribution supports your muscle hypertrophy target. Protein intake is ${Math.round((totals.protein / (proteinTarget || 1)) * 100)}% to target. Consider adding fibrous greens at dinner.`}
                </Text>

                {/* Key Highlights / Positives */}
                <View style={styles.analysisBulletsWrap}>
                  <Text style={[styles.bulletSectionLabel, { color: colors.neonGreen }]}>KEY STRENGTHS</Text>
                  <View style={styles.bulletRow}>
                    <CheckCircle2 size={13} color={colors.neonGreen} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                      {totals.protein >= proteinTarget * 0.7
                        ? `Strong protein pacing (${totals.protein}g) supports muscle protein synthesis.`
                        : 'Balanced morning meal timing supports glycogen availability.'}
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <CheckCircle2 size={13} color={colors.neonGreen} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                      Hydration level ({waterGlasses * 0.25}L) maintains cellular volume and reduces fatigue.
                    </Text>
                  </View>

                  <Text style={[styles.bulletSectionLabel, { color: Colors.warning, marginTop: 6 }]}>
                    RECOMMENDATIONS
                  </Text>
                  {dailyAnalysis?.tomorrow_recommendations && dailyAnalysis.tomorrow_recommendations.length > 0 ? (
                    dailyAnalysis.tomorrow_recommendations.slice(0, 2).map((rec, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Zap size={13} color={Colors.warning} />
                        <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{rec}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.bulletRow}>
                      <Zap size={13} color={Colors.warning} />
                      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                        Target {fiberTarget}g fiber daily by including sprouted lentils and dark leafy vegetables.
                      </Text>
                    </View>
                  )}
                </View>
              </GlassCard>

              {/* 10. Personalized Diet Plan */}
              <GlassCard style={styles.dietPlanCard} padding={16}>
                <View style={styles.dietPlanHeader}>
                  <ShieldCheck size={18} color={colors.primaryViolet} />
                  <Text style={[styles.dietPlanTitle, { color: colors.textPrimary }]}>
                    Personalized Diet Plan
                  </Text>
                  <Badge label="AI CALIBRATED" variant="primary" size="sm" />
                </View>

                <View style={[styles.dietPlanSummaryRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.dietPlanSummaryCol}>
                    <Text style={[styles.dietPlanMetricLabel, { color: colors.textMuted }]}>BMR</Text>
                    <Text style={[styles.dietPlanMetricVal, { color: colors.textPrimary }]}>{num(bmr || 1800)} kcal</Text>
                  </View>
                  <View style={styles.dietPlanSummaryCol}>
                    <Text style={[styles.dietPlanMetricLabel, { color: colors.textMuted }]}>TDEE</Text>
                    <Text style={[styles.dietPlanMetricVal, { color: colors.textPrimary }]}>{num(tdee || 2700)} kcal</Text>
                  </View>
                  <View style={styles.dietPlanSummaryCol}>
                    <Text style={[styles.dietPlanMetricLabel, { color: colors.textMuted }]}>PROTEIN RATIO</Text>
                    <Text style={[styles.dietPlanMetricVal, { color: colors.primaryViolet }]}>
                      {Math.round((proteinTarget * 4 * 100) / (calorieTarget || 2200))}%
                    </Text>
                  </View>
                </View>

                <Text style={[styles.planText, { color: colors.textSecondary }]}>
                  Calibrated for lean hypertrophy and active kinetic recovery. Meal distribution emphasizes 25% Breakfast, 35% Lunch, 15% Snacks, and 25% Dinner.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDietPlanModalVisible(true)}
                  style={[styles.customizePlanBtn, { borderColor: colors.primary }]}
                >
                  <Sliders size={14} color={colors.primary} />
                  <Text style={[styles.customizePlanBtnText, { color: colors.primary }]}>
                    Customize / Recalculate Diet Plan
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.planDisclaimer, { color: colors.textMuted }]}>
                  *AI generated nutritional guidance. Consult your sports nutritionist or physician for clinical diet interventions.
                </Text>
              </GlassCard>
            </View>
          )}

          {/* =================================================================== */}
          {/* SECTION 3: TRANSFORMATION PREDICTOR                                */}
          {/* =================================================================== */}
          {activeTab === 'transformation' && (
            <View style={styles.sectionContainer}>
              {/* Input Recap Card */}
              <GlassCard style={styles.recapCard} padding={16}>
                <View style={styles.recapHeader}>
                  <Scale size={18} color={colors.accentSky} />
                  <Text style={[styles.recapTitle, { color: colors.textPrimary }]}>Baseline Predictive Profile</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('GoalSelection')}
                    style={styles.recapEditLink}
                  >
                    <Edit3 size={12} color={colors.primary} />
                    <Text style={[styles.recapEditText, { color: colors.primary }]}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recapGrid}>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>WEIGHT</Text>
                    <Text style={[styles.recapVal, { color: colors.textPrimary }]}>{num(currentWeight)} kg</Text>
                  </View>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>TARGET</Text>
                    <Text style={[styles.recapVal, { color: colors.textPrimary }]}>{num(targetWeight)} kg</Text>
                  </View>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>GOAL</Text>
                    <Text style={[styles.recapVal, { color: colors.textPrimary }]}>Hypertrophy</Text>
                  </View>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>FREQUENCY</Text>
                    <Text style={[styles.recapVal, { color: colors.textPrimary }]}>{num(4)}x / week</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Timeframe Switcher (30 / 60 / 90 / 180 Days) */}
              <View style={styles.timeframeRow}>
                {([30, 60, 90, 180] as const).map((days) => {
                  const isSel = transformDays === days;
                  return (
                    <TouchableOpacity
                      key={days}
                      activeOpacity={0.8}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        setTransformDays(days);
                      }}
                      style={[styles.timeframePill, isSel && styles.timeframePillActive]}
                    >
                      <Text style={[styles.timeframeText, isSel && styles.timeframeTextActive]}>
                        {num(days)} Days
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Projection Chart with Shaded Band */}
              <TransformationChart
                timeframe={transformDays}
                currentWeight={weeklyReport?.weight.end_weight ?? currentWeight}
                targetWeight={targetWeight}
                weeklyWeightChange={weeklyReport?.weight.change}
              />

              {/* Muscle Development Trend Chip */}
              <GlassCard style={styles.muscleDevCard} padding={14}>
                <View style={styles.muscleDevRow}>
                  <Dumbbell size={18} color={colors.neonGreen} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.muscleDevTitle, { color: colors.textPrimary }]}>Muscle Hypertrophy Projection</Text>
                    <Text style={[styles.muscleDevSub, { color: colors.textSecondary }]}>
                      Gradual increase expected: ~+{num(((transformDays / 90) * 1.8).toFixed(1))} kg lean mass with 90%+ form compliance.
                    </Text>
                  </View>
                  <Badge label="OPTIMAL" variant="success" size="sm" />
                </View>
              </GlassCard>

              {/* Consistency Guidance Card */}
              <GlassCard style={styles.guidanceCard} padding={16}>
                <Text style={[styles.guidanceTitle, { color: colors.textPrimary }]}>Consistency Impact</Text>
                <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
                  Adhering to your 4 weekly workouts keeps you within the top 80% of the trajectory band. Missing &gt;2 sessions per month widens variance by ±18%.
                </Text>
              </GlassCard>

              {/* Prominent Disclaimer Banner */}
              <View style={styles.disclaimerBanner}>
                <AlertTriangle size={18} color={colors.warning} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                  These are estimated ranges based on your inputs and mock predictive models, not medical guarantees. Actual metabolic adaptations vary.
                </Text>
              </View>
            </View>
          )}

          {/* =================================================================== */}
          {/* SECTION 4: WEEKLY REVIEW                                            */}
          {/* =================================================================== */}
          {activeTab === 'weeklyReview' && (
            <View style={styles.sectionContainer}>
              {/* Week Selector Bar */}
              <View style={styles.weekSelectorBar}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setWeekOffset((prev) => Math.min(prev + 1, weekLabels.length - 1));
                  }}
                  style={styles.weekArrowBtn}
                >
                  <ChevronLeft size={18} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.weekLabelBox}>
                  <Calendar size={14} color={colors.primary} />
                  <Text style={[styles.weekLabelText, { color: colors.textPrimary }]}>
                    {weeklyReport ? `${weeklyReport.week.start} – ${weeklyReport.week.end}` : weekLabels[weekOffset]}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setWeekOffset((prev) => Math.max(prev - 1, 0));
                  }}
                  style={styles.weekArrowBtn}
                >
                  <ChevronRight size={18} color={weekOffset === 0 ? colors.textMuted : colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {daysTracked === 0 ? (
                <GlassCard style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8 }} padding={24}>
                  <Sparkles size={32} color={colors.primary} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: 12 }}>
                    Start tracking your daily activities to unlock your weekly report
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                    Log your meals, workouts, and hydration to generate AI weekly diagnostics and performance trends.
                  </Text>
                </GlassCard>
              ) : (
                <>
                  {daysTracked < 7 && (
                    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: `${colors.accentSky}18`, borderWidth: 1, borderColor: `${colors.accentSky}40`, marginBottom: 6 }}>
                      <Clock size={12} color={colors.accentSky} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accentSky }}>
                        {num(daysTracked)} {daysTracked === 1 ? 'day' : 'days'} of data available
                      </Text>
                    </View>
                  )}

                  {/* Weekly Overview Card */}
                  <GlassCard variant="glow" style={styles.weeklyOverviewCard} padding={16}>
                    <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>WEEK PERFORMANCE SUMMARY</Text>
                    <View style={styles.overviewStatsRow}>
                      <View style={styles.overviewStatCol}>
                        <Text style={[styles.overviewStatVal, { color: colors.textPrimary }]}>
                          {num(weeklyReport?.workout.workout_days ?? (exerciseLogged ? 1 : 0))} / {num(5)}
                        </Text>
                        <Text style={[styles.overviewStatLabel, { color: colors.textSecondary }]}>WORKOUTS</Text>
                      </View>
                      <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.overviewStatCol}>
                        <Text style={[styles.overviewStatVal, { color: colors.neonGreen }]}>{num(weeklyReport ? '94.2' : '92.0')}%</Text>
                        <Text style={[styles.overviewStatLabel, { color: colors.textSecondary }]}>AVG FORM</Text>
                      </View>
                      <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.overviewStatCol}>
                        <Text style={[styles.overviewStatVal, { color: colors.warning }]}>
                          {weeklyReport ? `${num(weeklyReport.weekly_score)}/100` : `${num(fitScoreData?.fit_score ?? 85)}/100`}
                        </Text>
                        <Text style={[styles.overviewStatLabel, { color: colors.textSecondary }]}>
                          {weeklyReport ? 'WEEK SCORE' : 'FIT SCORE'}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>

                  {/* AI Weekly Health Intelligence Summary */}
                  {weeklyReport?.ai_analysis ? (
                    <GlassCard style={[styles.improvementsCard, { borderColor: colors.accentSky, backgroundColor: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(56, 189, 248, 0.04)' }]} padding={16}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={16} color={colors.accentSky} />
                          <Text style={[styles.subSectionTitle, { color: colors.accentSky, marginBottom: 0 }]}>AI WEEKLY INTELLIGENCE</Text>
                        </View>
                        <Badge
                          label={weeklyReport.score_change > 0 ? `+${weeklyReport.score_change} PTS` : `${weeklyReport.weekly_score} PTS`}
                          variant={weeklyReport.score_change > 0 ? 'success' : 'primary'}
                          size="sm"
                        />
                      </View>
                      <Text style={[styles.improvementText, { color: colors.textPrimary, lineHeight: 21, fontWeight: '500' }]}>
                        {weeklyReport.ai_analysis}
                      </Text>
                    </GlassCard>
                  ) : null}

                  {/* Weekly Nutrition Averages */}
                  <GlassCard style={styles.weeklyNutritionCard} padding={14}>
                    <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>WEEKLY NUTRITION AVERAGES</Text>
                    <View style={styles.weeklyNutriRow}>
                      <View style={styles.nutriTile}>
                        <Utensils size={16} color={colors.primary} />
                        <Text style={[styles.nutriTileVal, { color: colors.textPrimary }]}>
                          {weeklyReport ? num(weeklyReport.nutrition.average_calories.toLocaleString()) : num(totals.calories.toLocaleString())}
                        </Text>
                        <Text style={[styles.nutriTileLabel, { color: colors.textSecondary }]}>kcal / day</Text>
                      </View>
                      <View style={styles.nutriTile}>
                        <Dumbbell size={16} color={colors.primaryViolet} />
                        <Text style={[styles.nutriTileVal, { color: colors.textPrimary }]}>
                          {weeklyReport ? num(weeklyReport.nutrition.average_protein) : num(totals.protein)}g
                        </Text>
                        <Text style={[styles.nutriTileLabel, { color: colors.textSecondary }]}>protein / day</Text>
                      </View>
                      <View style={styles.nutriTile}>
                        <Droplets size={16} color={colors.accentSky} />
                        <Text style={[styles.nutriTileVal, { color: colors.textPrimary }]}>
                          {weeklyReport ? num((weeklyReport.hydration.daily_average_ml / 250).toFixed(1)) : num(waterGlasses)}
                        </Text>
                        <Text style={[styles.nutriTileLabel, { color: colors.textSecondary }]}>glasses / day</Text>
                      </View>
                    </View>
                  </GlassCard>

                  {/* Stress Level Scale Bar */}
                  <StressScaleBar
                    score={
                      weeklyReport
                        ? Math.max(1, Math.min(5, Math.round(weeklyReport.stress.average_level)))
                        : dailyAnalysis?.category_scores
                        ? dailyAnalysis.category_scores.stress >= 90
                          ? 1
                          : dailyAnalysis.category_scores.stress >= 75
                          ? 2
                          : dailyAnalysis.category_scores.stress >= 60
                          ? 3
                          : 4
                        : 2
                    }
                  />

                  {/* Improvements List */}
                  <GlassCard style={styles.improvementsCard} padding={16}>
                    <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>COACH IMPROVEMENTS & WINS</Text>
                    {weeklyReport?.improvements && weeklyReport.improvements.length > 0 ? (
                      weeklyReport.improvements.map((item: string, idx: number) => (
                        <View key={idx} style={styles.improvementRow}>
                          <TrendingUp size={16} color={colors.success} />
                          <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                            {item}
                          </Text>
                        </View>
                      ))
                    ) : dailyAnalysis?.positives && dailyAnalysis.positives.length > 0 ? (
                      dailyAnalysis.positives.slice(0, 3).map((item: string, idx: number) => (
                        <View key={idx} style={styles.improvementRow}>
                          <TrendingUp size={16} color={colors.success} />
                          <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                            {item}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.improvementRow}>
                        <TrendingUp size={16} color={colors.textSecondary} />
                        <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                          Keep tracking meals, workouts, and hydration to unlock personalized AI coaching insights.
                        </Text>
                      </View>
                    )}

                    {/* Problems & Focus Areas */}
                    {weeklyReport?.problems && weeklyReport.problems.length > 0 ? (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={[styles.subSectionTitle, { color: colors.warning, marginBottom: 8 }]}>AREAS REQUIRING ATTENTION</Text>
                        {weeklyReport.problems.map((item: string, idx: number) => (
                          <View key={idx} style={styles.improvementRow}>
                            <Sparkles size={16} color={colors.warning} />
                            <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : dailyAnalysis?.areas_to_improve && dailyAnalysis.areas_to_improve.length > 0 ? (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={[styles.subSectionTitle, { color: colors.textSecondary, marginBottom: 8 }]}>COACH FOCUS TOMORROW</Text>
                        {dailyAnalysis.areas_to_improve.map((item: string, idx: number) => (
                          <View key={idx} style={styles.improvementRow}>
                            <Sparkles size={16} color={colors.warning} />
                            <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {/* Next Week Action Plan */}
                    {weeklyReport?.next_week_plan && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={[styles.subSectionTitle, { color: colors.primary, marginBottom: 8 }]}>NEXT WEEK ACTION PLAN</Text>
                        {[
                          ...weeklyReport.next_week_plan.nutrition.slice(0, 1),
                          ...weeklyReport.next_week_plan.workout.slice(0, 1),
                          ...weeklyReport.next_week_plan.sleep.slice(0, 1),
                        ].map((planItem: string, idx: number) => (
                          <View key={idx} style={styles.improvementRow}>
                            <CheckCircle2 size={16} color={colors.neonGreen} />
                            <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                              {planItem}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassCard>

                  {/* Full Week Breakdown Table */}
                  <GlassCard style={styles.breakdownTableCard} padding={14}>
                    <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>FULL 7-DAY BREAKDOWN</Text>
                    <View style={styles.tableWrap}>
                      {realBreakdown.map((row, idx) => (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={[styles.tableDay, { color: colors.textPrimary }]}>{row.day}</Text>
                          <View style={styles.tableStatusCol}>
                            {row.done ? (
                              <CheckCircle2 size={15} color={colors.neonGreen} />
                            ) : (
                              <XCircle size={15} color={colors.textMuted} />
                            )}
                          </View>
                          <Text style={[styles.tableMetric, { color: colors.textPrimary }]}>{num(row.water)} gls</Text>
                          <Text style={[styles.tableMetric, { color: colors.textPrimary }]}>{num(row.kcal)} kcal</Text>
                          <Text numberOfLines={1} style={[styles.tableNote, { color: colors.textSecondary }]}>{row.note}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </>
              )}
            </View>
          )}
        </Animated.View>

        {/* Bottom Sheet Modal for Logging Food */}
        <LogFoodModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
          initialTab={logFoodTab}
          initialMealType={selectedMealType}
        />

        {/* AI Personalized Diet Plan Customizer Modal */}
        <DietPlanModal
          visible={dietPlanModalVisible}
          onClose={() => setDietPlanModalVisible(false)}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
    gap: 16,
  },
  header: {
    gap: 4,
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: theme.typography.display.fontSize,
    fontFamily: theme.typography.display.fontFamily,
    fontWeight: theme.typography.display.fontWeight,
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  mainTabSwitcher: {
    marginTop: 2,
  },
  sectionContainer: {
    gap: 14,
    marginTop: 4,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiTile: {
    width: '48.5%',
    alignItems: 'center',
    gap: 4,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },

  // Section 2: Diet
  logFoodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  moduleSectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dietTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLogButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  quickLogBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLogBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  calorieHeroCard: {
    gap: 10,
  },
  calorieHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  calorieNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  calorieBigNumber: {
    fontSize: 26,
    fontWeight: '900',
  },
  calorieTargetDivider: {
    fontSize: 18,
    fontWeight: '600',
  },
  calorieTargetNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  calorieBadgeWrap: {
    alignItems: 'flex-end',
  },
  calorieProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  calorieProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroCardItem: {
    width: '48.5%',
    gap: 4,
  },
  macroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  macroCardPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValueBig: {
    fontSize: 18,
    fontWeight: '800',
  },
  macroValueTarget: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  waterCard: {
    gap: 6,
  },
  waterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  waterTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  waterSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  waterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeadingSmall: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mealsCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealSectionCard: {
    gap: 8,
  },
  mealSectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  mealSectionEmoji: {
    fontSize: 16,
  },
  mealSectionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealSectionSubtotal: {
    fontSize: 11,
    fontWeight: '600',
  },
  addMealPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addMealPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mealItemsCol: {
    gap: 4,
    marginTop: 2,
  },
  mealRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mealLeft: {
    flex: 1,
    gap: 2,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  mealRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealCalories: {
    fontSize: 13,
    fontWeight: '800',
  },
  mealProtein: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteMealBtn: {
    padding: 6,
  },
  emptyMealBox: {
    paddingVertical: 6,
  },
  emptyMealText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  aiAnalysisCard: {
    gap: 8,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiAnalysisHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiAnalysisTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  aiAnalysisBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  analysisBulletsWrap: {
    gap: 6,
    marginTop: 4,
  },
  bulletSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  dietPlanCard: {
    gap: 10,
  },
  dietPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietPlanTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  dietPlanSummaryRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'space-around',
    marginVertical: 2,
  },
  dietPlanSummaryCol: {
    alignItems: 'center',
    gap: 2,
  },
  dietPlanMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dietPlanMetricVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  customizePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  customizePlanBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planText: {
    fontSize: 12,
    lineHeight: 18,
  },
  planDisclaimer: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Section 3: Transformation
  recapCard: {
    gap: 10,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  recapEditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recapEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  recapGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  recapItem: {
    alignItems: 'center',
  },
  recapLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  recapVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  timeframePillActive: {
    backgroundColor: 'rgba(79, 124, 255, 0.2)',
    borderColor: Colors.primary,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timeframeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  muscleDevCard: {
    borderWidth: 1,
    borderColor: 'rgba(34, 255, 176, 0.3)',
  },
  muscleDevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muscleDevTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  muscleDevSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  guidanceCard: {
    gap: 6,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  guidanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.35)',
    padding: 14,
    borderRadius: 14,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Section 4: Weekly Review
  weekSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weeklyOverviewCard: {
    gap: 10,
  },
  overviewSub: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  overviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewStatCol: {
    alignItems: 'center',
  },
  overviewStatVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  overviewStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  weeklyNutritionCard: {
    gap: 10,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  weeklyNutriRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutriTile: {
    alignItems: 'center',
    gap: 3,
  },
  nutriTileVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  nutriTileLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  improvementsCard: {
    gap: 10,
  },
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  improvementText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 17,
  },
  breakdownTableCard: {
    gap: 10,
  },
  tableWrap: {
    gap: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableDay: {
    width: 38,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tableStatusCol: {
    width: 28,
  },
  tableMetric: {
    width: 60,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tableNote: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
