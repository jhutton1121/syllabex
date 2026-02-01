import api from './api';

const pageService = {
  getPages: async (courseId) => {
    const response = await api.get('/pages/', { params: { course: courseId } });
    return response.data;
  },

  getPage: async (pageId) => {
    const response = await api.get(`/pages/${pageId}/`);
    return response.data;
  },

  createPage: async (data) => {
    const response = await api.post('/pages/', data);
    return response.data;
  },

  updatePage: async (pageId, data) => {
    const response = await api.put(`/pages/${pageId}/`, data);
    return response.data;
  },

  deletePage: async (pageId) => {
    const response = await api.delete(`/pages/${pageId}/`);
    return response.data;
  },
};

export default pageService;
