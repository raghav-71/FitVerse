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
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Globe,
  Apple,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer, GlassCard, GradientButton, Badge } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useTheme } from '../../stores/themeStore';
import { useTranslation } from '../../stores/languageStore';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const login = useAuthStore((state) => state.login);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('athlete@fitverse.ai');
  const [password, setPassword] = useState('CyberAthlete2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Shake animation for error feedback
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    let hasError = false;
    setEmailError('');
    setPasswordError('');

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid athlete email address');
      hasError = true;
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) {
      triggerShake();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    // Simulate network authentication delay
    setTimeout(() => {
      setLoading(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      login(email.trim(), 'Aryan Sharma');
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
              <Badge label="FITVERSE AI" variant="primary" />
              <Badge label="AUTHENTICATION" variant="neutral" />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your kinetic athlete credentials to enter the vision coaching arena.
            </Text>
          </View>

          {/* Form Card */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <GlassCard style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Athlete Email</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    emailFocused && [styles.inputFocused, { borderColor: colors.primary }],
                    !!emailError && styles.inputError,
                  ]}
                >
                  <Mail
                    size={18}
                    color={emailFocused ? colors.primary : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="name@fitverse.ai"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
                {!!emailError && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{emailError}</Text>
                  </View>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithLink}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Security Password</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    passwordFocused && [styles.inputFocused, { borderColor: colors.primary }],
                    !!passwordError && styles.inputError,
                  ]}
                >
                  <Lock
                    size={18}
                    color={passwordFocused ? colors.primary : colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
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
                {!!passwordError && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                )}
              </View>

              {/* Action Button */}
              <GradientButton
                title={loading ? 'Authenticating...' : 'Authenticate & Continue'}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                loading={loading}
                onPress={handleLogin}
                fullWidth
              />

              {/* Social Login Options */}
              <View style={styles.dividerRow}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    login('google.athlete@fitverse.ai', 'Google Athlete');
                  }}
                >
                  <Globe size={18} color={colors.textPrimary} />
                  <Text style={[styles.socialText, { color: colors.textPrimary }]}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    login('apple.athlete@fitverse.ai', 'Apple Athlete');
                  }}
                >
                  <Apple size={18} color={colors.textPrimary} />
                  <Text style={[styles.socialText, { color: colors.textPrimary }]}>Apple ID</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Navigation to Register */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>New to the FitVerse arena?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Create Account</Text>
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
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  labelWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
    borderRadius: 12,
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
