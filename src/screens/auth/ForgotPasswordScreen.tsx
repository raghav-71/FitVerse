import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  Send,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSendReset = () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError(t('auth.validEmailError') || 'Please enter a valid athlete email address');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 600);
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Badge label={t('auth.recoveryBadge') || 'RECOVERY'} variant="warning" />
              <Badge label="FITVERSE AI" variant="neutral" />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('auth.resetPassword') || 'Reset Password'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('auth.resetSubtitle') || 'Enter your registered athlete email to receive secure access recovery instructions.'}
            </Text>
          </View>

          {/* Form Card or Success State */}
          <GlassCard style={styles.card}>
            {!submitted ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {t('auth.athleteEmail') || 'Athlete Email'}
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                      focused && {
                        borderColor: colors.primary,
                        backgroundColor: isDark ? 'rgba(79, 124, 255, 0.12)' : 'rgba(79, 124, 255, 0.06)',
                      },
                      !!emailError && styles.inputError,
                    ]}
                  >
                    <Mail
                      size={18}
                      color={focused ? colors.primary : colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="athlete@fitverse.ai"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                    />
                  </View>
                  {!!emailError && (
                    <View style={styles.errorRow}>
                      <AlertCircle size={14} color={Colors.danger} />
                      <Text style={styles.errorText}>{emailError}</Text>
                    </View>
                  )}
                </View>

                <GradientButton
                  title={loading ? (t('auth.sendingRecovery') || 'Sending Recovery Link...') : (t('auth.sendRecoveryLink') || 'Send Recovery Link')}
                  icon={<Send size={18} color="#FFFFFF" />}
                  loading={loading}
                  onPress={handleSendReset}
                  fullWidth
                />
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={36} color={Colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                  {t('auth.recoveryDispatched') || 'Recovery Link Dispatched'}
                </Text>
                <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
                  {t('auth.recoverySentMsg') || 'We sent credential verification instructions to'}{' '}
                  <Text style={[styles.emailHighlight, { color: colors.primary }]}>{email}</Text>. {t('auth.verifyInbox') || 'Please verify your inbox.'}
                </Text>
                <GradientButton
                  title={t('auth.returnToLogin') || 'Return to Login'}
                  onPress={() => navigation.navigate('Login')}
                  fullWidth
                />
              </View>
            )}
          </GlassCard>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={16} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              {t('auth.returnToSignIn') || 'Return to Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  header: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    padding: 20,
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 13, 18, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(79, 124, 255, 0.06)',
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(255, 77, 77, 0.06)',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 255, 176, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 255, 176, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
