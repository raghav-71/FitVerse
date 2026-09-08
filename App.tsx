import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet, Platform } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme';

import { useTheme } from './src/stores/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function MainAppShell() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <MainAppShell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 680,
          width: '100%',
          marginHorizontal: 'auto' as any,
          height: '100%',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 25,
        }
      : {}),
  },
});
