import { create } from 'zustand';
import { Colors } from '../theme/colors';

export type ThemeMode = 'light' | 'dark';

export const LightColors = {
  // Core backgrounds & surfaces
  background: '#F7F5EE',            // Warm ivory/cream from approved screenshots
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F5F7',
  cardBackground: '#FFFFFF',

  // Top Forest Green Header & Accents
  headerForest: '#162E1C',
  headerForestDark: '#112416',
  headerForestText: '#FFFFFF',
  headerForestSub: '#B3C7B6',
  primaryForest: '#18331E',

  // Primary Action
  primary: '#2B8FF4',
  primaryDark: '#1E75D8',
  primaryLight: '#EDF4FC',
  primaryGradient: ['#2B8FF4', '#1E75D8'] as const,
  gradientPrimary: ['#2B8FF4', '#1E75D8'] as const,

  // Accents
  gold: '#DFAB24',
  accentGold: '#DFAB24',
  badgeGold: '#F0BF38',
  tabActiveGold: '#DFAB24',
  royalPurple: '#3B1F8C',
  purpleLight: '#F3EEFF',
  primaryViolet: '#3B1F8C',

  // Prep Card
  prepCardBg: '#FFF9E6',
  prepCardBorder: '#F5E5B8',
  prepCardTitle: '#7C5315',
  prepCardBody: '#423724',
  coachMiniCardBg: '#EBF3EA',
  coachMiniCardText: '#2E3A2E',

  // Status
  success: '#276738',
  successLight: '#EBF3EA',
  warning: '#DFAB24',
  danger: '#EF4444',
  neonGreen: '#276738',
  accentSky: '#38BDF8',

  // Text
  textPrimary: '#1A1C1E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textSubtle: '#4B5563',

  // Borders
  border: '#E8E5DD',
  borderSubtle: '#F0EEE6',
  borderActive: '#2B8FF4',
  borderFocus: '#2B8FF4',
  borderGlow: '#DFAB24',

  // Tab Bar
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E8E5DD',

  // Gradients
  gradientSky: ['#38BDF8', '#0284C7'] as const,
  gradientPurple: ['#3B1F8C', '#6D28D9'] as const,
  gradientFire: ['#F97316', '#EF4444'] as const,
  gradientSuccess: ['#276738', '#162E1C'] as const,
  gradientWarning: ['#DFAB24', '#B45309'] as const,
};

export const DarkColors = {
  // Core backgrounds & surfaces
  background: '#0B0D12',            // Cyber Dark background
  surface: '#141721',
  surfaceSecondary: '#1C2030',
  cardBackground: '#141721',

  // Top Forest Green Header & Accents (deep sleek cyber card)
  headerForest: '#10151E',
  headerForestDark: '#0B0F17',
  headerForestText: '#FFFFFF',
  headerForestSub: '#8195B5',
  primaryForest: '#1A2333',

  // Primary Action
  primary: '#4F7CFF',
  primaryDark: '#3B68EC',
  primaryLight: 'rgba(79, 124, 255, 0.15)',
  primaryGradient: ['#4F7CFF', '#A855F7'] as const,
  gradientPrimary: ['#4F7CFF', '#A855F7'] as const,

  // Accents
  gold: '#F59E0B',
  accentGold: '#F59E0B',
  badgeGold: '#FBBF24',
  tabActiveGold: '#F59E0B',
  royalPurple: '#8B5CF6',
  purpleLight: 'rgba(139, 92, 246, 0.15)',
  primaryViolet: '#8B5CF6',

  // Prep Card (sleek dark amber)
  prepCardBg: '#1C1917',
  prepCardBorder: '#44403C',
  prepCardTitle: '#FBBF24',
  prepCardBody: '#E7E5E4',
  coachMiniCardBg: '#1E293B',
  coachMiniCardText: '#CBD5E1',

  // Status
  success: '#22FFB0',
  successLight: 'rgba(34, 255, 176, 0.15)',
  warning: '#F59E0B',
  danger: '#EF4444',
  neonGreen: '#22FFB0',
  accentSky: '#38BDF8',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textSubtle: '#CBD5E1',

  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderActive: '#4F7CFF',
  borderFocus: '#4F7CFF',
  borderGlow: '#F59E0B',

  // Tab Bar
  tabBarBg: '#10131D',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',

  // Gradients
  gradientSky: ['#38BDF8', '#0284C7'] as const,
  gradientPurple: ['#8B5CF6', '#6D28D9'] as const,
  gradientFire: ['#F97316', '#EF4444'] as const,
  gradientSuccess: ['#22FFB0', '#16A34A'] as const,
  gradientWarning: ['#F59E0B', '#D97706'] as const,
};

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'light', // Light / Warm Cream is DEFAULT as requested
  setThemeMode: (mode: ThemeMode) => {
    Object.assign(Colors, mode === 'dark' ? DarkColors : LightColors);
    set({ themeMode: mode });
  },
  toggleThemeMode: () =>
    set((state) => {
      const nextMode = state.themeMode === 'light' ? 'dark' : 'light';
      Object.assign(Colors, nextMode === 'dark' ? DarkColors : LightColors);
      return { themeMode: nextMode };
    }),
}));

/**
 * Convenient React hook for consuming active colors and toggling themes
 */
export const useTheme = () => {
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleThemeMode = useThemeStore((state) => state.toggleThemeMode);

  const isDark = themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return {
    themeMode,
    isDark,
    colors,
    setThemeMode,
    toggleThemeMode,
  };
};
