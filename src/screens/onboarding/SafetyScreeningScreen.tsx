import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HeartCrack,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GradientButton, Badge, ProgressBar } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

interface BodyArea {
  id: string;
  name: string;
}

const BODY_AREAS: BodyArea[] = [
  { id: 'Knee', name: 'Right / Left Knee' },
  { id: 'Shoulder', name: 'Shoulder Joint' },
  { id: 'Back', name: 'Lower Back / Spine' },
  { id: 'Neck', name: 'Cervical Neck' },
  { id: 'Wrist', name: 'Wrist & Forearm' },
  { id: 'Ankle', name: 'Ankle & Achilles' },
  { id: 'Other', name: 'Other Muscle Area' },
];

type Severity = 'no_pain' | 'previous_injury' | 'current_discomfort';

const SEVERITIES: { id: Severity; label: string; color: string }[] = [
  { id: 'no_pain', label: 'Tension Only', color: Colors.textSecondary },
  { id: 'previous_injury', label: 'Past Injury', color: Colors.warning },
  { id: 'current_discomfort', label: 'Active Discomfort', color: Colors.danger },
];

export const SafetyScreeningScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const selectedAreas = useAuthStore((state) => state.selectedPainAreas);
  const togglePainArea = useAuthStore((state) => state.togglePainArea);
  const safetyConditions = useAuthStore((state) => state.safetyConditions);
  const setSafetyCondition = useAuthStore((state) => state.setSafetyCondition);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const handleToggle = (area: string) => {
    togglePainArea(area);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSeveritySelect = (area: string, sev: Severity) => {
    setSafetyCondition(area, sev);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleFinish = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    completeOnboarding();
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topSection}>
          <View style={styles.badgeRow}>
            <Badge label="CALIBRATION 3 OF 3" variant="success" />
            <Badge label="INJURY PREVENTION" variant="neutral" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Any areas we should be careful with?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select any prior joint strains or current soreness. FitVerse AI automatically adapts form depth limits and safety thresholds.
          </Text>
          <ProgressBar progress={1.0} color={Colors.success} />
        </View>

        {/* Scrollable list of areas and sub-severity pickers */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {BODY_AREAS.map((area) => {
              const isSelected = selectedAreas.includes(area.id);
              const currentSeverity: Severity =
                safetyConditions[area.id] || 'previous_injury';

              return (
                <View
                  key={area.id}
                  style={[
                    styles.areaCard,
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
                  {/* Header chip row */}
                  <TouchableOpacity
                    onPress={() => handleToggle(area.id)}
                    activeOpacity={0.8}
                    style={styles.cardTouchArea}
                  >
                    <View style={styles.areaInfo}>
                      {isSelected ? (
                        <ShieldAlert size={20} color={Colors.warning} />
                      ) : (
                        <ShieldCheck size={20} color={colors.textSecondary} />
                      )}
                      <Text
                        style={[
                          styles.areaName,
                          { color: colors.textPrimary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {area.name}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.toggleBadge,
                        { borderColor: colors.border },
                        isSelected && styles.toggleBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          { color: colors.textSecondary },
                          isSelected && styles.toggleTextActive,
                        ]}
                      >
                        {isSelected ? 'Flagged' : 'Clear'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Sub-selector for severity if selected */}
                  {isSelected && (
                    <View style={[styles.subSelectorContainer, { borderTopColor: colors.border }]}>
                      <Text style={[styles.subSelectorTitle, { color: colors.textSecondary }]}>
                        Condition Status:
                      </Text>
                      <View style={styles.segmentedRow}>
                        {SEVERITIES.map((sev) => {
                          const isSevActive = currentSeverity === sev.id;
                          return (
                            <TouchableOpacity
                              key={sev.id}
                              onPress={() =>
                                handleSeveritySelect(area.id, sev.id)
                              }
                              style={[
                                styles.segmentButton,
                                { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                                isSevActive && {
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                  borderColor: sev.color,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.segmentText,
                                  { color: colors.textSecondary },
                                  isSevActive && {
                                    color: sev.color,
                                    fontWeight: '700',
                                  },
                                ]}
                              >
                                {sev.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomSection}>
          <GradientButton
            title="Finish Setup & Enter Main Arena"
            icon={<CheckCircle2 size={18} color="#FFFFFF" />}
            onPress={handleFinish}
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
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    gap: 12,
  },
  areaCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  areaCardActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.prepCardBg,
  },
  cardTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  areaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  areaName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  areaNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBadgeActive: {
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    borderColor: Colors.warning,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.warning,
    fontWeight: '700',
  },
  subSelectorContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  subSelectorTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingTop: 12,
  },
});
