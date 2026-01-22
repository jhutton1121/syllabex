import api from './api';

const gradebookService = {
  // Get course gradebook (Instructors only)
  getCourseGradebook: async (courseId) => {
    const response = await api.get(`/gradebook/course/${courseId}/`);
    return response.data;
  },

  // Get student grades (user ID based)
  getStudentGrades: async (userId) => {
    const response = await api.get(`/gradebook/student/${userId}/`);
    return response.data;
  },

  // Get my grades (current user)
  getMyGrades: async () => {
    const response = await api.get('/gradebook/');
    return response.data;
  },

  // Create grade entry (Instructors only)
  createGrade: async (gradeData) => {
    const response = await api.post('/gradebook/', gradeData);
    return response.data;
  },

  // Update grade entry
  updateGrade: async (id, gradeData) => {
    const response = await api.put(`/gradebook/${id}/`, gradeData);
    return response.data;
  },
};

export default gradebookService;
