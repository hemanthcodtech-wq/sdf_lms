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

export const ModeratorLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, logout } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please enter your moderator email and password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const data = await login(emailOrPhone.trim(), password);

      const userRole = data?.role || data?.user?.role;
      if (userRole !== 'moderator' && userRole !== 'admin') {
        await logout();
        setError('Access Denied: You must have an active Moderator account to access this portal.');
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'ModeratorDashboard' }],
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Moderator login failed. Verify your credentials.');
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
            <Ionicons name="shield-checkmark" size={38} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>Moderator Portal</Text>
          <Text style={styles.brandSubtitle}>Batch Management & Class Attendance</Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, shadows.lg]}>
          <Text style={styles.welcomeText}>Moderator Sign In</Text>
          <Text style={styles.instructionText}>
            Sign in with your verified moderator credentials
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <CustomInput
            label="Moderator Email / Phone"
            placeholder="moderator@sdflms.org"
            value={emailOrPhone}
            onChangeText={(text) => {
              setEmailOrPhone(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#2563eb" />}
          />

          <CustomInput
            label="Password"
            placeholder="Enter moderator password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#2563eb" />}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotText, { color: '#2563eb' }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Sign In to Moderator Portal"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
            style={[styles.loginButton, { backgroundColor: '#2563eb' }]}
          />
        </View>

        {/* Portal Switch Links */}
        <View style={styles.switchSection}>
          <TouchableOpacity
            style={styles.switchLinkBtn}
            onPress={() => navigation.navigate('InstructorLogin')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchText}>
              Are you an Instructor / Faculty? <Text style={styles.switchHighlight}>Sign into Instructor Portal →</Text>
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
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#2563eb',
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
    borderColor: 'rgba(37, 99, 235, 0.2)',
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
    color: colors.secondary,
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
