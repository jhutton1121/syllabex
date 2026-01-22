import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import assignmentService from '../services/assignmentService';
import QuestionBuilder from './QuestionBuilder';
import QuestionList from './QuestionList';
import './AssignmentForm.css';

const AssignmentForm = ({ assignment = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  // Parse existing due_date into separate date and time
  const getInitialDueDate = () => {
    if (assignment?.due_date) {
      return assignment.due_date.slice(0, 10); // YYYY-MM-DD
    }
    return '';
  };
  
  const getInitialDueTime = () => {
    if (assignment?.due_date) {
      return assignment.due_date.slice(11, 16); // HH:MM
    }
    return '23:59'; // Default to end of day
  };

  const [formData, setFormData] = useState({
    course_id: assignment?.course || '',
    type: assignment?.type || 'homework',
    title: assignment?.title || '',
    description: assignment?.description || '',
    due_date: getInitialDueDate(),
    due_time: getInitialDueTime(),
    points_possible: assignment?.points_possible || 100,
  });
  const [questions, setQuestions] = useState(assignment?.questions || []);
  const [originalQuestionIds, setOriginalQuestionIds] = useState([]);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses();
        setCourses(data.results || data);
      } catch (err) {
        setError('Failed to load courses');
      }
    };

    fetchCourses();
  }, []);

  // Load questions if editing
  useEffect(() => {
    const fetchQuestions = async () => {
      if (isEdit && assignment?.id) {
        try {
          const questionsData = await assignmentService.getQuestions(assignment.id);
          setQuestions(questionsData || []);
          // Track original question IDs to detect deletions later
          setOriginalQuestionIds(questionsData.map(q => q.id).filter(id => id !== undefined));
        } catch (err) {
          console.error('Failed to load questions:', err);
        }
      }
    };

    fetchQuestions();
  }, [isEdit, assignment?.id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
    setShowQuestionBuilder(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion(question);
    setEditingIndex(index);
    setShowQuestionBuilder(true);
  };

  const handleSaveQuestion = (questionData) => {
    if (editingIndex !== null) {
      // Update existing question
      const newQuestions = [...questions];
      newQuestions[editingIndex] = { ...questionData, id: editingQuestion?.id };
      setQuestions(newQuestions);
    } else {
      // Add new question
      setQuestions([...questions, { ...questionData, order: questions.length }]);
    }
    setShowQuestionBuilder(false);
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const newQuestions = questions.filter((_, i) => i !== index);
      // Update order values
      newQuestions.forEach((q, i) => {
        q.order = i;
      });
      setQuestions(newQuestions);
    }
  };

  const handleReorderQuestions = (fromIndex, toIndex) => {
    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, moved);
    // Update order values
    newQuestions.forEach((q, i) => {
      q.order = i;
    });
    setQuestions(newQuestions);
  };

  const handleCancelQuestion = () => {
    setShowQuestionBuilder(false);
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  const getTotalQuestionPoints = () => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Combine date and time, then convert to ISO format
      const dueDateTimeString = `${formData.due_date}T${formData.due_time}`;
      const submitData = {
        course_id: formData.course_id,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        points_possible: formData.points_possible,
        due_date: new Date(dueDateTimeString).toISOString(),
      };

      let assignmentId;

      if (isEdit) {
        await assignmentService.updateAssignment(assignment.id, submitData);
        assignmentId = assignment.id;
        
        // Identify deleted questions by comparing original IDs with current IDs
        const currentQuestionIds = questions.map(q => q.id).filter(id => id !== undefined);
        const deletedQuestionIds = originalQuestionIds.filter(id => !currentQuestionIds.includes(id));
        
        // Delete removed questions
        for (const questionId of deletedQuestionIds) {
          try {
            await assignmentService.deleteQuestion(questionId);
          } catch (err) {
            console.error(`Failed to delete question ${questionId}:`, err);
          }
        }
        
        // Update existing questions and add new ones
        for (const question of questions) {
          if (question.id) {
            await assignmentService.updateQuestion(question.id, question);
          } else {
            await assignmentService.addQuestion(assignmentId, question);
          }
        }
        
        setSuccess('Assignment updated successfully!');
      } else {
        const newAssignment = await assignmentService.createAssignment(submitData);
        assignmentId = newAssignment.id;
        
        // Add questions to the new assignment
        for (const question of questions) {
          await assignmentService.addQuestion(assignmentId, question);
        }
        
        setSuccess('Assignment created successfully!');
      }

      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data;
      if (typeof errorMessage === 'object') {
        const firstError = Object.values(errorMessage)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(`Failed to ${isEdit ? 'update' : 'create'} assignment`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assignment-form-container">
      <div className="card">
        <div className="card-header">
          {isEdit ? 'Edit Assignment' : 'Create New Assignment'}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="course_id">Course *</label>
            <select
              id="course_id"
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              required
              disabled={isEdit}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {isEdit && (
              <small className="form-hint">Course cannot be changed after creation</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="type">Assignment Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="homework">Homework</option>
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter assignment title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter assignment description"
              rows="4"
            />
          </div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label htmlFor="due_date">Due Date *</label>
              <input
                id="due_date"
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="due_time">Due Time *</label>
              <input
                id="due_time"
                type="time"
                name="due_time"
                value={formData.due_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="points_possible">Points Possible *</label>
              <input
                id="points_possible"
                type="number"
                name="points_possible"
                value={formData.points_possible}
                onChange={handleChange}
                required
                min="0"
              />
              {questions.length > 0 && (
                <small className="form-hint">
                  Total from questions: {getTotalQuestionPoints()} pts
                </small>
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div className="questions-section">
            <div className="section-header">
              <h3>Questions</h3>
              {!showQuestionBuilder && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddQuestion}
                >
                  + Add Question
                </button>
              )}
            </div>

            {showQuestionBuilder ? (
              <QuestionBuilder
                question={editingQuestion}
                onSave={handleSaveQuestion}
                onCancel={handleCancelQuestion}
                order={questions.length}
              />
            ) : (
              <QuestionList
                questions={questions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onReorder={handleReorderQuestions}
              />
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Assignment' : 'Create Assignment'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentForm;
