import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Syllabex LMS
        </Link>
        
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to={user.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'} className="navbar-link">
                Dashboard
              </Link>
              {user.role === 'teacher' && (
                <Link to="/teacher/assignments" className="navbar-link">
                  Assignments
                </Link>
              )}
              <span className="navbar-user">
                {user.email} ({user.role})
              </span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
