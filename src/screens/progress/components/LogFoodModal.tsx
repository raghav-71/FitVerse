import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Utensils, Sparkles, Plus, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomSheetModal, GradientButton } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { useDietStore, MealType } from '../../../stores/dietStore';
import { FoodService, FoodAnalyzeResponse } from '../../../services/api/foodService';

interface LogFoodModalProps {
  visible: boolean;
  onClose: () => void;
}

const QUICK_ADD_ITEMS = [
  { name: 'Oatmeal & Berries', mealType: 'Breakfast' as MealType, cal: 380, pro: 22, carb: 58, fat: 6 },
  { name: 'Grilled Chicken & Rice', mealType: 'Lunch' as MealType, cal: 560, pro: 48, carb: 64, fat: 12 },
  { name: 'Paneer Tikka Salad', mealType: 'Dinner' as MealType, cal: 420, pro: 28, carb: 24, fat: 22 },
  { name: 'Whey Protein Shake', mealType: 'Snack' as MealType, cal: 180, pro: 32, carb: 6, fat: 2 },
  { name: 'Boiled Eggs & Toast', mealType: 'Breakfast' as MealType, cal: 320, pro: 20, carb: 28, fat: 14 },
];

export const LogFoodModal: React.FC<LogFoodModalProps> = ({ visible, onClose }) => {
  const { addMeal } = useDietStore();

  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // AI Natural Language Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<FoodAnalyzeResponse | null>(null);

  const handleSelectQuickAdd = (item: typeof QUICK_ADD_ITEMS[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setMealType(item.mealType);
    setFoodName(item.name);
    setCalories(item.cal.toString());
    setProtein(item.pro.toString());
    setCarbs(item.carb.toString());
    setFat(item.fat.toString());
    setAiResult(null);
  };

  const handleAnalyzeAI = async () => {
    if (!foodName.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsAnalyzing(true);
    try {
      const result = await FoodService.analyzeFood(foodName);
      setAiResult(result);

      if (result && result.total) {
        setCalories(result.total.calories.toString());
        setProtein(result.total.protein.toString());
        setCarbs(result.total.carbs.toString());
        setFat(result.total.fat.toString());
        if (result.detected_meal_type) {
          setMealType(result.detected_meal_type);
        }
      }
    } catch (e) {
      console.warn('AI Food analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = () => {
    if (!foodName.trim()) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const calNum = parseInt(calories, 10) || 350;
    const proNum = parseFloat(protein) || 25;
    const carbNum = parseFloat(carbs) || Math.round(calNum * 0.45 / 4);
    const fatNum = parseFloat(fat) || Math.round(calNum * 0.25 / 9);

    addMeal({
      mealType,
      name: foodName.trim(),
      calories: calNum,
      protein: proNum,
      carbs: carbNum,
      fat: fatNum,
    });

    // Reset form & close
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setAiResult(null);
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Log Meal"
      subtitle="AI Nutrition & Macro Tracker"
      icon={<Utensils size={20} color={Colors.primary} />}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Meal Type Selector */}
        <Text style={styles.inputLabel}>MEAL TYPE</Text>
        <View style={styles.mealTypeRow}>
          {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as MealType[]).map((type) => {
            const isSelected = mealType === type;
            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setMealType(type);
                }}
                style={[styles.typePill, isSelected && styles.typePillActive]}
              >
                <Text style={[styles.typeText, isSelected && styles.typeTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Natural Language Food Name Input with AI Trigger */}
        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputLabel}>WHAT DID YOU EAT? (NATURAL LANGUAGE)</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleAnalyzeAI}
            disabled={isAnalyzing || !foodName.trim()}
            style={[styles.aiAnalyzeBtn, (!foodName.trim() || isAnalyzing) && styles.aiAnalyzeBtnDisabled]}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={12} color="#FFFFFF" />
                <Text style={styles.aiAnalyzeBtnText}>AI Analyze</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="e.g. 'I ate 2 rotis with dal' or '100g paneer & rice'"
          placeholderTextColor={Colors.textMuted}
          value={foodName}
          onChangeText={(text) => {
            setFoodName(text);
            if (aiResult) setAiResult(null);
          }}
          style={styles.textInput}
        />

        {/* AI Analysis Confirmation / Review Banner */}
        {aiResult && (
          <View
            style={[
              styles.aiBanner,
              aiResult.needs_confirmation ? styles.aiBannerWarning : styles.aiBannerSuccess,
            ]}
          >
            <View style={styles.aiBannerHeader}>
              {aiResult.needs_confirmation ? (
                <AlertCircle size={14} color={Colors.warning} />
              ) : (
                <CheckCircle2 size={14} color={Colors.neonGreen} />
              )}
              <Text
                style={[
                  styles.aiBannerTitle,
                  { color: aiResult.needs_confirmation ? Colors.warning : Colors.neonGreen },
                ]}
              >
                {aiResult.needs_confirmation ? 'Please Review Portions' : 'AI Verified Nutrition'}
              </Text>
            </View>

            {aiResult.confirmation_prompt ? (
              <Text style={styles.aiBannerPrompt}>{aiResult.confirmation_prompt}</Text>
            ) : (
              <Text style={styles.aiBannerPrompt}>
                Extracted: {aiResult.foods.map((f) => `${f.quantity} ${f.unit} ${f.name}`).join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Quick Add Suggestions */}
        <View style={styles.quickAddHeader}>
          <Sparkles size={12} color={Colors.neonGreen} />
          <Text style={styles.quickAddTitle}>AI Quick-Add Suggestions</Text>
        </View>
        <View style={styles.chipsWrap}>
          {QUICK_ADD_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.75}
              onPress={() => handleSelectQuickAdd(item)}
              style={styles.chip}
            >
              <Plus size={12} color={Colors.accentSky} />
              <Text style={styles.chipText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calories & Protein estimated inputs */}
        <View style={styles.macrosRow}>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>CALORIES (EST. KCAL)</Text>
            <TextInput
              placeholder="e.g. 450"
              placeholderTextColor={Colors.textMuted}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              style={styles.macroInput}
            />
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>PROTEIN (EST. GRAMS)</Text>
            <TextInput
              placeholder="e.g. 35"
              placeholderTextColor={Colors.textMuted}
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              style={styles.macroInput}
            />
          </View>
        </View>

        {/* CTA */}
        <GradientButton
          title="Log Meal to Daily Tracker"
          onPress={handleLogMeal}
          disabled={!foodName.trim()}
          fullWidth
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillActive: {
    backgroundColor: 'rgba(79, 124, 255, 0.2)',
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  quickAddTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neonGreen,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
    gap: 6,
  },
  macroInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  inputHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiAnalyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiAnalyzeBtnDisabled: {
    opacity: 0.5,
  },
  aiAnalyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  aiBanner: {
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
  },
  aiBannerSuccess: {
    backgroundColor: 'rgba(39, 103, 56, 0.12)',
    borderColor: 'rgba(39, 103, 56, 0.3)',
  },
  aiBannerWarning: {
    backgroundColor: 'rgba(223, 171, 36, 0.12)',
    borderColor: 'rgba(223, 171, 36, 0.3)',
  },
  aiBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiBannerPrompt: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
});
