import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { cacheService } from '../services/cacheService';
import { getAvatarUrl } from '../utils/imageHelper';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const isHandlingOAuthRef = useRef(false);

  // Check saved session on app load and catch incoming OAuth deep links
  useEffect(() => {
    loadStoredAuth();

    const processOAuthUrl = async (url) => {
      if (!url || isHandlingOAuthRef.current) return;
      if (url.includes('access_token=') || url.includes('token=')) {
        const match = url.match(/access_token=([^&]+)/) || url.match(/token=([^&]+)/);
        if (match && match[1]) {
          isHandlingOAuthRef.current = true;
          try {
            const tokenVal = match[1];
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenVal}` },
            });
            const profile = await res.json();
            if (profile?.email) {
              await loginWithGoogle({
                email: profile.email,
                name: profile.name || profile.given_name || 'Google User',
                avatar: profile.picture,
                googleId: profile.sub,
                accessToken: tokenVal,
              });
            }
          } catch (err) {
            console.error('AuthContext deep link login error:', err);
          } finally {
            isHandlingOAuthRef.current = false;
          }
        }
      }
    };

    Linking.getInitialURL().then(processOAuthUrl);
    const sub = Linking.addEventListener('url', (e) => processOAuthUrl(e?.url));
    return () => sub.remove();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedWishlist = await AsyncStorage.getItem('wishlist');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Instant prefetch of avatar image into native cache
        const avatarUri = getAvatarUrl(parsedUser?.avatar || parsedUser?.profileImage || parsedUser?.photoURL);
        if (avatarUri) {
          cacheService.prefetchImages([avatarUri]);
        }
      }
      if (storedWishlist) {
        setWishlist(JSON.parse(storedWishlist));
      }
    } catch (error) {
      console.error('Error loading stored auth data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrPhone, password) => {
    const data = await authService.login({ emailOrPhone, password });
    if (data && data.token) {
      const userData = {
        _id: data._id || data.user?._id,
        name: data.name || data.user?.name,
        email: data.email || data.user?.email || data.emailOrPhone,
        phone: data.phone || data.user?.phone,
        emailOrPhone: data.emailOrPhone || data.user?.emailOrPhone || data.email,
        avatar: data.avatar || data.user?.avatar,
        role: data.role || data.user?.role || 'student',
        createdAt: data.createdAt || data.user?.createdAt,
      };
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setToken(data.token);
      setUser(userData);
      const avatarUri = getAvatarUrl(userData.avatar);
      if (avatarUri) cacheService.prefetchImages([avatarUri]);
      return data;
    }
    throw new Error(data?.message || 'Login failed');
  };

  const loginWithGoogle = async (googlePayload) => {
    const data = await authService.googleLogin(googlePayload);
    if (data && data.token) {
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.emailOrPhone,
        emailOrPhone: data.emailOrPhone,
        avatar: data.avatar,
        role: data.role || 'student',
      };
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setToken(data.token);
      setUser(userData);
      const avatarUri = getAvatarUrl(userData.avatar);
      if (avatarUri) cacheService.prefetchImages([avatarUri]);
      return data;
    }
    throw new Error(data?.message || 'Google login failed');
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data && data.token) {
      const formattedUser = {
        _id: data._id || data.user?._id,
        name: data.name || data.user?.name || userData.name,
        email: data.email || data.user?.email || userData.email || userData.emailOrPhone,
        phone: data.phone || data.user?.phone || userData.phone,
        emailOrPhone: data.emailOrPhone || data.user?.emailOrPhone || userData.emailOrPhone,
        role: data.role || data.user?.role || 'student',
        createdAt: data.createdAt || new Date().toISOString(),
      };
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(formattedUser));
      setToken(data.token);
      setUser(formattedUser);
      return data;
    }
    return data;
  };

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      await cacheService.clearUserCache();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out', error);
    }
  }, []);

  const updateUserProfile = useCallback(async (updatedData) => {
    setUser((currentUser) => {
      const newUser = { ...(currentUser || {}), ...updatedData };
      AsyncStorage.setItem('user', JSON.stringify(newUser)).catch(err => {
        console.error('Error persisting user update:', err);
      });
      return newUser;
    });
  }, []);

  const toggleWishlist = async (course) => {
    let updated;
    const exists = wishlist.some(item => (item._id === course._id || item.id === course._id));
    if (exists) {
      updated = wishlist.filter(item => (item._id !== course._id && item.id !== course._id));
    } else {
      updated = [...wishlist, course];
    }
    setWishlist(updated);
    await AsyncStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const isInWishlist = (courseId) => {
    return wishlist.some(item => (item._id === courseId || item.id === courseId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUserProfile,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
