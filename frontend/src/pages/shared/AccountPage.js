import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import './AccountPage.css';

function AccountPage() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile Info State
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await userService.updateProfile(profileData);
      // Update auth context with new user data
      await login(user.email, null, true); // Refresh user data
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      setLoading(false);
      return;
    }

    try {
      await userService.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to change password. Please check your current password.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-container">
        <h1 className="account-title">Account Settings</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="account-grid">
          {/* Profile Picture Section (Placeholder) */}
          <div className="account-card">
            <h2 className="card-title">Profile Picture</h2>
            <div className="profile-picture-section">
              <div className="profile-picture-placeholder">
                <span className="profile-initials">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="profile-picture-info">
                <p className="info-text">Profile picture upload coming soon!</p>
                <p className="info-subtext">
                  You'll be able to upload a custom profile picture in a future update.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="account-card">
            <h2 className="card-title">Profile Information</h2>
            <form onSubmit={handleProfileSubmit} className="account-form">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="form-input"
                  required
                />
                <p className="form-hint">
                  Changing your email will update your login credentials.
                </p>
              </div>

              <div className="form-group">
                <label>Account Created</label>
                <p className="info-text">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Change Section */}
          <div className="account-card">
            <h2 className="card-title">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="account-form">
              <div className="form-group">
                <label htmlFor="current_password">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="password-requirements">
                <p className="requirements-title">Password Requirements:</p>
                <ul className="requirements-list">
                  <li className={passwordData.new_password.length >= 8 ? 'valid' : ''}>
                    At least 8 characters
                  </li>
                  <li className={passwordData.new_password === passwordData.confirm_password && passwordData.new_password ? 'valid' : ''}>
                    Passwords match
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
