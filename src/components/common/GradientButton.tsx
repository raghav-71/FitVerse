import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: readonly [string, string, ...string[]];
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'success' | 'fire' | 'outline' | 'glass' | 'sky' | 'purple' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  colors,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  variant = 'primary',
  size = 'md',
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onPress();
  };

  const getGradientColors = () => {
    if (colors) return colors;
    switch (variant) {
      case 'sky':
        return Colors.gradientSky;
      case 'purple':
        return Colors.gradientPurple;
      case 'gold':
        return ['#D8A928', '#C2931A'] as const;
      case 'success':
        return Colors.gradientSuccess;
      case 'fire':
        return Colors.gradientFire;
      case 'outline':
        return ['transparent', 'transparent'] as const;
      case 'glass':
        return ['rgba(30, 63, 36, 0.08)', 'rgba(30, 63, 36, 0.04)'] as const;
      default:
        return Colors.gradientPrimary;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 40;
      case 'lg':
        return 54;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 16;
      default:
        return 15;
    }
  };

  const getOutlineColor = () => {
    if (variant === 'purple') return Colors.primaryViolet;
    return Colors.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.touchable,
        variant === 'outline' && [styles.outlineButton, { borderColor: getOutlineColor() }],
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          { height: getHeight() },
          variant === 'outline' && { backgroundColor: 'transparent' },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                { fontSize: getFontSize() },
                variant === 'outline' && { color: getOutlineColor() },
                icon ? { marginLeft: 8 } : null,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#18261A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
});
