import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, shadows } from '../../theme/colors';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export const InstructorLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, logout, loginWithGoogle } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Catch deep link if returned to InstructorLoginScreen
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event?.url;
      if (url && (url.includes('access_token=') || url.includes('token='))) {
        const match = url.match(/access_token=([^&]+)/) || url.match(/token=([^&]+)/);
        if (match && match[1]) {
          try {
            await WebBrowser.dismissAuthSession();
          } catch (e) {}
          setGoogleLoading(true);
          await handleGoogleAccessToken(match[1]);
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const handleGoogleAccessToken = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await res.json();
      if (profile?.email) {
        const data = await loginWithGoogle({
          email: profile.email,
          name: profile.name || profile.given_name || 'Instructor',
          avatar: profile.picture,
          googleId: profile.sub,
          accessToken: token,
        });

        const userRole = data?.role || data?.user?.role;
        if (userRole === 'moderator') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ModeratorDashboard' }],
          });
          return;
        }
        if (userRole !== 'instructor' && userRole !== 'admin') {
          await logout();
          setError(`Access Denied: The account "${profile.email}" is registered as a student, not an Instructor or Moderator.`);
          return;
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'InstructorDashboard' }],
        });
      }
    } catch (e) {
      console.error('Instructor Google Login Error:', e);
      setError('Google Sign-In failed. Please try again or use password.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '473693349273-r3lct54ccv5pfeppqkes57odmni6nvh4.apps.googleusercontent.com';
    try {
      setError('');
      setGoogleLoading(true);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              await handleGoogleAccessToken(tokenResponse.access_token);
            } else {
              setGoogleLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } else {
        const redirectUri = 'https://swamidwijafoundation.com';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&prompt=select_account`;
        const authResult = await WebBrowser.openAuthSessionAsync(authUrl, 'sdflms://oauth');
        if (authResult.type === 'success' && authResult.url) {
          const tokenMatch = authResult.url.match(/access_token=([^&]+)/) || authResult.url.match(/token=([^&]+)/);
          if (tokenMatch && tokenMatch[1]) {
            await handleGoogleAccessToken(tokenMatch[1]);
            return;
          }
        }
        setTimeout(() => setGoogleLoading(false), 2000);
      }
    } catch (err) {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please enter your instructor email and password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const data = await login(emailOrPhone.trim(), password);

      const userRole = data?.role || data?.user?.role;
      if (userRole === 'moderator') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ModeratorDashboard' }],
        });
        return;
      }
      if (userRole !== 'instructor' && userRole !== 'admin') {
        await logout();
        setError('Access Denied: You must have an active Instructor or Moderator account to access this portal.');
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'InstructorDashboard' }],
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleBtn, shadows.sm]}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Sign In with Google</Text>
              </>
            )}
          </TouchableOpacity>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
});

