import api from './api';

const assignmentService = {
  // Get all assignments (filtered by course if provided)
  getAssignments: async (courseId = null, type = null) => {
    const params = {};
    if (courseId) params.course = courseId;
    if (type) params.type = type;
    
    const response = await api.get('/assignments/', { params });
    return response.data;
  },

  // Get single assignment
  getAssignment: async (id) => {
    const response = await api.get(`/assignments/${id}/`);
    return response.data;
  },

  // Create assignment (Teachers only)
  createAssignment: async (assignmentData) => {
    const response = await api.post('/assignments/', assignmentData);
    return response.data;
  },

  // Update assignment
  updateAssignment: async (id, assignmentData) => {
    const response = await api.put(`/assignments/${id}/`, assignmentData);
    return response.data;
  },

  // Delete assignment
  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignments/${id}/`);
    return response.data;
  },

  // Submit assignment (Students only)
  submitAssignment: async (assignmentId, answer) => {
    const response = await api.post(`/assignments/${assignmentId}/submit/`, {
      answer,
    });
    return response.data;
  },

  // Get submissions for assignment (Teachers only)
  getSubmissions: async (assignmentId) => {
    const response = await api.get(`/assignments/${assignmentId}/submissions/`);
    return response.data;
  },

  // Get student's own submissions
  getMySubmissions: async () => {
    const response = await api.get('/assignments/submissions/');
    return response.data;
  },
};

export default assignmentService;
