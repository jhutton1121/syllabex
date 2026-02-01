import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import pageService from '../../services/pageService';
import courseService from '../../services/courseService';
import './PageView.css';

const PageView = () => {
  const { courseId, pageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageData, courseData] = await Promise.all([
          pageService.getPage(pageId),
          courseService.getCourse(courseId),
        ]);
        setPage(pageData);
        setCourse(courseData);
      } catch (err) {
        setError('Failed to load page');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, pageId]);

  const isInstructor = course?.user_role === 'instructor';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await pageService.deletePage(pageId);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="page-view-error">
        <h2>{error || 'Page not found'}</h2>
        <button onClick={() => navigate(`/courses/${courseId}`)} className="btn btn-primary">
          Back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="page-view-container">
      <div className="page-view-header">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span className="separator">/</span>
          <Link to={`/courses/${courseId}`}>{course?.code || 'Course'}</Link>
          <span className="separator">/</span>
          <span>Pages</span>
        </div>
        <div className="page-view-title-row">
          <div className="page-view-title-info">
            <h1>{page.title}</h1>
            {!page.is_published && (
              <span className="page-draft-badge">Draft</span>
            )}
            <p className="page-updated">
              Last updated {new Date(page.updated_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
          {isInstructor && (
            <div className="page-view-actions">
              <button
                onClick={() => navigate(`/courses/${courseId}/pages/${pageId}/edit`)}
                className="btn btn-primary"
              >
                Edit Page
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-view-body">
        <div
          className="page-content"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </div>
    </div>
  );
};

export default PageView;
