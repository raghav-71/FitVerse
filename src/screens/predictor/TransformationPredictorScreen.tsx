import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Sparkles, AlertCircle, ArrowLeft, CheckCircle2, Shield, Calendar } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/common/GlassCard';
import { HeaderBar } from '../../components/common/HeaderBar';
import { useTransformationPredictor } from '../../services/mock/queries';

interface TransformationPredictorScreenProps {
  navigation: any;
}

export const TransformationPredictorScreen: React.FC<TransformationPredictorScreenProps> = ({
  navigation,
}) => {
  const { data: prediction } = useTransformationPredictor();
  const [selectedDay, setSelectedDay] = useState<30 | 60 | 90 | 180>(60);

  const selectedProjection = prediction?.timeframes.find((t) => t.days === selectedDay) || prediction?.timeframes[0];
  const current = prediction?.currentMetrics || { weightKg: 76.5, bodyFatPct: 19.2, muscleMassKg: 58.4 };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Body Transformation Predictor</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Prominent Science Disclaimer Banner */}
        <GlassCard variant="warning" style={styles.disclaimerBanner}>
          <View style={styles.disclaimerTitleRow}>
            <AlertCircle size={18} color={Colors.caution} />
            <Text style={styles.disclaimerTitle}>AI Scientific Forecast Notice</Text>
          </View>
          <Text style={styles.disclaimerText}>
            {prediction?.disclaimer ||
              'Predictions are calculated by FitVerse Biomechanical AI based on metabolic rate, training frequency, and form score adherence. These are scientific models, not guarantees.'}
          </Text>
        </GlassCard>

        {/* Current Baseline Recap */}
        <GlassCard style={styles.currentCard}>
          <Text style={styles.sectionTitle}>CURRENT BASELINE</Text>
          <View style={styles.baselineRow}>
            <View style={styles.baselineCol}>
              <Text style={styles.baselineVal}>{current.weightKg} kg</Text>
              <Text style={styles.baselineSub}>Body Weight</Text>
            </View>
            <View style={styles.baselineDivider} />
            <View style={styles.baselineCol}>
              <Text style={styles.baselineVal}>{current.bodyFatPct}%</Text>
              <Text style={styles.baselineSub}>Body Fat</Text>
            </View>
            <View style={styles.baselineDivider} />
            <View style={styles.baselineCol}>
              <Text style={styles.baselineVal}>{current.muscleMassKg} kg</Text>
              <Text style={styles.baselineSub}>Lean Mass</Text>
            </View>
          </View>
        </GlassCard>

        {/* Timeframe Selector (30, 60, 90, 180 Days) */}
        <Text style={styles.timelineHeader}>SELECT PROJECTION TIMEFRAME</Text>
        <View style={styles.timelineRow}>
          {([30, 60, 90, 180] as const).map((days) => {
            const isSelected = selectedDay === days;
            return (
              <TouchableOpacity
                key={days}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(days)}
                style={[
                  styles.timelineBtn,
                  isSelected && styles.timelineBtnSelected,
                ]}
              >
                <Text style={[styles.timelineDays, isSelected && styles.timelineDaysSelected]}>
                  {days}d
                </Text>
                <Text style={[styles.timelineSub, isSelected && { color: '#FFF' }]}>
                  {days === 30 ? 'Sprint' : days === 60 ? 'Build' : days === 90 ? 'Sculpt' : 'Apex'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Projected Milestone Outcome Card */}
        {selectedProjection && (
          <GlassCard variant="glow" style={styles.projectionCard}>
            <View style={styles.projHeader}>
              <View style={styles.confidencePill}>
                <Sparkles size={13} color={Colors.neonGreen} />
                <Text style={styles.confidenceText}>
                  {selectedProjection.confidenceScore}% AI Confidence Model
                </Text>
              </View>
              <Text style={styles.projTimeTag}>+{selectedProjection.days} Days</Text>
            </View>

            {/* Visual Milestone Description */}
            <Text style={styles.milestoneTitle}>{selectedProjection.visualMilestone}</Text>

            {/* Projected Numbers Comparison Grid */}
            <View style={styles.metricsCompareGrid}>
              <View style={styles.metricCompareItem}>
                <Text style={styles.compareLabel}>WEIGHT</Text>
                <Text style={styles.compareVal}>{selectedProjection.projectedWeightKg} kg</Text>
                <Text style={styles.compareDelta}>
                  {(selectedProjection.projectedWeightKg - current.weightKg).toFixed(1)} kg
                </Text>
              </View>

              <View style={styles.metricCompareItem}>
                <Text style={styles.compareLabel}>BODY FAT</Text>
                <Text style={[styles.compareVal, { color: Colors.neonGreen }]}>
                  {selectedProjection.projectedBodyFatPct}%
                </Text>
                <Text style={[styles.compareDelta, { color: Colors.neonGreen }]}>
                  -{(current.bodyFatPct - selectedProjection.projectedBodyFatPct).toFixed(1)}%
                </Text>
              </View>

              <View style={styles.metricCompareItem}>
                <Text style={styles.compareLabel}>LEAN MASS</Text>
                <Text style={[styles.compareVal, { color: Colors.primaryViolet }]}>
                  {selectedProjection.projectedMuscleMassKg} kg
                </Text>
                <Text style={[styles.compareDelta, { color: Colors.primaryViolet }]}>
                  +{(selectedProjection.projectedMuscleMassKg - current.muscleMassKg).toFixed(1)} kg
                </Text>
              </View>
            </View>

            {/* Key Physiological Benefits */}
            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsTitle}>Kinetic & Metabolic Adaptations:</Text>
              {selectedProjection.keyBenefits.map((b, idx) => (
                <View key={idx} style={styles.benefitRow}>
                  <CheckCircle2 size={16} color={Colors.neonGreen} />
                  <Text style={styles.benefitRowText}>{b}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F7F5EE
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  disclaimerBanner: {
    padding: 14,
    marginBottom: 16,
  },
  disclaimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  disclaimerTitle: {
    color: '#B87200',
    fontSize: 12,
    fontWeight: '800',
  },
  disclaimerText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  currentCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  baselineCol: {
    alignItems: 'center',
  },
  baselineVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  baselineSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  baselineDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderSubtle,
  },
  timelineHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  timelineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  timelineBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timelineDays: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textSecondary,
  },
  timelineDaysSelected: {
    color: '#FFFFFF',
  },
  timelineSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  projectionCard: {
    padding: 18,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE4CE',
    gap: 5,
  },
  confidenceText: {
    color: Colors.neonGreen,
    fontSize: 11,
    fontWeight: '800',
  },
  projTimeTag: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 23,
    marginBottom: 16,
  },
  metricsCompareGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FAF7EE',
    borderWidth: 1,
    borderColor: '#EDE7D8',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  metricCompareItem: {
    alignItems: 'center',
  },
  compareLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  compareVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  compareDelta: {
    fontSize: 11,
    color: Colors.neonGreen,
    fontWeight: '700',
    marginTop: 2,
  },
  benefitsBox: {
    gap: 8,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitRowText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
