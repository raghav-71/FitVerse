import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Settings,
  Bell,
  Flame,
  Dumbbell,
  Trophy,
  Award,
  Activity,
  ShieldCheck,
  CheckCheck,
  X,
  Sparkles,
  Inbox,
} from 'lucide-react-native';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useNotifications } from '../../services/mock/queries';
import { AppNotification } from '../../services/mock/types';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();
  const { data: initialNotifications } = useNotifications();
  const notificationPreferences = useAuthStore((state) => state.notificationPreferences);
  const updateNotificationPreferences = useAuthStore(
    (state) => state.updateNotificationPreferences
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialNotifications || [
      {
        id: 'notif_1',
        title: '🔥 18-Day Streak at Risk!',
        body: 'Your streak flame will reset at midnight. Complete today’s 6-min AI Squat calibration to protect your rank!',
        timestamp: '15m ago',
        read: false,
        type: 'streak_reminder',
      },
      {
        id: 'notif_2',
        title: '🏋️ Evening Workout Scheduled',
        body: 'Time for your AI Barbell Squat session. Computer Vision tracking calibrated for zero knee valgus.',
        timestamp: '1h ago',
        read: false,
        type: 'workout_reminder',
      },
      {
        id: 'notif_3',
        title: '⚔️ Arena Rival Alert!',
        body: 'Vikram Rajput claimed +350 XP in Quests. You are 4,920 XP away from taking Rank #1 in India.',
        timestamp: '3h ago',
        read: false,
        type: 'challenge_reminder',
      },
      {
        id: 'notif_4',
        title: '🏆 Achievement Unlocked: Laser Precision',
        body: 'Incredible form! You scored 98%+ accuracy across 5 consecutive sets and earned +500 XP.',
        timestamp: '1d ago',
        read: true,
        type: 'achievement',
      },
      {
        id: 'notif_5',
        title: '📊 Weekly Kinetic Report Ready',
        body: 'You completed 5 workouts with 94.8% average form score and burned 2,450 kcal this week.',
        timestamp: '2d ago',
        read: true,
        type: 'weekly_progress',
      },
      {
        id: 'notif_6',
        title: '🛡️ Biomechanical Guard Update',
        body: 'Knee safety guard active: Barbell squats dynamically configured to High Box Squat variant.',
        timestamp: '3d ago',
        read: true,
        type: 'coach',
      },
    ]
  );

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleMarkAsRead = (id: string) => {
    haptic();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const togglePreference = (key: keyof typeof notificationPreferences) => {
    haptic();
    updateNotificationPreferences({
      [key]: !notificationPreferences[key],
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'streak_reminder':
      case 'streak':
        return {
          icon: <Flame size={18} color={Colors.warning} />,
          bg: 'rgba(255, 176, 32, 0.15)',
        };
      case 'workout_reminder':
        return {
          icon: <Dumbbell size={18} color={Colors.primary} />,
          bg: 'rgba(79, 124, 255, 0.15)',
        };
      case 'challenge_reminder':
      case 'challenge':
        return {
          icon: <Trophy size={18} color={Colors.accentSky} />,
          bg: 'rgba(56, 189, 248, 0.15)',
        };
      case 'achievement':
        return {
          icon: <Award size={18} color={Colors.success} />,
          bg: 'rgba(34, 255, 176, 0.15)',
        };
      case 'weekly_progress':
        return {
          icon: <Activity size={18} color={Colors.primaryViolet} />,
          bg: 'rgba(168, 85, 247, 0.15)',
        };
      default:
        return {
          icon: <ShieldCheck size={18} color={Colors.success} />,
          bg: 'rgba(34, 255, 176, 0.15)',
        };
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('notifications') || 'Notifications'}</Text>
            {unreadCount > 0 ? (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {num(unreadCount)} {t('unreadAlerts') || 'unread alerts'}
              </Text>
            ) : (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {t('allCaughtUp') || 'All notifications caught up'}
              </Text>
            )}
          </View>

          <View style={styles.headerRightButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.headerIconButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
              >
                <CheckCheck size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => {
                haptic();
                setShowSettingsModal(true);
              }}
              activeOpacity={0.7}
            >
              <Settings size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <GlassCard style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Inbox size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('allCaughtUp') || "You're all caught up!"}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('noPendingAlerts') || 'No pending alerts or training reminders at this time.'}
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((item) => {
              const { icon, bg } = getNotificationIcon(item.type);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleMarkAsRead(item.id)}
                >
                  <GlassCard
                    style={[
                      styles.notifCard,
                      !item.read && styles.notifCardUnread,
                    ]}
                  >
                    {/* Left Icon Wrap */}
                    <View style={[styles.notifIconWrap, { backgroundColor: bg }]}>
                      {icon}
                    </View>

                    {/* Content Wrap */}
                    <View style={styles.notifContent}>
                      <View style={styles.notifHeaderRow}>
                        <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.notifTime, { color: colors.textMuted }]}>{item.timestamp}</Text>
                      </View>

                      <Text style={[styles.notifBody, { color: colors.textSecondary }]}>{item.body}</Text>
                    </View>

                    {/* Unread Gradient Dot */}
                    {!item.read && (
                      <LinearGradient
                        colors={theme.colors.primaryGradient as [string, string]}
                        style={styles.unreadDot}
                      />
                    )}
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* NOTIFICATION PREFERENCES MODAL                               */}
      {/* ============================================================ */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('notificationSettings') || 'Notification Settings'}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{t('customDeliveryPrefs') || 'Custom delivery preferences'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
                onPress={() => setShowSettingsModal(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Styled Toggle List */}
            <View style={styles.togglesList}>
              {/* 1. Workout Reminders */}
              <TouchableOpacity
                style={styles.preferenceRow}
                activeOpacity={0.7}
                onPress={() => togglePreference('workoutReminders')}
              >
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>{t('workoutReminders') || 'Workout Reminders'}</Text>
                  <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
                    Alerts for scheduled AI Mirror form calibrations
                  </Text>
                </View>
                <View
                  style={[
                    styles.customSwitch,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB' },
                    notificationPreferences.workoutReminders && [styles.customSwitchActive, { backgroundColor: colors.primary }],
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      notificationPreferences.workoutReminders && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 2. Streak Reminders */}
              <TouchableOpacity
                style={styles.preferenceRow}
                activeOpacity={0.7}
                onPress={() => togglePreference('streakReminders')}
              >
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>{t('streakProtectionAlerts') || 'Streak Protection Alerts'}</Text>
                  <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
                    Warnings before daily kinetic streak resets at midnight
                  </Text>
                </View>
                <View
                  style={[
                    styles.customSwitch,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB' },
                    notificationPreferences.streakReminders && [styles.customSwitchActive, { backgroundColor: colors.primary }],
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      notificationPreferences.streakReminders && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 3. Challenge Reminders */}
              <TouchableOpacity
                style={styles.preferenceRow}
                activeOpacity={0.7}
                onPress={() => togglePreference('challengeReminders')}
              >
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>{t('challengeArenaAlerts') || 'Challenge & Arena Alerts'}</Text>
                  <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
                    Rank updates and peer challenge invitations
                  </Text>
                </View>
                <View
                  style={[
                    styles.customSwitch,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB' },
                    notificationPreferences.challengeReminders && [styles.customSwitchActive, { backgroundColor: colors.primary }],
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      notificationPreferences.challengeReminders && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 4. Achievements */}
              <TouchableOpacity
                style={styles.preferenceRow}
                activeOpacity={0.7}
                onPress={() => togglePreference('achievements')}
              >
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>{t('achievementUnlocks') || 'Achievement Unlocks'}</Text>
                  <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
                    Badges, XP milestone boosts, and tier promotions
                  </Text>
                </View>
                <View
                  style={[
                    styles.customSwitch,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB' },
                    notificationPreferences.achievements && [styles.customSwitchActive, { backgroundColor: colors.primary }],
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      notificationPreferences.achievements && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 5. Weekly Progress */}
              <TouchableOpacity
                style={styles.preferenceRow}
                activeOpacity={0.7}
                onPress={() => togglePreference('weeklyProgress')}
              >
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>{t('weeklyBiometricSummary') || 'Weekly Biometric Summary'}</Text>
                  <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
                    Detailed report of weekly volume, calories, and form accuracy
                  </Text>
                </View>
                <View
                  style={[
                    styles.customSwitch,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB' },
                    notificationPreferences.weeklyProgress && [styles.customSwitchActive, { backgroundColor: colors.primary }],
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      notificationPreferences.weeklyProgress && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <GradientButton
              title="Save Preferences"
              onPress={() => setShowSettingsModal(false)}
              fullWidth
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
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
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  // Notifications List
  notificationsList: {
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
    position: 'relative',
  },
  notifCardUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notifBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },

  // Empty State
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },

  togglesList: {
    gap: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prefTextWrap: {
    flex: 1,
    paddingRight: 14,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  prefDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textSecondary,
  },
  switchThumbActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
