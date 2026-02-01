import React, { useState } from 'react';
import RichTextEditor from '../../../components/RichTextEditor';
import './AnnouncementForm.css';

function AnnouncementForm({ announcement, onSubmit, onCancel }) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [body, setBody] = useState(announcement?.body || '');
  const [isPublished, setIsPublished] = useState(
    announcement ? announcement.is_published : true
  );
  const [pinned, setPinned] = useState(announcement?.pinned || false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title, body, is_published: isPublished, pinned });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="announcement-form-card">
      <h3 className="announcement-form-title">
        {announcement ? 'Edit Announcement' : 'New Announcement'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="announcement-title">Title</label>
          <input
            id="announcement-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Body</label>
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Write your announcement..."
            toolbar="full"
          />
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span>Publish immediately</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <span>Pin to top</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
            {submitting
              ? 'Saving...'
              : announcement
                ? 'Update Announcement'
                : 'Post Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AnnouncementForm;
