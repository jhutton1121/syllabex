import React, { useState } from 'react';
import './AIModuleReview.css';

const AIModuleReview = ({ modules, isEditMode, onAccept, onClose }) => {
  const [reviewModules, setReviewModules] = useState(
    modules.map((m, i) => ({
      ...m,
      _status: 'pending',
      _editing: false,
      order: m.order ?? i,
      assignments: m.assignments || [],
    }))
  );

  const handleApprove = (index) => {
    setReviewModules(prev =>
      prev.map((m, i) => i === index ? { ...m, _status: 'approved', _editing: false } : m)
    );
  };

  const handleReject = (index) => {
    setReviewModules(prev =>
      prev.map((m, i) => i === index ? { ...m, _status: 'rejected', _editing: false } : m)
    );
  };

  const handleEdit = (index) => {
    setReviewModules(prev =>
      prev.map((m, i) => i === index ? { ...m, _editing: true } : m)
    );
  };

  const handleSaveEdit = (index, updated) => {
    setReviewModules(prev =>
      prev.map((m, i) =>
        i === index ? { ...m, ...updated, _status: 'approved', _editing: false } : m
      )
    );
  };

  const handleCancelEdit = (index) => {
    setReviewModules(prev =>
      prev.map((m, i) => i === index ? { ...m, _editing: false } : m)
    );
  };

  const handleRemoveAssignment = (moduleIndex, assignmentIndex) => {
    setReviewModules(prev =>
      prev.map((m, i) =>
        i === moduleIndex
          ? { ...m, assignments: m.assignments.filter((_, ai) => ai !== assignmentIndex) }
          : m
      )
    );
  };

  const handleApproveAll = () => {
    setReviewModules(prev =>
      prev.map(m => m._status !== 'rejected' ? { ...m, _status: 'approved', _editing: false } : m)
    );
  };

  const handleRejectAll = () => {
    setReviewModules(prev =>
      prev.map(m => ({ ...m, _status: 'rejected', _editing: false }))
    );
  };

  const handleAcceptReviewed = () => {
    const approved = reviewModules
      .filter(m => m._status === 'approved')
      .map(({ _status, _editing, ...m }) => m);

    if (approved.length === 0) {
      onClose();
      return;
    }
    onAccept(approved);
  };

  const approvedCount = reviewModules.filter(m => m._status === 'approved').length;
  const rejectedCount = reviewModules.filter(m => m._status === 'rejected').length;
  const pendingCount = reviewModules.filter(m => m._status === 'pending').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActionBadge = (m) => {
    if (!isEditMode) return null;
    const action = m._action || 'create';
    const colors = {
      create: { bg: 'rgba(52, 211, 153, 0.2)', color: '#34d399' },
      update: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' },
      delete: { bg: 'rgba(248, 113, 113, 0.2)', color: '#f87171' },
    };
    const style = colors[action] || colors.create;
    return (
      <span className="module-action-badge" style={{ background: style.bg, color: style.color }}>
        {action}
      </span>
    );
  };

  return (
    <div className="ai-module-review-overlay">
      <div className="ai-module-review-modal">
        <div className="ai-module-review-header">
          <h3>Review Generated Modules</h3>
          <div className="ai-review-stats">
            {pendingCount > 0 && <span className="stat-pending">{pendingCount} pending</span>}
            {approvedCount > 0 && <span className="stat-approved">{approvedCount} approved</span>}
            {rejectedCount > 0 && <span className="stat-rejected">{rejectedCount} rejected</span>}
          </div>
          <button className="ai-btn-icon ai-btn-close" onClick={onClose}>X</button>
        </div>

        <div className="ai-review-actions-top">
          <button className="btn btn-secondary btn-sm" onClick={handleApproveAll}>
            Approve All
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleRejectAll}>
            Reject All
          </button>
        </div>

        <div className="ai-module-review-list">
          {reviewModules.map((m, index) => (
            <div
              key={index}
              className={`ai-module-review-card ai-review-card-${m._status} ${m._action === 'delete' ? 'action-delete' : ''}`}
            >
              {m._editing ? (
                <ModuleEditForm
                  module={m}
                  onSave={(updated) => handleSaveEdit(index, updated)}
                  onCancel={() => handleCancelEdit(index)}
                />
              ) : (
                <>
                  <div className="ai-module-review-card-header">
                    <span className="module-review-num">M{index + 1}</span>
                    <span className="module-review-title">{m.title}</span>
                    {getActionBadge(m)}
                    {m._status !== 'pending' && (
                      <span className={`ai-review-badge badge-${m._status}`}>
                        {m._status}
                      </span>
                    )}
                  </div>

                  <div className="ai-module-review-card-body">
                    <div className="module-review-dates">
                      {formatDate(m.start_date)} &mdash; {formatDate(m.end_date)}
                    </div>
                    {m.description && (
                      <p className="module-review-desc">{m.description}</p>
                    )}

                    {m.assignments && m.assignments.length > 0 && (
                      <div className="module-review-assignments">
                        <div className="module-review-assignments-label">Placeholder Assignments</div>
                        {m.assignments.map((a, ai) => (
                          <div key={ai} className="module-review-assignment-chip">
                            <span className={`chip-type-badge type-${a.type}`}>{a.type}</span>
                            <span className="chip-title">{a.title}</span>
                            {a.due_date && (
                              <span className="chip-due">Due {formatDate(a.due_date)}</span>
                            )}
                            <span className="chip-points">{a.points_possible} pts</span>
                            <button
                              className="chip-remove"
                              onClick={() => handleRemoveAssignment(index, ai)}
                              title="Remove assignment"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ai-module-review-card-actions">
                    <button
                      className="btn btn-sm btn-approve"
                      onClick={() => handleApprove(index)}
                      disabled={m._status === 'approved'}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(index)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-reject"
                      onClick={() => handleReject(index)}
                      disabled={m._status === 'rejected'}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="ai-module-review-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAcceptReviewed}
            disabled={approvedCount === 0}
          >
            Apply {approvedCount} Module{approvedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

function ModuleEditForm({ module, onSave, onCancel }) {
  const [title, setTitle] = useState(module.title || '');
  const [description, setDescription] = useState(module.description || '');
  const [startDate, setStartDate] = useState(module.start_date || '');
  const [endDate, setEndDate] = useState(module.end_date || '');
  const [zoomLink, setZoomLink] = useState(module.zoom_link || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      zoom_link: zoomLink,
    });
  };

  return (
    <form className="module-edit-form" onSubmit={handleSubmit}>
      <div className="module-edit-field">
        <label>Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="module-edit-field">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="module-edit-row">
        <div className="module-edit-field">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="module-edit-field">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="module-edit-field">
        <label>Zoom Link</label>
        <input type="url" value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} placeholder="https://zoom.us/j/..." />
      </div>
      <div className="module-edit-actions">
        <button type="submit" className="btn btn-sm btn-approve">Save</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default AIModuleReview;
