import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingSlides } from '../screens/onboarding/OnboardingSlides';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../stores/themeStore';

export type AuthStackParamList = {
  OnboardingSlides: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  const hasSeenSlides = useAuthStore((state) => state.hasSeenSlides);
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={hasSeenSlides ? 'Login' : 'OnboardingSlides'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="OnboardingSlides" component={OnboardingSlides} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};
