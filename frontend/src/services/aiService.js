import api from './api';

const aiService = {
  generateQuestions: async (prompt, conversationHistory, courseId, assignmentContext) => {
    const response = await api.post('/ai/generate/', {
      prompt,
      conversation_history: conversationHistory,
      course_id: courseId,
      assignment_context: assignmentContext,
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/ai/settings/');
    return response.data;
  },

  getCourseStatus: async (courseId) => {
    const response = await api.get(`/ai/status/${courseId}/`);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/ai/settings/', data);
    return response.data;
  },

  getSyllabi: async (courseId) => {
    const response = await api.get(`/ai/syllabi/?course_id=${courseId}`);
    return response.data;
  },

  uploadSyllabus: async (courseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course', courseId);
    const response = await api.post('/ai/syllabi/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteSyllabus: async (id) => {
    await api.delete(`/ai/syllabi/${id}/`);
  },
};

export default aiService;
