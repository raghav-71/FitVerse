import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const register = useAuthStore((state) => state.register);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Password Strength Calculation (0 to 3)
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) && password.length >= 8) score += 1;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['Too Short', 'Moderate Form', 'Optimal Form'];
  const strengthColors = [Colors.danger, Colors.warning, Colors.success];

  const handleRegister = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Athlete name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be 6+ characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!termsAccepted) newErrors.terms = 'Please accept biometric safety terms';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerShake();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Registers new user and sets isAuthenticated=true, which triggers RootNavigator to switch to OnboardingStack!
      register(name.trim(), email.trim());
    }, 650);
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Badge label="NEW ATHLETE" variant="primary" />
              <Badge label="RECRUITMENT" variant="neutral" />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join the cyber-kinetic training arena and unlock precision AI biomechanics.
            </Text>
          </View>

          {/* Form Card */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <GlassCard style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Athlete Full Name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    focusedField === 'name' && [styles.inputFocused, { borderColor: colors.primary }],
                    !!errors.name && styles.inputError,
                  ]}
                >
                  <User
                    size={18}
                    color={focusedField === 'name' ? colors.primary : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="e.g. Aryan Sharma"
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {!!errors.name && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{errors.name}</Text>
                  </View>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Athlete Email</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    focusedField === 'email' && [styles.inputFocused, { borderColor: colors.primary }],
                    !!errors.email && styles.inputError,
                  ]}
                >
                  <Mail
                    size={18}
                    color={focusedField === 'email' ? colors.primary : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="athlete@fitverse.ai"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {!!errors.email && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Security Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    focusedField === 'password' && [styles.inputFocused, { borderColor: colors.primary }],
                    !!errors.password && styles.inputError,
                  ]}
                >
                  <Lock
                    size={18}
                    color={focusedField === 'password' ? colors.primary : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Min 6 alphanumeric characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                {/* Strength Meter */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      {[0, 1, 2].map((idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.strengthBar,
                            idx < strength && {
                              backgroundColor: strengthColors[strength - 1],
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.strengthText,
                        { color: strengthColors[strength - 1] || colors.textMuted },
                      ]}
                    >
                      {strengthLabels[strength - 1] || 'Weak'}
                    </Text>
                  </View>
                )}
                {!!errors.password && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    focusedField === 'confirm' && [styles.inputFocused, { borderColor: colors.primary }],
                    !!errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <Shield
                    size={18}
                    color={focusedField === 'confirm' ? colors.primary : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {!!errors.confirmPassword && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  </View>
                )}
              </View>

              {/* Custom Styled Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.customCheckbox,
                    { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                    termsAccepted && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                >
                  {termsAccepted && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  I consent to AI camera pose estimation & biomechanical motion feedback.
                </Text>
              </TouchableOpacity>
              {!!errors.terms && (
                <View style={styles.errorRow}>
                  <AlertCircle size={14} color={colors.danger} />
                  <Text style={styles.errorText}>{errors.terms}</Text>
                </View>
              )}

              {/* CTA Button */}
              <GradientButton
                title={loading ? 'Registering Athlete...' : 'Create Account & Begin'}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                loading={loading}
                onPress={handleRegister}
                fullWidth
              />
            </GlassCard>
          </Animated.View>

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already recruited to the arena?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 20,
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
    gap: 16,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
