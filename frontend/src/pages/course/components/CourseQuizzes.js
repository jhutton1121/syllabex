import React from 'react';
import { useNavigate } from 'react-router-dom';
import RichContent from '../../../components/RichContent';

function CourseQuizzes({ assignments, courseId, isInstructor }) {
  const navigate = useNavigate();

  // Filter for quizzes only
  const quizzes = assignments.filter(a => a.type === 'quiz');

  const sortedQuizzes = [...quizzes].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  if (sortedQuizzes.length === 0) {
    return (
      <div className="course-quizzes">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No quizzes yet</h3>
          {isInstructor ? (
            <p>Create a quiz-type assignment to see it here.</p>
          ) : (
            <p>Your instructor hasn't posted any quizzes yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="course-quizzes">
      <div className="assignments-grid">
        {sortedQuizzes.map((quiz) => {
          const isOverdue = quiz.due_date && new Date(quiz.due_date) < new Date();
          const isNotStarted = quiz.start_date && new Date(quiz.start_date) > new Date();

          return (
            <div key={quiz.id} className="assignment-card">
              <div className="assignment-header">
                <div className="assignment-badges">
                  <span className="type-badge quiz">Quiz</span>
                  {isNotStarted && <span className="availability-badge not-started">Not Started</span>}
                  {isOverdue && <span className="availability-badge overdue">Overdue</span>}
                </div>
              </div>
              <h3 className="assignment-title">{quiz.title}</h3>
              {quiz.description && (
                <RichContent html={quiz.description} className="assignment-description" />
              )}
              <div className="assignment-footer">
                <div className="assignment-meta">
                  {quiz.due_date && (
                    <span className="meta-item">
                      <strong>Due:</strong> {new Date(quiz.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className="meta-item">
                    <strong>Points:</strong> {quiz.points_possible}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/courses/${courseId}/assignments/${quiz.id}`)}
                  className="btn btn-sm btn-primary"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourseQuizzes;
