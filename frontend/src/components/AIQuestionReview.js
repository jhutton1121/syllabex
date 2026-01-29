import React, { useState } from 'react';
import QuestionBuilder from './QuestionBuilder';
import './AIQuestionReview.css';

const AIQuestionReview = ({ questions, onAccept, onClose }) => {
  const [reviewQuestions, setReviewQuestions] = useState(
    questions.map((q, i) => ({
      ...q,
      _status: 'pending', // pending, approved, rejected
      _editing: false,
      order: q.order ?? i,
    }))
  );

  const handleApprove = (index) => {
    setReviewQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, _status: 'approved', _editing: false } : q)
    );
  };

  const handleReject = (index) => {
    setReviewQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, _status: 'rejected', _editing: false } : q)
    );
  };

  const handleEdit = (index) => {
    setReviewQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, _editing: true } : q)
    );
  };

  const handleSaveEdit = (index, updatedQuestion) => {
    setReviewQuestions(prev =>
      prev.map((q, i) =>
        i === index
          ? { ...updatedQuestion, _status: 'approved', _editing: false, order: q.order }
          : q
      )
    );
  };

  const handleCancelEdit = (index) => {
    setReviewQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, _editing: false } : q)
    );
  };

  const handleApproveAll = () => {
    setReviewQuestions(prev =>
      prev.map(q => q._status !== 'rejected' ? { ...q, _status: 'approved', _editing: false } : q)
    );
  };

  const handleRejectAll = () => {
    setReviewQuestions(prev =>
      prev.map(q => ({ ...q, _status: 'rejected', _editing: false }))
    );
  };

  const handleAcceptReviewed = () => {
    const approved = reviewQuestions
      .filter(q => q._status === 'approved')
      .map(({ _status, _editing, ...q }) => q);

    if (approved.length === 0) {
      onClose();
      return;
    }
    onAccept(approved);
  };

  const approvedCount = reviewQuestions.filter(q => q._status === 'approved').length;
  const rejectedCount = reviewQuestions.filter(q => q._status === 'rejected').length;
  const pendingCount = reviewQuestions.filter(q => q._status === 'pending').length;

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'numerical': return 'Numerical';
      case 'text_response': return 'Text Response';
      default: return type;
    }
  };

  return (
    <div className="ai-review-overlay">
      <div className="ai-review-modal">
        <div className="ai-review-header">
          <h3>Review Generated Questions</h3>
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

        <div className="ai-review-list">
          {reviewQuestions.map((q, index) => (
            <div
              key={index}
              className={`ai-review-card ai-review-card-${q._status}`}
            >
              {q._editing ? (
                <div className="ai-review-edit-wrapper">
                  <QuestionBuilder
                    question={q}
                    onSave={(updated) => handleSaveEdit(index, updated)}
                    onCancel={() => handleCancelEdit(index)}
                    order={q.order}
                  />
                </div>
              ) : (
                <>
                  <div className="ai-review-card-header">
                    <span className="ai-review-q-num">Q{index + 1}</span>
                    <span className="ai-review-q-type">{getQuestionTypeLabel(q.question_type)}</span>
                    <span className="ai-review-q-points">{q.points} pts</span>
                    {q._status !== 'pending' && (
                      <span className={`ai-review-badge badge-${q._status}`}>
                        {q._status}
                      </span>
                    )}
                  </div>

                  <div className="ai-review-card-body">
                    <p className="ai-review-q-text">{q.text}</p>

                    {q.question_type === 'multiple_choice' && q.choices && (
                      <ul className="ai-review-choices">
                        {q.choices.map((c, ci) => (
                          <li key={ci} className={c.is_correct ? 'correct-choice' : ''}>
                            {c.is_correct && <span className="correct-marker">&#10003;</span>}
                            {c.text}
                          </li>
                        ))}
                      </ul>
                    )}

                    {q.question_type === 'numerical' && (
                      <p className="ai-review-numeric">
                        Answer: {q.correct_answer_numeric}
                        {q.numeric_tolerance ? ` (tolerance: ${q.numeric_tolerance})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="ai-review-card-actions">
                    <button
                      className="btn btn-sm btn-approve"
                      onClick={() => handleApprove(index)}
                      disabled={q._status === 'approved'}
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
                      disabled={q._status === 'rejected'}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="ai-review-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAcceptReviewed}
            disabled={approvedCount === 0}
          >
            Add {approvedCount} Question{approvedCount !== 1 ? 's' : ''} to Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIQuestionReview;
