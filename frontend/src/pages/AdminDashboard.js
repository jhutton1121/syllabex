import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import courseService from '../services/courseService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalInstructors: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesData = await courseService.getCourses();
        const coursesList = coursesData.results || coursesData;
        setCourses(coursesList);

        // Calculate stats
        const activeCourses = coursesList.filter(c => c.is_active).length;
        const totalStudents = coursesList.reduce((sum, c) => sum + (c.student_count || 0), 0);
        const totalInstructors = coursesList.reduce((sum, c) => sum + (c.instructor_count || 0), 0);

        setStats({
          totalCourses: coursesList.length,
          activeCourses,
          totalStudents,
          totalInstructors,
        });
      } catch (err) {
        setError('Failed to load admin data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Welcome, {user?.email}</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon courses">📚</div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalCourses}</span>
              <span className="stat-label">Total Courses</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">✅</div>
            <div className="stat-info">
              <span className="stat-number">{stats.activeCourses}</span>
              <span className="stat-label">Active Courses</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon students">👨‍🎓</div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalStudents}</span>
              <span className="stat-label">Total Enrollments</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon instructors">👨‍🏫</div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalInstructors}</span>
              <span className="stat-label">Total Instructors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/courses" className="action-card">
            <span className="action-icon">📚</span>
            <span className="action-title">Manage Courses</span>
            <span className="action-desc">Create, edit, and manage courses</span>
          </Link>
          <Link to="/admin/users" className="action-card">
            <span className="action-icon">👥</span>
            <span className="action-title">Manage Users</span>
            <span className="action-desc">View and manage user accounts</span>
          </Link>
          <Link to="/admin/courses/create" className="action-card highlight">
            <span className="action-icon">➕</span>
            <span className="action-title">Create Course</span>
            <span className="action-desc">Add a new course to the system</span>
          </Link>
        </div>
      </section>

      {/* Recent Courses */}
      <section className="recent-courses-section">
        <div className="section-header">
          <h2>Recent Courses</h2>
          <Link to="/admin/courses" className="view-all">View All →</Link>
        </div>
        {courses.length === 0 ? (
          <div className="empty-state">
            <p>No courses yet. Create your first course to get started.</p>
          </div>
        ) : (
          <div className="courses-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Instructors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 5).map((course) => (
                  <tr key={course.id}>
                    <td>
                      <span className="course-code">{course.code}</span>
                    </td>
                    <td>{course.name}</td>
                    <td>
                      <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{course.student_count}</td>
                    <td>{course.instructor_count}</td>
                    <td>
                      <Link to={`/admin/courses/${course.id}`} className="btn btn-sm btn-secondary">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
