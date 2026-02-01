import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import courseService from '../../services/courseService';
import RichTextEditor from '../../components/RichTextEditor';
import './AdminPages.css';

const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data.results || data);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await courseService.createCourse(newCourse);
      setShowCreateModal(false);
      setNewCourse({ code: '', name: '', description: '', is_active: true, start_date: '', end_date: '' });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <header className="admin-page-header">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="separator">/</span>
          <span>Courses</span>
        </div>
        <div className="header-row">
          <h1>Course Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create Course
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-page-content">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="toolbar-info">
            {filteredCourses.length} course(s)
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No courses found</h3>
            <p>Create your first course to get started.</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Instructors</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <span className="code">{course.code}</span>
                    </td>
                    <td>{course.name}</td>
                    <td>
                      <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{course.start_date ? new Date(course.start_date).toLocaleDateString() : '—'}</td>
                    <td>{course.end_date ? new Date(course.end_date).toLocaleDateString() : '—'}</td>
                    <td>{course.instructor_count}</td>
                    <td>{course.student_count}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/courses/${course.id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          Manage
                        </Link>
                        <Link
                          to={`/courses/${course.id}`}
                          className="btn btn-sm btn-outline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <RichTextEditor
                    content={newCourse.description}
                    onChange={(html) =>
                      setNewCourse({ ...newCourse, description: html })
                    }
                    placeholder="Course description..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={newCourse.start_date}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={newCourse.end_date}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newCourse.is_active}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, is_active: e.target.checked })
                      }
                    />
                    Active course
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
