import api from './api';

const courseService = {
  // Get all courses (filtered by user role on backend)
  getCourses: async () => {
    const response = await api.get('/courses/');
    return response.data;
  },

  // Get single course with details
  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}/`);
    return response.data;
  },

  // Create course (Admin only)
  createCourse: async (courseData) => {
    const response = await api.post('/courses/', courseData);
    return response.data;
  },

  // Update course
  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}/`, courseData);
    return response.data;
  },

  // Delete course
  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}/`);
    return response.data;
  },

  // Add member to course (Admin or Instructor)
  addMember: async (courseId, userId, role = 'student') => {
    const response = await api.post(`/courses/${courseId}/members/`, {
      user_id: userId,
      role: role,
    });
    return response.data;
  },

  // Remove member from course
  removeMember: async (courseId, userId) => {
    const response = await api.delete(`/courses/${courseId}/members/${userId}/`);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (courseId, userId, newRole) => {
    const response = await api.patch(`/courses/${courseId}/members/${userId}/role/`, {
      role: newRole,
    });
    return response.data;
  },

  // Get students in course
  getCourseStudents: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/students/`);
    return response.data;
  },

  // Get instructors in course
  getCourseInstructors: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/instructors/`);
    return response.data;
  },

  // Get all memberships (admin only)
  getMemberships: async () => {
    const response = await api.get('/courses/memberships/');
    return response.data;
  },
};

export default courseService;
