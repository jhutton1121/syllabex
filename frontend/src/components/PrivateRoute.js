import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has required role - redirect to appropriate dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to user's appropriate dashboard instead of a non-existent unauthorized page
    const redirectPath = user.role === 'student' ? '/student/dashboard' : 
                         user.role === 'teacher' ? '/teacher/dashboard' : '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;
