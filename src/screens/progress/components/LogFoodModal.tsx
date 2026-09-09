import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  Utensils,
  Sparkles,
  Plus,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  Search,
  Check,
  RotateCcw,
  Sliders,
  ShieldAlert,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { BottomSheetModal, GradientButton, Badge } from '../../../components/ui';
import { Colors } from '../../../theme/colors';
import { useDietStore, MealType } from '../../../stores/dietStore';
import {
  FoodService,
  FoodAnalyzeResponse,
  FoodImageAnalyzeResponse,
} from '../../../services/api/foodService';
import { useTheme } from '../../../stores/themeStore';
import { useTranslation } from '../../../stores/languageStore';

export type LogFoodTab = 'type' | 'search' | 'upload' | 'camera' | 'text' | 'manual' | 'photo';

interface LogFoodModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: LogFoodTab;
  initialMealType?: MealType;
}

// Indian & Healthy Food Database for Search & Quick Add
const INDIAN_FOOD_DATABASE = [
  { name: 'Paneer Curry', portion: '150g', mealType: 'Lunch' as MealType, cal: 350, pro: 22, carb: 12, fat: 24, fib: 4, conf: 82, icon: '🥘' },
  { name: 'Roti (Whole Wheat)', portion: '2 pcs (70g)', mealType: 'Lunch' as MealType, cal: 160, pro: 6, carb: 32, fat: 1.5, fib: 4, conf: 92, icon: '🫓' },
  { name: 'Yellow Tadka Dal', portion: '1 bowl (180g)', mealType: 'Dinner' as MealType, cal: 180, pro: 11, carb: 26, fat: 4.5, fib: 6.5, conf: 88, icon: '🍲' },
  { name: 'Steamed Basmati Rice', portion: '1 cup (150g)', mealType: 'Lunch' as MealType, cal: 195, pro: 4.2, carb: 43, fat: 0.5, fib: 1.5, conf: 94, icon: '🍚' },
  { name: 'Steamed Idli with Sambar', portion: '3 idlis (150g)', mealType: 'Breakfast' as MealType, cal: 210, pro: 7.5, carb: 42, fat: 1.8, fib: 4.5, conf: 91, icon: '🥞' },
  { name: 'Crispy Masala Dosa', portion: '1 med (140g)', mealType: 'Breakfast' as MealType, cal: 280, pro: 6.5, carb: 40, fat: 11, fib: 3.5, conf: 87, icon: '🌯' },
  { name: 'Vegetable Rava Upma', portion: '1 bowl (160g)', mealType: 'Breakfast' as MealType, cal: 230, pro: 6, carb: 38, fat: 6.5, fib: 4, conf: 86, icon: '🥣' },
  { name: 'Kanda Poha with Peanuts', portion: '1 plate (150g)', mealType: 'Breakfast' as MealType, cal: 250, pro: 5.5, carb: 44, fat: 7, fib: 3.8, conf: 89, icon: '🥗' },
  { name: 'Hyderabadi Biryani', portion: '1 plate (250g)', mealType: 'Lunch' as MealType, cal: 460, pro: 28, carb: 52, fat: 16, fib: 4.5, conf: 85, icon: '🍛' },
  { name: 'Aloo Gobi Sabzi', portion: '1 bowl (150g)', mealType: 'Lunch' as MealType, cal: 170, pro: 4, carb: 22, fat: 8, fib: 4.8, conf: 83, icon: '🥦' },
  { name: 'Grilled Chicken & Rice', portion: '1 plate (220g)', mealType: 'Lunch' as MealType, cal: 520, pro: 46, carb: 48, fat: 12, fib: 6, conf: 95, icon: '🍗' },
  { name: 'Greek Yogurt & Berries', portion: '1 cup (180g)', mealType: 'Snack' as MealType, cal: 220, pro: 20, carb: 26, fat: 4, fib: 3, conf: 96, icon: '🫐' },
];

const PHOTO_PRESETS = [
  {
    id: 'paneer_curry',
    label: 'Paneer Curry',
    portion: '150g',
    cal: 350,
    pro: 22,
    carb: 12,
    fat: 24,
    fib: 4,
    conf: 82,
    mealType: 'Lunch' as MealType,
    icon: '🥘',
  },
  {
    id: 'roti_dal',
    label: 'Roti & Dal',
    portion: '2 rotis + 1 bowl dal',
    cal: 340,
    pro: 17,
    carb: 58,
    fat: 6,
    fib: 10.5,
    conf: 90,
    mealType: 'Dinner' as MealType,
    icon: '🫓',
  },
  {
    id: 'idli_sambar',
    label: 'Idli & Sambar',
    portion: '3 idlis (150g)',
    cal: 210,
    pro: 7.5,
    carb: 42,
    fat: 1.8,
    fib: 4.5,
    conf: 91,
    mealType: 'Breakfast' as MealType,
    icon: '🥞',
  },
  {
    id: 'chicken_biryani',
    label: 'Biryani',
    portion: '1 plate (250g)',
    cal: 460,
    pro: 28,
    carb: 52,
    fat: 16,
    fib: 4.5,
    conf: 85,
    mealType: 'Lunch' as MealType,
    icon: '🍛',
  },
  {
    id: 'low_conf_sample',
    label: 'Mixed Curry (Low Conf)',
    portion: '180g',
    cal: 310,
    pro: 14,
    carb: 38,
    fat: 12,
    fib: 4.5,
    conf: 68,
    mealType: 'Lunch' as MealType,
    icon: '🍲',
  },
];

export const LogFoodModal: React.FC<LogFoodModalProps> = ({
  visible,
  onClose,
  initialTab = 'type',
  initialMealType = 'Breakfast',
}) => {
  const { addMeal } = useDietStore();
  const { colors, isDark } = useTheme();
  const { t, num } = useTranslation();

  // Normalize initial tab
  const normalizeTab = (tab: LogFoodTab): 'type' | 'search' | 'upload' | 'camera' => {
    if (tab === 'text') return 'type';
    if (tab === 'manual') return 'search';
    if (tab === 'photo') return 'upload';
    if (tab === 'camera') return 'camera';
    if (tab === 'search') return 'search';
    if (tab === 'upload') return 'upload';
    return 'type';
  };

  const [activeTab, setActiveTab] = useState<'type' | 'search' | 'upload' | 'camera'>(normalizeTab(initialTab));
  const [mealType, setMealType] = useState<MealType>(initialMealType);

  // Common editable nutrition fields
  const [foodName, setFoodName] = useState('');
  const [portionQuantity, setPortionQuantity] = useState('1 serving (150g)');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  // AI Text Natural Language State
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [aiTextResult, setAiTextResult] = useState<FoodAnalyzeResponse | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Photo & AI Vision State
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoVisionResult, setPhotoVisionResult] = useState<FoodImageAnalyzeResponse | null>(null);
  const [selectedPhotoPresetId, setSelectedPhotoPresetId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(normalizeTab(initialTab));
      setMealType(initialMealType);
    }
  }, [visible, initialTab, initialMealType]);

  const handleTabChange = (tab: 'type' | 'search' | 'upload' | 'camera') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(tab);

    // If user clicked camera tab, trigger camera picker
    if (tab === 'camera') {
      handleCapturePhoto();
    } else if (tab === 'upload' && !photoUri && !photoVisionResult) {
      // Optional gallery trigger
    }
  };

  // 1. Natural Language Text Analysis
  const handleAnalyzeTextAI = async () => {
    if (!foodName.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsAnalyzingText(true);
    try {
      const result = await FoodService.analyzeFood(foodName);
      setAiTextResult(result);

      if (result && result.total) {
        setCalories(result.total.calories.toString());
        setProtein(result.total.protein.toString());
        setCarbs(result.total.carbs.toString());
        setFat(result.total.fat.toString());
        setFiber((result.total.fiber || 4).toString());
        if (result.detected_meal_type) {
          setMealType(result.detected_meal_type);
        }
      }
    } catch (e) {
      console.warn('AI Food analysis error:', e);
    } finally {
      setIsAnalyzingText(false);
    }
  };

  // 2. Search selection
  const handleSelectFoodItem = (item: typeof INDIAN_FOOD_DATABASE[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setFoodName(item.name);
    setPortionQuantity(item.portion);
    setCalories(item.cal.toString());
    setProtein(item.pro.toString());
    setCarbs(item.carb.toString());
    setFat(item.fat.toString());
    setFiber(item.fib.toString());
    setMealType(item.mealType);
  };

  // 3. Photo Flow: Process Image base64 or preset
  const processImageForAnalysis = async (
    imageUri: string | null,
    base64Data?: string | null,
    hint?: string
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsAnalyzingPhoto(true);
    if (imageUri) setPhotoUri(imageUri);

    try {
      // Upload temporary image if base64 is available
      let imgId: string | undefined = undefined;
      if (base64Data) {
        try {
          const uploadRes = await FoodService.uploadFoodImage(base64Data, 'meal_photo.jpg', false);
          if (uploadRes && uploadRes.image_id) {
            imgId = uploadRes.image_id;
          }
        } catch (uploadErr) {
          console.warn('Upload image temp note:', uploadErr);
        }
      }

      // Vision analysis
      const analysis = await FoodService.analyzeFoodImage({
        image_id: imgId,
        image_base64: base64Data || undefined,
        meal_hint: hint || foodName || undefined,
        meal_type: mealType,
      });

      setPhotoVisionResult(analysis);
      setFoodName(analysis.primary_food);
      setPortionQuantity(analysis.estimated_quantity);
      setCalories(analysis.calories.toString());
      setProtein(analysis.protein.toString());
      setCarbs(analysis.carbs.toString());
      setFat(analysis.fat.toString());
      setFiber(analysis.fiber.toString());
      if (analysis.detected_meal_type) {
        setMealType(analysis.detected_meal_type);
      }
    } catch (err) {
      console.warn('Vision analysis error, using fallback:', err);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // 4. Capture Photo from Camera
  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'FitVerse needs camera access to analyze meal photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedPhotoPresetId(null);
        await processImageForAnalysis(asset.uri, asset.base64, 'meal capture');
      }
    } catch (e) {
      console.warn('Camera launch failed:', e);
      Alert.alert('Notice', 'Camera could not be opened directly. You can upload an image or choose a meal preset below.');
    }
  };

  // 5. Upload Photo from Gallery
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Gallery Permission Required',
          'FitVerse needs gallery access to select meal photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedPhotoPresetId(null);
        await processImageForAnalysis(asset.uri, asset.base64, 'gallery meal photo');
      }
    } catch (e) {
      console.warn('Gallery launch failed:', e);
      Alert.alert('Notice', 'Photo gallery could not be opened. You can select a meal preset below.');
    }
  };

  // 6. Select Photo Preset (For instant testing & Indian meal demo)
  const handleSelectPreset = async (preset: typeof PHOTO_PRESETS[0]) => {
    setSelectedPhotoPresetId(preset.id);
    setPhotoUri(null);
    await processImageForAnalysis(null, null, preset.label);
  };

  // 7. Save Final Confirmed Food Log
  const handleConfirmAndSave = async () => {
    if (!foodName.trim()) {
      Alert.alert('Incomplete Entry', 'Please enter a food name before saving.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const calNum = parseInt(calories, 10) || 350;
    const proNum = parseFloat(protein) || 20;
    const carbNum = parseFloat(carbs) || 35;
    const fatNum = parseFloat(fat) || 12;
    const fibNum = parseFloat(fiber) || 4;

    // Save to local Zustand store (updates MacroRing, daily summary, and dashboard)
    addMeal({
      mealType,
      name: foodName.trim(),
      calories: calNum,
      protein: proNum,
      carbs: carbNum,
      fat: fatNum,
      fiber: fibNum,
    });

    // Save confirmed nutrition values to database / food_logs
    try {
      await FoodService.logMeal({
        name: foodName.trim(),
        meal_type: mealType,
        calories: calNum,
        protein: proNum,
        carbs: carbNum,
        fat: fatNum,
        fiber: fibNum,
      });
    } catch (e) {
      console.warn('FoodService.logMeal remote note:', e);
    }

    // Reset state & close modal
    setFoodName('');
    setPortionQuantity('1 serving (150g)');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setAiTextResult(null);
    setPhotoVisionResult(null);
    setPhotoUri(null);
    setSelectedPhotoPresetId(null);
    onClose();
  };

  // Filtered search list
  const filteredFoods = INDIAN_FOOD_DATABASE.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Add Food & Nutrition"
      subtitle="Type • Search • Upload Photo • Take Photo"
      icon={<Utensils size={20} color={Colors.primary} />}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 4-OPTION USER FLOW SELECTOR */}
        <View style={[styles.modeTabsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange('type')}
            style={[styles.modeTabBtn, activeTab === 'type' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }]]}
          >
            <Sparkles size={13} color={activeTab === 'type' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.modeTabText, { color: activeTab === 'type' ? '#FFFFFF' : colors.textSecondary }]}>
              Type Food
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange('search')}
            style={[styles.modeTabBtn, activeTab === 'search' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }]]}
          >
            <Search size={13} color={activeTab === 'search' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.modeTabText, { color: activeTab === 'search' ? '#FFFFFF' : colors.textSecondary }]}>
              Search Food
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange('upload')}
            style={[styles.modeTabBtn, activeTab === 'upload' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }]]}
          >
            <Upload size={13} color={activeTab === 'upload' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.modeTabText, { color: activeTab === 'upload' ? '#FFFFFF' : colors.textSecondary }]}>
              Upload Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange('camera')}
            style={[styles.modeTabBtn, activeTab === 'camera' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }]]}
          >
            <Camera size={13} color={activeTab === 'camera' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.modeTabText, { color: activeTab === 'camera' ? '#FFFFFF' : colors.textSecondary }]}>
              Take Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* MEAL TYPE SELECTOR */}
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MEAL TIME</Text>
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
                style={[
                  styles.typePill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border },
                  isSelected && [styles.typePillActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
              >
                <Text style={[styles.typeText, { color: colors.textSecondary }, isSelected && styles.typeTextActive]}>
                  {type === 'Snack' ? 'Snacks' : type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* OPTION 1: TYPE FOOD                                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'type' && (
          <View style={styles.tabSection}>
            <View style={styles.inputHeaderRow}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIBE YOUR MEAL</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleAnalyzeTextAI}
                disabled={isAnalyzingText || !foodName.trim()}
                style={[
                  styles.aiAnalyzeBtn,
                  { backgroundColor: colors.primary },
                  (!foodName.trim() || isAnalyzingText) && styles.aiAnalyzeBtnDisabled,
                ]}
              >
                {isAnalyzingText ? (
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
              placeholder="e.g. '2 rotis with dal and salad'"
              placeholderTextColor={colors.textMuted}
              value={foodName}
              onChangeText={(text) => {
                setFoodName(text);
                if (aiTextResult) setAiTextResult(null);
              }}
              style={[
                styles.textInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
              ]}
            />

            {aiTextResult && (
              <View
                style={[
                  styles.aiBanner,
                  aiTextResult.needs_confirmation ? styles.aiBannerWarning : styles.aiBannerSuccess,
                ]}
              >
                <View style={styles.aiBannerHeader}>
                  {aiTextResult.needs_confirmation ? (
                    <AlertCircle size={14} color={Colors.warning} />
                  ) : (
                    <CheckCircle2 size={14} color={Colors.neonGreen} />
                  )}
                  <Text
                    style={[
                      styles.aiBannerTitle,
                      { color: aiTextResult.needs_confirmation ? Colors.warning : Colors.neonGreen },
                    ]}
                  >
                    {aiTextResult.needs_confirmation ? 'Please Review Portions' : 'AI Verified Nutrition'}
                  </Text>
                </View>
                <Text style={styles.aiBannerPrompt}>
                  {aiTextResult.confirmation_prompt || 'Extracted items and estimated nutrition breakdown below.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OPTION 2: SEARCH FOOD                                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'search' && (
          <View style={styles.tabSection}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SEARCH INDIAN MEALS & RECIPES</Text>
            <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              <Search size={16} color={colors.textSecondary} />
              <TextInput
                placeholder="Search Roti, Dal, Rice, Biryani, Idli..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.searchListScroll}>
              <View style={styles.searchChipsGrid}>
                {filteredFoods.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.75}
                    onPress={() => handleSelectFoodItem(item)}
                    style={[
                      styles.searchFoodChip,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border },
                      foodName === item.name && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : 'rgba(79, 124, 255, 0.08)' },
                    ]}
                  >
                    <Text style={styles.chipIcon}>{item.icon}</Text>
                    <View style={styles.chipContent}>
                      <Text style={[styles.chipTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.chipMeta, { color: colors.textSecondary }]}>{item.cal} kcal • {item.portion}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OPTION 3 & 4: PHOTO FLOW (UPLOAD PHOTO & TAKE PHOTO)          */}
        {/* ------------------------------------------------------------- */}
        {(activeTab === 'upload' || activeTab === 'camera') && (
          <View style={styles.tabSection}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {activeTab === 'camera' ? 'AI CAMERA MEAL SCANNER' : 'AI MEAL PHOTO UPLOAD'}
            </Text>

            {/* Action Buttons Row: Take Photo & Gallery Upload */}
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCapturePhoto}
                style={[styles.photoActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              >
                <Camera size={20} color={colors.primary} />
                <Text style={[styles.photoActionBtnText, { color: colors.textPrimary }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickFromGallery}
                style={[styles.photoActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              >
                <Upload size={20} color={colors.neonGreen} />
                <Text style={[styles.photoActionBtnText, { color: colors.textPrimary }]}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Captured / Uploaded Image Preview */}
            {photoUri && (
              <View style={[styles.photoPreviewCard, { borderColor: colors.border }]}>
                <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCapturePhoto}
                  style={styles.retakeButton}
                >
                  <RotateCcw size={14} color="#FFFFFF" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI Vision Analysis In-Progress Indicator */}
            {isAnalyzingPhoto && (
              <View style={[styles.analyzingCard, { backgroundColor: isDark ? 'rgba(79, 124, 255, 0.12)' : 'rgba(79, 124, 255, 0.08)' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.analyzingTitle, { color: colors.primary }]}>AI Vision Analyzing Photo...</Text>
                  <Text style={[styles.analyzingSub, { color: colors.textSecondary }]}>
                    Detecting Indian dishes, portion volume, and calculating macronutrients.
                  </Text>
                </View>
              </View>
            )}

            {/* Sample Indian Meals for instant testing */}
            <Text style={[styles.quickAddTitle, { color: colors.textSecondary, marginTop: 14, marginBottom: 8 }]}>
              Or Select Sample Indian Meal Photo:
            </Text>
            <View style={styles.photoPresetRow}>
              {PHOTO_PRESETS.map((preset) => {
                const isSelected = selectedPhotoPresetId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectPreset(preset)}
                    style={[
                      styles.photoPresetCard,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(79, 124, 255, 0.15)' : 'rgba(79, 124, 255, 0.08)' },
                    ]}
                  >
                    <Text style={styles.presetEmoji}>{preset.icon}</Text>
                    <Text style={[styles.presetLabel, { color: colors.textPrimary }]}>{preset.label}</Text>
                    <Badge
                      label={`${preset.conf}% Match`}
                      variant={preset.conf < 80 ? 'warning' : 'primary'}
                      size="sm"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MANDATORY DISCLAIMER & LOW CONFIDENCE PROMPT                  */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerRow}>
            <Utensils size={12} color={colors.textMuted} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              Nutrition values are estimated.
            </Text>
          </View>
        </View>

        {photoVisionResult?.is_low_confidence && (
          <View style={styles.lowConfidenceAlert}>
            <ShieldAlert size={16} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lowConfidenceTitle}>Confidence: {photoVisionResult.confidence_percentage}%</Text>
              <Text style={styles.lowConfidenceSub}>
                Please confirm food, edit quantity, or add missing information before saving.
              </Text>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FULL EDITABLE REVIEW SECTION (All fields editable)            */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.reviewSectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            REVIEW & EDIT DETAILS
          </Text>
          {photoVisionResult && (
            <Badge
              label={`AI Confidence: ${photoVisionResult.confidence_percentage}%`}
              variant={photoVisionResult.is_low_confidence ? 'warning' : 'success'}
              size="sm"
            />
          )}
        </View>

        {/* Food Name (Editable) */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>FOOD ITEM</Text>
        <TextInput
          placeholder="e.g. Paneer Curry"
          placeholderTextColor={colors.textMuted}
          value={foodName}
          onChangeText={setFoodName}
          style={[
            styles.textInput,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
          ]}
        />

        {/* Estimated Quantity (Editable) */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ESTIMATED QUANTITY</Text>
        <TextInput
          placeholder="e.g. 150g or 2 pieces"
          placeholderTextColor={colors.textMuted}
          value={portionQuantity}
          onChangeText={setPortionQuantity}
          style={[
            styles.textInput,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
          ]}
        />

        {/* Macronutrients Grid (All Editable) */}
        <View style={styles.macroGridRow}>
          <View style={styles.macroInputCell}>
            <Text style={[styles.macroFieldLabel, { color: colors.textSecondary }]}>CALORIES (KCAL)</Text>
            <TextInput
              placeholder="e.g. 350"
              placeholderTextColor={colors.textMuted}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              style={[
                styles.macroInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
              ]}
            />
          </View>

          <View style={styles.macroInputCell}>
            <Text style={[styles.macroFieldLabel, { color: colors.textSecondary }]}>PROTEIN (G)</Text>
            <TextInput
              placeholder="e.g. 22"
              placeholderTextColor={colors.textMuted}
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              style={[
                styles.macroInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
              ]}
            />
          </View>
        </View>

        <View style={styles.macroGridRow}>
          <View style={styles.macroInputCellThird}>
            <Text style={[styles.macroFieldLabel, { color: colors.textSecondary }]}>CARBS (G)</Text>
            <TextInput
              placeholder="e.g. 12"
              placeholderTextColor={colors.textMuted}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
              style={[
                styles.macroInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
              ]}
            />
          </View>

          <View style={styles.macroInputCellThird}>
            <Text style={[styles.macroFieldLabel, { color: colors.textSecondary }]}>FAT (G)</Text>
            <TextInput
              placeholder="e.g. 24"
              placeholderTextColor={colors.textMuted}
              value={fat}
              onChangeText={setFat}
              keyboardType="numeric"
              style={[
                styles.macroInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
              ]}
            />
          </View>

          <View style={styles.macroInputCellThird}>
            <Text style={[styles.macroFieldLabel, { color: colors.textSecondary }]}>FIBER (G)</Text>
            <TextInput
              placeholder="e.g. 4"
              placeholderTextColor={colors.textMuted}
              value={fiber}
              onChangeText={setFiber}
              keyboardType="numeric"
              style={[
                styles.macroInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, borderColor: colors.border },
              ]}
            />
          </View>
        </View>

        {/* CONFIRMATION & SAVE ACTION BUTTON */}
        <View style={styles.actionWrap}>
          <GradientButton
            title={`Confirm & Save to ${mealType === 'Snack' ? 'Snacks' : mealType}`}
            onPress={handleConfirmAndSave}
            disabled={!foodName.trim() || isAnalyzingText || isAnalyzingPhoto}
            size="lg"
            icon={<Check size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  modeTabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 4,
  },
  modeTabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  typePillActive: {},
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabSection: {
    marginBottom: 6,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAnalyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiAnalyzeBtnDisabled: {
    opacity: 0.45,
  },
  aiAnalyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  aiBanner: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  aiBannerSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  aiBannerWarning: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  aiBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  aiBannerPrompt: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  searchListScroll: {
    marginBottom: 8,
  },
  searchChipsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  searchFoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  chipIcon: {
    fontSize: 18,
  },
  chipContent: {
    gap: 2,
  },
  chipTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipMeta: {
    fontSize: 10,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  photoActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoPreviewCard: {
    position: 'relative',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 10,
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  analyzingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  analyzingTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  analyzingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  quickAddTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  photoPresetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  photoPresetCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  presetEmoji: {
    fontSize: 20,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginVertical: 4,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  disclaimerText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  lowConfidenceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  lowConfidenceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
  },
  lowConfidenceSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  macroGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  macroInputCell: {
    flex: 1,
  },
  macroInputCellThird: {
    flex: 1,
  },
  macroFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  macroInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  actionWrap: {
    marginTop: 14,
  },
});
