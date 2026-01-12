import api from './api';

const courseService = {
  // Get all courses (filtered by user role on backend)
  getCourses: async () => {
    const response = await api.get('/courses/');
    return response.data;
  },

  // Get single course
  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}/`);
    return response.data;
  },

  // Create course (Teachers/Admins only)
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

  // Enroll student (Admins only)
  enrollStudent: async (courseId, studentId) => {
    const response = await api.post(`/courses/${courseId}/enroll/`, {
      student_id: studentId,
    });
    return response.data;
  },

  // Get students in course
  getCourseStudents: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/students/`);
    return response.data;
  },
};

export default courseService;
