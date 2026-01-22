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

  // Get assignment for student view (without correct answers)
  getAssignmentForStudent: async (id) => {
    const response = await api.get(`/assignments/${id}/student_view/`);
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

  // Submit assignment with question responses (Students only)
  submitAssignment: async (assignmentId, answer, responses = []) => {
    const response = await api.post(`/assignments/${assignmentId}/submit/`, {
      answer,
      responses,
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

  // ===== Question Management =====

  // Get questions for an assignment
  getQuestions: async (assignmentId) => {
    const response = await api.get(`/assignments/${assignmentId}/questions/`);
    return response.data;
  },

  // Add a question to an assignment (Teachers only)
  addQuestion: async (assignmentId, questionData) => {
    const response = await api.post(`/assignments/${assignmentId}/questions/`, questionData);
    return response.data;
  },

  // Get a single question
  getQuestion: async (questionId) => {
    const response = await api.get(`/assignments/questions/${questionId}/`);
    return response.data;
  },

  // Update a question (Teachers only)
  updateQuestion: async (questionId, questionData) => {
    const response = await api.put(`/assignments/questions/${questionId}/`, questionData);
    return response.data;
  },

  // Delete a question (Teachers only)
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/assignments/questions/${questionId}/`);
    return response.data;
  },

  // Reorder a question
  reorderQuestion: async (questionId, newOrder) => {
    const response = await api.post(`/assignments/questions/${questionId}/reorder/`, {
      order: newOrder,
    });
    return response.data;
  },

  // ===== Grading =====

  // Grade a text response (Teachers only)
  gradeResponse: async (submissionId, responseId, pointsEarned) => {
    const response = await api.post(`/assignments/submissions/${submissionId}/grade_response/`, {
      response_id: responseId,
      points_earned: pointsEarned,
    });
    return response.data;
  },
};

export default assignmentService;
