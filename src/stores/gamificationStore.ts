import { create } from 'zustand';
import { GamificationService, GamificationProfile } from '../services/api/gamificationService';

interface GamificationState {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  showLevelUpModal: boolean;
  unlockedLevel: number;
  profile: GamificationProfile | null;
  isLoading: boolean;

  fetchProfile: () => Promise<void>;
  claimEventXp: (
    eventType: 'workout_completed' | 'protein_target_completed' | 'water_target_completed' | 'streak_milestone_7d' | 'daily_fit_score_achieved' | string,
    referenceId?: string
  ) => Promise<{ success: boolean; leveledUp: boolean; xpAwarded: number; coinsAwarded: number }>;
  completeChallenge: (challengeId: string) => Promise<{ success: boolean; leveledUp: boolean }>;

  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  incrementStreak: () => void;
  addReward: (xpGain: number, coinGain: number) => { leveledUp: boolean };
  closeLevelUpModal: () => void;
  reset: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xp: 4820,
  coins: 1450,
  level: 13,
  streak: 7,
  showLevelUpModal: false,
  unlockedLevel: 13,
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    const profile = await GamificationService.getProfile();
    if (profile) {
      set({
        xp: profile.xp,
        coins: profile.coins,
        level: profile.level,
        streak: profile.current_streak,
        unlockedLevel: profile.level,
        profile: profile,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  claimEventXp: async (eventType, referenceId) => {
    const res = await GamificationService.claimEventXp(eventType, referenceId);
    if (res && res.success) {
      const current = get();
      const leveledUp = res.leveled_up;
      set({
        xp: res.new_xp,
        coins: res.new_coins,
        level: res.new_level,
        streak: res.streak,
        showLevelUpModal: leveledUp,
        unlockedLevel: res.new_level,
      });
      return {
        success: true,
        leveledUp,
        xpAwarded: res.xp_awarded,
        coinsAwarded: res.coins_awarded,
      };
    }
    return { success: false, leveledUp: false, xpAwarded: 0, coinsAwarded: 0 };
  },

  completeChallenge: async (challengeId) => {
    const res = await GamificationService.completeChallenge(challengeId);
    if (res && res.success) {
      const leveledUp = res.leveled_up;
      set({
        xp: res.new_xp,
        coins: res.new_coins,
        level: res.new_level,
        showLevelUpModal: leveledUp,
        unlockedLevel: res.new_level,
      });
      return { success: true, leveledUp };
    }
    return { success: false, leveledUp: false };
  },

  addXp: (amount: number) => {
    const current = get();
    const newXp = current.xp + amount;
    const threshold = current.level * 400;
    const leveledUp = newXp >= threshold;
    set({
      xp: newXp,
      level: leveledUp ? current.level + 1 : current.level,
      showLevelUpModal: leveledUp,
    });
  },

  addCoins: (amount: number) => {
    set((state) => ({ coins: state.coins + amount }));
  },

  incrementStreak: () => {
    set((state) => ({ streak: state.streak + 1 }));
  },

  addReward: (xpGain, coinGain) => {
    const current = get();
    const newXp = current.xp + xpGain;
    const newCoins = current.coins + coinGain;
    const threshold = current.level * 400;
    const leveledUp = newXp >= threshold;
    const newLevel = leveledUp ? current.level + 1 : current.level;

    set({
      xp: newXp,
      coins: newCoins,
      level: newLevel,
      streak: current.streak + 1,
      showLevelUpModal: leveledUp,
      unlockedLevel: newLevel,
    });

    return { leveledUp };
  },

  closeLevelUpModal: () => set({ showLevelUpModal: false }),

  reset: () =>
    set({
      xp: 4820,
      coins: 1450,
      level: 13,
      streak: 7,
      showLevelUpModal: false,
      unlockedLevel: 13,
      profile: null,
    }),
}));
