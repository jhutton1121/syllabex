import React, { useState, useEffect, useCallback } from 'react';
import announcementService from '../../../services/announcementService';
import RichContent from '../../../components/RichContent';
import AnnouncementForm from './AnnouncementForm';
import './CourseAnnouncements.css';

function CourseAnnouncements({ courseId, isInstructor }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await announcementService.getAnnouncements(courseId);
      setAnnouncements(data.results || data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (data) => {
    try {
      await announcementService.createAnnouncement(courseId, data);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await announcementService.updateAnnouncement(courseId, editingAnnouncement.id, data);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to update announcement:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      await announcementService.deleteAnnouncement(courseId, id);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="announcements-loading">
        <div className="loading-spinner"></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="course-announcements">
      {isInstructor && (
        <div className="announcements-toolbar">
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(true); setEditingAnnouncement(null); }}
          >
            + New Announcement
          </button>
        </div>
      )}

      {(showForm || editingAnnouncement) && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={editingAnnouncement ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingAnnouncement(null); }}
        />
      )}

      {announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📢</div>
          <h3>No announcements yet</h3>
          <p>
            {isInstructor
              ? 'Create your first announcement to communicate with students.'
              : 'Your instructor hasn\'t posted any announcements yet.'}
          </p>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.map((a) => (
            <div key={a.id} className={`announcement-card ${a.pinned ? 'pinned' : ''}`}>
              <div className="announcement-card-header">
                <div className="announcement-header-left">
                  {a.pinned && <span className="pinned-badge">Pinned</span>}
                  {!a.is_published && <span className="draft-badge">Draft</span>}
                  <h3 className="announcement-title">{a.title}</h3>
                </div>
                {isInstructor && (
                  <div className="announcement-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setEditingAnnouncement(a); setShowForm(false); }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="announcement-card-body">
                <RichContent html={a.body} />
              </div>
              <div className="announcement-card-footer">
                <span className="announcement-author">
                  {a.author_info?.first_name
                    ? `${a.author_info.first_name} ${a.author_info.last_name}`
                    : a.author_info?.email}
                </span>
                <span className="announcement-date">{formatDate(a.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseAnnouncements;
