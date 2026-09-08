import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, TrendingUp, ShieldCheck, Flame } from 'lucide-react-native';
import { GlassCard, Avatar } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { LeaderboardUser } from '../../../services/mock/types';
import { useTranslation } from '../../../stores/languageStore';
import { useTheme } from '../../../stores/themeStore';

interface StickyUserRankCardProps {
  user: LeaderboardUser;
  metricType: 'daily' | 'weekly' | 'challenge' | 'streak';
}

export const StickyUserRankCard: React.FC<StickyUserRankCardProps> = ({
  user,
  metricType,
}) => {
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  const getMetricDisplay = () => {
    switch (metricType) {
      case 'daily':
        return {
          val: num((user.dailyXp || 520).toLocaleString()),
          unit: t('dailyXp') || 'Daily XP',
        };
      case 'challenge':
        return {
          val: num((user.challengeScore || 1650).toLocaleString()),
          unit: t('questPts') || 'Quest pts',
        };
      case 'streak':
        return {
          val: num(user.streak),
          unit: t('streakBadge') || 'Days Streak',
        };
      default:
        return {
          val: num(user.xp.toLocaleString()),
          unit: 'Arena XP',
        };
    }
  };

  const metric = getMetricDisplay();
  const rankDelta = (user.previousRank || user.rank) - user.rank;

  return (
    <GlassCard variant="glow" style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderActive }]} padding={16}>
      <View style={styles.topRow}>
        <View style={[styles.yourPositionPill, { backgroundColor: isDark ? 'rgba(34, 255, 176, 0.15)' : colors.coachMiniCardBg }]}>
          <Sparkles size={11} color={colors.neonGreen} />
          <Text style={[styles.yourPositionText, { color: colors.neonGreen }]}>
            {t('nationalStandings') || 'YOUR LEADERBOARD STANDING'}
          </Text>
        </View>

        {rankDelta > 0 && (
          <View style={styles.trendPill}>
            <TrendingUp size={12} color={colors.success} />
            <Text style={[styles.trendText, { color: colors.success }]}>+{num(rankDelta)} Ranks</Text>
          </View>
        )}
      </View>

      <View style={styles.mainRow}>
        {/* User Rank Circle */}
        <View style={[styles.rankCircle, { borderColor: colors.primary }]}>
          <Text style={[styles.rankPrefix, { color: colors.accentSky }]}>#</Text>
          <Text style={[styles.rankNumber, { color: colors.textPrimary }]}>{num(user.rank)}</Text>
        </View>

        {/* User Avatar */}
        <Avatar
          uri={user.avatarUrl}
          size="md"
          level={user.level}
          borderColor={colors.primary}
        />

        {/* User Details */}
        <View style={styles.userMetaCol}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
          <View style={styles.userTierRow}>
            <ShieldCheck size={12} color={colors.primaryViolet} />
            <Text style={[styles.userTierText, { color: colors.primaryViolet }]}>
              {user.badge || 'Rising Contender'}
            </Text>
          </View>
        </View>

        {/* Metric Value */}
        <View style={styles.metricBox}>
          <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{metric.val}</Text>
          <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>{metric.unit}</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: Colors.borderActive,
    backgroundColor: Colors.surface,
    gap: 12,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yourPositionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.coachMiniCardBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardSageBorder,
  },
  yourPositionText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.neonGreen,
    letterSpacing: 0.8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(79, 124, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  rankPrefix: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accentSky,
  },
  rankNumber: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 1,
  },
  userMetaCol: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userTierText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryViolet,
  },
  metricBox: {
    alignItems: 'flex-end',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
