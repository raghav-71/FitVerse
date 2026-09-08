import { TextStyle, Platform } from 'react-native';

const FONT_SANS = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

const FONT_MEDIUM = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'sans-serif',
});

export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FONT_SANS,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FONT_SANS,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: FONT_SANS,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FONT_SANS,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  caption: {
    fontFamily: FONT_SANS,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  fontFamily: {
    sans: FONT_SANS,
    medium: FONT_MEDIUM,
  } as any,
};
