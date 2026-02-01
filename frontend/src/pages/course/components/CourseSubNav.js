import React from 'react';
import './CourseSubNav.css';

function CourseSubNav({ activeView, onViewChange, isInstructor, isStudent, mainSidebarWidth }) {
  const navItems = [
    { id: 'modules', label: 'Modules', icon: '📦', visible: true },
    { id: 'pages', label: 'Pages', icon: '📄', visible: true },
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
    <nav className="course-sub-nav" style={{ left: `${mainSidebarWidth}px` }}>
      <div className="sub-nav-items">
        {navItems.filter(item => item.visible).map((item) => (
          <button
            key={item.id}
            className={`sub-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="sub-nav-icon">{item.icon}</span>
            <span className="sub-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default CourseSubNav;
