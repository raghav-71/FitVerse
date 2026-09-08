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
  Activity,
  BatteryCharging,
  Zap,
  Flame,
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

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'ActivityLevel'>;

interface ActivityOption {
  id: string;
  title: string;
  frequency: string;
  description: string;
  icon: (color: string, size: number) => React.ReactNode;
}

const ACTIVITY_LEVELS: ActivityOption[] = [
  {
    id: 'Sedentary',
    title: 'Sedentary',
    frequency: '0 – 1 sessions/week',
    description: 'Desk-focused routine. Starting fresh with low joint impact.',
    icon: (color, size) => <BatteryCharging size={size} color={color} />,
  },
  {
    id: 'Lightly Active',
    title: 'Lightly Active',
    frequency: '1 – 2 sessions/week',
    description: 'Casual walks and occasional training. Building baseline stamina.',
    icon: (color, size) => <Activity size={size} color={color} />,
  },
  {
    id: 'Moderately Active',
    title: 'Moderately Active',
    frequency: '3 – 5 sessions/week',
    description: 'Regular gym training or sports. Ready for standard tempo cues.',
    icon: (color, size) => <Zap size={size} color={color} />,
  },
  {
    id: 'Very Active',
    title: 'Very Active',
    frequency: '6+ sessions/week',
    description: 'Athletic intensity. High volume, strict depth validation.',
    icon: (color, size) => <Flame size={size} color={color} />,
  },
];

export const ActivityLevelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const currentLevel = useAuthStore((state) => state.activityLevel);
  const setActivityLevel = useAuthStore((state) => state.setActivityLevel);

  const [selected, setSelected] = useState<string>(
    currentLevel || 'Moderately Active'
  );

  const handleSelect = (id: string) => {
    setSelected(id);
    setActivityLevel(id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleContinue = () => {
    if (!selected) return;
    setActivityLevel(selected);
    navigation.navigate('SafetyScreening');
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header with Progress Bar */}
        <View style={styles.topSection}>
          <View style={styles.badgeRow}>
            <Badge label="CALIBRATION 2 OF 3" variant="warning" />
            <Badge label="ONBOARDING" variant="neutral" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Baseline Activity Level</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            How frequently do you currently exercise? We calibrate starting set volume and AI rep velocity thresholds to your conditioning.
          </Text>
          <ProgressBar progress={0.66} color={Colors.warning} />
        </View>

        {/* Vertical List of Activity Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {ACTIVITY_LEVELS.map((item) => {
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
                    borderColor: colors.gold,
                    backgroundColor: isDark ? 'rgba(255, 176, 32, 0.12)' : 'rgba(255, 176, 32, 0.08)',
                  },
                ]}
              >
                {isSelected && (
                  <LinearGradient
                    colors={['rgba(255, 176, 32, 0.12)', 'rgba(79, 124, 255, 0.06)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
                    isSelected && styles.iconWrapSelected,
                  ]}
                >
                  {item.icon(isSelected ? Colors.warning : colors.textSecondary, 24)}
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Badge label={item.frequency} variant="neutral" size="sm" />
                  </View>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>

                <View style={styles.radioContainer}>
                  {isSelected ? (
                    <CheckCircle size={20} color={Colors.warning} />
                  ) : (
                    <View style={[styles.unselectedRadio, { borderColor: colors.border }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Continue Button */}
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
  listContainer: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.prepCardBg,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardTitleSelected: {
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  radioContainer: {
    paddingLeft: 4,
  },
  unselectedRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  bottomSection: {
    paddingTop: 12,
  },
});
