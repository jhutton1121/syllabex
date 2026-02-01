import React, { useState } from 'react';
import './RubricBuilder.css';

const emptyRating = () => ({ label: '', description: '', points: 0, order: 0 });
const emptyCriterion = () => ({
  title: '',
  description: '',
  points_possible: 10,
  order: 0,
  ratings: [
    { label: 'Excellent', description: '', points: 10, order: 0 },
    { label: 'Good', description: '', points: 7, order: 1 },
    { label: 'Needs Work', description: '', points: 3, order: 2 },
    { label: 'Inadequate', description: '', points: 0, order: 3 },
  ],
});

const RubricBuilder = ({ rubric, onSave, onCancel }) => {
  const [title, setTitle] = useState(rubric?.title || '');
  const [description, setDescription] = useState(rubric?.description || '');
  const [isReusable, setIsReusable] = useState(rubric?.is_reusable ?? true);
  const [criteria, setCriteria] = useState(
    rubric?.criteria?.length
      ? rubric.criteria.map((c, i) => ({ ...c, order: c.order ?? i }))
      : [emptyCriterion()]
  );
  const [errors, setErrors] = useState({});

  const handleCriterionChange = (index, field, value) => {
    setCriteria(prev => prev.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, [field]: value };
      // If points_possible changed, scale the top rating to match
      if (field === 'points_possible') {
        const pts = parseInt(value, 10) || 0;
        if (updated.ratings.length > 0) {
          updated.ratings = updated.ratings.map((r, ri) =>
            ri === 0 ? { ...r, points: pts } : r
          );
        }
      }
      return updated;
    }));
  };

  const handleRatingChange = (cIndex, rIndex, field, value) => {
    setCriteria(prev => prev.map((c, ci) => {
      if (ci !== cIndex) return c;
      return {
        ...c,
        ratings: c.ratings.map((r, ri) =>
          ri === rIndex ? { ...r, [field]: field === 'points' ? (parseInt(value, 10) || 0) : value } : r
        ),
      };
    }));
  };

  const addCriterion = () => {
    const newC = emptyCriterion();
    newC.order = criteria.length;
    setCriteria(prev => [...prev, newC]);
  };

  const removeCriterion = (index) => {
    setCriteria(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i })));
  };

  const addRating = (cIndex) => {
    setCriteria(prev => prev.map((c, ci) => {
      if (ci !== cIndex) return c;
      const newR = emptyRating();
      newR.order = c.ratings.length;
      return { ...c, ratings: [...c.ratings, newR] };
    }));
  };

  const removeRating = (cIndex, rIndex) => {
    setCriteria(prev => prev.map((c, ci) => {
      if (ci !== cIndex) return c;
      return {
        ...c,
        ratings: c.ratings.filter((_, ri) => ri !== rIndex).map((r, ri) => ({ ...r, order: ri })),
      };
    }));
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (criteria.length === 0) errs.criteria = 'At least one criterion is required';
    criteria.forEach((c, i) => {
      if (!c.title.trim()) errs[`c${i}_title`] = 'Criterion title is required';
      if (!c.points_possible || c.points_possible <= 0) errs[`c${i}_points`] = 'Points must be positive';
      if (c.ratings.length < 2) errs[`c${i}_ratings`] = 'At least 2 rating levels required';
      c.ratings.forEach((r, ri) => {
        if (!r.label.trim()) errs[`c${i}_r${ri}_label`] = 'Rating label required';
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      is_reusable: isReusable,
      criteria: criteria.map((c, i) => ({
        title: c.title.trim(),
        description: c.description.trim(),
        points_possible: parseInt(c.points_possible, 10),
        order: i,
        ratings: c.ratings.map((r, ri) => ({
          label: r.label.trim(),
          description: r.description.trim(),
          points: parseInt(r.points, 10) || 0,
          order: ri,
        })),
      })),
    });
  };

  const totalPoints = criteria.reduce((sum, c) => sum + (parseInt(c.points_possible, 10) || 0), 0);

  return (
    <div className="rubric-builder">
      <div className="rubric-builder-header">
        <h3>{rubric ? 'Edit Rubric' : 'Create Rubric'}</h3>
        <span className="rubric-builder-total">{totalPoints} pts total</span>
      </div>

      <div className="rubric-builder-meta">
        <div className="rubric-builder-field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Essay Rubric"
            className={errors.title ? 'input-error' : ''}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>
        <div className="rubric-builder-field">
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of what this rubric assesses..."
            rows={2}
          />
        </div>
        <label className="rubric-builder-checkbox">
          <input
            type="checkbox"
            checked={isReusable}
            onChange={e => setIsReusable(e.target.checked)}
          />
          Reusable across assignments
        </label>
      </div>

      {errors.criteria && <div className="field-error">{errors.criteria}</div>}

      <div className="rubric-criteria-list">
        {criteria.map((criterion, cIndex) => (
          <div key={cIndex} className="rubric-criterion-card">
            <div className="rubric-criterion-header">
              <span className="rubric-criterion-num">Criterion {cIndex + 1}</span>
              {criteria.length > 1 && (
                <button
                  className="btn btn-sm btn-danger-text"
                  onClick={() => removeCriterion(cIndex)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="rubric-criterion-fields">
              <div className="rubric-builder-field">
                <label>Title</label>
                <input
                  type="text"
                  value={criterion.title}
                  onChange={e => handleCriterionChange(cIndex, 'title', e.target.value)}
                  placeholder="e.g. Thesis Clarity"
                  className={errors[`c${cIndex}_title`] ? 'input-error' : ''}
                />
              </div>
              <div className="rubric-builder-field">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={criterion.description}
                  onChange={e => handleCriterionChange(cIndex, 'description', e.target.value)}
                  placeholder="What this criterion assesses"
                />
              </div>
              <div className="rubric-builder-field rubric-field-narrow">
                <label>Max Points</label>
                <input
                  type="number"
                  min="1"
                  value={criterion.points_possible}
                  onChange={e => handleCriterionChange(cIndex, 'points_possible', e.target.value)}
                  className={errors[`c${cIndex}_points`] ? 'input-error' : ''}
                />
              </div>
            </div>

            <div className="rubric-ratings-section">
              <div className="rubric-ratings-label">
                Rating Levels
                {errors[`c${cIndex}_ratings`] && (
                  <span className="field-error"> — {errors[`c${cIndex}_ratings`]}</span>
                )}
              </div>
              {criterion.ratings.map((rating, rIndex) => (
                <div key={rIndex} className="rubric-rating-row">
                  <input
                    type="text"
                    value={rating.label}
                    onChange={e => handleRatingChange(cIndex, rIndex, 'label', e.target.value)}
                    placeholder="Label (e.g. Excellent)"
                    className={`rubric-rating-label-input ${errors[`c${cIndex}_r${rIndex}_label`] ? 'input-error' : ''}`}
                  />
                  <input
                    type="text"
                    value={rating.description}
                    onChange={e => handleRatingChange(cIndex, rIndex, 'description', e.target.value)}
                    placeholder="Description"
                    className="rubric-rating-desc-input"
                  />
                  <input
                    type="number"
                    min="0"
                    max={criterion.points_possible}
                    value={rating.points}
                    onChange={e => handleRatingChange(cIndex, rIndex, 'points', e.target.value)}
                    className="rubric-rating-points-input"
                  />
                  <span className="rubric-rating-pts-label">pts</span>
                  {criterion.ratings.length > 2 && (
                    <button
                      className="btn btn-sm btn-icon-only btn-danger-text"
                      onClick={() => removeRating(cIndex, rIndex)}
                      title="Remove rating"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                className="btn btn-sm btn-secondary rubric-add-rating-btn"
                onClick={() => addRating(cIndex)}
              >
                + Add Rating Level
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary rubric-add-criterion-btn" onClick={addCriterion}>
        + Add Criterion
      </button>

      <div className="rubric-builder-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>
          {rubric ? 'Update Rubric' : 'Create Rubric'}
        </button>
      </div>
    </div>
  );
};

export default RubricBuilder;
