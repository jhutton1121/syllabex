import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import userService from '../../services/userService';
import RichTextEditor from '../../components/RichTextEditor';
import './AdminPages.css';
import './AdminCourseDetail.css';

const AdminCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    ai_enabled: false,
  });

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Members state
  const [members, setMembers] = useState([]);
  
  // Add member state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMemberRole, setNewMemberRole] = useState('student');
  const [addingMember, setAddingMember] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const data = await courseService.getCourse(courseId);
      setCourse(data);
      setEditForm({
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        is_active: data.is_active ?? true,
        ai_enabled: data.ai_enabled ?? false,
      });
      setMembers(data.members || []);
    } catch (err) {
      setError('Failed to load course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Debounced user search
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await userService.searchUsers(searchQuery);
          // Filter out users already in the course
          const memberIds = members.map(m => m.user_info?.id || m.user);
          const filtered = (results.results || results).filter(
            user => !memberIds.includes(user.id)
          );
          setSearchResults(filtered);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, members]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Send empty string as null for dates
      const dataToSend = {
        ...editForm,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
      };
      await courseService.updateCourse(courseId, dataToSend);
      setSuccess('Course updated successfully');
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await courseService.deleteCourse(courseId);
      navigate('/admin/courses');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete course');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    
    setAddingMember(true);
    setError('');
    
    try {
      await courseService.addMember(courseId, selectedUser.id, newMemberRole);
      setSuccess(`${selectedUser.email} added as ${newMemberRole}`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setNewMemberRole('student');
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await courseService.removeMember(courseId, userId);
      setSuccess('Member removed');
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'student' ? 'instructor' : 'student';
    
    try {
      await courseService.updateMemberRole(courseId, userId, newRole);
      setSuccess(`Role changed to ${newRole}`);
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change role');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-content">
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Course not found</h3>
            <p>The course you're looking for doesn't exist.</p>
            <Link to="/admin/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <header className="admin-page-header">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="separator">/</span>
          <Link to="/admin/courses">Courses</Link>
          <span className="separator">/</span>
          <span>{course.code}</span>
        </div>
        <div className="header-row">
          <h1>{course.name}</h1>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
          >
            Delete Course
          </button>
        </div>
      </header>

      <div className="admin-page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="admin-detail-grid">
          {/* Course Edit Form */}
          <section className="detail-section">
            <div className="section-header">
              <h2>Course Information</h2>
            </div>
            <form onSubmit={handleSave} className="section-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>AI Assistant</label>
                  <select
                    value={editForm.ai_enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditForm({ ...editForm, ai_enabled: e.target.value === 'enabled' })}
                  >
                    <option value="disabled">Disabled</option>
                    <option value="enabled">Enabled</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <RichTextEditor
                  content={editForm.description}
                  onChange={(html) => setEditForm({ ...editForm, description: html })}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Add Member Section */}
          <section className="detail-section">
            <div className="section-header">
              <h2>Add Member</h2>
            </div>
            <div className="section-body">
              <div className="add-member-form">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    className="search-input"
                  />
                  {searching && <span className="search-indicator">Searching...</span>}
                  
                  {searchResults.length > 0 && !selectedUser && (
                    <div className="search-results">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="search-result-item"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery(user.email);
                            setSearchResults([]);
                          }}
                        >
                          <div className="result-avatar">
                            {user.first_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div className="result-info">
                            <span className="result-name">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="result-email">{user.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedUser && (
                  <div className="selected-user">
                    <span>Selected: <strong>{selectedUser.email}</strong></span>
                    <button 
                      type="button" 
                      className="btn-clear"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                <div className="add-member-controls">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="role-select"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="btn btn-primary"
                    disabled={!selectedUser || addingMember}
                  >
                    {addingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Members Table */}
        <section className="detail-section members-section">
          <div className="section-header">
            <h2>Course Members</h2>
            <span className="member-count">{members.length} member(s)</span>
          </div>
          <div className="section-body">
            {members.length === 0 ? (
              <div className="empty-state-small">
                <p>No members enrolled yet. Add members using the form above.</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Enrolled</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const userInfo = member.user_info || {};
                      const userId = userInfo.id || member.user;
                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar-small">
                                {userInfo.first_name?.[0] || userInfo.email?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span>{userInfo.first_name} {userInfo.last_name}</span>
                            </div>
                          </td>
                          <td>{userInfo.email}</td>
                          <td>
                            <span className={`role-badge ${member.role}`}>
                              {member.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${member.status}`}>
                              {member.status}
                            </span>
                          </td>
                          <td>
                            {member.enrolled_at 
                              ? new Date(member.enrolled_at).toLocaleDateString()
                              : '—'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleChangeRole(userId, member.role)}
                                title={`Change to ${member.role === 'student' ? 'instructor' : 'student'}`}
                              >
                                Switch Role
                              </button>
                              <button
                                className="btn btn-sm btn-danger-outline"
                                onClick={() => handleRemoveMember(userId)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Course</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{course.code} - {course.name}</strong>?
              </p>
              <p className="warning-text">
                This action cannot be undone. All assignments, grades, and member enrollments 
                associated with this course will be permanently deleted.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseDetail;
