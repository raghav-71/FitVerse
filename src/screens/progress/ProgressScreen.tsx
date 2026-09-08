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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useDailyActivityStore } from '../../stores/dailyActivityStore';
import { useDietStore } from '../../stores/dietStore';

import { SegmentedTabControl } from '../challenges/components/SegmentedTabControl';
import {
  WorkoutFrequencyChart,
  RepsOverTimeChart,
  FormScoreTrendChart,
  WeightTrendChart,
} from './components/ProgressSvgCharts';
import { MacroRing } from './components/MacroRing';
import { LogFoodModal } from './components/LogFoodModal';
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

  // Language Translation & Theme
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  // Stores
  const { xp, streak } = useGamificationStore();
  const { currentWeight, targetWeight, waterGlasses, fitScoreData, syncWithBackend: syncDailyActivity } = useDailyActivityStore();
  const {
    meals,
    calorieTarget,
    proteinTarget,
    waterTarget,
    planReasoning,
    dailyAnalysis,
    weeklyReport,
    getTotals,
    removeMeal,
    syncTodayWithBackend,
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
          {activeTab === 'diet' && (
            <View style={styles.sectionContainer}>
              {/* The 6 Dimensions Progress Poll (Screenshot) */}
              <SixDimensionsProgress
                categoryScores={dailyAnalysis?.category_scores}
                dailyScore={dailyAnalysis?.daily_score}
              />

              {/* Your Journey Transformation Stepper Card (Screenshot) */}
              <YourJourneyCard
                totalWorkoutMinutes={250}
                dailyScore={dailyAnalysis?.daily_score}
              />

              {/* Log Food Action Bar */}
              <View style={styles.logFoodBar}>
                <View>
                  <Text style={[styles.moduleSectionTitle, { color: colors.textPrimary }]}>{t('dailyNutrition') || 'Daily Nutrition'}</Text>
                  <Text style={[styles.moduleSectionSub, { color: colors.textSecondary }]}>Targeted macros based on your hypertrophy goal</Text>
                </View>

                <GradientButton
                  title={t('logFood') || 'Log Food'}
                  onPress={() => setLogModalVisible(true)}
                  icon={<Plus size={16} color="#FFFFFF" />}
                  size="sm"
                />
              </View>

              {/* Today's Nutrition Summary Card with 3 Macro Rings */}
              <GlassCard variant="glow" style={styles.nutritionSummaryCard} padding={16}>
                <View style={styles.ringsRow}>
                  <MacroRing
                    current={totals.calories}
                    target={calorieTarget}
                    label="Calories"
                    unit="kcal"
                    color={colors.primary}
                  />
                  <MacroRing
                    current={totals.protein}
                    target={proteinTarget}
                    label="Protein"
                    unit="g"
                    color={colors.primaryViolet}
                  />
                  <MacroRing
                    current={waterGlasses}
                    target={waterTarget}
                    label="Water"
                    unit="gls"
                    color={colors.accentSky}
                  />
                </View>

                {/* AI Insight Line */}
                <View style={styles.aiInsightRow}>
                  <Sparkles size={14} color={colors.neonGreen} />
                  <Text style={[styles.aiInsightText, { color: colors.textPrimary }]}>
                    {dailyAnalysis?.nutrition_analysis || planReasoning || `You're on track for your hypertrophy goal — consider adding ~${Math.max(0, proteinTarget - totals.protein)}g more protein at dinner.`}
                  </Text>
                </View>
              </GlassCard>

              {/* Today's Logged Meals List */}
              <View style={styles.mealsHeaderRow}>
                <Text style={[styles.sectionHeadingSmall, { color: colors.textSecondary }]}>TODAY'S LOGGED MEALS</Text>
                <Text style={[styles.mealsCount, { color: colors.textMuted }]}>{num(meals.length)} items</Text>
              </View>

              <View style={styles.mealsList}>
                {meals.map((meal) => (
                  <GlassCard key={meal.id} style={styles.mealCard} padding={12}>
                    <View style={styles.mealLeft}>
                      <View style={styles.mealTypeBadgeWrap}>
                        <Badge
                          label={meal.mealType}
                          variant={
                            meal.mealType === 'Breakfast'
                              ? 'warning'
                              : meal.mealType === 'Lunch'
                              ? 'primary'
                              : meal.mealType === 'Dinner'
                              ? 'gold'
                              : 'neutral'
                          }
                          size="sm"
                        />
                        <Text style={[styles.mealTime, { color: colors.textMuted }]}>{meal.loggedAt}</Text>
                      </View>
                      <Text style={[styles.mealName, { color: colors.textPrimary }]}>{meal.name}</Text>
                    </View>

                    <View style={styles.mealRight}>
                      <Text style={[styles.mealCalories, { color: colors.textPrimary }]}>{num(meal.calories)} kcal</Text>
                      <Text style={[styles.mealProtein, { color: colors.textSecondary }]}>{num(meal.protein)}g protein</Text>
                    </View>
                  </GlassCard>
                ))}
              </View>

              {/* Personalized Diet Plan Summary Card */}
              <GlassCard style={styles.dietPlanCard} padding={16}>
                <View style={styles.dietPlanHeader}>
                  <ShieldCheck size={18} color={colors.primaryViolet} />
                  <Text style={[styles.dietPlanTitle, { color: colors.textPrimary }]}>
                    {dailyAnalysis ? 'Daily AI Health Coach Guidance' : 'Personalized Hypertrophy Diet Plan'}
                  </Text>
                  <Badge label="AI GENERATED" variant="primary" size="sm" />
                </View>

                {dailyAnalysis?.tomorrow_recommendations && dailyAnalysis.tomorrow_recommendations.length > 0 ? (
                  dailyAnalysis.tomorrow_recommendations.map((rec, idx) => (
                    <View key={idx} style={styles.planBulletItem}>
                      <View style={[styles.planDot, { backgroundColor: colors.primaryViolet }]} />
                      <Text style={[styles.planText, { color: colors.textSecondary }]}>
                        {rec}
                      </Text>
                    </View>
                  ))
                ) : (
                  <>
                    <View style={styles.planBulletItem}>
                      <View style={[styles.planDot, { backgroundColor: colors.primaryViolet }]} />
                      <Text style={[styles.planText, { color: colors.textSecondary }]}>
                        Target 1.8g – 2.0g protein per kg bodyweight (aiming for ~150g daily) to support muscle protein synthesis.
                      </Text>
                    </View>
                    <View style={styles.planBulletItem}>
                      <View style={[styles.planDot, { backgroundColor: colors.primaryViolet }]} />
                      <Text style={[styles.planText, { color: colors.textSecondary }]}>
                        Focus pre-workout intake on complex carbohydrates ~90 mins prior to AI Barbell Squat sessions for optimal glycogen stores.
                      </Text>
                    </View>
                    <View style={styles.planBulletItem}>
                      <View style={[styles.planDot, { backgroundColor: colors.primaryViolet }]} />
                      <Text style={[styles.planText, { color: colors.textSecondary }]}>
                        Maintain consistent 3.0L water intake to prevent premature muscle cramping and elevate cellular hydration.
                      </Text>
                    </View>
                  </>
                )}
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

              {/* Weekly Overview Card */}
              <GlassCard variant="glow" style={styles.weeklyOverviewCard} padding={16}>
                <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>WEEK PERFORMANCE SUMMARY</Text>
                <View style={styles.overviewStatsRow}>
                  <View style={styles.overviewStatCol}>
                    <Text style={[styles.overviewStatVal, { color: colors.textPrimary }]}>
                      {num(weeklyReport?.workout.workout_days ?? 4)} / {num(5)}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: colors.textSecondary }]}>WORKOUTS</Text>
                  </View>
                  <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.overviewStatCol}>
                    <Text style={[styles.overviewStatVal, { color: colors.neonGreen }]}>{num('94.2')}%</Text>
                    <Text style={[styles.overviewStatLabel, { color: colors.textSecondary }]}>AVG FORM</Text>
                  </View>
                  <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.overviewStatCol}>
                    <Text style={[styles.overviewStatVal, { color: colors.warning }]}>
                      {weeklyReport ? `${num(weeklyReport.weekly_score)}/100` : `+${num('1,240')}`}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: colors.textSecondary }]}>
                      {weeklyReport ? 'WEEK SCORE' : 'XP GAINED'}
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
                      {weeklyReport ? num(weeklyReport.nutrition.average_calories.toLocaleString()) : num('2,120')}
                    </Text>
                    <Text style={[styles.nutriTileLabel, { color: colors.textSecondary }]}>kcal / day</Text>
                  </View>
                  <View style={styles.nutriTile}>
                    <Dumbbell size={16} color={colors.primaryViolet} />
                    <Text style={[styles.nutriTileVal, { color: colors.textPrimary }]}>
                      {weeklyReport ? num(weeklyReport.nutrition.average_protein) : num(138)}g
                    </Text>
                    <Text style={[styles.nutriTileLabel, { color: colors.textSecondary }]}>protein / day</Text>
                  </View>
                  <View style={styles.nutriTile}>
                    <Droplets size={16} color={colors.accentSky} />
                    <Text style={[styles.nutriTileVal, { color: colors.textPrimary }]}>
                      {weeklyReport ? num((weeklyReport.hydration.daily_average_ml / 250).toFixed(1)) : num('6.4')}
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
                  <>
                    <View style={styles.improvementRow}>
                      <TrendingUp size={16} color={colors.success} />
                      <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                        Form score up +6.2% vs previous week on AI Barbell Squats.
                      </Text>
                    </View>
                    <View style={styles.improvementRow}>
                      <TrendingUp size={16} color={colors.success} />
                      <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                        Hit hydration goal on 5 out of 7 days (+1 day improvement).
                      </Text>
                    </View>
                    <View style={styles.improvementRow}>
                      <TrendingUp size={16} color={colors.accentSky} />
                      <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
                        Shoulder stability locked during dynamic pushups with 0 shear alarms.
                      </Text>
                    </View>
                  </>
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
                  {[
                    { day: 'Mon', done: true, water: 7, kcal: 2150, note: 'AI Squats • Form 96%' },
                    { day: 'Tue', done: true, water: 8, kcal: 2200, note: 'Strict Curls • Form 94%' },
                    { day: 'Wed', done: false, water: 5, kcal: 1950, note: 'Rest & Mobility' },
                    { day: 'Thu', done: true, water: 6, kcal: 2080, note: 'Lunges • Form 92%' },
                    { day: 'Fri', done: true, water: 8, kcal: 2250, note: 'Deadlifts • Form 95%' },
                    { day: 'Sat', done: false, water: 5, kcal: 2000, note: 'Active Foam Roll' },
                    { day: 'Sun', done: false, water: 6, kcal: 2210, note: 'Weekly Prep' },
                  ].map((row, idx) => (
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
            </View>
          )}
        </Animated.View>

        {/* Bottom Sheet Modal for Logging Food */}
        <LogFoodModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
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
  nutritionSummaryCard: {
    gap: 14,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 255, 176, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 255, 176, 0.2)',
  },
  aiInsightText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  mealsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionHeadingSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  mealsCount: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  mealsList: {
    gap: 8,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealLeft: {
    gap: 4,
    flex: 1,
  },
  mealTypeBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mealRight: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  mealProtein: {
    fontSize: 11,
    color: Colors.primaryViolet,
    fontWeight: '700',
  },
  dietPlanCard: {
    gap: 10,
  },
  dietPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dietPlanTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  planBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  planDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryViolet,
    marginTop: 6,
  },
  planText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  planDisclaimer: {
    fontSize: 10,
    color: Colors.textMuted,
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
