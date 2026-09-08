import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { useTheme } from '../../stores/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'surface' | 'glow' | 'accent' | 'danger';
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 16,
}) => {
  const { colors, isDark } = useTheme();

  const getBorderColor = () => {
    switch (variant) {
      case 'glow':
        return colors.borderActive;
      case 'accent':
        return colors.borderGlow;
      case 'danger':
        return 'rgba(239, 68, 68, 0.4)';
      default:
        return colors.border;
    }
  };

  const flatStyle = StyleSheet.flatten(style) || {};
  let resolvedBg = flatStyle.backgroundColor;
  // If no background specified or in dark mode with static light/card colors, resolve dynamically
  if (
    !resolvedBg ||
    (isDark &&
      (resolvedBg === '#FFFFFF' ||
        resolvedBg === '#ffffff' ||
        resolvedBg === '#fff' ||
        resolvedBg === '#F7F5EE' ||
        resolvedBg === Colors.cardBackground ||
        resolvedBg === Colors.surface ||
        resolvedBg === Colors.background))
  ) {
    resolvedBg = variant === 'surface' ? colors.surfaceSecondary : colors.cardBackground;
  }

  let resolvedBorder = flatStyle.borderColor;
  if (
    !resolvedBorder ||
    (isDark &&
      (resolvedBorder === '#E8E5DD' ||
        resolvedBorder === '#F0EEE6' ||
        resolvedBorder === '#E5E7EB' ||
        resolvedBorder === Colors.border))
  ) {
    resolvedBorder = getBorderColor();
  }

  const combinedStyle: StyleProp<ViewStyle> = [
    styles.card,
    style,
    {
      backgroundColor: resolvedBg,
      borderColor: resolvedBorder,
      padding: flatStyle.padding !== undefined ? flatStyle.padding : padding,
    },
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={combinedStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={combinedStyle}>{children}</View>;
};

export const Card = GlassCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  surfaceCard: {
    backgroundColor: Colors.surfaceSecondary,
  },
});
