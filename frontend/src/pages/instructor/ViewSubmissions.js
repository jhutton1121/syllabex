import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import './ViewSubmissions.css';

const ViewSubmissions = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentData, submissionsData] = await Promise.all([
          assignmentService.getAssignment(assignmentId),
          assignmentService.getSubmissions(assignmentId),
        ]);
        setAssignment(assignmentData);
        setSubmissions(submissionsData.results || submissionsData);
      } catch (err) {
        setError('Failed to load submissions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  const getGradingStatus = (submission) => {
    if (!submission.responses || submission.responses.length === 0) {
      return { status: 'pending', label: 'No Responses', color: '#94a3b8' };
    }

    const totalResponses = submission.responses.length;
    const gradedResponses = submission.responses.filter(r => r.points_earned !== null).length;
    const autoGradedResponses = submission.responses.filter(r => r.is_auto_graded).length;

    if (gradedResponses === totalResponses) {
      return { status: 'complete', label: 'Fully Graded', color: '#10b981' };
    } else if (gradedResponses > 0 || autoGradedResponses > 0) {
      return { 
        status: 'partial', 
        label: `${gradedResponses}/${totalResponses} Graded`, 
        color: '#f59e0b' 
      };
    }
    return { status: 'pending', label: 'Needs Grading', color: '#ef4444' };
  };

  const calculateTotalScore = (submission) => {
    if (!submission.responses || submission.responses.length === 0) return null;
    
    const totalEarned = submission.responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const totalPossible = submission.responses.reduce((sum, r) => sum + (r.question_info?.points || 0), 0);
    
    if (totalPossible === 0) return null;
    return { earned: totalEarned, possible: totalPossible };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submissions-error">
        <div className="error-icon">⚠️</div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const dueDate = assignment ? new Date(assignment.due_date) : null;
  const isPastDue = dueDate && dueDate < new Date();
  const totalStudents = submissions.length;
  const gradedCount = submissions.filter(s => getGradingStatus(s).status === 'complete').length;

  return (
    <div className="view-submissions-page">
      {/* Header */}
      <header className="submissions-header">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span className="separator">/</span>
          <Link to={`/courses/${courseId}`}>{assignment?.course_info?.code || 'Course'}</Link>
          <span className="separator">/</span>
          <span>{assignment?.title || 'Assignment'}</span>
        </div>

        <div className="header-content">
          <div className="header-info">
            <span className={`type-badge type-${assignment?.type}`}>
              {assignment?.type}
            </span>
            <h1>{assignment?.title}</h1>
            <p className="assignment-meta">
              Due: {dueDate ? formatDate(assignment.due_date) : 'N/A'}
              {isPastDue && <span className="past-due-badge">Past Due</span>}
            </p>
          </div>

          <div className="header-actions">
            <Link 
              to={`/courses/${courseId}/assignments/${assignmentId}/edit`}
              className="btn btn-secondary"
            >
              Edit Assignment
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="submissions-stats">
          <div className="stat-card">
            <span className="stat-icon">📥</span>
            <div className="stat-info">
              <span className="stat-value">{totalStudents}</span>
              <span className="stat-label">Total Submissions</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <span className="stat-value">{gradedCount}</span>
              <span className="stat-label">Fully Graded</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div className="stat-info">
              <span className="stat-value">{totalStudents - gradedCount}</span>
              <span className="stat-label">Needs Review</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⭐</span>
            <div className="stat-info">
              <span className="stat-value">{assignment?.points_possible || 0}</span>
              <span className="stat-label">Points Possible</span>
            </div>
          </div>
        </div>
      </header>

      {/* Submissions List */}
      <main className="submissions-content">
        {submissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No submissions yet</h3>
            <p>Students haven't submitted this assignment yet.</p>
          </div>
        ) : (
          <div className="submissions-table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const gradingStatus = getGradingStatus(submission);
                  const score = calculateTotalScore(submission);

                  return (
                    <tr key={submission.id}>
                      <td>
                        <div className="student-cell">
                          <span className="student-avatar">
                            {(submission.student_info?.first_name?.[0] || 
                              submission.student_info?.email?.[0] || '?').toUpperCase()}
                          </span>
                          <div className="student-info">
                            <span className="student-name">
                              {submission.student_info?.first_name && submission.student_info?.last_name
                                ? `${submission.student_info.first_name} ${submission.student_info.last_name}`
                                : submission.student_info?.email?.split('@')[0] || 'Unknown'}
                            </span>
                            <span className="student-email">{submission.student_info?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="submitted-date">
                          {formatDate(submission.submitted_at)}
                        </span>
                        {new Date(submission.submitted_at) > dueDate && (
                          <span className="late-badge">Late</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="grading-status"
                          style={{ backgroundColor: gradingStatus.color + '20', color: gradingStatus.color }}
                        >
                          {gradingStatus.label}
                        </span>
                        {assignment?.has_rubric && (
                          <span
                            className="grading-status"
                            style={{
                              marginLeft: '6px',
                              backgroundColor: submission.rubric_assessment
                                ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                              color: submission.rubric_assessment
                                ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {submission.rubric_assessment ? 'Rubric Graded' : 'Rubric Pending'}
                          </span>
                        )}
                      </td>
                      <td>
                        {score ? (
                          <span className="score">
                            <strong>{score.earned}</strong> / {score.possible}
                          </span>
                        ) : (
                          <span className="no-score">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/courses/${courseId}/assignments/${assignmentId}/submissions/${submission.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          {gradingStatus.status === 'complete' ? 'Review' : 'Grade'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="submissions-footer">
        <button onClick={() => navigate(`/courses/${courseId}`)} className="btn btn-secondary">
          ← Back to Course
        </button>
      </footer>
    </div>
  );
};

export default ViewSubmissions;
