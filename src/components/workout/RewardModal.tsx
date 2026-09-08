import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Zap, Flame, Award, ArrowRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { GradientButton } from '../common/GradientButton';

interface RewardModalProps {
  visible: boolean;
  xpEarned: number;
  coinsEarned: number;
  streakDays: number;
  onContinue: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  visible,
  xpEarned,
  coinsEarned,
  streakDays,
  onContinue,
}) => {
  const [displayedXp, setDisplayedXp] = useState(0);
  const [displayedCoins, setDisplayedCoins] = useState(0);

  useEffect(() => {
    if (visible) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Count-up animation
      let step = 0;
      const totalSteps = 15;
      const interval = setInterval(() => {
        step += 1;
        setDisplayedXp(Math.round((xpEarned / totalSteps) * step));
        setDisplayedCoins(Math.round((coinsEarned / totalSteps) * step));
        if (step >= totalSteps) {
          clearInterval(interval);
          setDisplayedXp(xpEarned);
          setDisplayedCoins(coinsEarned);
        }
      }, 35);

      return () => clearInterval(interval);
    }
  }, [visible, xpEarned, coinsEarned]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['rgba(26, 32, 48, 0.95)', 'rgba(11, 13, 18, 0.98)']}
          style={styles.modalContent}
        >
          {/* Glowing Top Trophy Badge */}
          <View style={styles.trophyWrapper}>
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trophyCircle}
            >
              <Trophy size={40} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.sparkleBadge}>
              <Sparkles size={16} color="#FFD700" />
            </View>
          </View>

          <Text style={styles.titleText}>QUEST COMPLETED!</Text>
          <Text style={styles.subtitleText}>
            Biomechanic precision verified by FitVerse AI Engine.
          </Text>

          {/* Reward Metrics Grid */}
          <View style={styles.rewardsRow}>
            {/* XP Card */}
            <View style={styles.rewardCard}>
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.15)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.rewardCardGradient}
              >
                <Award size={24} color="#FBBF24" />
                <Text style={styles.rewardNumber}>+{displayedXp}</Text>
                <Text style={styles.rewardLabel}>XP GAINED</Text>
              </LinearGradient>
            </View>

            {/* Coins Card */}
            <View style={styles.rewardCard}>
              <LinearGradient
                colors={['rgba(34, 255, 176, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.rewardCardGradient}
              >
                <Zap size={24} color={Colors.neonGreen} />
                <Text style={[styles.rewardNumber, { color: Colors.neonGreen }]}>
                  +{displayedCoins}
                </Text>
                <Text style={styles.rewardLabel}>FIT COINS</Text>
              </LinearGradient>
            </View>

            {/* Streak Card */}
            <View style={styles.rewardCard}>
              <LinearGradient
                colors={['rgba(255, 107, 0, 0.15)', 'rgba(255, 61, 0, 0.05)']}
                style={styles.rewardCardGradient}
              >
                <Flame size={24} color="#FF6B00" />
                <Text style={[styles.rewardNumber, { color: '#FF8A3D' }]}>
                  {streakDays}d
                </Text>
                <Text style={styles.rewardLabel}>STREAK FLAME</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Claim Button */}
          <GradientButton
            title="Claim Rewards & Finish"
            onPress={onContinue}
            size="lg"
            style={{ width: '100%', marginTop: 8 }}
          />
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  trophyWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryViolet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1E2434',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  subtitleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  rewardCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rewardCardGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
    marginTop: 6,
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
