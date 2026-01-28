import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import gradebookService from '../../services/gradebookService';
import CourseSubNav from './components/CourseSubNav';
import CourseSyllabus from './components/CourseSyllabus';
import CourseQuizzes from './components/CourseQuizzes';
import CourseTests from './components/CourseTests';
import CourseCourseCalendar from './components/CourseCourseCalendar';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [subNavCollapsed, setSubNavCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isInstructor = course?.user_role === 'instructor';
  const isStudent = course?.user_role === 'student';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseData = await courseService.getCourse(courseId);
        setCourse(courseData);

        const assignmentsData = await assignmentService.getAssignments(courseId);
        setAssignments(assignmentsData.results || assignmentsData);

        // Instructors can see students and gradebook
        if (courseData.user_role === 'instructor') {
          const studentsData = await courseService.getCourseStudents(courseId);
          setStudents(studentsData);
          
          try {
            const gradebookData = await gradebookService.getCourseGradebook(courseId);
            setGrades(gradebookData);
          } catch (e) {
            console.log('No gradebook data yet');
          }
        }

        // Students can see their own grades and submissions
        if (courseData.user_role === 'student' && user) {
          try {
            const myGrades = await gradebookService.getStudentGrades(user.id);
            setGrades(myGrades);
          } catch (e) {
            console.log('No grades yet');
          }

          try {
            const mySubmissions = await assignmentService.getMySubmissions();
            // Filter submissions for this course only
            const courseSubmissions = mySubmissions.filter(
              sub => sub.assignment_info?.course === parseInt(courseId)
            );
            setSubmissions(courseSubmissions);
          } catch (e) {
            console.log('No submissions yet');
          }
        }

      } catch (err) {
        setError('Failed to load course data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user]);

  if (loading) {
    return (
      <div className="course-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-error">
        <h2>Course Not Found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Sort assignments by due date
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  // Calculate assignment counters
  const now = new Date();
  const totalAssignments = assignments.length;

  // Create a map of assignment IDs to submissions
  const submissionMap = {};
  submissions.forEach(sub => {
    submissionMap[sub.assignment] = sub;
  });

  // For students: calculate based on submission status
  let upcomingAssignments = 0;
  let completedAssignments = 0;
  let lateSubmissions = 0;
  let pastDueAssignments = 0;

  if (isStudent) {
    assignments.forEach(a => {
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      const startDate = a.start_date ? new Date(a.start_date) : null;
      const hasStarted = !startDate || startDate <= now;
      const submission = submissionMap[a.id];

      if (submission) {
        const submittedAt = new Date(submission.submitted_at);
        // Check if submitted before or after due date
        if (dueDate && submittedAt > dueDate) {
          lateSubmissions++;
        } else {
          completedAssignments++;
        }
      } else {
        // Not submitted
        if (dueDate && dueDate >= now && hasStarted) {
          upcomingAssignments++;
        } else if (dueDate && dueDate < now) {
          pastDueAssignments++;
        }
      }
    });
  } else {
    // For instructors: simpler view (no submission tracking)
    upcomingAssignments = assignments.filter(a => {
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      const startDate = a.start_date ? new Date(a.start_date) : null;
      const hasStarted = !startDate || startDate <= now;
      return dueDate && dueDate >= now && hasStarted;
    }).length;
    pastDueAssignments = assignments.filter(a => {
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      return dueDate && dueDate < now;
    }).length;
  }

  return (
    <div className="course-detail-container">
      {/* Course Header */}
      <header className="course-header">
        <div className="course-header-content">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span className="separator">/</span>
            <span>{course.code}</span>
          </div>
          <div className="course-title-row">
            <div className="course-title-info">
              <span className={`role-badge ${course.user_role}`}>
                {isInstructor ? '👨‍🏫 Instructor' : '👨‍🎓 Student'}
              </span>
              <h1>{course.code}</h1>
              <h2>{course.name}</h2>
            </div>
            {isInstructor && (
              <div className="course-actions">
                <button
                  onClick={() => navigate(`/courses/${courseId}/assignments/create`)}
                  className="btn btn-primary"
                >
                  + New Assignment
                </button>
              </div>
            )}
          </div>
          {course.description && (
            <p className="course-description">{course.description}</p>
          )}
          <div className="course-meta">
            <div className="meta-item">
              <span className="meta-label">Students</span>
              <span className="meta-value">{course.student_count}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Instructors</span>
              <span className="meta-value">{course.instructor_count}</span>
            </div>
          </div>
          <div className="assignment-stats-cards">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <div className="stat-number">{totalAssignments}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            <div className="stat-card stat-upcoming">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <div className="stat-number">{upcomingAssignments}</div>
                <div className="stat-label">Upcoming</div>
              </div>
            </div>
            {isStudent && (
              <>
                <div className="stat-card stat-completed">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <div className="stat-number">{completedAssignments}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                </div>
                <div className="stat-card stat-late">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <div className="stat-number">{lateSubmissions}</div>
                    <div className="stat-label">Late</div>
                  </div>
                </div>
              </>
            )}
            <div className="stat-card stat-pastdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <div className="stat-number">{pastDueAssignments}</div>
                <div className="stat-label">{isStudent ? 'Missing' : 'Past Due'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Course Content with Sub-Navigation */}
      <div className={`course-content-layout ${subNavCollapsed ? 'sub-nav-collapsed' : ''}`}>
        <CourseSubNav
          activeView={activeView}
          onViewChange={setActiveView}
          isInstructor={isInstructor}
          isStudent={isStudent}
          collapsed={subNavCollapsed}
          onToggleCollapse={() => setSubNavCollapsed(!subNavCollapsed)}
        />

        <div className="course-main-content">
          {/* Overview View */}
          {activeView === 'overview' && (
            <div className="overview-view">
              <h2>Course Overview</h2>
              {course.description && (
                <div className="overview-section">
                  <h3>About This Course</h3>
                  <p>{course.description}</p>
                </div>
              )}
              <div className="overview-info">
                <p>Welcome to {course.name}! Use the navigation on the left to explore course content, view assignments, check your grades, and more.</p>
              </div>
            </div>
          )}

          {/* Syllabus View */}
          {activeView === 'syllabus' && (
            <CourseSyllabus course={course} isInstructor={isInstructor} />
          )}

          {/* Quizzes View */}
          {activeView === 'quizzes' && (
            <CourseQuizzes
              assignments={assignments}
              courseId={courseId}
              isInstructor={isInstructor}
            />
          )}

          {/* Tests View */}
          {activeView === 'tests' && (
            <CourseTests
              assignments={assignments}
              courseId={courseId}
              isInstructor={isInstructor}
            />
          )}

          {/* Course Calendar View */}
          {activeView === 'calendar' && (
            <CourseCourseCalendar course={course} assignments={assignments} />
          )}

          {/* Assignments View */}
          {activeView === 'assignments' && (
            <div className="assignments-view">
            {sortedAssignments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No assignments yet</h3>
                {isInstructor ? (
                  <p>Create your first assignment to get started.</p>
                ) : (
                  <p>Your instructor hasn't posted any assignments yet.</p>
                )}
              </div>
            ) : (
              <div className="assignments-grid">
                {sortedAssignments.map((assignment) => {
                  const dueDate = new Date(assignment.due_date);
                  const startDate = assignment.start_date ? new Date(assignment.start_date) : null;
                  const now = new Date();
                  const isOverdue = assignment.is_overdue;
                  
                  // Determine availability status
                  const hasStarted = !startDate || startDate <= now;
                  const isPastDue = dueDate < now;
                  const isOpen = hasStarted && !isPastDue;
                  const isNotStarted = !hasStarted;
                  const isClosed = isPastDue;
                  
                  // For instructors: check if editable (before start date)
                  const isEditable = !startDate || startDate > now;
                  
                  return (
                    <div 
                      key={assignment.id} 
                      className={`assignment-card ${isOverdue ? 'overdue' : ''} ${isNotStarted ? 'not-started' : ''}`}
                    >
                      <div className="assignment-card-header">
                        <div className="header-badges">
                          <span className={`type-badge type-${assignment.type}`}>
                            {assignment.type}
                          </span>
                          {/* Availability Badge */}
                          {isNotStarted && <span className="availability-badge not-started">Not Started</span>}
                          {isOpen && <span className="availability-badge open">Open</span>}
                          {isClosed && <span className="availability-badge closed">Closed</span>}
                          {/* Editable Badge for Instructors */}
                          {isInstructor && isEditable && !isClosed && (
                            <span className="editable-badge">✏️ Editable</span>
                          )}
                        </div>
                      </div>
                      <div className="assignment-card-body">
                        <h3>{assignment.title}</h3>
                        {assignment.description && (
                          <p className="description">{assignment.description}</p>
                        )}
                      </div>
                      <div className="assignment-card-footer">
                        <div className="assignment-stats">
                          {/* Start Date (if exists) */}
                          {startDate && (
                            <div className="stat">
                              <span className="stat-label">Opens</span>
                              <span className="stat-value">
                                {startDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                          <div className="stat">
                            <span className="stat-label">Due</span>
                            <span className={`stat-value ${isOverdue ? 'overdue' : ''}`}>
                              {dueDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Points</span>
                            <span className="stat-value">{assignment.points_possible}</span>
                          </div>
                          {isInstructor && (
                            <div className="stat">
                              <span className="stat-label">Submissions</span>
                              <span className="stat-value">{assignment.submission_count || 0}</span>
                            </div>
                          )}
                        </div>
                        <div className="assignment-actions">
                          {isStudent ? (
                            <Link
                              to={`/courses/${courseId}/assignments/${assignment.id}`}
                              className={`btn btn-primary btn-sm ${isNotStarted ? 'disabled' : ''}`}
                              style={isNotStarted ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                            >
                              {isNotStarted ? 'Not Available' : 'View / Submit'}
                            </Link>
                          ) : (
                            <>
                              <Link
                                to={`/courses/${courseId}/assignments/${assignment.id}/edit`}
                                className="btn btn-secondary btn-sm"
                              >
                                Edit
                              </Link>
                              <Link
                                to={`/courses/${courseId}/assignments/${assignment.id}/submissions`}
                                className="btn btn-primary btn-sm"
                              >
                                Submissions
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          )}

          {/* Roster View (Instructor only) */}
          {activeView === 'roster' && isInstructor && (
          <div className="students-tab">
            {students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No students enrolled</h3>
                <p>Students will appear here once they're added to the course.</p>
              </div>
            ) : (
              <div className="students-list">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((membership) => (
                      <tr key={membership.id}>
                        <td>
                          <div className="student-name">
                            <span className="avatar">
                              {(membership.user_info?.first_name?.[0] || membership.user_info?.email[0]).toUpperCase()}
                            </span>
                            {membership.user_info?.first_name && membership.user_info?.last_name
                              ? `${membership.user_info.first_name} ${membership.user_info.last_name}`
                              : membership.user_info?.email.split('@')[0]}
                          </div>
                        </td>
                        <td>{membership.user_info?.email}</td>
                        <td>
                          <span className={`status-badge ${membership.status}`}>
                            {membership.status}
                          </span>
                        </td>
                        <td>
                          {new Date(membership.enrolled_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

          {/* Gradebook View (Instructor only) */}
          {activeView === 'gradebook' && isInstructor && (
          <div className="gradebook-tab">
            {!grades || grades.students?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No grades recorded</h3>
                <p>Grades will appear here once students submit assignments.</p>
              </div>
            ) : (
              <div className="gradebook-table-wrapper">
                <table className="gradebook-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Student</th>
                      {grades.assignments?.map((a) => (
                        <th key={a.id} className="assignment-col">
                          <div className="assignment-header">
                            <span className="assignment-title">{a.title}</span>
                            <span className="assignment-points">{a.points_possible} pts</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.students?.map((student) => (
                      <tr key={student.membership_id}>
                        <td className="sticky-col">
                          <div className="student-info">
                            <span className="student-name">{student.user_name || student.user_email}</span>
                          </div>
                        </td>
                        {student.grades?.map((grade, idx) => (
                          <td key={idx} className="grade-cell">
                            {grade.grade !== null ? (
                              <span className={`grade ${grade.letter_grade}`}>
                                {grade.grade}
                              </span>
                            ) : (
                              <span className="no-grade">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

          {/* Student Grades View */}
          {activeView === 'grades' && isStudent && (
          <div className="student-grades-tab">
            {!grades || grades.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                <h3>No grades yet</h3>
                <p>Your grades will appear here once your assignments are graded.</p>
              </div>
            ) : (
              <div className="grades-list">
                {Array.isArray(grades) && grades.map((grade) => (
                  <div key={grade.id} className="grade-card">
                    <div className="grade-info">
                      <h4>{grade.assignment_info?.title}</h4>
                      <p>{grade.assignment_info?.type}</p>
                    </div>
                    <div className="grade-score">
                      <span className="score">{grade.grade} / {grade.assignment_info?.points_possible}</span>
                      <span className={`letter-grade ${grade.letter_grade}`}>
                        {grade.letter_grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
