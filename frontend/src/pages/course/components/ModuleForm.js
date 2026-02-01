import React, { useState, useEffect } from 'react';
import courseService from '../../../services/courseService';
import assignmentService from '../../../services/assignmentService';
import RichTextEditor from '../../../components/RichTextEditor';
import './ModuleForm.css';

function ModuleForm({ courseId, module, assignments: propAssignments, onSave, onCancel }) {
  const isEdit = !!module;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    zoom_link: '',
  });
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || '',
        description: module.description || '',
        start_date: module.start_date || '',
        end_date: module.end_date || '',
        zoom_link: module.zoom_link || '',
      });
      setSelectedAssignments(
        (module.assignments || []).map((a) => a.id)
      );
    }
  }, [module]);

  useEffect(() => {
    // Load all course assignments so user can pick which ones belong to this module
    if (propAssignments) {
      setAllAssignments(propAssignments);
    } else {
      assignmentService.getAssignments(courseId).then((data) => {
        setAllAssignments(data.results || data);
      }).catch(() => {});
    }
  }, [courseId, propAssignments]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAssignment = (id) => {
    setSelectedAssignments((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setError('Start and end dates are required.');
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('End date must be after start date.');
      return;
    }

    setSaving(true);
    try {
      let savedModule;
      if (isEdit) {
        savedModule = await courseService.updateCourseModule(courseId, module.id, formData);
      } else {
        savedModule = await courseService.createCourseModule(courseId, formData);
      }

      // Update assignment module references
      const moduleId = savedModule.id;
      const prevAssignmentIds = isEdit ? (module.assignments || []).map((a) => a.id) : [];

      // Assignments to add to this module
      const toAdd = selectedAssignments.filter((id) => !prevAssignmentIds.includes(id));
      // Assignments to remove from this module
      const toRemove = prevAssignmentIds.filter((id) => !selectedAssignments.includes(id));

      const updates = [];
      for (const id of toAdd) {
        updates.push(assignmentService.patchAssignment(id, { module_id: moduleId }));
      }
      for (const id of toRemove) {
        updates.push(assignmentService.patchAssignment(id, { module_id: null }));
      }
      await Promise.all(updates);

      onSave();
    } catch (err) {
      console.error(err);
      setError('Failed to save module. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-form-card">
      <h3>{isEdit ? 'Edit Module' : 'New Module'}</h3>
      {error && <div className="alert-warning" style={{ marginBottom: 16 }}><strong>Error</strong><p>{error}</p></div>}
      <form onSubmit={handleSubmit}>
        <div className="module-form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Time Value of Money"
          />
        </div>

        <div className="module-form-group">
          <label>Description</label>
          <RichTextEditor
            content={formData.description}
            onChange={(html) => setFormData({ ...formData, description: html })}
            placeholder="Brief overview of what this module covers..."
          />
        </div>

        <div className="module-form-row">
          <div className="module-form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
            />
          </div>
          <div className="module-form-group">
            <label>End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="module-form-group">
          <label>Zoom Lecture Link</label>
          <input
            type="url"
            name="zoom_link"
            value={formData.zoom_link}
            onChange={handleChange}
            placeholder="https://zoom.us/j/..."
          />
          <span className="module-form-hint">Optional — link to live or recorded lecture.</span>
        </div>

        <div className="module-form-group">
          <label>Assignments</label>
          {(() => {
            const editingModuleId = isEdit ? module.id : null;
            const available = allAssignments.filter(
              (a) => !a.module || a.module === editingModuleId
            );
            return available.length === 0 ? (
            <p className="no-assignments-hint">
              {allAssignments.length === 0
                ? 'No assignments in this course yet.'
                : 'All assignments are already assigned to other modules.'}
            </p>
          ) : (
            <div className="assignment-checklist">
              {available.map((a) => (
                <label key={a.id} className="assignment-check-item">
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(a.id)}
                    onChange={() => toggleAssignment(a.id)}
                  />
                  <span className="check-label">{a.title}</span>
                  <span className="check-type">{a.type}</span>
                </label>
              ))}
            </div>
          );
          })()}
        </div>

        <div className="module-form-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Module'}
          </button>
          <button type="button" className="btn-form-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModuleForm;
