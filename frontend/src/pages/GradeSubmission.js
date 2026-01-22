import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import assignmentService from '../services/assignmentService';
import './GradeSubmission.css';

const GradeSubmission = () => {
  const { courseId, assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [grades, setGrades] = useState({});
  const [remarks, setRemarks] = useState({});
  const [savingStates, setSavingStates] = useState({});
  const [savedStates, setSavedStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionData, assignmentData] = await Promise.all([
          assignmentService.getSubmission(submissionId),
          assignmentService.getAssignment(assignmentId),
        ]);
        setSubmission(submissionData);
        setAssignment(assignmentData);

        // Initialize grades and remarks from existing data
        const initialGrades = {};
        const initialRemarks = {};
        
        if (submissionData.responses) {
          submissionData.responses.forEach(response => {
            initialGrades[response.id] = response.points_earned ?? '';
            initialRemarks[response.id] = response.teacher_remarks || '';
          });
        }
        
        setGrades(initialGrades);
        setRemarks(initialRemarks);
      } catch (err) {
        setError('Failed to load submission');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, assignmentId]);

  const handleGradeChange = (responseId, value) => {
    setGrades(prev => ({
      ...prev,
      [responseId]: value,
    }));
    // Clear saved state when user makes changes
    setSavedStates(prev => ({ ...prev, [responseId]: false }));
  };

  const handleRemarksChange = (responseId, value) => {
    setRemarks(prev => ({
      ...prev,
      [responseId]: value,
    }));
    // Clear saved state when user makes changes
    setSavedStates(prev => ({ ...prev, [responseId]: false }));
  };

  const handleSaveGrade = async (responseId) => {
    const pointsEarned = parseFloat(grades[responseId]);
    const teacherRemarks = remarks[responseId] || '';

    if (isNaN(pointsEarned) || pointsEarned < 0) {
      alert('Please enter a valid score (0 or greater)');
      return;
    }

    const response = submission.responses.find(r => r.id === responseId);
    if (pointsEarned > response.question_info?.points) {
      const confirm = window.confirm(
        `Score (${pointsEarned}) exceeds maximum points (${response.question_info?.points}). Continue anyway?`
      );
      if (!confirm) return;
    }

    setSavingStates(prev => ({ ...prev, [responseId]: true }));

    try {
      await assignmentService.gradeResponse(submissionId, responseId, pointsEarned, teacherRemarks);
      setSavedStates(prev => ({ ...prev, [responseId]: true }));

      // Update local submission data
      setSubmission(prev => ({
        ...prev,
        responses: prev.responses.map(r =>
          r.id === responseId
            ? { ...r, points_earned: pointsEarned, teacher_remarks: teacherRemarks }
            : r
        ),
      }));
    } catch (err) {
      alert('Failed to save grade. Please try again.');
      console.error(err);
    } finally {
      setSavingStates(prev => ({ ...prev, [responseId]: false }));
    }
  };

  const handleSaveAll = async () => {
    const responses = submission?.responses || [];
    const responsesToGrade = responses.filter(r => {
      const grade = grades[r.id];
      return grade !== '' && !isNaN(parseFloat(grade));
    });

    for (const response of responsesToGrade) {
      if (!savedStates[response.id]) {
        await handleSaveGrade(response.id);
      }
    }
  };

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const calculateTotalScore = () => {
    if (!submission?.responses) return { earned: 0, possible: 0 };
    
    const earned = submission.responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const possible = submission.responses.reduce((sum, r) => sum + (r.question_info?.points || 0), 0);
    
    return { earned, possible };
  };

  const getGradingProgress = () => {
    if (!submission?.responses || submission.responses.length === 0) return 0;
    const graded = submission.responses.filter(r => r.points_earned !== null).length;
    return Math.round((graded / submission.responses.length) * 100);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Loading submission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grading-error">
        <div className="error-icon">⚠️</div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const responses = submission?.responses || [];
  const totalScore = calculateTotalScore();
  const gradingProgress = getGradingProgress();

  return (
    <div className="grade-submission-page">
      {/* Sidebar */}
      <aside className="grading-sidebar">
        <div className="sidebar-header">
          <Link to={`/courses/${courseId}/assignments/${assignmentId}/submissions`} className="back-link">
            ← Back to Submissions
          </Link>
          
          <div className="student-card">
            <span className="student-avatar">
              {(submission?.student_info?.first_name?.[0] || 
                submission?.student_info?.email?.[0] || '?').toUpperCase()}
            </span>
            <div className="student-details">
              <h2>
                {submission?.student_info?.first_name && submission?.student_info?.last_name
                  ? `${submission.student_info.first_name} ${submission.student_info.last_name}`
                  : submission?.student_info?.email?.split('@')[0] || 'Student'}
              </h2>
              <p>{submission?.student_info?.email}</p>
            </div>
          </div>
        </div>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-label">Submitted</span>
              <span className="stat-value">
                {submission?.submitted_at ? formatDate(submission.submitted_at) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <div className="stat-content">
              <span className="stat-label">Questions</span>
              <span className="stat-value">{responses.length}</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <div className="stat-content">
              <span className="stat-label">Current Score</span>
              <span className="stat-value">{totalScore.earned} / {totalScore.possible}</span>
            </div>
          </div>
        </div>

        <div className="grading-progress-section">
          <h4>Grading Progress</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${gradingProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">{gradingProgress}% Complete</span>
        </div>

        <div className="sidebar-actions">
          <button 
            className="btn btn-primary btn-block"
            onClick={handleSaveAll}
          >
            Save All Grades
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="grading-main">
        <header className="grading-header">
          <div className="assignment-info">
            <span className={`type-badge type-${assignment?.type}`}>
              {assignment?.type}
            </span>
            <h1>{assignment?.title}</h1>
          </div>
        </header>

        {responses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No responses to grade</h3>
            <p>This submission doesn't have any responses.</p>
          </div>
        ) : (
          <div className="responses-container">
            {responses.map((response, index) => {
              const question = response.question_info || {};
              const isAutoGraded = response.is_auto_graded;
              const isSaving = savingStates[response.id];
              const isSaved = savedStates[response.id];

              return (
                <div key={response.id} className={`response-card ${isAutoGraded ? 'auto-graded' : ''}`}>
                  <div className="response-header">
                    <div className="question-number">
                      <span className="q-num">Q{index + 1}</span>
                      <span className="q-type-icon" title={getQuestionTypeLabel(question.question_type)}>
                        {getQuestionTypeIcon(question.question_type)}
                      </span>
                    </div>
                    <div className="question-meta">
                      <span className="question-type-label">{getQuestionTypeLabel(question.question_type)}</span>
                      <span className="question-points">{question.points} {question.points === 1 ? 'pt' : 'pts'}</span>
                      {isAutoGraded && <span className="auto-grade-badge">Auto-Graded</span>}
                    </div>
                  </div>

                  <div className="question-text">
                    {question.text}
                  </div>

                  {/* Student's Response */}
                  <div className="student-response">
                    <h4>Student's Answer:</h4>
                    {question.question_type === 'multiple_choice' ? (
                      <div className="mc-response">
                        {question.choices?.map((choice, idx) => {
                          const isSelected = String(response.response_text) === String(choice.id);
                          const isCorrect = choice.is_correct;
                          
                          return (
                            <div 
                              key={choice.id} 
                              className={`mc-choice ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''}`}
                            >
                              <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
                              <span className="choice-text">{choice.text}</span>
                              {isSelected && (
                                <span className={`choice-indicator ${isCorrect ? 'correct' : 'incorrect'}`}>
                                  {isCorrect ? '✓' : '✗'}
                                </span>
                              )}
                              {isCorrect && !isSelected && (
                                <span className="correct-answer-indicator">✓ Correct</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : question.question_type === 'numerical' ? (
                      <div className="numerical-response">
                        <div className="response-value">
                          <span className="label">Student's Answer:</span>
                          <span className="value">{response.response_text || 'No answer'}</span>
                        </div>
                        <div className="response-value">
                          <span className="label">Correct Answer:</span>
                          <span className="value correct">{question.correct_answer}</span>
                        </div>
                        {question.tolerance && (
                          <div className="response-value">
                            <span className="label">Tolerance:</span>
                            <span className="value">± {question.tolerance}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-response">
                        <p>{response.response_text || <em>No response provided</em>}</p>
                      </div>
                    )}
                  </div>

                  {/* Grading Section */}
                  <div className="grading-section">
                    <div className="grade-input-row">
                      <div className="grade-input-group">
                        <label>Points Earned:</label>
                        <div className="points-input-wrapper">
                          <input
                            type="number"
                            min="0"
                            max={question.points}
                            step="0.5"
                            value={grades[response.id] ?? ''}
                            onChange={(e) => handleGradeChange(response.id, e.target.value)}
                            className="points-input"
                            placeholder="0"
                          />
                          <span className="max-points">/ {question.points}</span>
                        </div>
                      </div>

                      <button
                        className={`btn btn-save ${isSaved ? 'saved' : ''}`}
                        onClick={() => handleSaveGrade(response.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <><span className="btn-spinner"></span> Saving...</>
                        ) : isSaved ? (
                          <>✓ Saved</>
                        ) : (
                          'Save Grade'
                        )}
                      </button>
                    </div>

                    <div className="remarks-group">
                      <label>Teacher Remarks (Optional):</label>
                      <textarea
                        value={remarks[response.id] || ''}
                        onChange={(e) => handleRemarksChange(response.id, e.target.value)}
                        placeholder="Add feedback for the student..."
                        rows="3"
                        className="remarks-input"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="grading-footer">
          <Link 
            to={`/courses/${courseId}/assignments/${assignmentId}/submissions`} 
            className="btn btn-secondary"
          >
            ← Back to Submissions
          </Link>
          <button className="btn btn-primary" onClick={handleSaveAll}>
            Save All Grades
          </button>
        </footer>
      </main>
    </div>
  );
};

export default GradeSubmission;
