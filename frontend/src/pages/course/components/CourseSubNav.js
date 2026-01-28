import React from 'react';
import './CourseSubNav.css';

function CourseSubNav({ activeView, onViewChange, isInstructor, isStudent, collapsed, onToggleCollapse }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', visible: true },
    { id: 'syllabus', label: 'Syllabus', icon: '📚', visible: true },
    { id: 'assignments', label: 'Assignments', icon: '📝', visible: true },
    { id: 'quizzes', label: 'Quizzes', icon: '🎯', visible: true },
    { id: 'tests', label: 'Tests', icon: '📋', visible: true },
    { id: 'calendar', label: 'Course Calendar', icon: '📅', visible: true },
    { id: 'roster', label: 'Roster', icon: '👥', visible: isInstructor },
    { id: 'gradebook', label: 'Gradebook', icon: '📊', visible: isInstructor },
    { id: 'grades', label: 'My Grades', icon: '📈', visible: isStudent },
  ];

  return (
    <nav className={`course-sub-nav ${collapsed ? 'collapsed' : ''}`}>
      <button className="sub-nav-toggle" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? '»' : '«'}
      </button>
      <div className="sub-nav-items">
        {navItems.filter(item => item.visible).map((item) => (
          <button
            key={item.id}
            className={`sub-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="sub-nav-icon">{item.icon}</span>
            {!collapsed && <span className="sub-nav-label">{item.label}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default CourseSubNav;
