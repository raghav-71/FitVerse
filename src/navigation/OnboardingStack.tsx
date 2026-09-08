import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FitnessGoalScreen } from '../screens/onboarding/FitnessGoalScreen';
import { ActivityLevelScreen } from '../screens/onboarding/ActivityLevelScreen';
import { SafetyScreeningScreen } from '../screens/onboarding/SafetyScreeningScreen';
import { useTheme } from '../stores/themeStore';

export type OnboardingStackParamList = {
  FitnessGoal: undefined;
  ActivityLevel: undefined;
  SafetyScreening: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStack: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="FitnessGoal"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="FitnessGoal" component={FitnessGoalScreen} />
      <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
      <Stack.Screen name="SafetyScreening" component={SafetyScreeningScreen} />
    </Stack.Navigator>
  );
};
