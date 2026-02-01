import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import RichContent from '../../components/RichContent';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
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

  // Sort assignments by due date
  const upcomingAssignments = assignments
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="container">
      <h1>Welcome, Student!</h1>
      <p className="subtitle">Email: {user?.email}</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        {/* Enrolled Courses */}
        <div className="card">
          <div className="card-header">My Courses</div>
          {courses.length === 0 ? (
            <p>You are not enrolled in any courses yet.</p>
          ) : (
            <div className="courses-list">
              {courses.map((course) => (
                <div key={course.id} className="course-item">
                  <h3>{course.code} - {course.name}</h3>
                  <RichContent html={course.description} />
                  <p className="course-meta">
                    Teacher: {course.teacher_info?.user_email || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className="card-header">Upcoming Assignments</div>
          {upcomingAssignments.length === 0 ? (
            <p>No assignments at the moment.</p>
          ) : (
            <div className="assignments-list">
              {upcomingAssignments.map((assignment) => (
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
                    Points: {assignment.points_possible}
                  </p>
                  <Link
                    to={`/student/assignments/${assignment.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Assignment
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
