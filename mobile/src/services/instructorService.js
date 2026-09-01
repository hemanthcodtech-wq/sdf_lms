import api from './api';

export const instructorService = {
  getDashboardStats: async () => {
    const response = await api.get('/instructor/dashboard-stats');
    return response.data;
  },

  getCourseDetails: async (courseId) => {
    const response = await api.get(`/instructor/courses/${courseId}/details`);
    return response.data;
  },

  getCourseMaterials: async (courseId) => {
    const response = await api.get(`/instructor/courses/${courseId}/materials`);
    return response.data;
  },

  addCourseMaterial: async (courseId, materialData) => {
    const response = await api.post(`/instructor/courses/${courseId}/materials`, materialData);
    return response.data;
  },

  deleteCourseMaterial: async (courseId, materialId) => {
    const response = await api.delete(`/instructor/courses/${courseId}/materials/${materialId}`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/instructor/profile', profileData);
    return response.data;
  },
};
