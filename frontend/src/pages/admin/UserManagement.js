import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import './AdminPages.css';

const UserManagement = () => {
  const [memberships, setMemberships] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    course_id: '',
    user_email: '',
    role: 'student',
  });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membershipsData, coursesData] = await Promise.all([
        courseService.getMemberships(),
        courseService.getCourses(),
      ]);
      setMemberships(membershipsData.results || membershipsData);
      setCourses(coursesData.results || coursesData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group memberships by user
  const userMap = new Map();
  memberships.forEach((m) => {
    const userId = m.user_info?.id || m.user;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        id: userId,
        email: m.user_info?.email || 'Unknown',
        first_name: m.user_info?.first_name || '',
        last_name: m.user_info?.last_name || '',
        memberships: [],
      });
    }
    userMap.get(userId).memberships.push(m);
  });

  const users = Array.from(userMap.values());

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole =
      filterRole === 'all' ||
      user.memberships.some((m) => m.role === filterRole);
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <header className="admin-page-header">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="separator">/</span>
          <span>Users</span>
        </div>
        <div className="header-row">
          <h1>User Management</h1>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary"
          >
            + Assign User to Course
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-page-content">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="instructor">Instructors</option>
              <option value="student">Students</option>
            </select>
          </div>
          <div className="toolbar-info">
            {filteredUsers.length} user(s)
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Users will appear here once they're enrolled in courses.</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <div className="avatar">
                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.email.split('@')[0]}
                    </h3>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="user-card-body">
                  <h4>Course Memberships</h4>
                  {user.memberships.length === 0 ? (
                    <p className="no-memberships">No course memberships</p>
                  ) : (
                    <ul className="memberships-list">
                      {user.memberships.map((m) => (
                        <li key={m.id} className="membership-item">
                          <span className={`role-badge ${m.role}`}>
                            {m.role}
                          </span>
                          <span className="course-name">
                            {courses.find((c) => c.id === m.course)?.code || 'Unknown Course'}
                          </span>
                          <span className={`status ${m.status}`}>{m.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign User to Course</h2>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setAssigning(true);
              try {
                // Note: This requires the user ID, not email
                // In a real app, you'd search for the user first
                setError('User assignment requires finding user by email first. This feature is simplified.');
                setShowAssignModal(false);
              } catch (err) {
                setError('Failed to assign user');
              } finally {
                setAssigning(false);
              }
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Course</label>
                  <select
                    value={assignData.course_id}
                    onChange={(e) =>
                      setAssignData({ ...assignData, course_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>User Email</label>
                  <input
                    type="email"
                    value={assignData.user_email}
                    onChange={(e) =>
                      setAssignData({ ...assignData, user_email: e.target.value })
                    }
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={assignData.role}
                    onChange={(e) =>
                      setAssignData({ ...assignData, role: e.target.value })
                    }
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={assigning}
                >
                  {assigning ? 'Assigning...' : 'Assign User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
