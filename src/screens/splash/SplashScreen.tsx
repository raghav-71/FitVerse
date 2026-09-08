import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width * 0.88, 360);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial entrance animation: smooth scale + fade-in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing pulse loop for the emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const timer = setTimeout(() => {
      pulseLoop.stop();
      onFinish();
    }, 2200);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Seamless Pure Black Canvas */}
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={require('../../../assets/fitverse_splash.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  splashImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 400,
          maxHeight: 400,
        }
      : {}),
  },
});
