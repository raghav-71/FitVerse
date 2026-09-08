import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Bell, Flame, Zap, Sparkles } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useUserProfile } from '../../services/mock/queries';
import { useGamificationStore } from '../../stores/gamificationStore';

interface HeaderBarProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  title?: string;
  subtitle?: string;
  variant?: 'dark' | 'light';
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onNotificationPress,
  onProfilePress,
  title,
  subtitle,
  variant = 'dark',
}) => {
  const { data: user } = useUserProfile();
  const { xp, coins, streak, level } = useGamificationStore();

  const currentStreak = streak || user?.streakDays || 22;
  const currentLevel = level || user?.level || 14;
  const avatarUrl = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  const isDark = variant === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <View style={styles.leftRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={onProfilePress} style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>L{currentLevel}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userNameText, isDark ? styles.textWhite : styles.textDark]}>
              {title || user?.name || 'Aryan Sharma'}
            </Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.greetingText, isDark ? styles.subtitleSage : styles.subtitleMuted]}
          >
            {subtitle || 'Day 11 • Full Body Transformation'}
          </Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {/* Streak Flame Pill */}
        <View style={[styles.streakPill, isDark ? styles.streakPillDark : styles.streakPillLight]}>
          <Flame size={14} color="#FF7A3D" />
          <Text style={styles.streakText}>{currentStreak}d</Text>
        </View>

        {/* Notification Bell */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onNotificationPress}
          style={[styles.bellButton, isDark ? styles.bellDark : styles.bellLight]}
        >
          <Bell size={18} color={isDark ? '#FFFFFF' : Colors.textPrimary} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  containerDark: {
    backgroundColor: Colors.primaryForest, // #163319 Deep forest green
  },
  containerLight: {
    backgroundColor: 'transparent',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#3B2D05',
    fontSize: 8,
    fontWeight: '800',
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textDark: {
    color: Colors.textPrimary,
  },
  proBadge: {
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#3B2D05',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 11,
    marginTop: 2,
  },
  subtitleSage: {
    color: '#B6D1B9',
  },
  subtitleMuted: {
    color: Colors.textSecondary,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  streakPillDark: {
    backgroundColor: 'rgba(255, 122, 61, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 61, 0.4)',
  },
  streakPillLight: {
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#FFD4BE',
  },
  streakText: {
    color: '#FF8A3D',
    fontSize: 11,
    fontWeight: '800',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bellLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D4D',
  },
});
