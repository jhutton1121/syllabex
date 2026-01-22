import React from 'react';
import './QuestionList.css';

const QuestionList = ({ questions, onEdit, onDelete, onReorder }) => {
  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      numerical: 'Numerical',
      text_response: 'Text Response',
    };
    return labels[type] || type;
  };

  const getQuestionTypeIcon = (type) => {
    const icons = {
      multiple_choice: '◉',
      numerical: '#',
      text_response: '¶',
    };
    return icons[type] || '?';
  };

  const moveQuestion = (index, direction) => {
    if (direction === 'up' && index > 0) {
      onReorder(index, index - 1);
    } else if (direction === 'down' && index < questions.length - 1) {
      onReorder(index, index + 1);
    }
  };

  const getTotalPoints = () => {
    return questions.reduce((sum, q) => sum + q.points, 0);
  };

  if (questions.length === 0) {
    return (
      <div className="question-list-empty">
        <p>No questions added yet.</p>
        <p className="hint">Click "Add Question" to get started.</p>
      </div>
    );
  }

  return (
    <div className="question-list">
      <div className="question-list-header">
        <span className="question-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
        <span className="total-points">{getTotalPoints()} total points</span>
      </div>
      
      <div className="questions">
        {questions.map((question, index) => (
          <div key={question.id || index} className="question-item">
            <div className="question-order">
              <button
                type="button"
                className="btn-reorder"
                onClick={() => moveQuestion(index, 'up')}
                disabled={index === 0}
                title="Move up"
              >
                ▲
              </button>
              <span className="order-number">{index + 1}</span>
              <button
                type="button"
                className="btn-reorder"
                onClick={() => moveQuestion(index, 'down')}
                disabled={index === questions.length - 1}
                title="Move down"
              >
                ▼
              </button>
            </div>
            
            <div className="question-content">
              <div className="question-type-badge">
                <span className="type-icon">{getQuestionTypeIcon(question.question_type)}</span>
                {getQuestionTypeLabel(question.question_type)}
              </div>
              
              <div className="question-text">{question.text}</div>
              
              {question.question_type === 'multiple_choice' && question.choices && (
                <div className="question-choices">
                  {question.choices.map((choice, i) => (
                    <span key={i} className={`choice-tag ${choice.is_correct ? 'correct' : ''}`}>
                      {choice.is_correct && '✓ '}{choice.text}
                    </span>
                  ))}
                </div>
              )}
              
              {question.question_type === 'numerical' && (
                <div className="question-answer-info">
                  Answer: {question.correct_answer_numeric}
                  {question.numeric_tolerance > 0 && ` (± ${question.numeric_tolerance})`}
                </div>
              )}
            </div>
            
            <div className="question-meta">
              <span className="question-points">{question.points} pt{question.points !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="question-actions">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => onEdit(question, index)}
                title="Edit question"
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => onDelete(index)}
                title="Delete question"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;
