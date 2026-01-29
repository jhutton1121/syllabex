import api from './api';

const userService = {
  // Get all users (Admin only)
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },

  // Search users by email
  searchUsers: async (query) => {
    const response = await api.get('/users/', { params: { search: query } });
    return response.data;
  },

  // Update current user's profile
  updateProfile: async (data) => {
    const response = await api.patch('/users/me/', data);
    return response.data;
  },

  // Change current user's password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/me/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },
};

export default userService;
