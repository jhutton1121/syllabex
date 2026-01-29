import React from 'react';

function CourseSyllabus({ course, isInstructor }) {
  return (
    <div className="course-syllabus">
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h3>No syllabus available</h3>
        {isInstructor ? (
          <p>Add a syllabus to help students understand course objectives and requirements.</p>
        ) : (
          <p>Your instructor hasn't uploaded a syllabus yet.</p>
        )}
      </div>
    </div>
  );
}

export default CourseSyllabus;
