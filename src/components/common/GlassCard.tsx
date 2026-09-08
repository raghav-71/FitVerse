import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { useTheme } from '../../stores/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'glow' | 'accent' | 'warning' | 'neon' | 'dark' | 'prep' | 'sage' | 'sky' | 'purple';
  gradientColors?: readonly [string, string, ...string[]];
  borderGlowColor?: string;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  gradientColors,
  borderGlowColor,
  padding = 16,
}) => {
  const { colors, isDark } = useTheme();

  const getGradient = () => {
    if (gradientColors) return gradientColors;
    switch (variant) {
      case 'dark':
        return isDark ? (['#10151E', '#162030'] as const) : Colors.gradientDarkCard;
      case 'prep':
      case 'warning':
        return isDark ? (['#1C1917', '#292524'] as const) : (['#FFF9E6', '#FFF8E1'] as const);
      case 'sage':
        return isDark ? (['#132418', '#1A3322'] as const) : (['#EBF3EA', '#E7EFE6'] as const);
      case 'sky':
        return isDark ? (['#0E1E33', '#132B4A'] as const) : (['#F0F8FF', '#E6F4FF'] as const);
      case 'purple':
        return isDark ? (['#1F1635', '#2B1E4A'] as const) : (['#F7F3FF', '#EFE8FF'] as const);
      case 'glow':
        return isDark ? ([colors.cardBackground, '#182236'] as const) : (['#FFFFFF', '#FAF8F4'] as const);
      case 'accent':
        return isDark ? ([colors.cardBackground, '#1C2030'] as const) : (['#FFFFFF', '#FFFDF9'] as const);
      case 'neon':
        return isDark ? (['#11261B', '#163524'] as const) : (['#F2F8F2', '#EAF3EA'] as const);
      default:
        return [colors.cardBackground, colors.cardBackground] as const;
    }
  };

  const getBorderColor = () => {
    if (borderGlowColor) return borderGlowColor;
    switch (variant) {
      case 'dark':
        return isDark ? colors.border : '#254B2B';
      case 'prep':
      case 'warning':
        return colors.prepCardBorder;
      case 'sage':
        return isDark ? colors.border : Colors.cardSageBorder;
      case 'sky':
        return isDark ? 'rgba(56, 189, 248, 0.4)' : '#B3D8FF';
      case 'purple':
        return isDark ? 'rgba(139, 92, 246, 0.4)' : '#D4BFFF';
      case 'glow':
        return colors.neonGreen;
      case 'accent':
        return colors.accentGold;
      case 'neon':
        return colors.neonGreen;
      default:
        return colors.border;
    }
  };

  const flatStyle = StyleSheet.flatten(style) || {};
  let resolvedBg = flatStyle.backgroundColor;
  if (
    !resolvedBg ||
    (isDark &&
      (resolvedBg === '#FFFFFF' ||
        resolvedBg === '#ffffff' ||
        resolvedBg === '#fff' ||
        resolvedBg === '#F7F5EE' ||
        resolvedBg === Colors.cardBackground ||
        resolvedBg === Colors.surface))
  ) {
    resolvedBg = colors.cardBackground;
  }

  const content = (
    <LinearGradient
      colors={getGradient()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.innerGradient,
        {
          borderColor: getBorderColor(),
          padding,
        },
      ]}
    >
      {children}
    </LinearGradient>
  );

  const wrapperStyle = [
    styles.cardWrapper,
    { backgroundColor: resolvedBg },
    variant === 'dark' && styles.cardWrapperDark,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={wrapperStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={wrapperStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardWrapperDark: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  innerGradient: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.2,
  },
});
