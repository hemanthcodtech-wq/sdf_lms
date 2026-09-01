import api from './api';

export const moderatorService = {
  getDashboardStats: async () => {
    const response = await api.get('/moderator/dashboard-stats');
    return response.data;
  },

  getCourseDetails: async (courseId) => {
    const response = await api.get(`/moderator/courses/${courseId}/details`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/moderator/profile', profileData);
    return response.data;
  },
};
