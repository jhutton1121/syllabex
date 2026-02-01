import api from './api';

const rubricService = {
  // Rubric CRUD (scoped to course)
  getRubrics: async (courseId) => {
    const response = await api.get(`/rubrics/courses/${courseId}/rubrics/`);
    return response.data;
  },

  getRubric: async (courseId, rubricId) => {
    const response = await api.get(`/rubrics/courses/${courseId}/rubrics/${rubricId}/`);
    return response.data;
  },

  createRubric: async (courseId, rubricData) => {
    const response = await api.post(`/rubrics/courses/${courseId}/rubrics/`, rubricData);
    return response.data;
  },

  updateRubric: async (courseId, rubricId, rubricData) => {
    const response = await api.put(`/rubrics/courses/${courseId}/rubrics/${rubricId}/`, rubricData);
    return response.data;
  },

  deleteRubric: async (courseId, rubricId) => {
    await api.delete(`/rubrics/courses/${courseId}/rubrics/${rubricId}/`);
  },

  duplicateRubric: async (courseId, rubricId) => {
    const response = await api.post(`/rubrics/courses/${courseId}/rubrics/${rubricId}/duplicate/`);
    return response.data;
  },

  // Rubric Assessment (grading)
  getAssessment: async (submissionId) => {
    const response = await api.get(`/rubrics/submissions/${submissionId}/rubric-assessment/`);
    return response.data;
  },

  createAssessment: async (submissionId, assessmentData) => {
    const response = await api.post(`/rubrics/submissions/${submissionId}/rubric-assessment/`, assessmentData);
    return response.data;
  },
};

export default rubricService;
