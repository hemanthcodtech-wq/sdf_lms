import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export const PortalSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Catch deep link if returned to PortalSelectionScreen
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
      }
    } catch (e) {
      console.error('Portal Google Login Error:', e);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '473693349273-r3lct54ccv5pfeppqkes57odmni6nvh4.apps.googleusercontent.com';
    try {
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

  const portals = [
    {
      id: 'student',
      title: 'Student / User Login',
      subtitle: 'Access enrolled courses, live Zoom classes & certificates',
      icon: 'school-outline',
      badge: 'LEARNER PORTAL',
      badgeColor: colors.primary,
      accentColor: colors.primary,
      bgTint: 'rgba(13, 92, 49, 0.08)',
      borderColor: colors.primary,
      onPress: () => navigation.navigate('Login'),
    },
    {
      id: 'staff',
      title: 'Staff / Faculty Login',
      subtitle: 'Access for instructors, faculty & batch moderators',
      icon: 'briefcase-outline',
      badge: 'STAFF PORTAL',
      badgeColor: colors.secondary,
      accentColor: colors.secondary,
      bgTint: 'rgba(234, 122, 40, 0.08)',
      borderColor: colors.secondary,
      onPress: () => navigation.navigate('InstructorLogin'),
    },
  ];

  if (googleLoading) {
    return (
      <View style={[styles.container, styles.googleLoadingScreen]}>
        <View style={styles.googleLoadingCenter}>
          <View style={[styles.logoBadge, shadows.brandGlow, { borderColor: '#ffffff', marginBottom: 20 }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <ActivityIndicator size="large" color="#ffffff" style={{ marginVertical: 18 }} />
          <Text style={styles.googleLoadingTitle}>Signing In with Google...</Text>
          <Text style={styles.googleLoadingSub}>Opening your learning dashboard</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'web' ? 24 : Math.max(insets.top, 24),
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, shadows.brandGlow]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Swamy Dwija Foundation</Text>
          <Text style={styles.subtitle}>Select your portal to log in and get started</Text>
        </View>

        {/* Portal Options */}
        <View style={styles.portalsContainer}>
          {portals.map((portal) => (
            <TouchableOpacity
              key={portal.id}
              style={[
                styles.portalCard,
                { backgroundColor: '#ffffff', borderColor: portal.borderColor },
                shadows.md,
              ]}
              onPress={portal.onPress}
              activeOpacity={0.82}
            >
              <View style={styles.portalCardTop}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: portal.bgTint },
                  ]}
                >
                  <Ionicons name={portal.icon} size={28} color={portal.accentColor} />
                </View>
                <View style={[styles.badge, { backgroundColor: portal.bgTint }]}>
                  <Text style={[styles.badgeText, { color: portal.accentColor }]}>
                    {portal.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.portalTitle}>{portal.title}</Text>
              <Text style={styles.portalSubtitle}>{portal.subtitle}</Text>

              <View style={styles.portalActionRow}>
                <Text style={[styles.actionText, { color: portal.accentColor }]}>
                  Proceed to Login
                </Text>
                <Ionicons name="arrow-forward" size={16} color={portal.accentColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Instant Google Login Option */}
        <View style={styles.googleSection}>
          <TouchableOpacity
            style={[styles.portalGoogleBtn, shadows.sm]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.82}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.portalGoogleBtnText}>Sign In with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Guest Exploration Option */}
        <View style={styles.guestSection}>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Browse & Explore Courses as Guest</Text>
            <Ionicons name="compass-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  logoImage: {
    width: 88,
    height: 88,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  portalsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  portalCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
  },
  portalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  portalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  portalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  guestSection: {
    alignItems: 'center',
    marginTop: 6,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  googleSection: {
    marginTop: 4,
    marginBottom: 12,
    width: '100%',
  },
  portalGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  portalGoogleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  googleLoadingScreen: {
    backgroundColor: '#0d5c31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLoadingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  googleLoadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
  },
  googleLoadingSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    textAlign: 'center',
  },
});
