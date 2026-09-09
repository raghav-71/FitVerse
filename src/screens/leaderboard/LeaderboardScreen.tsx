import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Flame, Crown, Sparkles, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/common/GlassCard';
import { HeaderBar } from '../../components/common/HeaderBar';
import { useLeaderboard } from '../../services/mock/queries';
import { GamificationService } from '../../services/api/gamificationService';
import { LeaderboardUser } from '../../services/mock/types';

interface LeaderboardScreenProps {
  navigation: any;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { data: mockLeaderboard } = useLeaderboard();
  const [activeTab, setActiveTab] = useState<'national' | 'friends'>('national');
  const [backendList, setBackendList] = useState<LeaderboardUser[] | null>(null);

  useEffect(() => {
    GamificationService.getLeaderboard('weekly', activeTab).then((res) => {
      const entries = res?.rankings || res?.entries;
      if (entries && entries.length > 0) {
        const mapped: LeaderboardUser[] = entries.map((e: any) => ({
          rank: e.rank,
          previousRank: e.previous_rank ?? e.rank,
          id: e.user_id,
          name: e.name,
          avatarUrl: e.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          xp: e.score ?? e.xp ?? 0,
          level: Math.max(1, Math.floor((e.score ?? e.xp ?? 0) / 400)),
          streak: 5,
          badge: e.badge,
          isCurrentUser: e.is_current_user ?? false,
        }));
        setBackendList(mapped);
      }
    });
  }, [activeTab]);

  const leaderboard = backendList || mockLeaderboard;
  const top3 = leaderboard?.slice(0, 3) || [];
  const restUsers = leaderboard?.slice(3) || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeaderBar
          title="National Arena"
          subtitle="All India Leaderboard"
          onNotificationPress={() => navigation.navigate('Notifications')}
          onProfilePress={() => navigation.navigate('Profile')}
        />

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('national')}
            style={[styles.tabBtn, activeTab === 'national' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'national' && styles.tabBtnTextActive]}>
              National League 🇮🇳
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('friends')}
            style={[styles.tabBtn, activeTab === 'friends' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === 'friends' && styles.tabBtnTextActive]}>
              Friends Arena ⚡
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top 3 Podium Presentation */}
        {top3.length === 3 && (
          <View style={styles.podiumContainer}>
            {/* Rank 2 (Silver) */}
            <View style={[styles.podiumColumn, { marginTop: 30 }]}>
              <View style={styles.podiumAvatarWrap}>
                <Image source={{ uri: top3[1].avatarUrl }} style={styles.podiumAvatar} />
                <View style={[styles.podiumRankTag, { backgroundColor: '#94A3B8' }]}>
                  <Text style={styles.podiumRankText}>2</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name.split(' ')[0]}</Text>
              <Text style={styles.podiumXp}>{top3[1].xp.toLocaleString()} XP</Text>
            </View>

            {/* Rank 1 (Gold Apex) */}
            <View style={styles.podiumColumn}>
              <View style={styles.crownBox}>
                <Crown size={22} color="#FFD700" />
              </View>
              <View style={[styles.podiumAvatarWrap, styles.podiumAvatarWrapFirst]}>
                <Image source={{ uri: top3[0].avatarUrl }} style={[styles.podiumAvatar, styles.podiumAvatarFirst]} />
                <View style={[styles.podiumRankTag, { backgroundColor: '#FFD700' }]}>
                  <Text style={[styles.podiumRankText, { color: '#000' }]}>1</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, { fontWeight: '900' }]} numberOfLines={1}>
                {top3[0].name.split(' ')[0]}
              </Text>
              <Text style={[styles.podiumXp, { color: '#FFD700' }]}>
                {top3[0].xp.toLocaleString()} XP
              </Text>
            </View>

            {/* Rank 3 (Bronze) */}
            <View style={[styles.podiumColumn, { marginTop: 40 }]}>
              <View style={styles.podiumAvatarWrap}>
                <Image source={{ uri: top3[2].avatarUrl }} style={styles.podiumAvatar} />
                <View style={[styles.podiumRankTag, { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.podiumRankText}>3</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name.split(' ')[0]}</Text>
              <Text style={styles.podiumXp}>{top3[2].xp.toLocaleString()} XP</Text>
            </View>
          </View>
        )}

        {/* Leaderboard List */}
        <View style={styles.leaderboardList}>
          {restUsers.map((user) => {
            const isMe = user.isCurrentUser;
            const rankImproved = user.previousRank > user.rank;
            return (
              <GlassCard
                key={user.id}
                variant={isMe ? 'glow' : 'default'}
                style={[
                  styles.userRow,
                  isMe && { borderColor: Colors.primary, backgroundColor: 'rgba(79, 124, 255, 0.14)' },
                ]}
              >
                {/* Rank Number & Shift */}
                <View style={styles.rankCol}>
                  <Text style={[styles.rankNum, isMe && { color: Colors.neonGreen }]}>
                    #{user.rank}
                  </Text>
                  {rankImproved ? (
                    <ChevronUp size={14} color={Colors.neonGreen} />
                  ) : (
                    <ChevronDown size={14} color={Colors.caution} />
                  )}
                </View>

                {/* User Info */}
                <Image source={{ uri: user.avatarUrl }} style={styles.listAvatar} />
                <View style={styles.listUserInfo}>
                  <Text style={[styles.listUserName, isMe && { color: Colors.neonGreen }]}>
                    {user.name}
                  </Text>
                  <View style={styles.listSubRow}>
                    <Text style={styles.listLevel}>Level {user.level}</Text>
                    <View style={styles.listStreak}>
                      <Flame size={12} color="#FF6B00" />
                      <Text style={styles.listStreakText}>{user.streak}d</Text>
                    </View>
                  </View>
                </View>

                {/* User XP */}
                <View style={styles.xpCol}>
                  <Text style={styles.xpColNum}>{user.xp.toLocaleString()}</Text>
                  <Text style={styles.xpColLabel}>XP</Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F7F5EE
  },
  scrollContent: {
    paddingBottom: 110,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#EBE7DD',
    borderRadius: 14,
    padding: 4,
    marginTop: 14,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  podiumColumn: {
    alignItems: 'center',
    width: 95,
  },
  crownBox: {
    marginBottom: 4,
  },
  podiumAvatarWrap: {
    position: 'relative',
  },
  podiumAvatarWrapFirst: {
    transform: [{ scale: 1.15 }],
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
  },
  podiumAvatarFirst: {
    borderColor: Colors.accentGold,
    borderWidth: 3,
  },
  podiumRankTag: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  podiumRankText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  podiumName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  podiumXp: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  leaderboardList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankCol: {
    alignItems: 'center',
    width: 32,
  },
  rankNum: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
  },
  listUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  listSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  listLevel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  listStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  listStreakText: {
    fontSize: 11,
    color: '#FF7A3D',
    fontWeight: '700',
  },
  xpCol: {
    alignItems: 'flex-end',
  },
  xpColNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B87200',
  },
  xpColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
