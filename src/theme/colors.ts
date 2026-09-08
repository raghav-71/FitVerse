export const Colors = {
  // Core Backgrounds (warm cream & crisp white cards from screenshot)
  background: '#F7F5EE',            // Warm ivory/cream background exactly matching screenshots
  surface: '#FFFFFF',               // Crisp white card surface
  surfaceSecondary: '#F3F5F7',      // Soft light gray sub-surface / tile background
  cardBackground: '#FFFFFF',        // Standard white card background

  // Top Forest Green Header Bar & Accents (matching screenshot top bar)
  headerForest: '#162E1C',          // Deep luxury forest green top card (#162E1C)
  headerForestDark: '#112416',
  headerForestText: '#FFFFFF',
  headerForestSub: '#B3C7B6',       // Soft sage text
  primaryForest: '#18331E',          // Deep forest green button & modal titles ("View plan", "Exercise Tracker")

  // Primary Action Colors (Sky Blue from Exercise & Water modals)
  primary: '#2B8FF4',               // Vibrant Sky Blue ("Log Exercise", "+ Add one glass")
  primaryDark: '#1E75D8',
  primaryLight: '#EDF4FC',          // Light cyan-blue container
  primaryGradient: ['#2B8FF4', '#1E75D8'] as const,
  gradientPrimary: ['#2B8FF4', '#1E75D8'] as const,

  // Golden / Mustard Accent (Active "Home" tab, "PRO" badge, streak flame, Day 90 button)
  gold: '#DFAB24',                  // Mustard gold from active Home tab and PRO badge
  accentGold: '#DFAB24',
  goldLight: '#FFF5D6',
  badgeGold: '#F0BF38',
  tabActiveGold: '#DFAB24',

  // Royal Purple Accent (Weight tracker numbers "53.1 kg", minus/plus stepper, View Progress)
  royalPurple: '#3B1F8C',           // Deep royal purple from Weight Tracker
  purpleLight: '#F3EEFF',
  purpleSlider: '#8B5CF6',
  primaryViolet: '#3B1F8C',

  // Tonight's Prep Warm Golden-Cream Card
  prepCardBg: '#FFF9E6',            // Soft butter/cream background
  prepCardBorder: '#F5E5B8',        // Warm golden border
  prepCardTitle: '#7C5315',         // Olive/amber title text
  prepCardBody: '#423724',          // Warm dark brown body text
  coachMiniCardBg: '#EBF3EA',       // Soft sage background
  coachMiniCardText: '#2E3A2E',
  cardPrepBorder: '#F5E5B8',
  cardPrepText: '#7C5315',
  cardSageBorder: '#CFE4CE',
  cardSageText: '#276738',

  // Status & Accents
  success: '#276738',               // Deep botanical leaf green
  successLight: '#EBF3EA',
  warning: '#DFAB24',               // Warm mustard gold
  danger: '#EF4444',                // Bright alert red (coach notification badge)
  neonGreen: '#276738',
  accentSky: '#38BDF8',             // Water droplet cyan

  // Aliases for game & biomechanic states
  safe: '#276738',
  caution: '#DFAB24',
  block: '#EF4444',

  // Typography
  textPrimary: '#1A1C1E',           // Rich dark charcoal text
  textSecondary: '#6B7280',         // Medium neutral gray
  textMuted: '#9CA3AF',             // Light neutral gray
  textSubtle: '#4B5563',
  textTertiary: '#6B7280',

  // Borders & Dividers
  border: '#E8E5DD',                // Subtle warm card border
  borderSubtle: '#F0EEE6',          // Soft divider border
  borderActive: '#2B8FF4',          // Active border blue
  borderFocus: '#2B8FF4',
  borderGlow: '#DFAB24',            // Gold glow

  // Additional Gradients & Cloned Tokens
  backgroundDark: '#162E1C',
  backgroundDarkCard: '#18331E',
  gradientDarkCard: ['#162E1C', '#1E3A24'] as const,
  gradientSky: ['#38BDF8', '#0284C7'] as const,
  gradientPurple: ['#3B1F8C', '#6D28D9'] as const,
  gradientFire: ['#F97316', '#EF4444'] as const,
  gradientSuccess: ['#276738', '#162E1C'] as const,
  gradientWarning: ['#DFAB24', '#B45309'] as const,
};

export type ColorTheme = typeof Colors;
