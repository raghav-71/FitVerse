import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  OnboardingCarousel: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  GoalSelection: undefined;
  SafetyScreening: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  InjuryCoach: undefined;
  Predictor: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  AIWorkout: undefined;
  Challenges: undefined;
  Progress: undefined;
  Profile: undefined;
};
