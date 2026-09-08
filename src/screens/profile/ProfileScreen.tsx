import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  User,
  LogOut,
  Award,
  ShieldCheck,
  Flame,
  Dumbbell,
  Calendar,
  Zap,
  Trophy,
  Target,
  Activity,
  Scale,
  ChevronRight,
  Lock,
  Check,
  Edit3,
  Bell,
  Shield,
  Moon,
  HelpCircle,
  Info,
  X,
  Plus,
  Minus,
  Sparkles,
  Crosshair,
  AlertTriangle,
  Globe,
  Sun,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer, GlassCard, GradientButton, Badge, Avatar, ProgressBar } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useAchievements } from '../../services/mock/queries';
import { Achievement } from '../../services/mock/types';
import { useTranslation } from '../../stores/languageStore';
import { useTheme } from '../../stores/themeStore';
import { LanguageSelectorModal } from '../../components/common/LanguageSelectorModal';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Stores
  const user = useAuthStore((state) => state.user);
  const selectedGoal = useAuthStore((state) => state.selectedGoal);
  const activityLevel = useAuthStore((state) => state.activityLevel);
  const experienceLevel = useAuthStore((state) => state.experienceLevel);
  const equipmentPreferences = useAuthStore((state) => state.equipmentPreferences);
  const heightCm = useAuthStore((state) => state.heightCm);
  const weightKg = useAuthStore((state) => state.weightKg);
  const isLeaderboardPublic = useAuthStore((state) => state.isLeaderboardPublic);
  const isDataSharingEnabled = useAuthStore((state) => state.isDataSharingEnabled);
  const updateProfileDetails = useAuthStore((state) => state.updateProfileDetails);
  const updatePrivacySettings = useAuthStore((state) => state.updatePrivacySettings);
  const logout = useAuthStore((state) => state.logout);

  const xp = useGamificationStore((state) => state.xp);
  const level = useGamificationStore((state) => state.level);
  const streak = useGamificationStore((state) => state.streak);

  // TanStack Query Mock for achievements
  const { data: achievements } = useAchievements();

  // Modals state
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [editingField, setEditingField] = useState<
    'goal' | 'activity' | 'experience' | 'equipment' | 'measurements' | 'privacy' | 'help' | 'about' | null
  >(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { currentOption, t, num } = useTranslation();
  const { themeMode, isDark, toggleThemeMode, colors } = useTheme();

  // Temporary edit states
  const [tempGoal, setTempGoal] = useState(selectedGoal);
  const [tempActivity, setTempActivity] = useState(activityLevel);
  const [tempExperience, setTempExperience] = useState(experienceLevel);
  const [tempEquipment, setTempEquipment] = useState<string[]>(equipmentPreferences);
  const [tempHeight, setTempHeight] = useState(heightCm);
  const [tempWeight, setTempWeight] = useState(weightKg);

  const hapticFeedback = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const getAchievementIcon = (iconName: string, color: string, size = 22) => {
    switch (iconName) {
      case 'Crosshair':
        return <Crosshair size={size} color={color} />;
      case 'Flame':
        return <Flame size={size} color={color} />;
      case 'ShieldAlert':
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={color} />;
      case 'Zap':
        return <Zap size={size} color={color} />;
      case 'Dumbbell':
        return <Dumbbell size={size} color={color} />;
      case 'Trophy':
        return <Trophy size={size} color={color} />;
      case 'Activity':
        return <Activity size={size} color={color} />;
      case 'Sparkles':
        return <Sparkles size={size} color={color} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  const openEditor = (
    field: 'goal' | 'activity' | 'experience' | 'equipment' | 'measurements' | 'privacy' | 'help' | 'about'
  ) => {
    hapticFeedback();
    setTempGoal(selectedGoal);
    setTempActivity(activityLevel);
    setTempExperience(experienceLevel);
    setTempEquipment([...equipmentPreferences]);
    setTempHeight(heightCm);
    setTempWeight(weightKg);
    setEditingField(field);
  };

  const handleSaveDetails = () => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Medium);
    updateProfileDetails({
      selectedGoal: tempGoal,
      activityLevel: tempActivity,
      experienceLevel: tempExperience,
      equipmentPreferences: tempEquipment,
      heightCm: tempHeight,
      weightKg: tempWeight,
    });
    setEditingField(null);
  };

  const toggleEquipmentOption = (item: string) => {
    hapticFeedback();
    if (tempEquipment.includes(item)) {
      if (tempEquipment.length > 1) {
        setTempEquipment(tempEquipment.filter((e) => e !== item));
      }
    } else {
      setTempEquipment([...tempEquipment, item]);
    }
  };

  const handleLogout = () => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    setShowLogoutConfirm(false);
    logout();
  };

  const unlockedCount = achievements?.filter((a) => a.unlocked).length || 5;
  const totalAchievements = achievements?.length || 10;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============================================================ */}
        {/* 1. ATHLETE HEADER (Deep Forest Green Banner)                 */}
        {/* ============================================================ */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarWrapper}>
              <Avatar
                name={user?.name || 'Aryan Sharma'}
                level={level}
                size="lg"
                status="online"
              />
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.badgeRow}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{`TIER ${num(Math.ceil(level / 5))}`}</Text>
                </View>
              </View>

              <Text style={styles.athleteName}>{user?.name || 'Aryan Sharma'}</Text>
              <Text style={styles.athleteEmail}>{user?.email || 'athlete@fitverse.ai'}</Text>
            </View>

            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => openEditor('measurements')}
              activeOpacity={0.7}
            >
              <Edit3 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 2. STATS ROW (4 GlassCard tiles)                             */}
        {/* ============================================================ */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statTile}>
            <View style={[styles.statIconWrap, { backgroundColor: `${Colors.primary}20` }]}>
              <Dumbbell size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{num(42)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('totalWorkouts') || 'Total Workouts'}</Text>
          </GlassCard>

          <GlassCard style={styles.statTile}>
            <View style={[styles.statIconWrap, { backgroundColor: `${Colors.warning}20` }]}>
              <Flame size={18} color={Colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{num(streak)} {t('daysUnit') || 'Days'}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('currentStreak') || 'Current Streak'}</Text>
          </GlassCard>

          <GlassCard style={styles.statTile}>
            <View style={[styles.statIconWrap, { backgroundColor: `${Colors.accentSky}20` }]}>
              <Calendar size={18} color={Colors.accentSky} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{t('aug2026') || 'Aug 2026'}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('memberSince') || 'Member Since'}</Text>
          </GlassCard>

          <GlassCard style={styles.statTile}>
            <View style={[styles.statIconWrap, { backgroundColor: `${Colors.success}20` }]}>
              <Zap size={18} color={Colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{num(xp.toLocaleString())}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('totalXp') || 'Total XP'}</Text>
          </GlassCard>
        </View>

        {/* ============================================================ */}
        {/* 3. ACHIEVEMENTS SECTION (Grid of 10 badges)                  */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('achievementsTitle') || 'ACHIEVEMENTS'}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {num(unlockedCount)} {t('of') || 'of'} {num(totalAchievements)} {t('unlocked') || 'Unlocked'}
            </Text>
          </View>
          <Badge
            label={`${num(Math.round((unlockedCount / totalAchievements) * 100))}% COMPLETE`}
            variant="warning"
            size="sm"
          />
        </View>

        <View style={styles.achievementsGrid}>
          {achievements?.map((item) => {
            const isUnlocked = item.unlocked;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback();
                  setSelectedAchievement(item);
                }}
                style={styles.achievementCardWrapper}
              >
                <GlassCard
                  style={[
                    styles.achievementCard,
                    !isUnlocked && styles.achievementCardLocked,
                  ]}
                >
                  <View style={styles.achievementIconArea}>
                    {isUnlocked ? (
                      <LinearGradient
                        colors={theme.colors.primaryGradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconGradientRing}
                      >
                        <View style={styles.iconInnerGlow}>
                          {getAchievementIcon(item.icon, Colors.primary, 20)}
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={styles.iconLockedRing}>
                        {getAchievementIcon(item.icon, Colors.textSecondary, 18)}
                        <View style={styles.lockBadge}>
                          <Lock size={10} color={Colors.textPrimary} />
                        </View>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.achievementTitle,
                      { color: isUnlocked ? colors.textPrimary : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.achievementRarity}>{item.rarity.toUpperCase()}</Text>

                  {!isUnlocked && (
                    <View style={styles.achievementProgressMini}>
                      <ProgressBar
                        progress={item.progress / item.maxProgress}
                        color={Colors.borderFocus}
                      />
                      <Text style={styles.achievementProgressText}>
                        {item.progress}/{item.maxProgress}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ============================================================ */}
        {/* 4. MY PROFILE DETAILS LIST (Navigable GlassCard Rows)        */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('myProfileTitle') || 'MY PROFILE DETAILS'}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('bioSetup') || 'Personalized Bio Setup'}</Text>
        </View>

        <GlassCard style={styles.detailsGroupCard}>
          {/* Fitness Goal */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('goal')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.primary}18` }]}>
                <Target size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('fitnessGoal') || 'Fitness Goal'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>{selectedGoal}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Activity Level */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('activity')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.success}18` }]}>
                <Activity size={18} color={Colors.success} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('activityLevel') || 'Activity Level'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>{activityLevel}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Experience Level */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('experience')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.warning}18` }]}>
                <Award size={18} color={Colors.warning} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('experienceLevel') || 'Experience Level'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>{experienceLevel}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Equipment Preferences */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('equipment')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.accentSky}18` }]}>
                <Dumbbell size={18} color={Colors.accentSky} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('equipmentPreferences') || 'Equipment Preferences'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {equipmentPreferences.join(', ')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Height & Weight */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('measurements')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.primaryViolet}18` }]}>
                <Scale size={18} color={Colors.primaryViolet} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('heightAndWeight') || 'Height & Weight'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>
                  {num(heightCm)} cm · {num(weightKg.toFixed(1))} kg
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </GlassCard>

        {/* ============================================================ */}
        {/* 5. SETTINGS LIST                                             */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('settingsAndPrivacy') || 'SETTINGS & PRIVACY'}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('systemControls') || 'System Controls'}</Text>
        </View>

        <GlassCard style={styles.detailsGroupCard}>
          {/* Language Preference */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.primary}18` }]}>
                <Globe size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('languageSetting') || 'Language / भाषा'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>{currentOption.label} ({currentOption.nativeName})</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Notification Preferences */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.primary}18` }]}>
                <Bell size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('notificationPreferences') || 'Notification Preferences'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>Reminders & Achievement Alerts</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Privacy Settings */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('privacy')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.success}18` }]}>
                <Shield size={18} color={Colors.success} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('privacySettings') || 'Privacy Settings'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>
                  {isLeaderboardPublic ? (t('publicRankSharingOn') || 'Public Rank · Data Sharing On') : (t('private') || 'Private')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* App Theme with Working Interactive Light/Dark Mode Toggle */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.8}
            onPress={() => {
              hapticFeedback(Haptics.ImpactFeedbackStyle.Medium);
              toggleThemeMode();
            }}
          >
            <View style={styles.detailRowLeft}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: isDark ? `${Colors.primary}25` : '#FEF3C7' },
                ]}
              >
                {isDark ? (
                  <Moon size={18} color={Colors.primary} />
                ) : (
                  <Sun size={18} color="#D97706" />
                )}
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('appTheme') || 'App Theme'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>
                  {isDark ? (t('themeDark') || 'Cyber Dark') : (t('themeLight') || 'Light (Default)')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge
                label={isDark ? 'DARK' : 'LIGHT'}
                variant={isDark ? 'primary' : 'gold'}
                size="sm"
              />
              <Switch
                value={isDark}
                onValueChange={() => {
                  hapticFeedback(Haptics.ImpactFeedbackStyle.Medium);
                  toggleThemeMode();
                }}
                trackColor={{ false: '#D1CCBF', true: Colors.primary }}
                thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Help & Support */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('help')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${Colors.warning}18` }]}>
                <HelpCircle size={18} color={Colors.warning} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('helpAndSupport') || 'Help & Support'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>FAQs, Tutorials & AI Support</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* About */}
          <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={0.7}
            onPress={() => openEditor('about')}
          >
            <View style={styles.detailRowLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${colors.textSecondary}18` }]}>
                <Info size={18} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.detailRowLabel, { color: colors.textPrimary }]}>{t('aboutApp') || 'About FitVerse AI'}</Text>
                <Text style={[styles.detailRowValue, { color: colors.textSecondary }]}>v2.4.0 (Build 2026.09)</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </GlassCard>

        {/* ============================================================ */}
        {/* 6. LOG OUT BUTTON (Outline Danger with Confirmation Modal)   */}
        {/* ============================================================ */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity
            style={styles.logoutOutlineButton}
            activeOpacity={0.8}
            onPress={() => {
              hapticFeedback(Haptics.ImpactFeedbackStyle.Medium);
              setShowLogoutConfirm(true);
            }}
          >
            <LogOut size={18} color={Colors.danger} />
            <Text style={styles.logoutButtonText}>{t('signOut') || 'Sign Out of FitVerse'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ============================================================ */}
      {/* ACHIEVEMENT DETAIL MODAL                                     */}
      {/* ============================================================ */}
      <Modal
        visible={!!selectedAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.achievementModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {selectedAchievement && (
              <>
                <TouchableOpacity
                  style={[styles.closeModalBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
                  onPress={() => setSelectedAchievement(null)}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.modalIconArea}>
                  {selectedAchievement.unlocked ? (
                    <LinearGradient
                      colors={theme.colors.primaryGradient as [string, string]}
                      style={styles.modalGradientRing}
                    >
                      <View style={[styles.modalIconInner, { backgroundColor: colors.cardBackground }]}>
                        {getAchievementIcon(selectedAchievement.icon, '#FFFFFF', 32)}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.modalIconLocked, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                      {getAchievementIcon(selectedAchievement.icon, colors.textSecondary, 32)}
                      <View style={[styles.modalLockOverlay, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Lock size={16} color={colors.textPrimary} />
                      </View>
                    </View>
                  )}
                </View>

                <Text style={[styles.modalAchievementTitle, { color: colors.textPrimary }]}>{selectedAchievement.title}</Text>
                <Badge
                  label={selectedAchievement.rarity.toUpperCase()}
                  variant={
                    selectedAchievement.rarity === 'Legendary'
                      ? 'warning'
                      : selectedAchievement.rarity === 'Epic'
                      ? 'primary'
                      : 'neutral'
                  }
                  size="sm"
                />

                <Text style={[styles.modalAchievementDesc, { color: colors.textSecondary }]}>{selectedAchievement.description}</Text>

                <View style={[styles.modalProgressBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F5F7', borderColor: colors.border }]}>
                  <View style={styles.modalProgressHeader}>
                    <Text style={[styles.modalProgressLabel, { color: colors.textSecondary }]}>PROGRESS</Text>
                    <Text style={[styles.modalProgressVal, { color: colors.textPrimary }]}>
                      {num(selectedAchievement.progress)} / {num(selectedAchievement.maxProgress)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={selectedAchievement.progress / selectedAchievement.maxProgress}
                    color={selectedAchievement.unlocked ? colors.neonGreen : colors.primary}
                  />
                  {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
                    <Text style={[styles.unlockedDateText, { color: colors.textMuted }]}>
                      Unlocked {selectedAchievement.unlockedAt}
                    </Text>
                  )}
                </View>

                <View style={styles.rewardsRow}>
                  <View style={[styles.rewardPill, { backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7', borderColor: colors.border }]}>
                    <Zap size={15} color={colors.neonGreen} />
                    <Text style={[styles.rewardPillText, { color: colors.textPrimary }]}>+{num(selectedAchievement.rewardXp)} XP</Text>
                  </View>
                  <View style={[styles.rewardPill, { backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F7', borderColor: colors.border }]}>
                    <Trophy size={15} color={colors.warning} />
                    <Text style={[styles.rewardPillText, { color: colors.textPrimary }]}>+{num(selectedAchievement.rewardCoins)} Coins</Text>
                  </View>
                </View>

                <GradientButton
                  title={selectedAchievement.unlocked ? 'Claimed' : 'In Progress'}
                  disabled={selectedAchievement.unlocked}
                  onPress={() => setSelectedAchievement(null)}
                  fullWidth
                  style={{ marginTop: 16 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* EDIT PROFILE DETAILS MODALS                                  */}
      {/* ============================================================ */}
      <Modal
        visible={editingField !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingField(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                {editingField === 'goal' && 'Edit Fitness Goal'}
                {editingField === 'activity' && 'Edit Activity Level'}
                {editingField === 'experience' && 'Edit Experience Level'}
                {editingField === 'equipment' && 'Equipment Preferences'}
                {editingField === 'measurements' && 'Height & Weight'}
                {editingField === 'privacy' && 'Privacy & Data Controls'}
                {editingField === 'help' && 'Help & Support Center'}
                {editingField === 'about' && 'About FitVerse AI'}
              </Text>
              <TouchableOpacity onPress={() => setEditingField(null)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 1. Goal Selection */}
            {editingField === 'goal' && (
              <View style={styles.optionsWrap}>
                {[
                  'Build Muscle',
                  'Burn Fat & Tone',
                  'Athletic Biomechanics',
                  'Mobility & Joint Health',
                ].map((goal) => {
                  const isSelected = tempGoal === goal;
                  return (
                    <TouchableOpacity
                      key={goal}
                      style={[
                        styles.optionCard,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        isSelected && styles.optionCardSelected,
                      ]}
                      onPress={() => {
                        hapticFeedback();
                        setTempGoal(goal);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionCardText,
                          { color: colors.textSecondary },
                          isSelected && [styles.optionCardTextSelected, { color: colors.textPrimary }],
                        ]}
                      >
                        {goal}
                      </Text>
                      {isSelected && <Check size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 2. Activity Level */}
            {editingField === 'activity' && (
              <View style={styles.optionsWrap}>
                {[
                  'Sedentary (0-1 workouts/wk)',
                  'Moderately Active (2-4 workouts/wk)',
                  'Very Active (5+ workouts/wk)',
                  'Elite Cyber Athlete',
                ].map((act) => {
                  const isSelected = tempActivity.includes(act.split(' ')[0]);
                  return (
                    <TouchableOpacity
                      key={act}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => {
                        hapticFeedback();
                        setTempActivity(act.split(' ')[0]);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionCardText,
                          isSelected && styles.optionCardTextSelected,
                        ]}
                      >
                        {act}
                      </Text>
                      {isSelected && <Check size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 3. Experience Level */}
            {editingField === 'experience' && (
              <View style={styles.optionsWrap}>
                {['Beginner', 'Intermediate', 'Advanced', 'Master'].map((exp) => {
                  const isSelected = tempExperience === exp;
                  return (
                    <TouchableOpacity
                      key={exp}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => {
                        hapticFeedback();
                        setTempExperience(exp);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionCardText,
                          isSelected && styles.optionCardTextSelected,
                        ]}
                      >
                        {exp}
                      </Text>
                      {isSelected && <Check size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 4. Equipment Preferences */}
            {editingField === 'equipment' && (
              <View style={styles.optionsWrap}>
                <Text style={styles.sheetSubPrompt}>
                  Select equipment available in your training environment:
                </Text>
                <View style={styles.chipsRow}>
                  {[
                    'Dumbbells',
                    'Barbell',
                    'Resistance Bands',
                    'Kettlebell',
                    'Pull-up Bar',
                    'Bodyweight Only',
                  ].map((eq) => {
                    const isSelected = tempEquipment.includes(eq);
                    return (
                      <TouchableOpacity
                        key={eq}
                        onPress={() => toggleEquipmentOption(eq)}
                        style={[styles.chipPill, isSelected && styles.chipPillSelected]}
                      >
                        <Text
                          style={[
                            styles.chipPillText,
                            isSelected && styles.chipPillTextSelected,
                          ]}
                        >
                          {eq}
                        </Text>
                        {isSelected && <Check size={13} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 5. Height & Weight Steppers */}
            {editingField === 'measurements' && (
              <View style={styles.measurementsBox}>
                {/* Height */}
                <View style={styles.stepperRow}>
                  <Text style={styles.stepperLabel}>Height</Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        hapticFeedback();
                        setTempHeight((h) => Math.max(120, h - 1));
                      }}
                    >
                      <Minus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{tempHeight} cm</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        hapticFeedback();
                        setTempHeight((h) => Math.min(230, h + 1));
                      }}
                    >
                      <Plus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight */}
                <View style={styles.stepperRow}>
                  <Text style={styles.stepperLabel}>Weight</Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        hapticFeedback();
                        setTempWeight((w) => Math.max(30, +(w - 0.2).toFixed(1)));
                      }}
                    >
                      <Minus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{tempWeight.toFixed(1)} kg</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        hapticFeedback();
                        setTempWeight((w) => Math.min(200, +(w + 0.2).toFixed(1)));
                      }}
                    >
                      <Plus size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* 6. Privacy Settings */}
            {editingField === 'privacy' && (
              <View style={styles.privacyBox}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.toggleLabel}>Public Leaderboard Visibility</Text>
                    <Text style={styles.toggleDesc}>
                      Display your rank, name, and total XP on the National Leaderboard.
                    </Text>
                  </View>
                  <Switch
                    value={isLeaderboardPublic}
                    onValueChange={(val) => {
                      hapticFeedback();
                      updatePrivacySettings({ isLeaderboardPublic: val });
                    }}
                    trackColor={{ false: Colors.cardBackground, true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.toggleLabel}>Anonymous Biometric Analytics</Text>
                    <Text style={styles.toggleDesc}>
                      Share encrypted joint keypoint angles to improve AI form correction models.
                    </Text>
                  </View>
                  <Switch
                    value={isDataSharingEnabled}
                    onValueChange={(val) => {
                      hapticFeedback();
                      updatePrivacySettings({ isDataSharingEnabled: val });
                    }}
                    trackColor={{ false: Colors.cardBackground, true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}

            {/* 7. Help & Support */}
            {editingField === 'help' && (
              <View style={styles.helpBox}>
                <Text style={styles.helpHeadline}>Frequently Asked Questions</Text>
                <View style={styles.faqCard}>
                  <Text style={styles.faqQuestion}>How does FitVerse AI track reps?</Text>
                  <Text style={styles.faqAnswer}>
                    Our 17-keypoint computer vision engine monitors joint flexion (e.g. hip-knee 90°
                    depth) with real-time feedback and rep count verification.
                  </Text>
                </View>
                <View style={styles.faqCard}>
                  <Text style={styles.faqQuestion}>Is my camera feed stored?</Text>
                  <Text style={styles.faqAnswer}>
                    Never. All pose tracking runs entirely in real-time on your device's neural
                    engine. No video or frames are ever uploaded or saved.
                  </Text>
                </View>
              </View>
            )}

            {/* 8. About FitVerse AI */}
            {editingField === 'about' && (
              <View style={styles.aboutBox}>
                <View style={styles.aboutLogoRow}>
                  <LinearGradient
                    colors={theme.colors.primaryGradient as [string, string]}
                    style={styles.aboutIconRing}
                  >
                    <Sparkles size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.aboutTitle}>FitVerse AI</Text>
                    <Text style={styles.aboutVersion}>v2.4.0 (SIH Hackathon Edition)</Text>
                  </View>
                </View>
                <Text style={styles.aboutBody}>
                  The next-generation cybernetic fitness coaching platform built for Smart India
                  Hackathon. Featuring real-time computer vision pose estimation, injury prevention
                  guard, predictive metabolic modeling, and national arena gamification.
                </Text>
              </View>
            )}

            {/* Modal Actions */}
            {editingField !== 'privacy' &&
              editingField !== 'help' &&
              editingField !== 'about' && (
                <View style={styles.sheetActions}>
                  <GradientButton
                    title="Save Changes"
                    onPress={handleSaveDetails}
                    fullWidth
                  />
                </View>
              )}
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* LOGOUT CONFIRMATION MODAL                                    */}
      {/* ============================================================ */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmModalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.alertIconCircle}>
              <AlertTriangle size={28} color={colors.danger} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>{t('signOutConfirmTitle') || 'Sign Out of FitVerse?'}</Text>
            <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
              {t('signOutConfirmDesc') || 'Your current active streak and local biometric caches will remain safely saved in the FitVerse cloud.'}
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={[styles.cancelModalBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={[styles.cancelModalText, { color: colors.textPrimary }]}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.confirmLogoutText}>{t('yesSignOut') || 'Yes, Sign Out'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 110, // Generous clearance for floating tab bar
    gap: 18,
  },

  // 1. Athlete Header
  profileHeaderCard: {
    backgroundColor: Colors.headerForest,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#162E1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  proBadge: {
    backgroundColor: Colors.badgeGold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1C1E',
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  athleteName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  athleteEmail: {
    fontSize: 12,
    color: Colors.headerForestSub,
  },
  editIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    maxWidth: 360,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // 3. Achievements Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCardWrapper: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    maxWidth: 360,
  },
  achievementCard: {
    padding: 12,
    alignItems: 'center',
    gap: 6,
    minHeight: 130,
    justifyContent: 'center',
  },
  achievementCardLocked: {
    opacity: 0.65,
    backgroundColor: 'transparent',
  },
  achievementIconArea: {
    marginBottom: 4,
  },
  iconGradientRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLockedRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: Colors.textSecondary,
  },
  achievementRarity: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  achievementProgressMini: {
    width: '100%',
    gap: 2,
    marginTop: 4,
  },
  achievementProgressText: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // 4 & 5. Details Group Card & Settings
  detailsGroupCard: {
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detailRowValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // 6. Logout
  logoutWrapper: {
    marginTop: 4,
  },
  logoutOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 77, 0.45)',
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },

  // Achievement Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  achievementModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    position: 'relative',
    gap: 10,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconArea: {
    marginTop: 8,
    marginBottom: 6,
  },
  modalGradientRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconLocked: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalLockOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAchievementTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalAchievementDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 4,
  },
  modalProgressBox: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  modalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalProgressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  modalProgressVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unlockedDateText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rewardPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Sheet Modal
  sheetContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionsWrap: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionCardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  optionCardTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  sheetSubPrompt: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  measurementsBox: {
    gap: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    minWidth: 70,
    textAlign: 'center',
  },
  privacyBox: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toggleDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  helpBox: {
    gap: 10,
  },
  helpHeadline: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  faqCard: {
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  faqAnswer: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  aboutBox: {
    gap: 12,
  },
  aboutLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  aboutVersion: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  aboutBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sheetActions: {
    marginTop: 6,
  },

  // Logout Confirm Modal
  confirmModalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 12,
  },
  alertIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  confirmDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmLogoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLogoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
