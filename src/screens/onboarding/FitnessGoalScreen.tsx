import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Flame,
  Dumbbell,
  Zap,
  Heart,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer, GradientButton, Badge, ProgressBar } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'FitnessGoal'>;

interface GoalOption {
  id: string;
  title: string;
  subtitle: string;
  icon: (color: string, size: number) => React.ReactNode;
}

const GOALS: GoalOption[] = [
  {
    id: 'Build Muscle',
    title: 'Build Muscle',
    subtitle: 'Hypertrophy & progressive overload',
    icon: (color, size) => <Dumbbell size={size} color={color} />,
  },
  {
    id: 'Lose Weight',
    title: 'Lose Weight',
    subtitle: 'Caloric burn & high-tempo reps',
    icon: (color, size) => <Flame size={size} color={color} />,
  },
  {
    id: 'Improve Endurance',
    title: 'Endurance',
    subtitle: 'Aerobic threshold & stamina',
    icon: (color, size) => <Zap size={size} color={color} />,
  },
  {
    id: 'General Fitness',
    title: 'General Fitness',
    subtitle: 'Mobility, agility & daily energy',
    icon: (color, size) => <Heart size={size} color={color} />,
  },
  {
    id: 'Injury Recovery',
    title: 'Injury Recovery',
    subtitle: 'Corrective kinematics & gentle rehab',
    icon: (color, size) => <ShieldCheck size={size} color={color} />,
  },
];

export const FitnessGoalScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const currentGoal = useAuthStore((state) => state.selectedGoal);
  const setGoal = useAuthStore((state) => state.setGoal);

  const [selected, setSelected] = useState<string>(currentGoal || 'Build Muscle');

  const handleSelect = (id: string) => {
    setSelected(id);
    setGoal(id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleContinue = () => {
    if (!selected) return;
    setGoal(selected);
    navigation.navigate('ActivityLevel');
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Progress header */}
        <View style={styles.topSection}>
          <View style={styles.badgeRow}>
            <Badge label="CALIBRATION 1 OF 3" variant="primary" />
            <Badge label="ONBOARDING" variant="neutral" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Primary Fitness Focus</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            What is your core objective? FitVerse AI will tune camera rep-pacing and form threshold algorithms accordingly.
          </Text>
          <ProgressBar progress={0.33} />
        </View>

        {/* 2-Column Grid of Goal Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
        >
          {GOALS.map((item) => {
            const isSelected = selected === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.85}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                  isSelected && {
                    borderColor: colors.primary,
                    backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : 'rgba(79, 124, 255, 0.08)',
                  },
                ]}
              >
                {isSelected && (
                  <LinearGradient
                    colors={['rgba(79, 124, 255, 0.15)', 'rgba(168, 85, 247, 0.08)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
                      isSelected && styles.iconWrapSelected,
                    ]}
                  >
                    {item.icon(isSelected ? colors.primary : colors.textSecondary, 24)}
                  </View>
                  {isSelected && (
                    <CheckCircle size={18} color={Colors.success} />
                  )}
                </View>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomSection}>
          <GradientButton
            title="Continue"
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={handleContinue}
            disabled={!selected}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  topSection: {
    gap: 8,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(79, 124, 255, 0.15)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  cardTitleSelected: {
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bottomSection: {
    paddingTop: 12,
  },
});
