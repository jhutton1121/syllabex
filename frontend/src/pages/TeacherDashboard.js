import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import courseService from '../services/courseService';
import assignmentService from '../services/assignmentService';
import './Dashboard.css';

const TeacherDashboard = () => {
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
    return <div className="loading">Loading dashboard...</div>;
  }

  const recentAssignments = assignments.slice(0, 5);

  return (
    <div className="container">
      <h1>Welcome, Teacher!</h1>
      <p className="subtitle">Email: {user?.email}</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-actions">
        <button
          onClick={() => navigate('/teacher/courses/create')}
          className="btn btn-primary"
        >
          Create New Course
        </button>
        <button
          onClick={() => navigate('/teacher/assignments/create')}
          className="btn btn-success"
        >
          Create New Assignment
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Teaching Courses */}
        <div className="card">
          <div className="card-header">My Courses</div>
          {courses.length === 0 ? (
            <p>You are not teaching any courses yet.</p>
          ) : (
            <div className="courses-list">
              {courses.map((course) => (
                <div key={course.id} className="course-item">
                  <h3>{course.code} - {course.name}</h3>
                  <p>{course.description}</p>
                  <p className="course-meta">
                    Active Enrollments: {course.enrollment_count || 0}
                  </p>
                  <div className="course-actions">
                    <Link
                      to={`/teacher/courses/${course.id}/students`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Students
                    </Link>
                    <Link
                      to={`/teacher/gradebook/${course.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Gradebook
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="card">
          <div className="card-header">Recent Assignments</div>
          {recentAssignments.length === 0 ? (
            <p>No assignments created yet.</p>
          ) : (
            <div className="assignments-list">
              {recentAssignments.map((assignment) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-header">
                    <h4>{assignment.title}</h4>
                    <span className={`assignment-type type-${assignment.type}`}>
                      {assignment.type}
                    </span>
                  </div>
                  <p className="assignment-course">
                    {assignment.course_info?.code} - {assignment.course_info?.name}
                  </p>
                  <p className="assignment-due">
                    Due: {new Date(assignment.due_date).toLocaleDateString()} at{' '}
                    {new Date(assignment.due_date).toLocaleTimeString()}
                  </p>
                  <p className="assignment-points">
                    Submissions: {assignment.submission_count || 0}
                  </p>
                  <div className="assignment-actions">
                    <Link
                      to={`/teacher/assignments/${assignment.id}/edit`}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/teacher/assignments/${assignment.id}/submissions`}
                      className="btn btn-primary btn-sm"
                    >
                      View Submissions
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
