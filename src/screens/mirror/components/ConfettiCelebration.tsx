import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  Colors.primary,
  Colors.primaryViolet,
  Colors.success,
  Colors.warning,
  Colors.accentSky,
  '#FFFFFF',
];

interface Particle {
  id: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
  dx: number;
  dy: number;
  rotSpeed: number;
  anim: Animated.Value;
}

export const ConfettiCelebration: React.FC = () => {
  const particlesRef = useRef<Particle[]>([]);

  if (particlesRef.current.length === 0) {
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 80 + Math.random() * 220;
      particlesRef.current.push({
        id: i,
        startX: SCREEN_WIDTH / 2 + (Math.random() * 40 - 20),
        startY: SCREEN_HEIGHT * 0.35 + (Math.random() * 40 - 20),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 7 + Math.random() * 6,
        shape: i % 2 === 0 ? 'rect' : 'circle',
        dx: Math.cos(angle) * velocity,
        dy: Math.sin(angle) * velocity - 120, // initial upward blast
        rotSpeed: (Math.random() - 0.5) * 720,
        anim: new Animated.Value(0),
      });
    }
  }

  useEffect(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const animations = particlesRef.current.map((p) =>
      Animated.timing(p.anim, {
        toValue: 1,
        duration: 2200 + Math.random() * 600,
        useNativeDriver: true,
      })
    );

    Animated.stagger(15, animations).start();
  }, []);

  return (
    <View pointerEvents="none" style={styles.container}>
      {particlesRef.current.map((p) => {
        const translateX = p.anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [p.startX, p.startX + p.dx * 0.7, p.startX + p.dx + (Math.random() * 40 - 20)],
        });

        const translateY = p.anim.interpolate({
          inputRange: [0, 0.35, 1],
          outputRange: [p.startY, p.startY + p.dy, p.startY + 400 + Math.random() * 200],
        });

        const rotate = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotSpeed}deg`],
        });

        const opacity = p.anim.interpolate({
          inputRange: [0, 0.1, 0.75, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        const scale = p.anim.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0.3, 1.2, 0.7],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.shape === 'rect' ? p.size * 1.6 : p.size,
                borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
                backgroundColor: p.color,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
