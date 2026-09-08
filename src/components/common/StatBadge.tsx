import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../theme/colors';

interface StatBadgeProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'streak' | 'xp' | 'coins' | 'level' | 'default';
  style?: StyleProp<ViewStyle>;
}

export const StatBadge: React.FC<StatBadgeProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'streak':
        return {
          backgroundColor: '#FFF2EB',
          borderColor: '#FFD7C2',
          textColor: '#E5531B',
        };
      case 'xp':
        return {
          backgroundColor: '#FFF8E6',
          borderColor: '#FBE29F',
          textColor: '#B8820A',
        };
      case 'coins':
        return {
          backgroundColor: '#FFF9E6',
          borderColor: '#FCE5A4',
          textColor: '#C57E00',
        };
      case 'level':
        return {
          backgroundColor: '#F5F0FF',
          borderColor: '#E2D4FF',
          textColor: Colors.primaryViolet,
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderColor: Colors.borderSubtle,
          textColor: Colors.textPrimary,
        };
    }
  };

  const badgeConfig = getBadgeStyle();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: badgeConfig.backgroundColor,
          borderColor: badgeConfig.borderColor,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.valueText, { color: badgeConfig.textColor }]}>{value}</Text>
      {label ? <Text style={styles.labelText}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  iconWrapper: {
    marginRight: 6,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  labelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
});
