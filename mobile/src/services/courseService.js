import api from './api';

export const courseService = {
  // Get all published courses for explore / catalog
  getPublicCourses: async () => {
    const response = await api.get('/courses/public');
    return response.data;
  },

  // Get single course by slug or ID
  getCourseDetails: async (slugOrId) => {
    const response = await api.get(`/courses/public/${slugOrId}`);
    return response.data;
  },

  // Get enrolled courses for student
  getMyCourses: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  getEnrolledCourses: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  // Get upcoming live classes for student
  getStudentClasses: async () => {
    const response = await api.get('/classes/student');
    return response.data;
  },

  // Get class sessions & materials for a specific course
  getCourseClasses: async (courseId) => {
    const response = await api.get(`/classes/course/${courseId}`);
    return response.data;
  },

  // Wishlist actions (stored locally in AsyncStorage with backend sync)
  getWishlist: async () => {
    try {
      const response = await api.get('/auth/wishlist');
      return response.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  // Payment history
  getPaymentHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  // Certificates
  getMyCertificates: async () => {
    try {
      const response = await api.get('/payments/history');
      if (response.data && response.data.data) {
        const completed = response.data.data.filter((e) => e.completed || e.certificateId);
        return { success: true, data: completed };
      }
      return { success: true, data: [] };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  getCertificates: async () => {
    try {
      const response = await api.get('/payments/history');
      if (response.data && response.data.data) {
        const completed = response.data.data.filter((e) => e.completed || e.certificateId);
        return { success: true, data: completed };
      }
      return { success: true, data: [] };
    } catch (e) {
      return { success: true, data: [] };
    }
  },
};
