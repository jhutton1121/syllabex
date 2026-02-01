import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../../services/courseService';
import ModuleForm from './ModuleForm';
import AIModuleChatPanel from '../../../components/AIModuleChatPanel';
import RichContent from '../../../components/RichContent';
import './CourseModules.css';

function CourseModules({ courseId, modules, assignments, isInstructor, onModulesChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [lockConfirm, setLockConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const handleToggleLock = async (moduleId) => {
    try {
      await courseService.toggleModuleLock(courseId, moduleId);
      setLockConfirm(null);
      onModulesChange();
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const handleDelete = async (moduleId) => {
    try {
      await courseService.deleteCourseModule(courseId, moduleId);
      setDeleteConfirm(null);
      onModulesChange();
    } catch (err) {
      console.error('Failed to delete module:', err);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingModule(null);
    onModulesChange();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingModule(null);
  };

  const handleEdit = (mod) => {
    setEditingModule(mod);
    setShowForm(true);
  };

  const handleAIModulesAccepted = async (approvedModules) => {
    try {
      await courseService.batchApplyModules(courseId, approvedModules);
      onModulesChange();
    } catch (err) {
      console.error('Failed to apply AI modules:', err);
    }
  };

  const sortedModules = [...(modules || [])].sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`modules-view ${aiPanelOpen ? 'ai-open' : ''}`}>
      <div className="modules-content">
        <div className="modules-header">
          <h2>Course Modules</h2>
          {isInstructor && !showForm && (
            <div className="modules-header-actions">
              <button className="btn-ai-modules" onClick={() => setAiPanelOpen(!aiPanelOpen)}>
                {aiPanelOpen ? 'Close AI' : 'AI Assistant'}
              </button>
              <button className="btn-new-module" onClick={() => setShowForm(true)}>
                + New Module
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <ModuleForm
            courseId={courseId}
            module={editingModule}
            assignments={assignments}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        )}

        {sortedModules.length === 0 && !showForm ? (
          <div className="modules-empty-state">
            <div className="empty-icon">📦</div>
            <h3>No modules yet</h3>
            <p>
              {isInstructor
                ? 'Create your first module to organize course content.'
                : 'Your instructor hasn\'t created any modules yet.'}
            </p>
          </div>
        ) : (
          <div className="modules-timeline">
            {sortedModules.map((mod) => (
              <div
                key={mod.id}
                className={`module-card status-${mod.status} ${mod.is_locked ? 'is-locked' : ''}`}
              >
                <div className="module-card-header">
                  <div className="module-title-area">
                    <div className="module-title-row">
                      <h3 className="module-title">{mod.title}</h3>
                      <span className={`module-status-pill ${mod.status}`}>{mod.status}</span>
                      {mod.is_locked && <span className="module-status-pill" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>Locked</span>}
                    </div>
                    <div className="module-date-range">
                      {formatDate(mod.start_date)} &mdash; {formatDate(mod.end_date)}
                    </div>
                  </div>

                  {isInstructor && (
                    <div className="module-header-actions">
                      <button
                        className={`lock-btn ${mod.is_locked ? 'locked' : ''}`}
                        title={mod.is_locked ? 'Unlock module' : 'Lock module'}
                        onClick={() => setLockConfirm(mod)}
                      >
                        {mod.is_locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="edit-module-btn"
                        title="Edit module"
                        onClick={() => handleEdit(mod)}
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-module-btn"
                        title="Delete module"
                        onClick={() => setDeleteConfirm(mod)}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="module-card-body">
                  {mod.description && (
                    <RichContent html={mod.description} className="module-description" />
                  )}

                  {mod.zoom_link && (
                    <a
                      href={mod.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="module-zoom-link"
                    >
                      📹 Join Zoom Lecture
                    </a>
                  )}

                  {!isInstructor && mod.is_locked ? (
                    <p className="module-locked-notice">This module is currently locked by the instructor.</p>
                  ) : (
                    <div className="module-assignments">
                      {mod.assignments && mod.assignments.length > 0 ? (
                        <>
                          <div className="module-assignments-label">Assignments</div>
                          {mod.assignments.map((a) => (
                            <div key={a.id} className="module-assignment-chip-wrapper">
                              <Link
                                to={isInstructor
                                  ? `/courses/${courseId}/assignments/${a.id}/edit`
                                  : `/courses/${courseId}/assignments/${a.id}`}
                                className="module-assignment-chip"
                              >
                                <span className={`chip-type-badge type-${a.type}`}>{a.type}</span>
                                <span className="chip-title">{a.title}</span>
                                <div className="chip-meta">
                                  <span className="chip-due">
                                    Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="chip-points">{a.points_possible} pts</span>
                                </div>
                              </Link>
                              {isInstructor && (
                                <Link
                                  to={`/courses/${courseId}/assignments/${a.id}`}
                                  className="chip-view-btn"
                                  title="View as student"
                                >
                                  View
                                </Link>
                              )}
                            </div>
                          ))}
                        </>
                      ) : null}

                      {mod.pages && mod.pages.length > 0 && (
                        <>
                          <div className="module-assignments-label" style={{ marginTop: mod.assignments && mod.assignments.length > 0 ? '12px' : '0' }}>Pages</div>
                          {mod.pages.map((p) => (
                            <div key={p.id} className="module-assignment-chip-wrapper">
                              <Link
                                to={`/courses/${courseId}/pages/${p.id}`}
                                className="module-assignment-chip"
                              >
                                <span className="chip-type-badge type-page">page</span>
                                <span className="chip-title">{p.title}</span>
                              </Link>
                            </div>
                          ))}
                        </>
                      )}

                      {(!mod.assignments || mod.assignments.length === 0) && (!mod.pages || mod.pages.length === 0) && (
                        <p className="no-assignments-msg">No content in this module yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isInstructor && aiPanelOpen && (
        <AIModuleChatPanel
          courseId={courseId}
          existingModules={modules}
          onModulesAccepted={handleAIModulesAccepted}
          isOpen={aiPanelOpen}
          onToggle={() => setAiPanelOpen(false)}
        />
      )}

      {/* Lock Confirmation */}
      {lockConfirm && (
        <div className="lock-confirm-overlay" onClick={() => setLockConfirm(null)}>
          <div className="lock-confirm-popover" onClick={(e) => e.stopPropagation()}>
            <p>
              {lockConfirm.is_locked
                ? `Unlock "${lockConfirm.title}"? Students will be able to access this module's content.`
                : `Lock "${lockConfirm.title}"? Students won't be able to access this module's content.`}
            </p>
            <div className="lock-confirm-actions">
              <button className="btn-cancel" onClick={() => setLockConfirm(null)}>Cancel</button>
              <button className="btn-confirm" onClick={() => handleToggleLock(lockConfirm.id)}>
                {lockConfirm.is_locked ? 'Unlock' : 'Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-popover" onClick={(e) => e.stopPropagation()}>
            <p>
              Delete "{deleteConfirm.title}"? This will remove the module but not its assignments.
            </p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteConfirm.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseModules;
