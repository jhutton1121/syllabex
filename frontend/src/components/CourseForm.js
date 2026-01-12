import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import './AssignmentForm.css';

const CourseForm = ({ course = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: course?.code || '',
    name: course?.name || '',
    description: course?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      if (isEdit) {
        await courseService.updateCourse(course.id, formData);
        setSuccess('Course updated successfully!');
      } else {
        await courseService.createCourse(formData);
        setSuccess('Course created successfully!');
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
        setError(`Failed to ${isEdit ? 'update' : 'create'} course`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assignment-form-container">
      <div className="card">
        <div className="card-header">
          {isEdit ? 'Edit Course' : 'Create New Course'}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Course Code *</label>
            <input
              id="code"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="e.g., CS101, MATH201"
              disabled={isEdit}
            />
            {isEdit && (
              <small className="form-hint">Course code cannot be changed after creation</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Course Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter course name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter course description"
              rows="6"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
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

export default CourseForm;
