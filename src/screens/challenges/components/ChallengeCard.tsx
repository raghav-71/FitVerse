import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Flame,
  Zap,
  Trophy,
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { GlassCard, ProgressBar, Badge, GradientButton } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { Challenge } from '../../../services/mock/types';
import { useTranslation } from '../../../stores/languageStore';
import { useTheme } from '../../../stores/themeStore';

interface ChallengeCardProps {
  challenge: Challenge;
  onToggleJoin: (id: string) => void;
  onClaimReward?: (id: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onToggleJoin,
  onClaimReward,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t, num } = useTranslation();
  const { colors, isDark } = useTheme();

  const displayTitle = t(`${challenge.id}_title` as any) !== `${challenge.id}_title`
    ? t(`${challenge.id}_title` as any)
    : challenge.title;

  const displayDesc = t(`${challenge.id}_desc` as any) !== `${challenge.id}_desc`
    ? t(`${challenge.id}_desc` as any)
    : challenge.description;

  const displayCategory = t(`cat_${challenge.category.toLowerCase()}` as any) !== `cat_${challenge.category.toLowerCase()}`
    ? t(`cat_${challenge.category.toLowerCase()}` as any)
    : challenge.category;

  const displayType = t(`${challenge.type}Badge` as any) !== `${challenge.type}Badge`
    ? t(`${challenge.type}Badge` as any)
    : challenge.type.toUpperCase();

  const displayUnit = t(challenge.unit as any) !== challenge.unit
    ? t(challenge.unit as any)
    : challenge.unit;

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

  const handleJoin = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsJoining(true);
    setTimeout(() => {
      onToggleJoin(challenge.id);
      setIsJoining(false);
    }, 280);
  };

  const getChallengeIcon = () => {
    const size = 20;
    switch (challenge.badgeIcon) {
      case 'Flame':
        return <Flame size={size} color={colors.warning} />;
      case 'Zap':
        return <Zap size={size} color={colors.neonGreen} />;
      case 'Trophy':
        return <Trophy size={size} color={colors.accentGold} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={colors.primary} />;
      case 'Users':
        return <Users size={size} color={colors.accentSky} />;
      default:
        return <Sparkles size={size} color={colors.primaryViolet} />;
    }
  };

  const progressRatio = Math.min(
    1,
    challenge.targetProgress > 0
      ? challenge.currentProgress / challenge.targetProgress
      : 0
  );
  const progressPercent = Math.round(progressRatio * 100);

  const isCompleted = challenge.completed || progressRatio >= 1;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <GlassCard
        variant={isCompleted ? 'glow' : challenge.joined ? 'accent' : 'default'}
        style={[styles.card, isCompleted && styles.completedCard]}
        padding={16}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Top Row: Icon + Type Badge + Expiry info */}
          <View style={styles.topRow}>
            <View style={[styles.iconCircle, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)' }]}>
              {getChallengeIcon()}
            </View>

            <View style={styles.headerMeta}>
              <View style={styles.badgeGroup}>
                <Badge
                  label={displayType}
                  variant={
                    challenge.type === 'daily'
                      ? 'warning'
                      : challenge.type === 'weekly'
                      ? 'primary'
                      : 'gold'
                  }
                  size="sm"
                />
                <Badge label={displayCategory} variant="neutral" size="sm" />
              </View>

              <View style={styles.expiryBox}>
                <Clock size={11} color={colors.textSecondary} />
                <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
                  {num(challenge.expiresInHours)} {t('hLeft') || 'h left'}
                </Text>
              </View>
            </View>
          </View>

          {/* Title & Description */}
          <View style={styles.bodyContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{displayTitle}</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{displayDesc}</Text>
          </View>

          {/* Rewards Row */}
          <View style={styles.rewardsRow}>
            <View style={[styles.rewardChip, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <Zap size={12} color={colors.warning} />
              <Text style={[styles.rewardText, { color: colors.warning }]}>+{num(challenge.rewardXp)} XP</Text>
            </View>
            <View style={[styles.rewardChip, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <Trophy size={12} color={colors.neonGreen} />
              <Text style={[styles.rewardText, { color: colors.neonGreen }]}>
                +{num(challenge.rewardCoins)} {t('coins') || 'Coins'}
              </Text>
            </View>
            <View style={styles.participantsBox}>
              <Users size={11} color={colors.textMuted} />
              <Text style={[styles.participantsText, { color: colors.textMuted }]}>
                {num(challenge.participantsCount.toLocaleString())} {t('athletes') || 'athletes'}
              </Text>
            </View>
          </View>

          {/* Progress Section (if joined or completed) */}
          {(challenge.joined || isCompleted) && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  {t('progressLabel') || 'Progress'}
                </Text>
                <Text style={[styles.progressValue, { color: colors.textPrimary }]}>
                  {num(challenge.currentProgress)} / {num(challenge.targetProgress)} {displayUnit} ({num(progressPercent)}%)
                </Text>
              </View>
              <ProgressBar
                progress={progressRatio}
                color={isCompleted ? colors.neonGreen : colors.primary}
                height={6}
              />
            </View>
          )}

          {/* Action Button Row */}
          <View style={styles.actionRow}>
            {isCompleted ? (
              <View style={styles.completedBadgeRow}>
                <CheckCircle2 size={16} color={colors.neonGreen} />
                <Text style={[styles.completedText, { color: colors.neonGreen }]}>
                  {t('questComplete') || 'Quest Complete • Rewards Claimed'}
                </Text>
              </View>
            ) : challenge.joined ? (
              <View style={styles.inProgressRow}>
                <View style={styles.inProgressBadge}>
                  <CheckCircle2 size={13} color={colors.neonGreen} />
                  <Text style={[styles.inProgressText, { color: colors.neonGreen }]}>
                    {t('inProgress') || 'In Progress'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleJoin}
                  style={styles.leaveBtn}
                >
                  <Text style={[styles.leaveBtnText, { color: colors.textMuted }]}>
                    {t('abandon') || 'Abandon'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <GradientButton
                title={isJoining ? (t('joining') || 'Joining...') : (t('joinQuest') || 'Join Quest')}
                onPress={handleJoin}
                size="sm"
                fullWidth
              />
            )}
          </View>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  completedCard: {
    borderColor: 'rgba(34, 255, 176, 0.35)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bodyContent: {
    marginTop: 8,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.warning,
  },
  participantsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  participantsText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 10,
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionRow: {
    marginTop: 12,
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: 'rgba(34, 255, 176, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 255, 176, 0.25)',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.neonGreen,
  },
  inProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 255, 176, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 255, 176, 0.25)',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.neonGreen,
  },
  leaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
