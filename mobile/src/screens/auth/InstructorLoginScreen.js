import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export const InstructorLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please enter your instructor email and password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(emailOrPhone.trim(), password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Instructor login failed. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 16 : Math.max(insets.top, 20), paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('PortalSelection'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Brand Logo / Icon */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, shadows.brandGlow]}>
            <Ionicons name="easel" size={38} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>Instructor Portal</Text>
          <Text style={styles.brandSubtitle}>Manage Curriculum, Live Zoom & Students</Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, shadows.lg]}>
          <Text style={styles.welcomeText}>Faculty Access</Text>
          <Text style={styles.instructionText}>
            Sign in with your registered instructor account
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <CustomInput
            label="Faculty Email / Mobile"
            placeholder="instructor@sdflms.org"
            value={emailOrPhone}
            onChangeText={(text) => {
              setEmailOrPhone(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.secondary} />}
          />

          <CustomInput
            label="Password"
            placeholder="Enter instructor password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.secondary} />}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Sign In to Faculty Portal"
            onPress={handleLogin}
            loading={loading}
            variant="secondary"
            size="lg"
            style={styles.loginButton}
          />
        </View>

        {/* Portal Switch Links */}
        <View style={styles.switchSection}>
          <TouchableOpacity
            style={styles.switchLinkBtn}
            onPress={() => navigation.navigate('ModeratorLogin')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchText}>
              Are you a Batch Moderator? <Text style={styles.switchHighlight}>Sign into Moderator Portal →</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchLinkBtn, { marginTop: 8 }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchTextSecondary}>
              Student / Learner? <Text style={styles.switchHighlightSecondary}>Sign into Learner Portal</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 122, 40, 0.2)',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  loginButton: {
    marginTop: 8,
  },
  switchSection: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  switchLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  switchText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  switchHighlight: {
    color: '#2563eb',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  switchTextSecondary: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  switchHighlightSecondary: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
