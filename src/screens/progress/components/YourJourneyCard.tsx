import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Sparkles, Clock, Camera, Check, ChevronRight, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../theme/colors';
import { useTranslation } from '../../../stores/languageStore';

interface YourJourneyCardProps {
  onSeeDay90?: () => void;
  onAddPhoto?: () => void;
  totalWorkoutMinutes?: number;
  dailyScore?: number;
}

export const YourJourneyCard: React.FC<YourJourneyCardProps> = ({
  onSeeDay90,
  onAddPhoto,
  totalWorkoutMinutes = 250,
  dailyScore,
}) => {
  const { t, num } = useTranslation();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  const workoutHours = Math.floor(totalWorkoutMinutes / 60);
  const workoutMins = totalWorkoutMinutes % 60;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  };

  const handleDay0Press = () => {
    triggerHaptic();
    if (onAddPhoto) {
      onAddPhoto();
    } else {
      setShowPhotoModal(true);
    }
  };

  const handleSeeDay90Press = () => {
    triggerHaptic();
    if (onSeeDay90) {
      onSeeDay90();
    } else {
      setShowPhotoModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Section Header */}
      <View style={styles.topRow}>
        <Text style={styles.sectionLabel}>{t('yourJourney') || 'YOUR JOURNEY'}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSeeDay90Press}
          style={styles.seeDay90Pill}
        >
          <Sparkles size={13} color="#DFAB24" />
          <Text style={styles.seeDay90Text}>{t('seeDay90') || 'See Day 90'}</Text>
        </TouchableOpacity>
      </View>

      {/* Headline & Subtitle */}
      <View style={styles.headlineWrap}>
        <Text style={styles.mainTitle}>{t('meetFutureYou') || 'Meet the future you'}</Text>
        <Text style={styles.subTitle}>
          Add your photo, see your own Day-90 transformation
        </Text>
      </View>

      {/* 4-Stop Transformation Stepper */}
      <View style={styles.stepperContainer}>
        {/* Step 1: Day 0 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDay0Press}
          style={styles.stepColumn}
        >
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            {hasPhoto ? (
              <Check size={18} color="#DFAB24" strokeWidth={3} />
            ) : (
              <Camera size={18} color="#DFAB24" />
            )}
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Day {num(0)}</Text>
          <Text style={styles.stepSublabelActive}>{hasPhoto ? 'added' : 'add photo'}</Text>
        </TouchableOpacity>

        {/* Line 1 */}
        <View style={styles.stepLine} />

        {/* Step 2: Day 30 */}
        <View style={styles.stepColumn}>
          <View style={styles.stepCircleUpcoming}>
            <Text style={styles.stepNumberText}>{num(30)}</Text>
          </View>
          <Text style={styles.stepLabel}>Day {num(30)}</Text>
          <Text style={styles.stepSublabel}>milestone</Text>
        </View>

        {/* Line 2 */}
        <View style={styles.stepLine} />

        {/* Step 3: Day 60 */}
        <View style={styles.stepColumn}>
          <View style={styles.stepCircleUpcoming}>
            <Text style={styles.stepNumberText}>{num(60)}</Text>
          </View>
          <Text style={styles.stepLabel}>Day {num(60)}</Text>
          <Text style={styles.stepSublabel}>progress</Text>
        </View>

        {/* Line 3 */}
        <View style={styles.stepLine} />

        {/* Step 4: Day 90 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSeeDay90Press}
          style={styles.stepColumn}
        >
          <View style={[styles.stepCircleUpcoming, styles.stepCircleGold]}>
            <Sparkles size={16} color="#DFAB24" />
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelGold]}>Day {num(90)}</Text>
          <Text style={styles.stepSublabelGold}>reveal</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Duration / Milestone Pill */}
      <View style={styles.durationPill}>
        <Clock size={15} color="#DFAB24" />
        <Text style={styles.durationPillText}>
          {num(workoutHours)}h {num(workoutMins)}m · {t('totalWorkoutDuration') || 'Total Workout Duration'}
        </Text>
      </View>

      {/* Photo Upload & Day 90 Preview Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowPhotoModal(false)}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.modalIconRing}>
              <Sparkles size={28} color="#DFAB24" />
            </View>

            <Text style={styles.modalHeadline}>90-Day Neural Forecast</Text>
            <Text style={styles.modalBody}>
              Upload a baseline frontal photo to generate your predictive 3D hypertrophy avatar
              and weekly progression milestones.
            </Text>

            <TouchableOpacity
              style={styles.uploadPhotoBtn}
              activeOpacity={0.85}
              onPress={() => {
                setHasPhoto(true);
                setShowPhotoModal(false);
              }}
            >
              <Camera size={18} color="#162E1C" />
              <Text style={styles.uploadPhotoBtnText}>
                {hasPhoto ? 'Photo Uploaded (Tap to Change)' : 'Take or Choose Baseline Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#162E1C', // Deep forest green from screenshot
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#26492C',
    padding: 18,
    gap: 16,
    shadowColor: '#162E1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#98B99D',
    letterSpacing: 0.8,
  },
  seeDay90Pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(223, 171, 36, 0.12)',
    borderWidth: 1,
    borderColor: '#DFAB24',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  seeDay90Text: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DFAB24',
  },
  headlineWrap: {
    gap: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 13,
    color: '#98B99D',
    lineHeight: 18,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  stepColumn: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#26452B',
    borderWidth: 2,
    borderColor: '#DFAB24', // Gold active ring
  },
  stepCircleUpcoming: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#223B28',
    borderWidth: 1,
    borderColor: '#305337',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleGold: {
    borderColor: 'rgba(223, 171, 36, 0.4)',
    backgroundColor: '#2A3C2A',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#98B99D',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#2D5434',
    marginBottom: 26,
    marginHorizontal: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#98B99D',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepLabelGold: {
    color: '#DFAB24',
    fontWeight: '800',
  },
  stepSublabel: {
    fontSize: 10,
    color: '#709174',
    fontWeight: '600',
  },
  stepSublabelActive: {
    fontSize: 10,
    color: '#DFAB24',
    fontWeight: '700',
  },
  stepSublabelGold: {
    fontSize: 10,
    color: '#DFAB24',
    fontWeight: '700',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#102214',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1D3B23',
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  modalIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DFAB24',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    marginTop: 6,
  },
  uploadPhotoBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#162E1C',
  },
});
