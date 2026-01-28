import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, assignmentsData] = await Promise.all([
          courseService.getCourses(),
          assignmentService.getAssignments(),
        ]);
        
        setCourses(coursesData.results || coursesData);
        setAssignments(assignmentsData.results || assignmentsData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Sort assignments by due date
  const upcomingAssignments = assignments
    .filter(a => !a.is_overdue)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  // Group courses by role
  const instructorCourses = courses.filter(c => c.user_role === 'instructor');
  const studentCourses = courses.filter(c => c.user_role === 'student');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.first_name || user?.email?.split('@')[0]}!</h1>
          <p className="subtitle">{user?.email}</p>
        </div>
        <div className="quick-stats">
          <div className="stat-card">
            <span className="stat-number">{instructorCourses.length}</span>
            <span className="stat-label">Teaching</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{studentCourses.length}</span>
            <span className="stat-label">Enrolled</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{upcomingAssignments.length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        {/* Courses Section */}
        <section className="courses-section">
          <div className="section-header">
            <h2>My Courses</h2>
          </div>
          
          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No courses yet</h3>
              <p>You're not enrolled in any courses. Contact an administrator to get started.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className={`course-card ${course.user_role}`}>
                  <div className="course-card-header">
                    <span className={`role-badge ${course.user_role}`}>
                      {course.user_role === 'instructor' ? '👨‍🏫 Instructor' : '👨‍🎓 Student'}
                    </span>
                    <span className={`status-indicator ${course.is_active ? 'active' : 'inactive'}`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="course-card-body">
                    <h3 className="course-code">{course.code}</h3>
                    <h4 className="course-name">{course.name}</h4>
                    {course.description && (
                      <p className="course-description">{course.description}</p>
                    )}
                  </div>
                  <div className="course-card-footer">
                    <div className="course-stats">
                      {course.user_role === 'instructor' ? (
                        <>
                          <span className="stat">
                            <span className="stat-icon">👥</span>
                            {course.student_count} students
                          </span>
                        </>
                      ) : (
                        <span className="stat">
                          <span className="stat-icon">👨‍🏫</span>
                          {course.instructor_count} instructor(s)
                        </span>
                      )}
                    </div>
                    <Link to={`/courses/${course.id}`} className="btn btn-view">
                      View Course →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assignments Section */}
        <section className="assignments-section">
          <div className="section-header">
            <h2>Upcoming Assignments</h2>
            {upcomingAssignments.length > 0 && (
              <Link to="/assignments" className="view-all-link">View All →</Link>
            )}
          </div>
          
          {upcomingAssignments.length === 0 ? (
            <div className="empty-state small">
              <div className="empty-icon">✅</div>
              <p>You're all caught up! No upcoming assignments.</p>
            </div>
          ) : (
            <div className="assignments-list">
              {upcomingAssignments.map((assignment) => {
                const dueDate = new Date(assignment.due_date);
                const now = new Date();
                const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntilDue <= 2;
                
                return (
                  <div key={assignment.id} className={`assignment-card ${isUrgent ? 'urgent' : ''}`}>
                    <div className="assignment-type-badge">
                      <span className={`type-badge type-${assignment.type}`}>
                        {assignment.type}
                      </span>
                    </div>
                    <div className="assignment-info">
                      <h4>{assignment.title}</h4>
                      <p className="assignment-course">
                        {assignment.course_info?.code} - {assignment.course_info?.name}
                      </p>
                    </div>
                    <div className="assignment-meta">
                      <div className="due-date">
                        <span className="label">Due</span>
                        <span className={`date ${isUrgent ? 'urgent' : ''}`}>
                          {dueDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isUrgent && <span className="urgent-badge">Soon!</span>}
                      </div>
                      <div className="points">
                        <span className="label">Points</span>
                        <span className="value">{assignment.points_possible}</span>
                      </div>
                    </div>
                    <Link
                      to={`/courses/${assignment.course}/assignments/${assignment.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;
