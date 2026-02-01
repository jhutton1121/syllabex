import api from './api';

const announcementService = {
  getAnnouncements: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/announcements/`);
    return response.data;
  },

  getAnnouncement: async (courseId, id) => {
    const response = await api.get(`/courses/${courseId}/announcements/${id}/`);
    return response.data;
  },

  createAnnouncement: async (courseId, data) => {
    const response = await api.post(`/courses/${courseId}/announcements/`, data);
    return response.data;
  },

  updateAnnouncement: async (courseId, id, data) => {
    const response = await api.put(`/courses/${courseId}/announcements/${id}/`, data);
    return response.data;
  },

  deleteAnnouncement: async (courseId, id) => {
    const response = await api.delete(`/courses/${courseId}/announcements/${id}/`);
    return response.data;
  },

  getRecentAnnouncements: async () => {
    const response = await api.get('/courses/announcements/recent/');
    return response.data;
  },
};

export default announcementService;
