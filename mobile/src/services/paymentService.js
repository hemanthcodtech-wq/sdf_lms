import api from './api';

export const paymentService = {
  createOrder: async (courseId, amount) => {
    const response = await api.post('/payments/create-order', {
      courseId,
      amount,
    });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/payments/verify-payment', paymentData);
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },
};
