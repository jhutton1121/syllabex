import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import assignmentService from '../services/assignmentService';
import './AssignmentForm.css';

const AssignmentForm = ({ assignment = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: assignment?.course || '',
    type: assignment?.type || 'homework',
    title: assignment?.title || '',
    description: assignment?.description || '',
    due_date: assignment?.due_date ? assignment.due_date.slice(0, 16) : '',
    points_possible: assignment?.points_possible || 100,
  });
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Convert due_date to ISO format
      const submitData = {
        ...formData,
        due_date: new Date(formData.due_date).toISOString(),
      };

      if (isEdit) {
        await assignmentService.updateAssignment(assignment.id, submitData);
        setSuccess('Assignment updated successfully!');
      } else {
        await assignmentService.createAssignment(submitData);
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
              rows="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="due_date">Due Date *</label>
              <input
                id="due_date"
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
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
            </div>
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
