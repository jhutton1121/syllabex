import React, { useState } from 'react';
import './AIQuestionReview.css';

const AIRubricReview = ({ rubric, onAccept, onClose }) => {
  const [reviewCriteria, setReviewCriteria] = useState(
    (rubric.criteria || []).map((c, i) => ({
      ...c,
      _status: 'pending',
      _editing: false,
      order: c.order ?? i,
    }))
  );
  const [title, setTitle] = useState(rubric.title || '');
  const [description, setDescription] = useState(rubric.description || '');

  const handleApprove = (index) => {
    setReviewCriteria(prev =>
      prev.map((c, i) => i === index ? { ...c, _status: 'approved', _editing: false } : c)
    );
  };

  const handleReject = (index) => {
    setReviewCriteria(prev =>
      prev.map((c, i) => i === index ? { ...c, _status: 'rejected', _editing: false } : c)
    );
  };

  const handleEdit = (index) => {
    setReviewCriteria(prev =>
      prev.map((c, i) => i === index ? { ...c, _editing: true } : c)
    );
  };

  const handleSaveEdit = (index, field, value) => {
    setReviewCriteria(prev =>
      prev.map((c, i) => i === index ? { ...c, [field]: value } : c)
    );
  };

  const handleDoneEdit = (index) => {
    setReviewCriteria(prev =>
      prev.map((c, i) => i === index ? { ...c, _editing: false, _status: 'approved' } : c)
    );
  };

  const handleApproveAll = () => {
    setReviewCriteria(prev =>
      prev.map(c => c._status !== 'rejected' ? { ...c, _status: 'approved', _editing: false } : c)
    );
  };

  const handleRejectAll = () => {
    setReviewCriteria(prev =>
      prev.map(c => ({ ...c, _status: 'rejected', _editing: false }))
    );
  };

  const handleAccept = () => {
    const approved = reviewCriteria
      .filter(c => c._status === 'approved')
      .map(({ _status, _editing, ...c }, i) => ({ ...c, order: i }));

    if (approved.length === 0) {
      onClose();
      return;
    }

    onAccept({
      title,
      description,
      criteria: approved,
    });
  };

  const approvedCount = reviewCriteria.filter(c => c._status === 'approved').length;
  const rejectedCount = reviewCriteria.filter(c => c._status === 'rejected').length;
  const pendingCount = reviewCriteria.filter(c => c._status === 'pending').length;

  return (
    <div className="ai-review-overlay">
      <div className="ai-review-modal">
        <div className="ai-review-header">
          <h3>Review Generated Rubric</h3>
          <div className="ai-review-stats">
            {pendingCount > 0 && <span className="stat-pending">{pendingCount} pending</span>}
            {approvedCount > 0 && <span className="stat-approved">{approvedCount} approved</span>}
            {rejectedCount > 0 && <span className="stat-rejected">{rejectedCount} rejected</span>}
          </div>
          <button className="ai-btn-icon ai-btn-close" onClick={onClose}>X</button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Rubric Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border-default)',
                borderRadius: '6px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border-default)',
                borderRadius: '6px', padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '13px'
              }}
            />
          </div>
        </div>

        <div className="ai-review-actions-top">
          <button className="btn btn-secondary btn-sm" onClick={handleApproveAll}>Approve All</button>
          <button className="btn btn-secondary btn-sm" onClick={handleRejectAll}>Reject All</button>
        </div>

        <div className="ai-review-list">
          {reviewCriteria.map((criterion, index) => (
            <div key={index} className={`ai-review-card ai-review-card-${criterion._status}`}>
              {criterion._editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text" value={criterion.title}
                    onChange={e => handleSaveEdit(index, 'title', e.target.value)}
                    placeholder="Criterion title"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}
                  />
                  <input
                    type="text" value={criterion.description}
                    onChange={e => handleSaveEdit(index, 'description', e.target.value)}
                    placeholder="Description"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max Points:</label>
                    <input
                      type="number" value={criterion.points_possible}
                      onChange={e => handleSaveEdit(index, 'points_possible', parseInt(e.target.value, 10) || 0)}
                      style={{ width: '80px', background: 'var(--input-bg)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '6px', color: 'var(--text-primary)', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                  <button className="btn btn-sm btn-approve" onClick={() => handleDoneEdit(index)}>Done Editing</button>
                </div>
              ) : (
                <>
                  <div className="ai-review-card-header">
                    <span className="ai-review-q-num">C{index + 1}</span>
                    <span className="ai-review-q-type">{criterion.title}</span>
                    <span className="ai-review-q-points">{criterion.points_possible} pts</span>
                    {criterion._status !== 'pending' && (
                      <span className={`ai-review-badge badge-${criterion._status}`}>{criterion._status}</span>
                    )}
                  </div>
                  <div className="ai-review-card-body">
                    {criterion.description && (
                      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-muted)' }}>{criterion.description}</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(criterion.ratings || []).map((r, ri) => (
                        <div key={ri} style={{
                          background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                          borderRadius: '6px', padding: '6px 10px', fontSize: '12px'
                        }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{r.label}</strong>
                          <span style={{ color: 'var(--primary-light)', marginLeft: '6px' }}>{r.points}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ai-review-card-actions">
                    <button className="btn btn-sm btn-approve" onClick={() => handleApprove(index)} disabled={criterion._status === 'approved'}>Approve</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(index)}>Edit</button>
                    <button className="btn btn-sm btn-reject" onClick={() => handleReject(index)} disabled={criterion._status === 'rejected'}>Reject</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="ai-review-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAccept} disabled={approvedCount === 0}>
            Accept Rubric ({approvedCount} criteria)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRubricReview;
