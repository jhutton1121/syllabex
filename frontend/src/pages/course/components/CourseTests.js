import React from 'react';
import { useNavigate } from 'react-router-dom';
import RichContent from '../../../components/RichContent';

function CourseTests({ assignments, courseId, isInstructor }) {
  const navigate = useNavigate();

  // Filter for tests only
  const tests = assignments.filter(a => a.type === 'test');

  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  if (sortedTests.length === 0) {
    return (
      <div className="course-tests">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No tests yet</h3>
          {isInstructor ? (
            <p>Create a test-type assignment to see it here.</p>
          ) : (
            <p>Your instructor hasn't posted any tests yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="course-tests">
      <div className="assignments-grid">
        {sortedTests.map((test) => {
          const isOverdue = test.due_date && new Date(test.due_date) < new Date();
          const isNotStarted = test.start_date && new Date(test.start_date) > new Date();

          return (
            <div key={test.id} className="assignment-card">
              <div className="assignment-header">
                <div className="assignment-badges">
                  <span className="type-badge test">Test</span>
                  {isNotStarted && <span className="availability-badge not-started">Not Started</span>}
                  {isOverdue && <span className="availability-badge overdue">Overdue</span>}
                </div>
              </div>
              <h3 className="assignment-title">{test.title}</h3>
              {test.description && (
                <RichContent html={test.description} className="assignment-description" />
              )}
              <div className="assignment-footer">
                <div className="assignment-meta">
                  {test.due_date && (
                    <span className="meta-item">
                      <strong>Due:</strong> {new Date(test.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className="meta-item">
                    <strong>Points:</strong> {test.points_possible}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/courses/${courseId}/assignments/${test.id}`)}
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

export default CourseTests;
