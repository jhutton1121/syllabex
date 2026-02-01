import React, { useState, useEffect } from 'react';
import rubricService from '../services/rubricService';
import './RubricGradingPanel.css';

const RubricGradingPanel = ({ rubric, submissionId, existingAssessment, onGraded }) => {
  const [selectedRatings, setSelectedRatings] = useState({});
  const [comments, setComments] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existingAssessment && existingAssessment.criterion_scores) {
      const ratings = {};
      const cmts = {};
      existingAssessment.criterion_scores.forEach(score => {
        ratings[score.criterion] = score.selected_rating;
        if (score.comments) cmts[score.criterion] = score.comments;
      });
      setSelectedRatings(ratings);
      setComments(cmts);
    }
  }, [existingAssessment]);

  if (!rubric || !rubric.criteria) return null;

  const totalScore = rubric.criteria.reduce((sum, c) => {
    const ratingId = selectedRatings[c.id];
    if (!ratingId) return sum;
    const rating = c.ratings.find(r => r.id === ratingId);
    return sum + (rating ? rating.points : 0);
  }, 0);

  const totalPossible = rubric.criteria.reduce((sum, c) => sum + c.points_possible, 0);
  const allCriteriaRated = rubric.criteria.every(c => selectedRatings[c.id] != null);

  const handleSelectRating = (criterionId, ratingId) => {
    setSelectedRatings(prev => ({ ...prev, [criterionId]: ratingId }));
    setSaved(false);
  };

  const handleCommentChange = (criterionId, value) => {
    setComments(prev => ({ ...prev, [criterionId]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!allCriteriaRated) return;
    setSaving(true);
    try {
      const criterionScores = rubric.criteria.map(c => ({
        criterion_id: c.id,
        rating_id: selectedRatings[c.id],
        comments: comments[c.id] || '',
      }));

      const result = await rubricService.createAssessment(submissionId, {
        criterion_scores: criterionScores,
      });

      setSaved(true);
      if (onGraded) onGraded(result);
    } catch (err) {
      console.error('Failed to save rubric assessment:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rubric-grading-panel">
      <div className="rubric-grading-header">
        <h3 className="rubric-grading-title">Rubric: {rubric.title}</h3>
        <div className="rubric-grading-score">
          <span className="rubric-grading-score-value">{totalScore}</span>
          <span className="rubric-grading-score-sep">/</span>
          <span className="rubric-grading-score-total">{totalPossible}</span>
          <span className="rubric-grading-score-label">pts</span>
        </div>
      </div>

      <div className="rubric-grading-criteria">
        {rubric.criteria.map(criterion => (
          <div key={criterion.id} className="rubric-grading-criterion">
            <div className="rubric-grading-criterion-header">
              <div className="rubric-grading-criterion-title">{criterion.title}</div>
              <div className="rubric-grading-criterion-points">
                {selectedRatings[criterion.id]
                  ? `${criterion.ratings.find(r => r.id === selectedRatings[criterion.id])?.points ?? 0} / ${criterion.points_possible}`
                  : `— / ${criterion.points_possible}`
                } pts
              </div>
            </div>
            {criterion.description && (
              <div className="rubric-grading-criterion-desc">{criterion.description}</div>
            )}

            <div className="rubric-grading-ratings">
              {criterion.ratings.map(rating => {
                const isSelected = selectedRatings[criterion.id] === rating.id;
                return (
                  <button
                    key={rating.id}
                    className={`rubric-grading-rating-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectRating(criterion.id, rating.id)}
                  >
                    <div className="rubric-grading-rating-label">{rating.label}</div>
                    <div className="rubric-grading-rating-desc">{rating.description}</div>
                    <div className="rubric-grading-rating-points">{rating.points} pts</div>
                  </button>
                );
              })}
            </div>

            <div className="rubric-grading-comment">
              <textarea
                placeholder="Optional comment for this criterion..."
                value={comments[criterion.id] || ''}
                onChange={e => handleCommentChange(criterion.id, e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rubric-grading-footer">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!allCriteriaRated || saving}
        >
          {saving ? 'Saving...' : saved ? '✓ Rubric Saved' : 'Save Rubric Assessment'}
        </button>
        {!allCriteriaRated && (
          <span className="rubric-grading-hint">Select a rating for each criterion to save</span>
        )}
      </div>
    </div>
  );
};

export default RubricGradingPanel;
