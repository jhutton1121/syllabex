import api from './api';

const gradebookService = {
  // Get course gradebook (Teachers only)
  getCourseGradebook: async (courseId) => {
    const response = await api.get(`/gradebook/course/${courseId}/`);
    return response.data;
  },

  // Get student grades
  getStudentGrades: async (studentId) => {
    const response = await api.get(`/gradebook/student/${studentId}/`);
    return response.data;
  },

  // Create grade entry (Teachers only)
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
