import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ShieldCheck, Trophy, Sparkles, ArrowRight } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { GradientButton } from '../../components/common/GradientButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'AI Pose & Form Mirror',
    subtitle: 'Real-time biomechanics feedback and rep accuracy via computer vision.',
    icon: Camera,
    gradient: Colors.gradientPrimary,
    badge: 'VISION AI ENGINE',
    highlight: '98%+ Form Precision',
  },
  {
    id: '2',
    title: 'Injury Prevention Coach',
    subtitle: 'Adaptive safety screening and automatic exercise substitutions before injury occurs.',
    icon: ShieldCheck,
    gradient: Colors.gradientSuccess,
    badge: 'ZERO-INJURY PROTOCOL',
    highlight: 'Intelligent Risk Shield',
  },
  {
    id: '3',
    title: 'Gamified Fitness World',
    subtitle: 'Earn XP, fit coins, level up, maintain fiery streaks, and climb the national arena.',
    icon: Trophy,
    gradient: ['#FF6B00', '#A855F7'] as const,
    badge: 'AAA RPG FITNESS',
    highlight: 'Unlock Epic Trophies',
  },
];

interface OnboardingCarouselScreenProps {
  onFinish: () => void;
}

export const OnboardingCarouselScreen: React.FC<OnboardingCarouselScreenProps> = ({
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const slide = SLIDES[currentIndex];
  const IconComponent = slide.icon;

  return (
    <View style={styles.container}>
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.badgePill}>
          <Sparkles size={13} color={Colors.neonGreen} />
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={onFinish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Visual Card */}
      <View style={styles.visualContainer}>
        <LinearGradient
          colors={slide.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCircle}
        >
          <IconComponent size={64} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.highlightPill}>
          <Text style={styles.highlightText}>⚡ {slide.highlight}</Text>
        </View>
      </View>

      {/* Slide Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <GradientButton
          title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F7F5EE
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CFE4CE',
    gap: 6,
  },
  badgeText: {
    color: Colors.neonGreen,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  heroCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  highlightPill: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  highlightText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 24,
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1CCBF',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
});
