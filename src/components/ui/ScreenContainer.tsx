import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../stores/themeStore';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  safeArea = true,
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const ContainerComponent = safeArea ? SafeAreaView : View;

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <ContainerComponent
        style={[
          styles.container,
          { backgroundColor: colors.background },
          isTablet && styles.tabletContainer,
          style,
        ]}
      >
        {children}
      </ContainerComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    width: '100%',
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 640,
          marginHorizontal: 'auto' as any,
        }
      : {}),
  },
  tabletContainer: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
});
