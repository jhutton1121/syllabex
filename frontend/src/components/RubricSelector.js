import React, { useState, useEffect } from 'react';
import rubricService from '../services/rubricService';
import RubricBuilder from './RubricBuilder';
import RubricDisplay from './RubricDisplay';
import AIRubricChatPanel from './AIRubricChatPanel';
import './RubricSelector.css';

const RubricSelector = ({ courseId, selectedRubricId, onSelect, onClear, assignmentContext }) => {
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [previewRubric, setPreviewRubric] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadRubrics();
    }
  }, [courseId]);

  const loadRubrics = async () => {
    try {
      setLoading(true);
      const data = await rubricService.getRubrics(courseId);
      setRubrics(data.results || data);
    } catch (err) {
      console.error('Failed to load rubrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRubric = async (rubricData) => {
    try {
      const created = await rubricService.createRubric(courseId, rubricData);
      setRubrics(prev => [created, ...prev]);
      onSelect(created.id);
      setShowBuilder(false);
      setPreviewRubric(created);
    } catch (err) {
      console.error('Failed to create rubric:', err);
    }
  };

  const handleSelectRubric = async (rubricId) => {
    onSelect(rubricId);
    try {
      const full = await rubricService.getRubric(courseId, rubricId);
      setPreviewRubric(full);
    } catch (err) {
      console.error('Failed to load rubric details:', err);
    }
  };

  const handleAiRubricAccepted = async (rubricData) => {
    try {
      const created = await rubricService.createRubric(courseId, rubricData);
      setRubrics(prev => [created, ...prev]);
      onSelect(created.id);
      setPreviewRubric(created);
      setShowAiPanel(false);
    } catch (err) {
      console.error('Failed to save AI rubric:', err);
    }
  };

  if (showBuilder) {
    return (
      <RubricBuilder
        onSave={handleCreateRubric}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  return (
    <div className="rubric-selector">
      <div className="rubric-selector-header">
        <label className="rubric-selector-label">Grading Rubric</label>
        <div className="rubric-selector-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowBuilder(true)}
          >
            + Create New
          </button>
          <button
            className="btn btn-sm btn-ai"
            onClick={() => setShowAiPanel(true)}
          >
            AI Generate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rubric-selector-loading">Loading rubrics...</div>
      ) : rubrics.length === 0 && !selectedRubricId ? (
        <div className="rubric-selector-empty">
          No rubrics for this course yet. Create one to get started.
        </div>
      ) : (
        <div className="rubric-selector-dropdown">
          <select
            value={selectedRubricId || ''}
            onChange={e => {
              const val = e.target.value;
              if (val) {
                handleSelectRubric(parseInt(val, 10));
              } else {
                onClear();
                setPreviewRubric(null);
              }
            }}
          >
            <option value="">No rubric (standard grading)</option>
            {rubrics.map(r => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.total_points_possible} pts, {r.criteria_count} criteria)
              </option>
            ))}
          </select>
        </div>
      )}

      {previewRubric && selectedRubricId && (
        <div className="rubric-selector-preview">
          <RubricDisplay rubric={previewRubric} />
          <button
            className="btn btn-sm btn-secondary rubric-remove-btn"
            onClick={() => {
              onClear();
              setPreviewRubric(null);
            }}
          >
            Remove Rubric
          </button>
        </div>
      )}

      {showAiPanel && (
        <AIRubricChatPanel
          courseId={courseId}
          assignmentContext={assignmentContext}
          onRubricAccepted={handleAiRubricAccepted}
          isOpen={showAiPanel}
          onToggle={() => setShowAiPanel(false)}
        />
      )}
    </div>
  );
};

export default RubricSelector;
