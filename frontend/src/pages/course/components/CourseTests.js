import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RichContent from '../../../components/RichContent';
import assignmentService from '../../../services/assignmentService';
import './CourseQuizzes.css';

function CourseTests({ assignments, courseId, isInstructor, onAssignmentsChange }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const tests = assignments.filter(a => a.type === 'test');
  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sortedTests.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedTests.map(t => t.id)));
    }
  };

  const handleDelete = async (id) => {
    try {
      await assignmentService.deleteAssignment(id);
      setDeleteConfirm(null);
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
      onAssignmentsChange?.();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await assignmentService.bulkDeleteAssignments([...selected]);
      setBulkDeleteConfirm(false);
      setSelected(new Set());
      onAssignmentsChange?.();
    } catch (err) {
      console.error('Failed to bulk delete assignments:', err);
    }
  };

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
      {isInstructor && (
        <div className="assignment-bulk-bar">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selected.size === sortedTests.length}
              onChange={toggleSelectAll}
            />
            Select all
          </label>
          {selected.size > 0 && (
            <button
              className="btn-bulk-delete"
              onClick={() => setBulkDeleteConfirm(true)}
            >
              Delete selected ({selected.size})
            </button>
          )}
        </div>
      )}

      <div className="assignments-grid">
        {sortedTests.map((test) => {
          const isOverdue = test.due_date && new Date(test.due_date) < new Date();
          const isNotStarted = test.start_date && new Date(test.start_date) > new Date();

          return (
            <div key={test.id} className="assignment-card">
              {isInstructor && (
                <div className="assignment-select-row">
                  <input
                    type="checkbox"
                    checked={selected.has(test.id)}
                    onChange={() => toggleSelect(test.id)}
                  />
                  <button
                    className="btn-delete-assignment"
                    title="Delete assignment"
                    onClick={() => setDeleteConfirm(test)}
                  >
                    🗑️
                  </button>
                </div>
              )}
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

      {/* Single Delete Confirmation */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-popover" onClick={(e) => e.stopPropagation()}>
            <p>Delete "{deleteConfirm.title}"? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="delete-confirm-popover" onClick={(e) => e.stopPropagation()}>
            <p>Delete {selected.size} selected assignment{selected.size > 1 ? 's' : ''}? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={() => setBulkDeleteConfirm(false)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={handleBulkDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseTests;
