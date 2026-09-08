import { create } from 'zustand';

interface GamificationState {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  showLevelUpModal: boolean;
  unlockedLevel: number;
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
  level: 14,
  streak: 18,
  showLevelUpModal: false,
  unlockedLevel: 14,

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
      level: 14,
      streak: 18,
      showLevelUpModal: false,
      unlockedLevel: 14,
    }),
}));
