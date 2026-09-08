import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Flame,
  Zap,
  Play,
  Sparkles,
  ChevronRight,
  Activity,
  Award,
  CheckCircle2,
  Check,
  X,
  Droplets,
  Scale,
  Dumbbell,
  Minus,
  Plus,
  Compass,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/common/GlassCard';
import { HeaderBar } from '../../components/common/HeaderBar';
import { RadialGauge } from '../../components/common/RadialGauge';
import { GradientButton } from '../../components/common/GradientButton';
import { useUserProfile, useExercises } from '../../services/mock/queries';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useGamificationStore } from '../../stores/gamificationStore';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { data: user } = useUserProfile();
  const { data: exercises } = useExercises();
  const { setExercise, setPhase } = useWorkoutStore();
  const { xp, coins, streak, level } = useGamificationStore();

  // Modal States
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);

  // Tracker State
  const [waterGlasses, setWaterGlasses] = useState(4);
  const [weightKg, setWeightKg] = useState(53.1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Gym', 'Walk']);

  const weekDays = [
    { label: 'M', done: true },
    { label: 'T', done: true },
    { label: 'W', done: true },
    { label: 'T', done: true },
    { label: 'F', done: true },
    { label: 'S', done: true, isToday: true },
    { label: 'S', done: false },
  ];

  const recommendedExercise = exercises?.[0] || {
    id: 'ex_squats',
    name: 'AI Barbell Squat',
    category: 'Legs',
    difficulty: 'Intermediate',
    targetReps: 12,
    targetSets: 3,
    caloriesEst: 140,
    durationMin: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=80',
    safetyNotes: ['Keep spine neutral'],
    formCues: ['Knees tracking over toes'],
    musclesTargeted: ['Quadriceps', 'Glutes'],
    aiPoseKeypoints: [],
  };

  const handleStartWorkout = (ex = recommendedExercise) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setExercise(ex);
    setPhase('before');
    navigation.navigate('AIWorkout');
  };

  const toggleActivity = (act: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (selectedActivities.includes(act)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== act));
    } else {
      setSelectedActivities([...selectedActivities, act]);
    }
  };

  const addGlass = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (waterGlasses < 8) setWaterGlasses(waterGlasses + 1);
  };

  const currentLevel = level || user?.level || 14;
  const currentXp = xp || user?.xp || 4820;
  const xpToNext = user?.xpToNextLevel || 6000;
  const xpPercent = Math.min(100, Math.round((currentXp / xpToNext) * 100));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>
          {/* Top Deep Forest Green Header Section */}
          <View style={styles.forestHeroHeader}>
            <HeaderBar
              title={user?.name ? `Namaste, ${user.name}` : 'Namaste, Priya ji'}
              subtitle="Day 11 • 6-Month Full Body Transformation with Coach"
              variant="dark"
              onNotificationPress={() => navigation.navigate('Notifications')}
              onProfilePress={() => navigation.navigate('Profile')}
            />

            {/* Week Days Tracker Strip & Day 90 Sparkle */}
            <View style={styles.daysTrackerRow}>
              <View style={styles.daysList}>
                {weekDays.map((d, i) => (
                  <View key={i} style={styles.dayItem}>
                    <View
                      style={[
                        styles.dayCircle,
                        d.done && styles.dayCircleDone,
                        d.isToday && styles.dayCircleToday,
                      ]}
                    >
                      {d.done ? (
                        <Check size={11} color={d.isToday ? Colors.accentGold : '#8FBA94'} />
                      ) : null}
                    </View>
                    <Text style={styles.dayLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Predictor')}
                style={styles.seeDay90Btn}
              >
                <View style={styles.sparkleCircle}>
                  <Sparkles size={16} color={Colors.accentGold} />
                </View>
                <Text style={styles.seeDay90Text}>See Day 90</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Body Content on Warm Ivory */}
          <View style={styles.mainBody}>
            {/* Tonight's Prep Card (Yellow Cream from Screenshot 3) */}
            <GlassCard variant="prep" style={styles.prepCard} padding={14}>
              <Text style={styles.prepTitle}>Tonight's prep</Text>
              <Text style={styles.prepBody}>
                Kal ke oats idli ke liye aaj raat hi batter soak kar lo taaki subah fresh nashta taiyaar rahe.
              </Text>
            </GlassCard>

            {/* Coach Tip Sage Card (Mint Sage from Screenshot 3) */}
            <GlassCard variant="sage" style={styles.coachCard} padding={12}>
              <View style={styles.coachRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' }}
                  style={styles.coachAvatar}
                />
                <Text style={styles.coachTipText}>
                  Dopahar 3 minute ekant basun apne shwas var laksh theva. Kahi vichar naka kara.
                </Text>
              </View>
            </GlassCard>

            {/* Primary Action: View Plan Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleStartWorkout()}
              style={styles.viewPlanBtn}
            >
              <Text style={styles.viewPlanText}>View plan</Text>
            </TouchableOpacity>

            {/* TODAY'S ACTIVITY Section (Exercise, Paani, Wazan) */}
            <Text style={styles.sectionHeading}>TODAY'S ACTIVITY</Text>
            <View style={styles.activityGrid}>
              {/* Exercise Card */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setExerciseModalVisible(true)}
                style={[styles.activityCard, styles.exerciseCardBorder]}
              >
                <View style={styles.streakBadgePill}>
                  <Text style={styles.streakBadgePillText}>STREAK</Text>
                </View>
                <View style={styles.activityIconBox}>
                  <Dumbbell size={22} color="#E57A58" />
                </View>
                <Text style={styles.activityTitle}>Exercise</Text>
                <Text style={styles.activitySub}>Log now →</Text>
                <View style={styles.activityTrack}>
                  <View style={[styles.activityFill, { width: '80%', backgroundColor: '#E57A58' }]} />
                </View>
              </TouchableOpacity>

              {/* Paani / Water Card */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWaterModalVisible(true)}
                style={styles.activityCard}
              >
                <View style={styles.activityIconBox}>
                  <Droplets size={22} color={Colors.accentSky} />
                </View>
                <Text style={styles.activityTitle}>Paani</Text>
                <Text style={styles.activitySub}>{waterGlasses}/8</Text>
                <View style={styles.activityTrack}>
                  <View style={[styles.activityFill, { width: `${(waterGlasses / 8) * 100}%`, backgroundColor: Colors.primaryForest }]} />
                </View>
              </TouchableOpacity>

              {/* Wazan / Weight Card */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWeightModalVisible(true)}
                style={styles.activityCard}
              >
                <View style={styles.activityIconBox}>
                  <Scale size={22} color={Colors.primaryViolet} />
                </View>
                <Text style={styles.activityTitle}>Wazan</Text>
                <Text style={styles.activitySub}>{weightKg} kg</Text>
                <View style={styles.activityTrack}>
                  <View style={[styles.activityFill, { width: '100%', backgroundColor: Colors.primaryViolet }]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Level XP Progress Bar */}
            <View style={styles.xpBarContainer}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>ARENA RANK PROGRESS</Text>
                <Text style={styles.xpValue}>
                  {currentXp} / {xpToNext} XP <Text style={{ color: Colors.neonGreen }}>({xpPercent}%)</Text>
                </Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
              </View>
            </View>

            {/* Hero AI Recommended Workout Card */}
            <GlassCard variant="default" style={styles.heroWorkoutCard} padding={16}>
              <View style={styles.heroCardBadgeRow}>
                <View style={styles.aiBadge}>
                  <Sparkles size={13} color={Colors.neonGreen} />
                  <Text style={styles.aiBadgeText}>AI BIOMECHANIC MATCH</Text>
                </View>
                <Text style={styles.durationTag}>8 MIN • 140 KCAL</Text>
              </View>

              <Text style={styles.workoutName}>{recommendedExercise.name}</Text>
              <Text style={styles.workoutReason}>
                Optimized for your <Text style={{ color: Colors.primary, fontWeight: '700' }}>Full Body Transformation</Text>. AI Pose Guard active to ensure perfect 90° knee depth.
              </Text>

              <View style={styles.workoutActionRow}>
                <View style={styles.musclesRow}>
                  {recommendedExercise.musclesTargeted.slice(0, 2).map((m, i) => (
                    <View key={i} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{m}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleStartWorkout(recommendedExercise)}
                  style={styles.startBtn}
                >
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.startBtnGradient}
                  >
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.startBtnText}>Start Mirror</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Today's Biomechanical Progress Card with Radial Gauge */}
            <GlassCard style={styles.todayCard} padding={16}>
              <View style={styles.todayCardContent}>
                <View style={styles.todayMetrics}>
                  <Text style={styles.todayTitle}>Today's Kinetic Score</Text>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricBig}>94.2%</Text>
                      <Text style={styles.metricSub}>Avg Form</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricBig}>1,840</Text>
                      <Text style={styles.metricSub}>Verified Reps</Text>
                    </View>
                  </View>
                  <View style={styles.safetyStatusRow}>
                    <ShieldCheck size={15} color={Colors.neonGreen} />
                    <Text style={styles.safetyStatusText}>
                      Zero Joint Shear Detected
                    </Text>
                  </View>
                </View>

                <RadialGauge score={94} size={98} strokeWidth={8} subtitle="FORM SCORE" />
              </View>
            </GlassCard>

            {/* 4 Core Quick Action Tiles (2x2 Grid) */}
            <Text style={styles.sectionHeading}>CORE MODULES</Text>
            <View style={styles.gridActions}>
              <GlassCard
                onPress={() => handleStartWorkout()}
                style={styles.gridActionCard}
                padding={14}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#EBF4FF' }]}>
                  <Camera size={20} color={Colors.accentSky} />
                </View>
                <Text style={styles.gridActionTitle}>AI Fitness Mirror</Text>
                <Text style={styles.gridActionSub}>60 FPS pose tracking</Text>
              </GlassCard>

              <GlassCard
                onPress={() => navigation.navigate('InjuryCoach')}
                style={styles.gridActionCard}
                padding={14}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#EBF3EA' }]}>
                  <ShieldCheck size={20} color={Colors.neonGreen} />
                </View>
                <Text style={styles.gridActionTitle}>Injury Coach</Text>
                <Text style={styles.gridActionSub}>Pain & safe swaps</Text>
              </GlassCard>

              <GlassCard
                onPress={() => navigation.navigate('Predictor')}
                style={styles.gridActionCard}
                padding={14}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#F5F0FF' }]}>
                  <TrendingUp size={20} color={Colors.primaryViolet} />
                </View>
                <Text style={styles.gridActionTitle}>Body Predictor</Text>
                <Text style={styles.gridActionSub}>30-180 day forecast</Text>
              </GlassCard>

              <GlassCard
                onPress={() => navigation.navigate('Challenges')}
                style={styles.gridActionCard}
                padding={14}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#FFF2EB' }]}>
                  <Trophy size={20} color="#E5531B" />
                </View>
                <Text style={styles.gridActionTitle}>Arena Quests</Text>
                <Text style={styles.gridActionSub}>Challenges & ranks</Text>
              </GlassCard>
            </View>

            {/* My Coaches Section */}
            <Text style={styles.sectionHeading}>MY COACHES</Text>
            <GlassCard style={styles.coachesListCard} padding={0}>
              <View style={styles.coachItem}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }}
                  style={styles.coachPhoto}
                />
                <View style={styles.coachInfo}>
                  <View style={styles.coachTitleRow}>
                    <Text style={styles.coachName}>Coach Arjun</Text>
                    <View style={styles.coachTag}>
                      <Text style={styles.coachTagText}>FITNESS COACH</Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.coachMsg}>
                    Achha pace hai, bas din khatam hone tak...
                  </Text>
                </View>
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>1</Text>
                </View>
              </View>

              <View style={styles.coachDivider} />

              <View style={styles.coachItem}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' }}
                  style={styles.coachPhoto}
                />
                <View style={styles.coachInfo}>
                  <View style={styles.coachTitleRow}>
                    <Text style={styles.coachName}>Counsellor Sneha</Text>
                    <View style={styles.coachTag}>
                      <Text style={styles.coachTagText}>STRESS COACH</Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.coachMsg}>
                    Aapne bataya tha ki aap shaant mahsoos kar...
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 1. EXERCISE TRACKER MODAL (Matches Screenshot 1) */}
      {/* ========================================================================= */}
      <Modal
        visible={exerciseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              onPress={() => setExerciseModalVisible(false)}
              style={styles.closeBtn}
            >
              <X size={18} color="#4A5568" />
            </TouchableOpacity>

            <View style={styles.sheetHeaderCenter}>
              <Text style={styles.sheetEmojiHeader}>🏃 Exercise Tracker</Text>
              <Text style={styles.sheetSub}>What did you do today?</Text>
            </View>

            {/* Selected Summary Pill */}
            <View style={styles.selectedPillRow}>
              <View style={styles.greenCheckSquare}>
                <Check size={14} color="#FFF" />
              </View>
              <Text style={styles.selectedSummaryText}>
                💪 Gym 30m • 🚶 Walk 30m
              </Text>
            </View>

            {/* Activity Grid */}
            <View style={styles.activityChipsGrid}>
              {[
                { name: 'Walk', icon: '🚶' },
                { name: 'Gym', icon: '💪' },
                { name: 'Yoga', icon: '🧘' },
                { name: 'Dance', icon: '💃' },
                { name: 'Sports', icon: '⚽' },
                { name: 'Cycling', icon: '🚴' },
                { name: 'Home Workout', icon: '🏠' },
                { name: 'Other', icon: '✨' },
              ].map((act) => {
                const isSelected = selectedActivities.includes(act.name);
                return (
                  <TouchableOpacity
                    key={act.name}
                    activeOpacity={0.8}
                    onPress={() => toggleActivity(act.name)}
                    style={[
                      styles.actTile,
                      isSelected ? styles.actTileActive : styles.actTileInactive,
                    ]}
                  >
                    <Text style={styles.actEmoji}>{act.icon}</Text>
                    <Text
                      style={[
                        styles.actLabel,
                        isSelected ? styles.actLabelActive : styles.actLabelInactive,
                      ]}
                    >
                      {act.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Log Exercise Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } catch {}
                setExerciseModalVisible(false);
              }}
              style={styles.skyCtaBtn}
            >
              <Text style={styles.skyCtaText}>✓ Log Exercise</Text>
            </TouchableOpacity>

            {/* Bottom Stats 3 Columns */}
            <View style={styles.statsThreeCols}>
              <View style={styles.statColBox}>
                <Text style={styles.statColValue}>6/7</Text>
                <Text style={styles.statColLabel}>This Week</Text>
              </View>
              <View style={styles.statColBox}>
                <Text style={styles.statColValue}>💪 + 🚶</Text>
                <Text style={styles.statColLabel}>Today</Text>
              </View>
              <View style={styles.statColBox}>
                <Text style={styles.statColValue}>6 🔥</Text>
                <Text style={styles.statColLabel}>Streak</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. WATER TRACKER MODAL (Matches Screenshot 4) */}
      {/* ========================================================================= */}
      <Modal
        visible={waterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWaterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              onPress={() => setWaterModalVisible(false)}
              style={styles.closeBtn}
            >
              <X size={18} color="#4A5568" />
            </TouchableOpacity>

            <View style={styles.sheetHeaderCenter}>
              <Text style={styles.sheetEmojiHeader}>💧 Water Tracker</Text>
              <Text style={styles.sheetSub}>Click to track your daily water intake!</Text>
            </View>

            {/* Progress Card */}
            <View style={styles.waterRingCard}>
              <View style={styles.waterCircleBadge}>
                <Text style={styles.waterBigNumber}>{waterGlasses}</Text>
              </View>
              <View style={styles.waterRingText}>
                <Text style={styles.waterRingTitle}>
                  {waterGlasses >= 8 ? 'Goal Reached! 🎉' : 'Half done! 🔥'}
                </Text>
                <Text style={styles.waterRingSubtitle}>
                  {waterGlasses} of 8 glasses done
                </Text>
                <View style={styles.waterProgressTrack}>
                  <View
                    style={[
                      styles.waterProgressFill,
                      { width: `${(waterGlasses / 8) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* 8 Glass Buttons Grid */}
            <View style={styles.glassesGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => {
                const isDrunk = g <= waterGlasses;
                return (
                  <TouchableOpacity
                    key={g}
                    activeOpacity={0.8}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setWaterGlasses(g === waterGlasses ? g - 1 : g);
                    }}
                    style={[
                      styles.glassBox,
                      isDrunk ? styles.glassBoxActive : styles.glassBoxInactive,
                    ]}
                  >
                    <Droplets size={16} color={isDrunk ? '#FFFFFF' : Colors.accentSky} />
                    <Text
                      style={[
                        styles.glassNumber,
                        isDrunk ? styles.glassNumberActive : styles.glassNumberInactive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add One Glass Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={addGlass}
              style={styles.skyCtaBtn}
            >
              <Text style={styles.skyCtaText}>+ Add one glass</Text>
            </TouchableOpacity>

            {/* Bottom 3 Columns */}
            <View style={styles.statsThreeCols}>
              <View style={styles.statColBox}>
                <Text style={styles.statColValue}>1.0L</Text>
                <Text style={styles.statColLabel}>Yesterday</Text>
              </View>
              <View style={styles.statColBox}>
                <Text style={styles.statColValue}>1.3L</Text>
                <Text style={styles.statColLabel}>Avg / day</Text>
              </View>
              <View style={styles.statColBox}>
                <Text style={styles.statColValue}>7 🔥</Text>
                <Text style={styles.statColLabel}>Streak</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. WEIGHT TRACKER MODAL (Matches Screenshot 2) */}
      {/* ========================================================================= */}
      <Modal
        visible={weightModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              onPress={() => setWeightModalVisible(false)}
              style={styles.closeBtn}
            >
              <X size={18} color="#4A5568" />
            </TouchableOpacity>

            <View style={styles.sheetHeaderCenter}>
              <Text style={styles.sheetEmojiHeader}>⚖️ Weight Tracker</Text>
              <Text style={styles.sheetSub}>Log daily • Track progress</Text>
            </View>

            {/* Stepper Display */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setWeightKg(Math.max(30, Math.round((weightKg - 0.1) * 10) / 10));
                }}
                style={styles.stepperBtn}
              >
                <Minus size={22} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.weightDisplay}>
                <Text style={styles.weightBigNum}>{weightKg.toFixed(1)}</Text>
                <Text style={styles.weightKgLabel}>kg</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setWeightKg(Math.min(150, Math.round((weightKg + 0.1) * 10) / 10));
                }}
                style={styles.stepperBtn}
              >
                <Plus size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Weight Slider Visual */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${((weightKg - 30) / (120 - 30)) * 100}%` },
                  ]}
                />
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${((weightKg - 30) / (120 - 30)) * 96}%` },
                  ]}
                />
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderRangeText}>30</Text>
                <Text style={styles.sliderRangeText}>75</Text>
                <Text style={styles.sliderRangeText}>120</Text>
              </View>
            </View>

            {/* Actions: Log Now & View Progress */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                setWeightModalVisible(false);
              }}
              style={styles.weightLogBtn}
            >
              <Text style={styles.weightLogText}>Log Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setWeightModalVisible(false);
                navigation.navigate('Progress');
              }}
              style={styles.viewProgressBtn}
            >
              <Text style={styles.viewProgressText}>📈 View Progress</Text>
            </TouchableOpacity>

            {/* Metric Cards 2x2 */}
            <View style={styles.weightMetricsGrid}>
              <View style={styles.weightMetricCard}>
                <Text style={styles.wmEmoji}>🏁</Text>
                <View>
                  <Text style={styles.wmVal}>55.9</Text>
                  <Text style={styles.wmSub}>Start</Text>
                </View>
              </View>

              <View style={styles.weightMetricCard}>
                <Text style={styles.wmEmoji}>📍</Text>
                <View>
                  <Text style={styles.wmVal}>{weightKg.toFixed(1)}</Text>
                  <Text style={styles.wmSub}>Current</Text>
                </View>
              </View>

              <View style={styles.weightMetricCard}>
                <Text style={styles.wmEmoji}>🎯</Text>
                <View>
                  <Text style={styles.wmVal}>50.0</Text>
                  <Text style={styles.wmSub}>Goal</Text>
                </View>
              </View>

              <View style={styles.weightMetricCard}>
                <Text style={styles.wmEmoji}>📉</Text>
                <View>
                  <Text style={[styles.wmVal, { color: Colors.neonGreen }]}>2.8</Text>
                  <Text style={styles.wmSub}>Lost</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F7F5EE
  },
  scrollContent: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 480,
  },
  forestHeroHeader: {
    backgroundColor: Colors.primaryForest, // #163319 Deep forest green
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  daysTrackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 6,
  },
  daysList: {
    flexDirection: 'row',
    gap: 8,
  },
  dayItem: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleDone: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(42, 112, 52, 0.4)',
  },
  dayCircleToday: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(216, 169, 40, 0.25)',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E9E8E',
    marginTop: 3,
  },
  seeDay90Btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(216, 169, 40, 0.15)',
  },
  seeDay90Text: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4E2D5',
    marginTop: 3,
  },
  mainBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  prepCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardPrepBorder,
  },
  prepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cardPrepText,
    marginBottom: 3,
  },
  prepBody: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.cardPrepText,
    fontWeight: '500',
  },
  coachCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardSageBorder,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coachAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  coachTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.cardSageText,
    fontWeight: '500',
  },
  viewPlanBtn: {
    backgroundColor: Colors.primary, // #1E3F24
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  viewPlanText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  activityGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  exerciseCardBorder: {
    borderColor: '#FFD4C2',
  },
  streakBadgePill: {
    position: 'absolute',
    top: -6,
    right: 8,
    backgroundColor: '#E58A6A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  streakBadgePillText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  activityIconBox: {
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  activitySub: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  activityTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#EDE8DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    borderRadius: 2,
  },
  xpBarContainer: {
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  xpValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EDE8DC',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.neonGreen,
    borderRadius: 3,
  },
  heroWorkoutCard: {
    marginBottom: 16,
  },
  heroCardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF3EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.neonGreen,
    letterSpacing: 0.5,
  },
  durationTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  workoutReason: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  workoutActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  musclesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  muscleTag: {
    backgroundColor: '#F3EFE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  startBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderRadius: 18,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  todayCard: {
    marginBottom: 20,
  },
  todayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayMetrics: {
    flex: 1,
    paddingRight: 10,
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  metricItem: {},
  metricBig: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  safetyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  safetyStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neonGreen,
  },
  gridActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridActionCard: {
    width: '48%',
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridActionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  gridActionSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  coachesListCard: {
    borderRadius: 18,
    marginBottom: 20,
  },
  coachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  coachPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  coachInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  coachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  coachName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  coachTag: {
    backgroundColor: '#F3EFE6',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  coachTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  coachMsg: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  coachDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 14,
  },
  unreadBadge: {
    backgroundColor: '#E53935',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Modals Common Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    position: 'relative',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderCenter: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetEmojiHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary, // #1E3F24
  },
  sheetSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  skyCtaBtn: {
    backgroundColor: Colors.accentSky, // #38B6FF
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  skyCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  statsThreeCols: {
    flexDirection: 'row',
    gap: 10,
  },
  statColBox: {
    flex: 1,
    backgroundColor: '#F6F5F0',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statColValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  statColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Exercise Tracker Modal Specific */
  selectedPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D4E5FF',
    gap: 8,
  },
  greenCheckSquare: {
    backgroundColor: '#34A853',
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  activityChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  actTile: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  actTileActive: {
    backgroundColor: '#4C9EEB',
  },
  actTileInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  actLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  actLabelActive: {
    color: '#FFFFFF',
  },
  actLabelInactive: {
    color: '#4A5568',
  },

  /* Water Tracker Modal Specific */
  waterRingCard: {
    backgroundColor: '#EDF7FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  waterCircleBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: Colors.accentSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBigNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.accentSky,
  },
  waterRingText: {
    flex: 1,
  },
  waterRingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  waterRingSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  waterProgressTrack: {
    height: 5,
    backgroundColor: '#CFE6FF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: Colors.accentSky,
    borderRadius: 3,
  },
  glassesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  glassBox: {
    width: '23%',
    aspectRatio: 1.1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glassBoxActive: {
    backgroundColor: Colors.accentSky,
  },
  glassBoxInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  glassNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  glassNumberActive: {
    color: '#FFFFFF',
  },
  glassNumberInactive: {
    color: '#64748B',
  },

  /* Weight Tracker Modal Specific */
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 12,
  },
  stepperBtn: {
    backgroundColor: Colors.primaryViolet, // #48299E
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightBigNum: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.primaryViolet,
  },
  weightKgLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryViolet,
    marginLeft: 4,
  },
  sliderContainer: {
    marginHorizontal: 10,
    marginBottom: 16,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E8DEFF',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primaryViolet,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryViolet,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderRangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  weightLogBtn: {
    backgroundColor: '#F1F3F5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  weightLogText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  viewProgressBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primaryViolet,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  viewProgressText: {
    color: Colors.primaryViolet,
    fontSize: 14,
    fontWeight: '800',
  },
  weightMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weightMetricCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wmEmoji: {
    fontSize: 16,
  },
  wmVal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primaryViolet,
  },
  wmSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
});
