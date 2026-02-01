import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import './NotificationsPage.css';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(p);
      const results = data.results || data;
      setNotifications(results);
      setHasNext(!!data.next);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="notifications-loading">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {notifications.map((n) => (
              <button
                key={n.id}
                className={`notification-row ${!n.is_read ? 'unread' : ''}`}
                onClick={() => handleClick(n)}
              >
                <div className="notification-row-left">
                  {!n.is_read && <span className="unread-indicator" />}
                  <div className="notification-row-content">
                    <span className="notification-row-title">{n.title}</span>
                    {n.body && <span className="notification-row-body">{n.body}</span>}
                  </div>
                </div>
                <div className="notification-row-right">
                  {n.course_code && (
                    <span className="notification-row-course">{n.course_code}</span>
                  )}
                  <span className="notification-row-time">{formatDate(n.created_at)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="notifications-pagination">
            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="page-indicator">Page {page}</span>
            <button
              className="btn btn-secondary"
              disabled={!hasNext}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationsPage;
