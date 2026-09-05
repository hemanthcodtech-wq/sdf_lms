import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
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

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const isProcessingGoogle = React.useRef(false);

  // Load Google Identity Services script on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const scriptId = 'google-identity-sdk';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Listen for native app deep links (e.g. sdflms://oauth#access_token=...)
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
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => sub.remove();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email.trim(), password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'HomeTab' } }],
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccessToken = async (token) => {
    if (isProcessingGoogle.current) return;
    isProcessingGoogle.current = true;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await res.json();
      if (profile?.email) {
        await loginWithGoogle({
          email: profile.email,
          name: profile.name || profile.given_name || 'Google User',
          avatar: profile.picture,
          googleId: profile.sub,
          accessToken: token,
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'HomeTab' } }],
        });
      } else {
        throw new Error('Failed to retrieve Google profile information');
      }
    } catch (authErr) {
      console.error('Google Sign-In backend sync error:', authErr);
      setError(authErr?.response?.data?.message || authErr.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
      isProcessingGoogle.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '473693349273-r3lct54ccv5pfeppqkes57odmni6nvh4.apps.googleusercontent.com';
    try {
      setError('');
      setGoogleLoading(true);

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        // Web: Use Google OAuth2 Token Client popup
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              setError(tokenResponse.error_description || 'Google authorization cancelled');
              setGoogleLoading(false);
              return;
            }
            if (tokenResponse?.access_token) {
              await handleGoogleAccessToken(tokenResponse.access_token);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } else {
        // Native Android APK & iOS: Open System Chrome / Browser OAuth Session (shows all logged in Google accounts)
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
      console.error('Google Sign-In Error:', err);
      setError(err?.response?.data?.message || err.message || 'Google Sign-In error');
      setGoogleLoading(false);
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoBadge, shadows.brandGlow]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>Swamy Dwija Foundation</Text>
          <Text style={styles.brandSubtitle}>Empowering Your Learning Journey</Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, shadows.md]}>
          <Text style={styles.cardTitle}>User Account Login</Text>
          <Text style={styles.cardSubtitle}>
            Enter your email and password to continue
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorBannerText}>{error}</Text>
                {(error.toLowerCase().includes('not registered') || error.toLowerCase().includes('sign up') || error.toLowerCase().includes('register')) && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={{ color: colors.primaryDark || '#0d5c31', fontWeight: '800', fontSize: 13, textDecorationLine: 'underline' }}>
                      👉 Tap here to Sign Up
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          {/* Email Address */}
          <CustomInput
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
          />

          {/* Password */}
          <CustomInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} />}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Login to Account"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginButton}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign In With Google Button */}
          <TouchableOpacity
            style={[styles.googleBtn, shadows.sm]}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <View style={styles.googleBtnContent}>
                <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Sign In with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link to Register & Staff */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.staffLinkRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('InstructorLogin')}
            activeOpacity={0.7}
          >
            <Text style={styles.staffLinkText}>
              Staff / Faculty? <Text style={styles.staffLinkHighlight}>Sign into Staff Portal →</Text>
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
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  brandLogo: {
    width: 80,
    height: 80,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  officialLogo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: colors.secondaryDark || colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  googleBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  staffLinkRow: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  staffLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  staffLinkHighlight: {
    color: colors.secondaryDark || '#c25e17',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
