import api, { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  googleLogin: async (data) => {
    const payload = typeof data === 'string' ? { credential: data } : data;
    const response = await api.post('/auth/google', payload);
    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  verifyOtp: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Upload failed');
      }
      return data;
    } catch (err) {
      console.error('Fetch avatar upload failed, trying api fallback', err);
      const response = await api.post('/auth/upload-avatar', formData);
      return response.data;
    }
  },
};
