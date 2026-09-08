import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  ShieldCheck,
  Trophy,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Globe,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../stores/languageStore';
import { useTheme } from '../../stores/themeStore';
import { LanguageSelectorModal } from '../../components/common/LanguageSelectorModal';

interface SlideItem {
  id: string;
  badge: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'gold';
  title: string;
  highlightText: string;
  description: string;
  icon: (color: string, size: number) => React.ReactNode;
  accentColor: string;
  gradient: readonly [string, string];
}

// Modular/extensible slide configuration
export const ONBOARDING_SLIDES_CONFIG: SlideItem[] = [
  {
    id: 'slide_mirror',
    badge: 'COMPUTER VISION',
    badgeVariant: 'primary',
    title: 'AI Fitness Mirror',
    highlightText: 'Real-Time Kinetic Coaching',
    description:
      'Train in front of your camera. Real-time 17-point pose estimation monitors joint alignment, rep cadence, and validates squat depth.',
    icon: (color, size) => <Camera size={size} color={color} />,
    accentColor: Colors.primary,
    gradient: Colors.primaryGradient,
  },
  {
    id: 'slide_injury',
    badge: 'BIO-MECHANICAL SAFETY',
    badgeVariant: 'success',
    title: 'Zero Injury Risk',
    highlightText: 'Automated Form Protection',
    description:
      'Input joint history or daily soreness. FitVerse automatically gates risky movements, adapting rep targets to preserve tendon longevity.',
    icon: (color, size) => <ShieldCheck size={size} color={color} />,
    accentColor: Colors.success,
    gradient: Colors.gradientSuccess,
  },
  {
    id: 'slide_gamification',
    badge: 'COMPETITIVE ARENA',
    badgeVariant: 'gold',
    title: 'Gamified Progress',
    highlightText: 'Earn XP, Coins & Climb Ranks',
    description:
      'Every validated repetition awards XP and kinetic coins. Level up your avatar, unlock legendary badges, and duel rivals on the leaderboard.',
    icon: (color, size) => <Trophy size={size} color={color} />,
    accentColor: Colors.warning,
    gradient: Colors.gradientWarning,
  },
  {
    id: 'slide_prediction',
    badge: 'NEURAL FORECASTING',
    badgeVariant: 'primary',
    title: 'Transformation Predictor',
    highlightText: 'See Your Future Physique',
    description:
      'Predict your 30, 60, and 90-day muscular hypertrophy and metabolic fat loss trajectory with predictive regression analytics.',
    icon: (color, size) => <TrendingUp size={size} color={color} />,
    accentColor: Colors.primaryViolet,
    gradient: Colors.primaryGradient,
  },
];

export const OnboardingSlides: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const setHasSeenSlides = useAuthStore((state) => state.setHasSeenSlides);
  const { t, currentOption } = useTranslation();

  // Responsive width calculation that respects mobile viewports and Web 480px maxWidth
  const { width: windowWidth } = useWindowDimensions();
  const maxContentWidth = 480 - 32; // ScreenContainer padding is 16 on each side
  const defaultSlideWidth = Math.min(windowWidth - 32, maxContentWidth);
  const [slideWidth, setSlideWidth] = useState<number>(defaultSlideWidth > 0 ? defaultSlideWidth : 340);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const itemWidth = slideWidth > 0 ? slideWidth : 340;
    const index = Math.round(scrollOffset / itemWidth);
    if (index !== currentIndex && index >= 0 && index < ONBOARDING_SLIDES_CONFIG.length) {
      setCurrentIndex(index);
    }
  };

  const handleFinish = () => {
    setHasSeenSlides(true);
    navigation.navigate('Register');
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES_CONFIG.length - 1) {
      const nextIdx = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIdx * slideWidth,
        animated: true,
      });
      setCurrentIndex(nextIdx);
    } else {
      handleFinish();
    }
  };

  const { colors, isDark } = useTheme();
  const isLast = currentIndex === ONBOARDING_SLIDES_CONFIG.length - 1;

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Top Bar with Language Selector & Skip */}
        <View style={styles.topBar}>
          <View style={[styles.brandChip, { backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : '#EDF4FC', borderColor: colors.border }]}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={[styles.brandText, { color: colors.primary }]}>FITVERSE AI</Text>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowLanguageModal(true)}
              style={[styles.langPill, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            >
              <Globe size={13} color={colors.primary} />
              <Text style={[styles.langPillText, { color: colors.textPrimary }]}>{currentOption.label}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFinish}
              style={styles.skipButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('skip')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carousel Container with Dynamic onLayout Width Measurement */}
        <View
          style={styles.carouselContainer}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - slideWidth) > 1) {
              setSlideWidth(w);
            }
          }}
        >
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_SLIDES_CONFIG}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={slideWidth}
            snapToAlignment="center"
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={[styles.slideItem, { width: slideWidth }]}>
                {/* Illustration Circle */}
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconCircle}
                >
                  {item.icon('#FFFFFF', 44)}
                </LinearGradient>

                {/* Badges & Titles */}
                <View style={styles.textContainer}>
                  <Badge label={item.badge} variant={item.badgeVariant} />
                  <Text style={[styles.headline, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.subHeadline, { color: colors.primary }]}>{item.highlightText}</Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Bottom Navigation Row */}
        <View style={styles.bottomControls}>
          {/* Pagination Indicator Dots */}
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES_CONFIG.map((_, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => {
                  flatListRef.current?.scrollToOffset({
                    offset: i * slideWidth,
                    animated: true,
                  });
                  setCurrentIndex(i);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View
                  style={[
                    styles.dot,
                    i === currentIndex ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Next / Get Started Action */}
          <GradientButton
            title={isLast ? (t('getStarted') || 'Get Started') : (t('continue') || 'Continue')}
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={handleNext}
            fullWidth
          />
        </View>

        {/* Language Selector Modal */}
        <LanguageSelectorModal
          visible={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E0D2',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF4FC',
    borderWidth: 1,
    borderColor: '#D3E7FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  carouselContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  slideItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 22,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  subHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomControls: {
    gap: 20,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#D1CCBF', // Warm visible dot on cream background
  },
});
