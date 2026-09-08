import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Camera, Trophy, BarChart3, User, MessageSquare, Play, ClipboardList, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? '#FFFFFF' : '#8E928A';
    const size = 20;

    switch (routeName) {
      case 'Home':
        return <Home size={size} color={color} />;
      case 'AIWorkout':
        return <Camera size={size} color={color} />;
      case 'Challenges':
        return <Trophy size={size} color={color} />;
      case 'Progress':
        return <BarChart3 size={size} color={color} />;
      case 'Profile':
        return <User size={size} color={color} />;
      default:
        return <Home size={size} color={color} />;
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Challenges':
        return 'Quests';
      case 'AIWorkout':
        return 'Mirror';
      case 'Progress':
        return 'Health';
      case 'Profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              onPress={onPress}
              style={styles.tabItemWrapper}
            >
              {isFocused ? (
                <View style={styles.activePill}>
                  {getIcon(route.name, true)}
                  <Text style={styles.activeLabel}>{getLabel(route.name)}</Text>
                </View>
              ) : (
                <View style={styles.inactiveItem}>
                  {getIcon(route.name, false)}
                  <Text style={styles.inactiveLabel}>{getLabel(route.name)}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    shadowColor: '#18261A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItemWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  activePill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentGold, // #D8A928 golden mustard
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 64,
    shadowColor: Colors.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  inactiveItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E928A',
    marginTop: 3,
  },
});
