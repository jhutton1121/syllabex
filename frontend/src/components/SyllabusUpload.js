import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';
import './SyllabusUpload.css';

const SyllabusUpload = ({ courseId }) => {
  const [syllabi, setSyllabi] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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
      // Silently fail - syllabi are optional
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
      // Reset file input
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
    <div className="syllabus-upload">
      <h4 className="syllabus-title">Course Context</h4>
      <p className="syllabus-desc">
        Upload a syllabus so the AI can reference course topics when generating questions.
      </p>

      {error && <div className="syllabus-error">{error}</div>}

      <label className="syllabus-upload-btn">
        {uploading ? 'Uploading...' : '+ Upload Syllabus'}
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleUpload}
          disabled={uploading}
          hidden
        />
      </label>

      {syllabi.length > 0 && (
        <ul className="syllabus-list">
          {syllabi.map(s => (
            <li key={s.id} className="syllabus-item">
              <span className="syllabus-filename">{s.original_filename}</span>
              <button
                className="syllabus-delete-btn"
                onClick={() => handleDelete(s.id)}
                title="Remove"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      {syllabi.length === 0 && !uploading && (
        <p className="syllabus-empty">No syllabus uploaded yet.</p>
      )}
    </div>
  );
};

export default SyllabusUpload;
