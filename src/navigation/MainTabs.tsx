import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Home as HomeIcon,
  Trophy as TrophyIcon,
  Camera as CameraIcon,
  Activity as ActivityIcon,
  User as UserIcon,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ChallengesScreen as QuestsScreen } from '../screens/challenges/ChallengesScreen';
import { MirrorScreen } from '../screens/mirror/MirrorScreen';
import { ProgressScreen as HealthScreen } from '../screens/progress/ProgressScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { theme } from '../theme';
import { Colors } from '../theme/colors';

import { useTranslation } from '../stores/languageStore';
import { useTheme } from '../stores/themeStore';

export type MainTabsParamList = {
  Home: undefined;
  Quests: undefined;
  Mirror: undefined;
  Health: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

interface TabConfig {
  name: keyof MainTabsParamList;
  icon: (color: string, size: number) => React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    name: 'Home',
    icon: (color, size) => <HomeIcon size={size} color={color} />,
  },
  {
    name: 'Quests',
    icon: (color, size) => <TrophyIcon size={size} color={color} />,
  },
  {
    name: 'Mirror',
    icon: (color, size) => <CameraIcon size={size} color={color} />,
  },
  {
    name: 'Health',
    icon: (color, size) => <ActivityIcon size={size} color={color} />,
  },
  {
    name: 'Profile',
    icon: (color, size) => <UserIcon size={size} color={color} />,
  },
];

const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getTabLabel = (name: string) => {
    switch (name) {
      case 'Home': return t('homeTab') || 'Home';
      case 'Quests': return t('questsTab') || 'Quests';
      case 'Mirror': return t('mirrorTab') || 'Mirror';
      case 'Health': return t('healthTab') || 'Health';
      case 'Profile': return t('profileTab') || 'Profile';
      default: return name;
    }
  };

  return (
    <View style={[styles.bottomBarContainer, { backgroundColor: colors.tabBarBg, borderTopColor: colors.tabBarBorder }]}>
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tabConfig = TABS.find((t) => t.name === route.name) || TABS[0];
          const label = getTabLabel(route.name);

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {isFocused ? (
                <View style={[styles.activePill, { backgroundColor: colors.gold }]}>
                  {tabConfig.icon('#FFFFFF', 15)}
                  <Text numberOfLines={1} style={styles.activeLabel}>{label}</Text>
                </View>
              ) : (
                <View style={styles.inactivePill}>
                  {tabConfig.icon(colors.textSecondary, 18)}
                  <Text numberOfLines={1} style={[styles.inactiveLabel, { color: colors.textSecondary }]}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Quests" component={QuestsScreen} />
      <Tab.Screen name="Mirror" component={MirrorScreen} />
      <Tab.Screen name="Health" component={HealthScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DD',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 8,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: Colors.tabActiveGold,
    shadowColor: Colors.tabActiveGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inactivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  inactiveLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
