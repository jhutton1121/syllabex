import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assignmentService from '../services/assignmentService';
import './TakeAssignment.css';

const TakeAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await assignmentService.getAssignment(id);
        setAssignment(data);
      } catch (err) {
        setError('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Please provide an answer before submitting');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await assignmentService.submitAssignment(id, answer);
      setSuccess('Assignment submitted successfully!');
      
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const errorMsg = errorData.non_field_errors?.[0] || 
                        errorData.detail || 
                        Object.values(errorData)[0];
        setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      } else {
        setError('Failed to submit assignment. You may have already submitted it.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading assignment...</div>;
  }

  if (!assignment) {
    return (
      <div className="container">
        <div className="alert alert-error">Assignment not found</div>
      </div>
    );
  }

  const isOverdue = new Date(assignment.due_date) < new Date();

  return (
    <div className="container">
      <div className="take-assignment-container">
        <div className="card">
          <div className="assignment-header">
            <div>
              <h1>{assignment.title}</h1>
              <p className="assignment-meta">
                {assignment.course_info?.code} - {assignment.course_info?.name}
              </p>
            </div>
            <span className={`assignment-type type-${assignment.type}`}>
              {assignment.type}
            </span>
          </div>

          <div className="assignment-details">
            <div className="detail-item">
              <strong>Due Date:</strong>{' '}
              {new Date(assignment.due_date).toLocaleDateString()} at{' '}
              {new Date(assignment.due_date).toLocaleTimeString()}
              {isOverdue && <span className="overdue-badge">OVERDUE</span>}
            </div>
            <div className="detail-item">
              <strong>Points Possible:</strong> {assignment.points_possible}
            </div>
          </div>

          {assignment.description && (
            <div className="assignment-description">
              <h3>Description:</h3>
              <p>{assignment.description}</p>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="answer">Your Answer *</label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows="15"
                required
                disabled={submitting || success}
              />
              <small className="form-hint">
                Please provide a complete answer to the assignment.
              </small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting || success}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/student/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TakeAssignment;
