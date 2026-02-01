import React from 'react';
import './RubricDisplay.css';

const RubricDisplay = ({ rubric, assessment, showScores }) => {
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    return null;
  }

  // Find the max number of ratings across all criteria
  const maxRatings = Math.max(...rubric.criteria.map(c => (c.ratings || []).length));

  // Build a lookup of selected ratings if assessment exists
  const selectedRatings = {};
  const criterionComments = {};
  if (assessment && assessment.criterion_scores) {
    assessment.criterion_scores.forEach(score => {
      selectedRatings[score.criterion] = score.selected_rating;
      if (score.comments) {
        criterionComments[score.criterion] = score.comments;
      }
    });
  }

  return (
    <div className="rubric-display">
      <div className="rubric-display-header">
        <h4 className="rubric-display-title">{rubric.title}</h4>
        {rubric.description && (
          <p className="rubric-display-desc">{rubric.description}</p>
        )}
        <span className="rubric-display-points">
          {showScores && assessment
            ? `${assessment.total_score} / ${rubric.criteria.reduce((sum, c) => sum + c.points_possible, 0)} pts`
            : `${rubric.criteria.reduce((sum, c) => sum + c.points_possible, 0)} pts total`
          }
        </span>
      </div>

      <div className="rubric-table-wrapper">
        <table className="rubric-table">
          <thead>
            <tr>
              <th className="rubric-th-criterion">Criteria</th>
              {Array.from({ length: maxRatings }, (_, i) => (
                <th key={i} className="rubric-th-rating">Level {i + 1}</th>
              ))}
              <th className="rubric-th-points">Points</th>
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map(criterion => {
              const ratings = criterion.ratings || [];
              const selectedId = selectedRatings[criterion.id];

              return (
                <React.Fragment key={criterion.id || criterion.order}>
                  <tr className="rubric-row">
                    <td className="rubric-td-criterion">
                      <div className="rubric-criterion-title">{criterion.title}</div>
                      {criterion.description && (
                        <div className="rubric-criterion-desc">{criterion.description}</div>
                      )}
                    </td>
                    {ratings.map((rating, ri) => {
                      const isSelected = selectedId === rating.id;
                      return (
                        <td
                          key={ri}
                          className={`rubric-td-rating ${isSelected ? 'rubric-td-selected' : ''}`}
                        >
                          <div className="rubric-rating-label">{rating.label}</div>
                          <div className="rubric-rating-desc">{rating.description}</div>
                          <div className="rubric-rating-points">{rating.points} pts</div>
                        </td>
                      );
                    })}
                    {/* Fill empty cells if fewer ratings */}
                    {Array.from({ length: maxRatings - ratings.length }, (_, i) => (
                      <td key={`empty-${i}`} className="rubric-td-rating rubric-td-empty" />
                    ))}
                    <td className="rubric-td-points">
                      {showScores && selectedId != null
                        ? ratings.find(r => r.id === selectedId)?.points ?? '—'
                        : criterion.points_possible
                      }
                    </td>
                  </tr>
                  {showScores && criterionComments[criterion.id] && (
                    <tr className="rubric-row-comment">
                      <td colSpan={maxRatings + 2} className="rubric-td-comment">
                        <span className="rubric-comment-label">Comment:</span> {criterionComments[criterion.id]}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RubricDisplay;
