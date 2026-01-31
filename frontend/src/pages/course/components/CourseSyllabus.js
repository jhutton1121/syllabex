import React, { useState, useEffect } from 'react';
import aiService from '../../../services/aiService';

function CourseSyllabus({ course, isInstructor }) {
  const [syllabi, setSyllabi] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const courseId = course?.id;

  useEffect(() => {
    if (courseId) {
      loadSyllabi();
    }
  }, [courseId]);

  const loadSyllabi = async () => {
    try {
      const data = await aiService.getSyllabi(courseId);
      setSyllabi(data.results || data);
    } catch {
      // Syllabi are optional
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }

    setError('');
    setUploading(true);
    try {
      await aiService.uploadSyllabus(courseId, file);
      await loadSyllabi();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await aiService.deleteSyllabus(id);
      setSyllabi(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete syllabus.');
    }
  };

  return (
    <div className="course-syllabus">
      <h2>Syllabus</h2>

      {isInstructor && (
        <div className="syllabus-upload-section">
          <p className="syllabus-upload-desc">
            Upload course syllabi (PDF or DOCX). Uploaded documents provide context to the AI assistant for generating modules and assignments.
          </p>

          {error && <div className="syllabus-error-banner">{error}</div>}

          <label className="syllabus-upload-area">
            {uploading ? 'Uploading...' : '+ Upload Syllabus'}
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleUpload}
              disabled={uploading}
              hidden
            />
          </label>
        </div>
      )}

      {syllabi.length > 0 ? (
        <div className="syllabus-file-list">
          {syllabi.map(s => (
            <div key={s.id} className="syllabus-file-card">
              <div className="syllabus-file-header">
                <span className="syllabus-file-icon">📄</span>
                <span className="syllabus-file-name">{s.original_filename}</span>
                {s.file && (
                  <a
                    href={s.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="syllabus-download-btn"
                  >
                    Download
                  </a>
                )}
                {isInstructor && (
                  <button
                    className="syllabus-remove-btn"
                    onClick={() => handleDelete(s.id)}
                    title="Remove"
                  >
                    &times;
                  </button>
                )}
              </div>
              {s.char_count === 0 ? (
                <div className="syllabus-extraction-warning">
                  No text could be extracted from this file. The AI won't have syllabus context. Try uploading a different format.
                </div>
              ) : (
                <div className="syllabus-extraction-status">
                  <span className="syllabus-extracted-chars">{s.char_count.toLocaleString()} characters extracted</span>
                  {s.preview && (
                    <p className="syllabus-text-preview">{s.preview}...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No syllabus available</h3>
          {isInstructor ? (
            <p>Upload a syllabus to help students and the AI assistant understand course objectives.</p>
          ) : (
            <p>Your instructor hasn't uploaded a syllabus yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseSyllabus;
