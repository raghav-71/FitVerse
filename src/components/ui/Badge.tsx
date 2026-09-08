import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gold' | 'outline' | 'neutral';
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  size = 'md',
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'neutral':
        return {
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.15)',
          text: Colors.textSecondary,
        };
      case 'success':
        return {
          bg: 'rgba(34, 255, 176, 0.15)',
          border: 'rgba(34, 255, 176, 0.35)',
          text: Colors.success,
        };
      case 'warning':
        return {
          bg: 'rgba(255, 176, 32, 0.15)',
          border: 'rgba(255, 176, 32, 0.35)',
          text: Colors.warning,
        };
      case 'danger':
        return {
          bg: 'rgba(255, 77, 77, 0.15)',
          border: 'rgba(255, 77, 77, 0.35)',
          text: Colors.danger,
        };
      case 'gold':
        return {
          bg: 'rgba(251, 191, 36, 0.2)',
          border: 'rgba(251, 191, 36, 0.5)',
          text: '#FCD34D',
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: Colors.border,
          text: Colors.textSecondary,
        };
      default:
        return {
          bg: 'rgba(79, 124, 255, 0.15)',
          border: 'rgba(79, 124, 255, 0.35)',
          text: Colors.primary,
        };
    }
  };

  const current = getBadgeStyle();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          paddingHorizontal: isSm ? 6 : 10,
          paddingVertical: isSm ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: current.text, fontSize: isSm ? 9 : 11 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
