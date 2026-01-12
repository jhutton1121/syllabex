import api from './api';
import { jwtDecode } from 'jwt-decode';

const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/users/register/', userData);
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh } = response.data;
    
    // Store tokens
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      authService.logout();
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  },

  // Get user role from token
  getUserRole: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded.role;
    } catch (error) {
      return null;
    }
  },
};

export default authService;
