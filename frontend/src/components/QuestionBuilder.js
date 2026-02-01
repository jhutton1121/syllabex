import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import './QuestionBuilder.css';

const QuestionBuilder = ({ question = null, onSave, onCancel, order = 0 }) => {
  const [formData, setFormData] = useState({
    question_type: question?.question_type || 'multiple_choice',
    text: question?.text || '',
    points: question?.points || 1,
    correct_answer_numeric: question?.correct_answer_numeric || '',
    numeric_tolerance: question?.numeric_tolerance || 0,
    choices: question?.choices || [
      { text: '', is_correct: true, order: 0 },
      { text: '', is_correct: false, order: 1 },
    ],
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const handleChoiceChange = (index, field, value) => {
    const newChoices = [...formData.choices];
    
    if (field === 'is_correct') {
      // Only one choice can be correct
      newChoices.forEach((choice, i) => {
        choice.is_correct = i === index;
      });
    } else {
      newChoices[index][field] = value;
    }
    
    setFormData({
      ...formData,
      choices: newChoices,
    });
  };

  const addChoice = () => {
    setFormData({
      ...formData,
      choices: [
        ...formData.choices,
        { text: '', is_correct: false, order: formData.choices.length },
      ],
    });
  };

  const removeChoice = (index) => {
    if (formData.choices.length <= 2) {
      setError('Multiple choice questions must have at least 2 choices');
      return;
    }
    
    const newChoices = formData.choices.filter((_, i) => i !== index);
    // Update order values
    newChoices.forEach((choice, i) => {
      choice.order = i;
    });
    // If removed choice was correct, make first choice correct
    if (!newChoices.some(c => c.is_correct)) {
      newChoices[0].is_correct = true;
    }
    
    setFormData({
      ...formData,
      choices: newChoices,
    });
  };

  const validateForm = () => {
    if (!formData.text.trim()) {
      setError('Question text is required');
      return false;
    }
    
    if (formData.points < 1) {
      setError('Points must be at least 1');
      return false;
    }
    
    if (formData.question_type === 'multiple_choice') {
      if (formData.choices.some(c => !c.text.trim())) {
        setError('All choices must have text');
        return false;
      }
      if (!formData.choices.some(c => c.is_correct)) {
        setError('One choice must be marked as correct');
        return false;
      }
    }
    
    if (formData.question_type === 'numerical') {
      if (formData.correct_answer_numeric === '' || isNaN(formData.correct_answer_numeric)) {
        setError('Correct answer is required for numerical questions');
        return false;
      }
      if (formData.numeric_tolerance < 0) {
        setError('Tolerance cannot be negative');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    const submitData = {
      question_type: formData.question_type,
      text: formData.text,
      points: formData.points,
      order: question?.order ?? order,
    };
    
    if (formData.question_type === 'multiple_choice') {
      submitData.choices = formData.choices;
    } else if (formData.question_type === 'numerical') {
      submitData.correct_answer_numeric = parseFloat(formData.correct_answer_numeric);
      submitData.numeric_tolerance = parseFloat(formData.numeric_tolerance) || 0;
    }
    
    if (question?.id) {
      submitData.id = question.id;
    }
    
    onSave(submitData);
  };

  return (
    <div className="question-builder">
      <div className="question-builder-header">
        <h4>{question ? 'Edit Question' : 'Add Question'}</h4>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="question-builder-form">
        <div className="form-group">
          <label htmlFor="question_type">Question Type</label>
          <select
            id="question_type"
            name="question_type"
            value={formData.question_type}
            onChange={handleChange}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="numerical">Numerical</option>
            <option value="text_response">Text Response</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="text">Question Text *</label>
          <RichTextEditor
            content={formData.text}
            onChange={(html) => setFormData({ ...formData, text: html })}
            placeholder="Enter your question"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="points">Points *</label>
          <input
            id="points"
            type="number"
            name="points"
            value={formData.points}
            onChange={handleChange}
            min="1"
          />
        </div>
        
        {formData.question_type === 'multiple_choice' && (
          <div className="choices-section">
            <label>Answer Choices</label>
            <p className="form-hint">Select the radio button for the correct answer</p>
            
            {formData.choices.map((choice, index) => (
              <div key={index} className="choice-row">
                <input
                  type="radio"
                  name="correct_choice"
                  checked={choice.is_correct}
                  onChange={() => handleChoiceChange(index, 'is_correct', true)}
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                  className="choice-input"
                />
                <button
                  type="button"
                  className="btn btn-icon btn-danger"
                  onClick={() => removeChoice(index)}
                  title="Remove choice"
                >
                  &times;
                </button>
              </div>
            ))}
            
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addChoice}
            >
              + Add Choice
            </button>
          </div>
        )}
        
        {formData.question_type === 'numerical' && (
          <div className="numerical-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="correct_answer_numeric">Correct Answer *</label>
                <input
                  id="correct_answer_numeric"
                  type="number"
                  step="any"
                  name="correct_answer_numeric"
                  value={formData.correct_answer_numeric}
                  onChange={handleChange}
                  placeholder="e.g., 3.14159"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="numeric_tolerance">Tolerance</label>
                <input
                  id="numeric_tolerance"
                  type="number"
                  step="any"
                  name="numeric_tolerance"
                  value={formData.numeric_tolerance}
                  onChange={handleChange}
                  placeholder="e.g., 0.001"
                  min="0"
                />
                <small className="form-hint">
                  Answers within ± this value will be accepted
                </small>
              </div>
            </div>
          </div>
        )}
        
        {formData.question_type === 'text_response' && (
          <div className="text-response-notice">
            <p className="form-hint">
              Text response questions will be graded manually by the instructor.
            </p>
          </div>
        )}
        
        <div className="question-builder-actions">
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {question ? 'Update Question' : 'Add Question'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBuilder;
