import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface BodyRegion {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface InteractiveBodyMapProps {
  selectedParts: string[];
  onTogglePart: (partName: string) => void;
}

const BODY_POINTS: BodyRegion[] = [
  { id: 'neck', name: 'Neck & Traps', x: 100, y: 40 },
  { id: 'l_shoulder', name: 'Left Shoulder', x: 62, y: 65 },
  { id: 'r_shoulder', name: 'Right Shoulder', x: 138, y: 65 },
  { id: 'chest', name: 'Chest / Sternum', x: 100, y: 85 },
  { id: 'l_elbow', name: 'Left Elbow / Arm', x: 42, y: 115 },
  { id: 'r_elbow', name: 'Right Elbow / Arm', x: 158, y: 115 },
  { id: 'low_back', name: 'Lower Back & Spine', x: 100, y: 125 },
  { id: 'hips', name: 'Hips / Pelvis', x: 100, y: 155 },
  { id: 'l_knee', name: 'Left Knee', x: 75, y: 215 },
  { id: 'r_knee', name: 'Right Knee', x: 125, y: 215 },
  { id: 'l_ankle', name: 'Left Ankle / Foot', x: 75, y: 275 },
  { id: 'r_ankle', name: 'Right Ankle / Foot', x: 125, y: 275 },
];

export const InteractiveBodyMap: React.FC<InteractiveBodyMapProps> = ({
  selectedParts,
  onTogglePart,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.diagramWrapper}>
        <Svg width={200} height={310} viewBox="0 0 200 310">
          {/* Head & Neck */}
          <Circle cx={100} cy={22} r={14} fill="rgba(255,255,255,0.06)" stroke={Colors.borderSubtle} strokeWidth={1.5} />
          
          {/* Torso & Skeletal Lines */}
          <Line x1={62} y1={65} x2={138} y2={65} stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
          <Line x1={100} y1={36} x2={100} y2={155} stroke="rgba(255,255,255,0.25)" strokeWidth={2.5} />
          <Line x1={62} y1={65} x2={42} y2={115} stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />
          <Line x1={138} y1={65} x2={158} y2={115} stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />
          
          {/* Pelvis & Legs */}
          <Line x1={75} y1={155} x2={125} y2={155} stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
          <Line x1={75} y1={155} x2={75} y2={215} stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />
          <Line x1={125} y1={155} x2={125} y2={215} stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />
          <Line x1={75} y1={215} x2={75} y2={275} stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />
          <Line x1={125} y1={215} x2={125} y2={275} stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />

          {/* Interactive Tap Nodes */}
          {BODY_POINTS.map((point) => {
            const isSelected = selectedParts.includes(point.name);
            return (
              <React.Fragment key={point.id}>
                {isSelected && (
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={14}
                    fill="rgba(255, 77, 77, 0.25)"
                  />
                )}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={8}
                  fill={isSelected ? '#FF4D4D' : Colors.primary}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Quick Select Buttons Grid */}
      <View style={styles.gridContainer}>
        <Text style={styles.gridTitle}>Tap area or select below:</Text>
        <View style={styles.tagsRow}>
          {BODY_POINTS.map((point) => {
            const isSelected = selectedParts.includes(point.name);
            return (
              <TouchableOpacity
                key={point.id}
                activeOpacity={0.75}
                onPress={() => onTogglePart(point.name)}
                style={[
                  styles.tagPill,
                  isSelected && styles.tagPillSelected,
                ]}
              >
                <View
                  style={[
                    styles.tagDot,
                    { backgroundColor: isSelected ? '#FF4D4D' : Colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.tagTextSelected,
                  ]}
                >
                  {point.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  diagramWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridContainer: {
    width: '100%',
    marginTop: 16,
  },
  gridTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagPillSelected: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
    borderColor: '#FF4D4D',
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
