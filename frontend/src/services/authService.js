import api from './api';
import { jwtDecode } from 'jwt-decode';

const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/users/register/', userData);
    return response.data;
  },

  // Set the account slug (must be called before login)
  setAccountSlug: (slug) => {
    localStorage.setItem('account_slug', slug);
  },

  // Get the current account slug
  getAccountSlug: () => {
    return localStorage.getItem('account_slug');
  },

  // Login user (account_slug must be set first via setAccountSlug or X-Account-Slug header)
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh } = response.data;

    // Store tokens
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // Extract and store account_slug from JWT
    try {
      const decoded = jwtDecode(access);
      if (decoded.account_slug) {
        localStorage.setItem('account_slug', decoded.account_slug);
      }
    } catch (e) {
      // JWT decode failed, account_slug stays as-is
    }

    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('account_slug');
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

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },
};

export default authService;
