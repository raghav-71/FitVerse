import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { Globe, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../theme/colors';
import { useTranslation } from '../../stores/languageStore';
import { SupportedLanguage, LANGUAGE_OPTIONS } from '../../services/i18n/translations';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { currentLanguage, setLanguage, t } = useTranslation();

  const handleSelectLanguage = (code: SupportedLanguage) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconCircle}>
                    <Globe size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.title}>{t('languageSelectorTitle')}</Text>
                    <Text style={styles.subTitle}>{t('languageSelectorSub')}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Language Options Scrollable List */}
              <ScrollView
                style={styles.scrollWrapper}
                contentContainerStyle={styles.optionsList}
                showsVerticalScrollIndicator={true}
              >
                {LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = currentLanguage === opt.code;
                  return (
                    <TouchableOpacity
                      key={opt.code}
                      activeOpacity={0.75}
                      onPress={() => handleSelectLanguage(opt.code)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.flagText}>{opt.flag}</Text>
                        <View style={styles.optionTextWrap}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text style={styles.optionNativeName}>
                            {opt.nativeName}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.checkRadio,
                          isSelected && styles.checkRadioSelected,
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollWrapper: {
    maxHeight: 380,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    gap: 16,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E5DD',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagText: {
    fontSize: 22,
  },
  optionTextWrap: {
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  optionNativeName: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  checkRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRadioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
});
