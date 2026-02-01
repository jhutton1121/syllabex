import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import pageService from '../../../services/pageService';
import './CoursePages.css';

function CoursePages({ courseId, isInstructor }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const data = await pageService.getPages(courseId);
        setPages(data.results || data);
      } catch (err) {
        console.error('Failed to load pages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, [courseId]);

  if (loading) {
    return (
      <div className="pages-loading">
        <div className="loading-spinner"></div>
        <p>Loading pages...</p>
      </div>
    );
  }

  return (
    <div className="pages-view">
      <div className="pages-header">
        <h2>Pages</h2>
        {isInstructor && (
          <Link to={`/courses/${courseId}/pages/create`} className="btn-new-page">
            + New Page
          </Link>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="pages-empty-state">
          <div className="empty-icon">📄</div>
          <h3>No pages yet</h3>
          <p>
            {isInstructor
              ? 'Create your first page to share content with students.'
              : 'Your instructor hasn\'t created any pages yet.'}
          </p>
        </div>
      ) : (
        <div className="pages-list">
          {pages.map((page) => (
            <Link
              key={page.id}
              to={`/courses/${courseId}/pages/${page.id}`}
              className="page-card"
            >
              <div className="page-card-icon">📄</div>
              <div className="page-card-info">
                <h3 className="page-card-title">{page.title}</h3>
                <div className="page-card-meta">
                  {!page.is_published && (
                    <span className="page-status-badge draft">Draft</span>
                  )}
                  {page.is_published && (
                    <span className="page-status-badge published">Published</span>
                  )}
                  <span className="page-card-date">
                    Updated {new Date(page.updated_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="page-card-arrow">&#8250;</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default CoursePages;
