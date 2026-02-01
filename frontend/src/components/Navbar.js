import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {user && (
          <button
            className="hamburger-menu"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
          Syllabex LMS
        </Link>

        <div className="navbar-menu">
          {user ? (
            <>
              {isAdmin() && (
                <Link to="/admin" className="navbar-link admin-link">
                  Admin
                </Link>
              )}
              <NotificationBell />
              <span className="navbar-user">
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-logout">
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
