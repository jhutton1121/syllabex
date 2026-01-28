import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import './TakeAssignment.css';

const TakeAssignment = () => {
  const { assignmentId, courseId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // Use student view to get assignment without correct answers
        const data = await assignmentService.getAssignmentForStudent(assignmentId);
        setAssignment(data);
        
        // Check if there's an existing submission
        if (data.existing_submission) {
          setSubmission(data.existing_submission);
        }
        
        // Initialize responses for each question
        const initialResponses = {};
        if (data.questions) {
          data.questions.forEach(q => {
            // Pre-fill with existing responses if available
            const existingResponse = data.existing_submission?.responses?.find(
              r => r.question === q.id || r.question_id === q.id
            );
            initialResponses[q.id] = existingResponse?.response_text || '';
          });
        }
        setResponses(initialResponses);
      } catch (err) {
        setError('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateResponses = () => {
    if (!assignment.questions || assignment.questions.length === 0) {
      return true; // No questions to validate
    }

    const unanswered = assignment.questions.filter(q => {
      const response = responses[q.id];
      return !response || (typeof response === 'string' && !response.trim());
    });

    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) unanswered.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateResponses()) {
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Format responses for the API
      const formattedResponses = Object.entries(responses).map(([questionId, responseText]) => ({
        question_id: parseInt(questionId),
        response_text: String(responseText)
      }));

      await assignmentService.submitAssignment(assignmentId, '', formattedResponses);
      setSuccess('Assignment submitted successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
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

  const getAnsweredCount = () => {
    if (!assignment?.questions) return 0;
    return assignment.questions.filter(q => {
      const response = responses[q.id];
      return response && (typeof response !== 'string' || response.trim());
    }).length;
  };

  const getTotalPoints = () => {
    if (!assignment?.questions) return 0;
    return assignment.questions.reduce((sum, q) => sum + q.points, 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Loading assignment...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container">
        <div className="alert alert-error">Assignment not found</div>
      </div>
    );
  }

  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();
  const hasStarted = assignment.has_started !== false; // Default to true if not provided
  const isAvailable = assignment.is_available !== false; // Default to true if not provided
  const isPastDue = isOverdue;
  const questions = assignment.questions || [];
  
  // Check if assignment is not yet available
  const notYetAvailable = !hasStarted || !isAvailable;
  
  // Check if assignment is closed (past due)
  const isClosed = isPastDue;
  
  // Check if student has already submitted
  const hasSubmitted = !!submission;
  
  // Student can only take assignment if it's available and not yet submitted
  const canTakeAssignment = !notYetAvailable && !isClosed && !hasSubmitted;
  
  // Show grades if past due date and has submission
  const showGrades = isPastDue && hasSubmitted;

  return (
    <div className="take-assignment-page">
      <div className="assignment-sidebar">
        <div className="sidebar-header">
          <span className={`assignment-type-badge type-${assignment.type}`}>
            {assignment.type}
          </span>
          <h2>{assignment.title}</h2>
          <p className="course-label">
            {assignment.course_info?.code} — {assignment.course_info?.name}
          </p>
        </div>

        <div className="sidebar-stats">
          {/* Start Date (if provided) */}
          {assignment.start_date && (
            <div className="stat-item">
              <span className="stat-icon">🚀</span>
              <div className="stat-content">
                <span className="stat-label">Opens</span>
                <span className="stat-value">
                  {new Date(assignment.start_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
                {!hasStarted && <span className="not-started-badge">NOT STARTED</span>}
              </div>
            </div>
          )}

          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-label">Due Date</span>
              <span className="stat-value">
                {dueDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
              {isOverdue && <span className="overdue-badge">OVERDUE</span>}
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <div className="stat-content">
              <span className="stat-label">Questions</span>
              <span className="stat-value">{questions.length}</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <div className="stat-content">
              <span className="stat-label">Total Points</span>
              <span className="stat-value">{getTotalPoints()}</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <span className="stat-label">Progress</span>
              <span className="stat-value">{getAnsweredCount()} / {questions.length}</span>
            </div>
          </div>
        </div>

        {assignment.description && (
          <div className="sidebar-description">
            <h4>Instructions</h4>
            <p>{assignment.description}</p>
          </div>
        )}

        <div className="sidebar-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${questions.length > 0 ? (getAnsweredCount() / questions.length) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {questions.length > 0 ? Math.round((getAnsweredCount() / questions.length) * 100) : 0}% Complete
          </span>
        </div>
      </div>

      <div className="assignment-main">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Show status messages based on availability */}
        {notYetAvailable && (
          <div className="availability-notice not-available">
            <span className="notice-icon">🔒</span>
            <h3>Assignment Not Yet Available</h3>
            <p>
              This assignment will open on{' '}
              {assignment.start_date && new Date(assignment.start_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {isClosed && !hasSubmitted && (
          <div className="availability-notice closed">
            <span className="notice-icon">⏰</span>
            <h3>Assignment Closed</h3>
            <p>
              The due date for this assignment was{' '}
              {dueDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {hasSubmitted && !showGrades && (
          <div className="availability-notice submitted">
            <span className="notice-icon">✅</span>
            <h3>Assignment Submitted</h3>
            <p>
              You submitted this assignment on{' '}
              {submission.submitted_at && new Date(submission.submitted_at).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
            <p className="grading-info">Your grades will be visible after the due date.</p>
          </div>
        )}

        {/* Show graded submission with teacher remarks */}
        {showGrades && (
          <div className="graded-submission">
            <div className="graded-header">
              <h3>Your Graded Submission</h3>
              <div className="grade-summary">
                <span className="grade-label">Score:</span>
                <span className="grade-value">
                  {submission.responses?.reduce((sum, r) => sum + (r.points_earned || 0), 0)} / {' '}
                  {submission.responses?.reduce((sum, r) => sum + (r.question_info?.points || 0), 0)} pts
                </span>
              </div>
            </div>
            
            <div className="questions-container">
              {submission.responses?.map((response, index) => (
                <GradedQuestionCard
                  key={response.id}
                  response={response}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Show assignment form if available and not submitted */}
        {canTakeAssignment && (
          <form onSubmit={handleSubmit}>
            {questions.length === 0 ? (
              <div className="no-questions-notice">
                <span className="notice-icon">📋</span>
                <h3>No questions available</h3>
                <p>This assignment doesn't have any questions yet.</p>
              </div>
            ) : (
              <div className="questions-container">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    value={responses[question.id]}
                    onChange={(value) => handleResponseChange(question.id, value)}
                    disabled={submitting || success}
                  />
                ))}
              </div>
            )}

            <div className="submission-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                ← Back to Dashboard
              </button>
              
              {questions.length > 0 && (
                <button
                  type="submit"
                  className="btn btn-success btn-submit"
                  disabled={submitting || success}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Assignment'
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Back button for non-takeable assignments */}
        {!canTakeAssignment && !showGrades && (
          <div className="submission-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const GradedQuestionCard = ({ response, index }) => {
  const question = response.question_info || {};
  const pointsEarned = response.points_earned ?? 0;
  const pointsPossible = question.points || 0;
  const teacherRemarks = response.teacher_remarks;
  
  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'numerical': return 'Numerical';
      case 'text_response': return 'Written Response';
      default: return type;
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return '◉';
      case 'numerical': return '#';
      case 'text_response': return '✎';
      default: return '?';
    }
  };

  const getGradeColor = () => {
    const percentage = (pointsEarned / pointsPossible) * 100;
    if (percentage >= 90) return '#10b981';
    if (percentage >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="question-card graded">
      <div className="question-header">
        <div className="question-number">
          <span className="q-num">Q{index + 1}</span>
          <span className="q-type-icon" title={getQuestionTypeLabel(question.question_type)}>
            {getQuestionTypeIcon(question.question_type)}
          </span>
        </div>
        <div className="question-meta">
          <span className="question-type-label">{getQuestionTypeLabel(question.question_type)}</span>
          <span className="question-grade" style={{ backgroundColor: getGradeColor() + '20', color: getGradeColor() }}>
            {pointsEarned} / {pointsPossible} pts
          </span>
        </div>
      </div>

      <div className="question-text">
        {question.text}
      </div>

      <div className="question-answer graded-answer">
        <div className="your-answer">
          <h4>Your Answer:</h4>
          {question.question_type === 'multiple_choice' ? (
            <div className="mc-display">
              {question.choices?.map((choice, idx) => {
                const isSelected = String(response.response_text) === String(choice.id);
                const isCorrect = choice.is_correct;
                
                return isSelected ? (
                  <div key={choice.id} className={`selected-choice ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="choice-text">{choice.text}</span>
                    <span className="choice-indicator">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="response-text">{response.response_text || 'No answer'}</p>
          )}
        </div>

        {teacherRemarks && (
          <div className="teacher-remarks">
            <h4>Teacher's Feedback:</h4>
            <p>{teacherRemarks}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const QuestionCard = ({ question, index, value, onChange, disabled }) => {
  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'numerical': return 'Numerical';
      case 'text_response': return 'Written Response';
      default: return type;
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return '◉';
      case 'numerical': return '#';
      case 'text_response': return '✎';
      default: return '?';
    }
  };

  return (
    <div className={`question-card ${value ? 'answered' : ''}`}>
      <div className="question-header">
        <div className="question-number">
          <span className="q-num">Q{index + 1}</span>
          <span className="q-type-icon" title={getQuestionTypeLabel(question.question_type)}>
            {getQuestionTypeIcon(question.question_type)}
          </span>
        </div>
        <div className="question-meta">
          <span className="question-type-label">{getQuestionTypeLabel(question.question_type)}</span>
          <span className="question-points">{question.points} {question.points === 1 ? 'pt' : 'pts'}</span>
        </div>
      </div>

      <div className="question-text">
        {question.text}
      </div>

      <div className="question-answer">
        {question.question_type === 'multiple_choice' && (
          <MultipleChoiceInput
            choices={question.choices || []}
            value={value}
            onChange={onChange}
            disabled={disabled}
            questionId={question.id}
          />
        )}

        {question.question_type === 'numerical' && (
          <NumericalInput
            value={value}
            onChange={onChange}
            disabled={disabled}
            questionId={question.id}
          />
        )}

        {question.question_type === 'text_response' && (
          <TextResponseInput
            value={value}
            onChange={onChange}
            disabled={disabled}
            questionId={question.id}
          />
        )}
      </div>
    </div>
  );
};

const MultipleChoiceInput = ({ choices, value, onChange, disabled, questionId }) => {
  const sortedChoices = [...choices].sort((a, b) => a.order - b.order);

  return (
    <div className="multiple-choice-options">
      {sortedChoices.map((choice, idx) => (
        <label 
          key={choice.id} 
          className={`choice-option ${String(value) === String(choice.id) ? 'selected' : ''}`}
        >
          <input
            type="radio"
            name={`question-${questionId}`}
            value={choice.id}
            checked={String(value) === String(choice.id)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
          <span className="choice-text">{choice.text}</span>
          <span className="choice-check">✓</span>
        </label>
      ))}
    </div>
  );
};

const NumericalInput = ({ value, onChange, disabled, questionId }) => {
  return (
    <div className="numerical-input-container">
      <label htmlFor={`numerical-${questionId}`} className="numerical-label">
        Enter your numerical answer:
      </label>
      <input
        id={`numerical-${questionId}`}
        type="number"
        step="any"
        className="numerical-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., 42 or 3.14159"
        disabled={disabled}
      />
      <span className="numerical-hint">
        You can enter whole numbers or decimals
      </span>
    </div>
  );
};

const TextResponseInput = ({ value, onChange, disabled, questionId }) => {
  const wordCount = value ? value.trim().split(/\s+/).filter(w => w).length : 0;

  return (
    <div className="text-response-container">
      <label htmlFor={`text-${questionId}`} className="text-label">
        Write your answer below:
      </label>
      <textarea
        id={`text-${questionId}`}
        className="text-response-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your response here..."
        rows="6"
        disabled={disabled}
      />
      <div className="text-response-footer">
        <span className="word-count">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        <span className="grading-notice">This question will be graded manually by your instructor</span>
      </div>
    </div>
  );
};

export default TakeAssignment;
