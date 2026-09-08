import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../theme/colors';
import { useTheme } from '../../../stores/themeStore';

interface TabOption<T extends string> {
  key: T;
  label: string;
  badgeCount?: number | string;
}

interface SegmentedTabControlProps<T extends string> {
  options: TabOption<T>[];
  selectedTab: T;
  onSelectTab: (tab: T) => void;
  size?: 'md' | 'sm';
}

export function SegmentedTabControl<T extends string>({
  options,
  selectedTab,
  onSelectTab,
  size = 'md',
}: SegmentedTabControlProps<T>) {
  const { colors } = useTheme();

  const handlePress = (tabKey: T) => {
    if (tabKey !== selectedTab) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      onSelectTab(tabKey);
    }
  };

  const isSmall = size === 'sm';

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }, isSmall && styles.containerSmall]}>
      {options.map((opt) => {
        const isSelected = selectedTab === opt.key;

        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.8}
            onPress={() => handlePress(opt.key)}
            style={[styles.tabButton, isSmall && styles.tabButtonSmall]}
          >
            {isSelected && (
              <LinearGradient
                colors={colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text
              style={[
                styles.tabLabel,
                isSmall && styles.tabLabelSmall,
                isSelected ? styles.tabLabelSelected : [styles.tabLabelUnselected, { color: colors.textSecondary }],
              ]}
            >
              {opt.label}
            </Text>
            {opt.badgeCount !== undefined && opt.badgeCount !== '' && (
              <View
                style={[
                  styles.badgeCircle,
                  isSelected ? styles.badgeSelected : styles.badgeUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isSelected ? styles.badgeTextSelected : [styles.badgeTextUnselected, { color: colors.textSecondary }],
                  ]}
                >
                  {opt.badgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  containerSmall: {
    padding: 3,
    borderRadius: 18,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    gap: 6,
  },
  tabButtonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabLabelUnselected: {
    color: Colors.textSecondary,
  },
  badgeCircle: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextSelected: {
    color: '#FFFFFF',
  },
  badgeTextUnselected: {
    color: Colors.textSecondary,
  },
});
