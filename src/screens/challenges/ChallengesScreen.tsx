import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
} from 'react-native';
import {
  Trophy,
  Zap,
  Flame,
  ShieldCheck,
  Eye,
  EyeOff,
  Bell,
  Search,
  Sun,
  Moon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge, Avatar } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { theme } from '../../theme';
import { useChallenges, useLeaderboard } from '../../services/mock/queries';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useAuthStore } from '../../stores/authStore';
import { useDailyActivityStore } from '../../stores/dailyActivityStore';
import { useDietStore } from '../../stores/dietStore';
import { useWorkoutSessionStore } from '../../stores/workoutSessionStore';
import { Challenge, LeaderboardUser } from '../../services/mock/types';
import { MOCK_CHALLENGES } from '../../services/mock/data';
import { useTranslation } from '../../stores/languageStore';
import { useTheme } from '../../stores/themeStore';
import { GamificationService } from '../../services/api/gamificationService';

import { SegmentedTabControl } from './components/SegmentedTabControl';
import { ChallengeCard } from './components/ChallengeCard';
import { LeaderboardRow } from './components/LeaderboardRow';
import { StickyUserRankCard } from './components/StickyUserRankCard';

interface ChallengesScreenProps {
  navigation?: any;
}

type MainTab = 'challenges' | 'leaderboard';
type ChallengeFilter = 'all' | 'active' | 'available' | 'completed' | 'daily' | 'weekly';
type LeaderboardMetric = 'daily' | 'weekly' | 'challenge' | 'streak';

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const [mainTab, setMainTab] = useState<MainTab>('challenges');
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('all');
  const [leaderboardMetric, setLeaderboardMetric] = useState<LeaderboardMetric>('weekly');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Local state for interactive challenge actions
  const [challengesState, setChallengesState] = useState<Challenge[]>(MOCK_CHALLENGES);

  // Queries
  const { data: queryChallenges, refetch: refetchChallenges } = useChallenges();
  const { data: queryLeaderboard, refetch: refetchLeaderboard } = useLeaderboard();

  // Stores
  const { xp, level, streak, addReward } = useGamificationStore();
  const { user } = useAuthStore();
  const waterGlasses = useDailyActivityStore((state) => state.waterGlasses);
  const steps = useDailyActivityStore((state) => state.steps || 6420);
  const exerciseLogged = useDailyActivityStore((state) => state.exerciseLogged);
  const meals = useDietStore((state) => state.meals);
  const getTotals = useDietStore((state) => state.getTotals);
  const completedSummary = useWorkoutSessionStore((state) => state.completedSummary);

  const { t, num } = useTranslation();
  const { colors, isDark, toggleThemeMode } = useTheme();

  const totalProtein = getTotals().protein;
  const totalWaterMl = waterGlasses * 250;
  const totalCompletedWorkouts = (completedSummary ? 1 : 0) + (exerciseLogged ? 1 : 0);

  // Calculate live dynamic activity progress
  const getLiveProgress = (c: Challenge): number => {
    if (c.completed) return c.targetProgress;
    const id = c.id.toLowerCase();
    if (id.includes('water') || id.includes('hydration')) {
      return c.unit === 'ml' ? totalWaterMl : waterGlasses;
    }
    if (id.includes('protein') || id.includes('nutrition')) {
      return totalProtein;
    }
    if (id.includes('squat') || id.includes('workout') || id.includes('rep') || id.includes('pushup')) {
      return totalCompletedWorkouts > 0 ? c.targetProgress : c.currentProgress;
    }
    if (id.includes('step') || id.includes('walk')) {
      return steps;
    }
    return c.currentProgress;
  };

  // Load verified gamification profile & challenges from backend
  useEffect(() => {
    useGamificationStore.getState().fetchProfile();
    GamificationService.getChallenges().then((backendList) => {
      if (backendList && backendList.length > 0) {
        const mapped: Challenge[] = backendList.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          type: (b.category || 'daily') as 'daily' | 'weekly' | 'special',
          category: (b.category || 'daily').toUpperCase(),
          rewardXp: b.reward_xp ?? b.xp_reward ?? 100,
          rewardCoins: b.reward_coins ?? b.coins_reward ?? 20,
          currentProgress: b.current_progress ?? b.current_value ?? 0,
          targetProgress: b.target_value ?? 100,
          unit: b.id.includes('water') ? 'ml' : b.id.includes('squat') ? 'reps' : b.id.includes('protein') ? 'g' : 'days',
          joined: b.joined ?? true,
          completed: b.completed ?? false,
          expiresInHours: b.category === 'daily' ? 14 : 96,
          participantsCount: 1420,
          badgeIcon: b.id.includes('squat') ? 'ShieldCheck' : b.id.includes('water') ? 'Zap' : 'Flame',
        }));
        setChallengesState(mapped);
      }
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await Promise.all([
      refetchChallenges(),
      refetchLeaderboard(),
      useGamificationStore.getState().fetchProfile(),
    ]);
    setRefreshing(false);
  };

  // Toggle join challenge
  const handleToggleJoin = (id: string) => {
    setChallengesState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextJoined = !c.joined;
          const nextParticipants = c.participantsCount + (nextJoined ? 1 : -1);
          return {
            ...c,
            joined: nextJoined,
            participantsCount: Math.max(1, nextParticipants),
          };
        }
        return c;
      })
    );
  };

  // Claim completed challenge with strict backend validation
  const handleClaimReward = async (id: string) => {
    const challenge = challengesState.find((c) => c.id === id);
    if (!challenge) return;

    const liveProg = getLiveProgress(challenge);
    if (liveProg < challenge.targetProgress) {
      // Must satisfy condition before claiming
      return;
    }

    if (!challenge.completed) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      addReward(challenge.rewardXp, challenge.rewardCoins);
      setChallengesState((prev) =>
        prev.map((c) => (c.id === id ? { ...c, completed: true, currentProgress: c.targetProgress } : c))
      );
      await GamificationService.completeChallenge(id);
      useGamificationStore.getState().fetchProfile();
    }
  };

  // Filtered challenges dynamically mapping live activity metrics
  const activeList = challengesState.length > 0 ? challengesState : (queryChallenges || []);
  const filteredChallenges = useMemo(() => {
    return activeList
      .map((c) => ({
        ...c,
        currentProgress: getLiveProgress(c),
      }))
      .filter((c) => {
        if (challengeFilter === 'all') return true;
        if (challengeFilter === 'active') return c.joined && !c.completed;
        if (challengeFilter === 'available') return !c.joined && !c.completed;
        if (challengeFilter === 'completed') return c.completed;
        return c.type === challengeFilter;
      });
  }, [activeList, challengeFilter, waterGlasses, totalProtein, totalCompletedWorkouts, steps]);

  // Leaderboard data sorted according to selected metric
  const rawLeaderboard = queryLeaderboard || [];
  const sortedLeaderboard = useMemo(() => {
    const list = [...rawLeaderboard];
    switch (leaderboardMetric) {
      case 'daily':
        return list.sort((a, b) => (b.dailyXp || 0) - (a.dailyXp || 0));
      case 'challenge':
        return list.sort((a, b) => (b.challengeScore || 0) - (a.challengeScore || 0));
      case 'streak':
        return list.sort((a, b) => b.streak - a.streak);
      default:
        return list.sort((a, b) => b.xp - a.xp);
    }
  }, [rawLeaderboard, leaderboardMetric]);

  // Current user item
  const currentUserItem: LeaderboardUser = useMemo(() => {
    const found = rawLeaderboard.find((u) => u.isCurrentUser);
    if (found) {
      return {
        ...found,
        xp,
        level,
        streak,
      };
    }
    return {
      id: 'usr_001',
      rank: 4,
      previousRank: 6,
      name: user?.name || 'Aryan Sharma (You)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      xp,
      level,
      streak,
      badge: '🚀 Rising Contender',
      isCurrentUser: true,
    };
  }, [rawLeaderboard, user, xp, level, streak]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.primaryViolet]}
          />
        }
      >
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <Badge label={t('arenaLeague') || 'ARENA LEAGUE'} variant="gold" size="sm" />
              <Badge label={t('season4') || 'SEASON 4'} variant="primary" size="sm" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t('questsTitle') || 'Quests & Arena'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {t('questsSub') || 'Compete, unlock cyber badges, and ascend the national rankings'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Quick Theme Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                toggleThemeMode();
              }}
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
              accessibilityLabel="Toggle Dark / Light Theme"
            >
              {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color={colors.textPrimary} />}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notifications')}
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Bell size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarBtn}
            >
              <Avatar
                size="sm"
                level={level}
                borderColor={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Main Segmented Tab Switcher (Challenges vs Leaderboard) */}
        <View style={styles.mainSwitcherWrapper}>
          <SegmentedTabControl<MainTab>
            options={[
              {
                key: 'challenges',
                label: t('questsAndChallenges') || 'Quests & Challenges',
                badgeCount: num(filteredChallenges.length),
              },
              {
                key: 'leaderboard',
                label: t('nationalLeaderboard') || 'National Leaderboard',
              },
            ]}
            selectedTab={mainTab}
            onSelectTab={setMainTab}
          />
        </View>

        {/* =================================================================== */}
        {/* SECTION 1: CHALLENGES                                               */}
        {/* =================================================================== */}
        {mainTab === 'challenges' && (
          <View style={styles.sectionContainer}>
            {/* Sub-Tabs: All / Daily / Weekly / Friends */}
            <View style={styles.subFilterRow}>
              {(
                [
                  { key: 'all', label: t('allQuests') || 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'available', label: 'Available' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'daily', label: t('dailyTab') || 'Daily' },
                ] as const
              ).map((tab) => {
                const isSelected = challengeFilter === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.8}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setChallengeFilter(tab.key);
                    }}
                    style={[
                      styles.subFilterPill,
                      {
                        borderColor: colors.border,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                      },
                      isSelected && [styles.subFilterPillActive, { backgroundColor: isDark ? 'rgba(79, 124, 255, 0.3)' : '#DFAB24', borderColor: isDark ? colors.primary : '#DFAB24' }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.subFilterText,
                        { color: colors.textSecondary },
                        isSelected && styles.subFilterTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Challenges List */}
            {filteredChallenges.length > 0 ? (
              <View style={styles.challengesList}>
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onToggleJoin={handleToggleJoin}
                    onClaimReward={handleClaimReward}
                  />
                ))}
              </View>
            ) : (
              /* Empty State */
              <GlassCard style={styles.emptyCard} padding={28}>
                <View style={styles.emptyIconCircle}>
                  <Trophy size={36} color={colors.warning} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {t('noActiveQuests') || 'No Active Quests Here'}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {t('noActiveQuestsDesc') || "You've cleared all challenges in this category or none are currently open."}
                </Text>
                <GradientButton
                  title={t('browseAllQuests') || 'Browse All Quests'}
                  onPress={() => setChallengeFilter('all')}
                  size="sm"
                  style={{ marginTop: 8 }}
                />
              </GlassCard>
            )}
          </View>
        )}

        {/* =================================================================== */}
        {/* SECTION 2: LEADERBOARD                                              */}
        {/* =================================================================== */}
        {mainTab === 'leaderboard' && (
          <View style={styles.sectionContainer}>
            {/* Top Metric Filter Row (Daily XP / Weekly XP / Challenge Score / Streak) */}
            <View style={styles.metricFilterRow}>
              {(
                [
                  { key: 'weekly', label: t('weeklyXp') || 'Weekly XP' },
                  { key: 'daily', label: t('dailyXp') || 'Daily XP' },
                  { key: 'challenge', label: t('questPts') || 'Quest Pts' },
                  { key: 'streak', label: t('streakFilter') || 'Streak' },
                ] as const
              ).map((tab) => {
                const isSelected = leaderboardMetric === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.8}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setLeaderboardMetric(tab.key);
                    }}
                    style={[
                      styles.metricFilterPill,
                      {
                        borderColor: colors.border,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                      },
                      isSelected && [styles.metricFilterPillActive, { backgroundColor: isDark ? 'rgba(79, 124, 255, 0.3)' : '#DFAB24', borderColor: isDark ? colors.primary : '#DFAB24' }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.metricFilterText,
                        { color: colors.textSecondary },
                        isSelected && styles.metricFilterTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Privacy Setting Banner */}
            <GlassCard style={styles.privacyCard} padding={12}>
              <View style={styles.privacyRow}>
                {showOnLeaderboard ? (
                  <Eye size={16} color={colors.success} />
                ) : (
                  <EyeOff size={16} color={colors.textMuted} />
                )}
                <View style={styles.privacyTextCol}>
                  <Text style={[styles.privacyTitle, { color: colors.textPrimary }]}>
                    {t('showOnLeaderboard') || 'Show me on public leaderboard'}
                  </Text>
                  <Text style={[styles.privacySub, { color: colors.textMuted }]}>
                    {showOnLeaderboard
                      ? (t('showOnLeaderboardSub') || 'Your avatar and verified XP are visible to teammates.')
                      : (t('ghostModeSub') || 'Ghost mode active. You are hidden from public rankings.')}
                  </Text>
                </View>

                <Switch
                  value={showOnLeaderboard}
                  onValueChange={(val) => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setShowOnLeaderboard(val);
                  }}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </GlassCard>

            {/* Pinned / Sticky Current User Rank Card */}
            {showOnLeaderboard && (
              <StickyUserRankCard
                user={currentUserItem}
                metricType={leaderboardMetric}
              />
            )}

            {/* Ranked List Section Header */}
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
                {t('nationalStandings') || 'NATIONAL STANDINGS'}
              </Text>
              <Text style={[styles.listHeaderSub, { color: colors.textMuted }]}>
                {t('topAthletes') || 'Top 100 Verified Athletes'}
              </Text>
            </View>

            {/* Ranked List */}
            <View style={styles.rankedList}>
              {sortedLeaderboard.map((u, idx) => (
                <LeaderboardRow
                  key={u.id}
                  user={{
                    ...u,
                    rank: idx + 1,
                  }}
                  metricType={leaderboardMetric}
                  index={idx}
                />
              ))}
            </View>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
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
    paddingRight: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    padding: 2,
  },
  mainSwitcherWrapper: {
    marginTop: 4,
  },
  sectionContainer: {
    gap: 14,
  },

  // Sub-filter tabs
  subFilterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  subFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subFilterPillActive: {
    backgroundColor: 'rgba(79, 124, 255, 0.2)',
    borderColor: Colors.primary,
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  subFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  challengesList: {
    gap: 12,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },

  // Leaderboard filters
  metricFilterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metricFilterPill: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricFilterPillActive: {
    backgroundColor: 'rgba(79, 124, 255, 0.2)',
    borderColor: Colors.primary,
  },
  metricFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  metricFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  privacyCard: {
    backgroundColor: Colors.surfaceSecondary,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyTextCol: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacySub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  listHeaderSub: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  rankedList: {
    gap: 2,
  },
});
