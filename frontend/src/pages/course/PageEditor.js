import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import pageService from '../../services/pageService';
import courseService from '../../services/courseService';
import RichTextEditor from '../../components/RichTextEditor';
import './PageEditor.css';

const PageEditor = () => {
  const { courseId, pageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!pageId;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [moduleId, setModuleId] = useState('');
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, modulesData] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getCourseModules(courseId),
        ]);
        setCourse(courseData);
        setModules(modulesData.results || modulesData);

        if (isEditing) {
          const pageData = await pageService.getPage(pageId);
          setTitle(pageData.title);
          setBody(pageData.body || '');
          setIsPublished(pageData.is_published);
          setModuleId(pageData.module || '');
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, pageId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = {
        course_id: parseInt(courseId),
        title: title.trim(),
        body,
        is_published: isPublished,
        module_id: moduleId || null,
      };

      if (isEditing) {
        await pageService.updatePage(pageId, data);
        navigate(`/courses/${courseId}/pages/${pageId}`);
      } else {
        const newPage = await pageService.createPage(data);
        navigate(`/courses/${courseId}/pages/${newPage.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save page');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-editor-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-editor-container">
      <div className="page-editor-header">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span className="separator">/</span>
          <Link to={`/courses/${courseId}`}>{course?.code || 'Course'}</Link>
          <span className="separator">/</span>
          <span>{isEditing ? 'Edit Page' : 'New Page'}</span>
        </div>
        <h1>{isEditing ? 'Edit Page' : 'Create New Page'}</h1>
      </div>

      {error && <div className="page-editor-error">{error}</div>}

      <form onSubmit={handleSubmit} className="page-editor-form">
        <div className="form-group">
          <label htmlFor="page-title">Title</label>
          <input
            id="page-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="page-module">Module (optional)</label>
            <select
              id="page-module"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="form-input"
            >
              <option value="">No module</option>
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span className="toggle-text">
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Content</label>
          <RichTextEditor
            content={body}
            onChange={setBody}
            editable={true}
            placeholder="Write your page content here..."
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(isEditing ? `/courses/${courseId}/pages/${pageId}` : `/courses/${courseId}`)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Page'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PageEditor;
