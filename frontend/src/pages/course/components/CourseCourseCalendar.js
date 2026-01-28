import React from 'react';

function CourseCourseCalendar({ course, assignments }) {
  // Filter upcoming assignments
  const upcomingAssignments = assignments
    .filter(a => a.due_date && new Date(a.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 10);

  return (
    <div className="course-calendar">
      <div className="calendar-placeholder">
        <div className="empty-icon">📅</div>
        <h3>Course Calendar View</h3>
        <p>A dedicated calendar view for {course.name} will be available here.</p>
        <p className="info-subtext">
          For now, use the main Calendar page to see all assignment due dates.
        </p>
      </div>

      {upcomingAssignments.length > 0 && (
        <div className="upcoming-section">
          <h3>Upcoming Deadlines</h3>
          <div className="upcoming-list">
            {upcomingAssignments.map((assignment) => (
              <div key={assignment.id} className="upcoming-item">
                <span className={`type-indicator ${assignment.type}`}></span>
                <div className="upcoming-info">
                  <div className="upcoming-title">{assignment.title}</div>
                  <div className="upcoming-type">{assignment.type}</div>
                </div>
                <div className="upcoming-date">
                  {new Date(assignment.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseCourseCalendar;
