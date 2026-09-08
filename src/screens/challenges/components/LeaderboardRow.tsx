import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Award,
} from 'lucide-react-native';
import { GlassCard, Avatar } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { LeaderboardUser } from '../../../services/mock/types';
import { useTranslation } from '../../../stores/languageStore';
import { useTheme } from '../../../stores/themeStore';

interface LeaderboardRowProps {
  user: LeaderboardUser;
  metricType: 'daily' | 'weekly' | 'challenge' | 'streak';
  index: number;
  onPress?: () => void;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  user,
  metricType,
  index,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  // Staggered entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay: Math.min(index * 45, 450),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        delay: Math.min(index * 45, 450),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  // Rank Badge (Top 3 Gold/Silver/Bronze)
  const renderRankBadge = () => {
    if (user.rank === 1) {
      return (
        <View style={[styles.rankBox, styles.rankGold]}>
          <Crown size={12} color="#FFFFFF" />
          <Text style={styles.rankTextGold}>{num(1)}</Text>
        </View>
      );
    }
    if (user.rank === 2) {
      return (
        <View style={[styles.rankBox, styles.rankSilver]}>
          <Text style={styles.rankTextSilver}>{num(2)}</Text>
        </View>
      );
    }
    if (user.rank === 3) {
      return (
        <View style={[styles.rankBox, styles.rankBronze]}>
          <Text style={styles.rankTextBronze}>{num(3)}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.rankBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
        <Text style={[styles.rankText, { color: colors.textSecondary }]}>#{num(user.rank)}</Text>
      </View>
    );
  };

  // Rank Delta Indicator
  const rankDelta = (user.previousRank || user.rank) - user.rank;
  const renderDelta = () => {
    if (rankDelta > 0) {
      return (
        <View style={styles.deltaBox}>
          <TrendingUp size={11} color={colors.success} />
          <Text style={[styles.deltaText, { color: colors.success }]}>+{num(rankDelta)}</Text>
        </View>
      );
    }
    if (rankDelta < 0) {
      return (
        <View style={styles.deltaBox}>
          <TrendingDown size={11} color={colors.danger} />
          <Text style={[styles.deltaText, { color: colors.danger }]}>{num(rankDelta)}</Text>
        </View>
      );
    }
    return (
      <View style={styles.deltaBox}>
        <Minus size={11} color={colors.textMuted} />
      </View>
    );
  };

  // Format metric value
  const getMetricDisplay = () => {
    switch (metricType) {
      case 'daily':
        return {
          val: num((user.dailyXp || Math.round(user.xp / 14)).toLocaleString()),
          unit: t('dailyXp') || 'XP Today',
        };
      case 'challenge':
        return {
          val: num((user.challengeScore || Math.round(user.xp * 0.3)).toLocaleString()),
          unit: t('questPts') || 'pts',
        };
      case 'streak':
        return {
          val: num(user.streak),
          unit: t('streakBadge') || 'Days Flame',
        };
      default:
        return {
          val: num(user.xp.toLocaleString()),
          unit: t('weeklyXp') || 'Total XP',
        };
    }
  };

  const metric = getMetricDisplay();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <GlassCard
          variant={user.isCurrentUser ? 'accent' : 'default'}
          style={[styles.card, user.isCurrentUser && styles.currentUserCard]}
          padding={12}
        >
          {/* Rank Badge */}
          {renderRankBadge()}

          {/* Delta Indicator */}
          {renderDelta()}

          {/* User Avatar */}
          <Avatar
            uri={user.avatarUrl}
            size="sm"
            level={user.level}
            borderColor={user.isCurrentUser ? Colors.primary : Colors.border}
          />

          {/* Name & Badge Info */}
          <View style={styles.nameCol}>
            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { color: colors.textPrimary },
                  user.isCurrentUser && { color: colors.primary, fontWeight: '800' },
                ]}
              >
                {user.name}
              </Text>
            </View>

            {user.badge ? (
              <Text numberOfLines={1} style={styles.userBadgeText}>
                {user.badge}
              </Text>
            ) : (
              <View style={styles.subInfoRow}>
                <Flame size={10} color={colors.warning} />
                <Text style={[styles.subInfoText, { color: colors.textSecondary }]}>
                  {num(user.streak)}d {t('streakFilter') || 'streak'}
                </Text>
              </View>
            )}
          </View>

          {/* Metric Value Aligned Right */}
          <View style={styles.metricCol}>
            <Text
              style={[
                styles.metricVal,
                { color: colors.textPrimary },
                metricType === 'streak' && { color: colors.warning },
              ]}
            >
              {metric.val}
            </Text>
            <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>{metric.unit}</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  currentUserCard: {
    borderWidth: 1.5,
    borderColor: Colors.borderActive,
    backgroundColor: 'rgba(79, 124, 255, 0.1)',
  },
  rankBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 176, 32, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accentGold,
  },
  rankSilver: {
    backgroundColor: 'rgba(226, 232, 240, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rankBronze: {
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  rankTextGold: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.accentGold,
  },
  rankTextSilver: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E2E8F0',
  },
  rankTextBronze: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
  },
  deltaBox: {
    width: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentSky,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  subInfoText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  metricCol: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  metricUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
