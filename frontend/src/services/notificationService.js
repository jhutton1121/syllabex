import api from './api';

const notificationService = {
  getNotifications: async (page = 1) => {
    const response = await api.get(`/notifications/?page=${page}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },
};

export default notificationService;
