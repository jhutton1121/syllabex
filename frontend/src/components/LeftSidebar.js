import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './LeftSidebar.css';

function LeftSidebar({ isOpen, isExpanded, onToggle, onToggleExpand }) {
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/courses',
      icon: '📚',
      label: 'Courses',
      onClick: () => {
        // Navigate to dashboard and scroll to courses section
        window.location.href = '/dashboard#courses';
      }
    },
    {
      path: '/calendar',
      icon: '📅',
      label: 'Calendar'
    },
    {
      path: '/account',
      icon: '👤',
      label: 'Account'
    },
    {
      path: '/assignments',
      icon: '📝',
      label: 'Assignments',
      onClick: () => {
        // Navigate to dashboard and scroll to assignments section
        window.location.href = '/dashboard#assignments';
      }
    }
  ];

  return (
    <>
      <aside className={`left-sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${isOpen ? 'open' : ''}`}>
        <button
          className="sidebar-toggle desktop-only"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="toggle-icon">{isExpanded ? '«' : '»'}</span>
        </button>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            item.onClick ? (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path || location.hash.includes(item.path.split('/')[1]) ? 'active' : ''}`}
                onClick={() => {
                  item.onClick();
                  if (window.innerWidth <= 768) onToggle();
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth <= 768) onToggle();
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>
      </aside>
    </>
  );
}

export default LeftSidebar;
