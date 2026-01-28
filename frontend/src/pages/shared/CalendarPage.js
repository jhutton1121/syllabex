import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';

const localizer = momentLocalizer(moment);

function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  // Color palette for courses
  const courseColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Green
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#06b6d4', // Cyan
  ];

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching courses...');
      const coursesResponse = await courseService.getCourses();
      console.log('Courses response:', coursesResponse);

      // Handle different response formats (array or object with results)
      const coursesData = Array.isArray(coursesResponse)
        ? coursesResponse
        : coursesResponse.results || [];

      console.log('Courses fetched:', coursesData.length);
      setCourses(coursesData);

      // Fetch assignments for all courses
      const allEvents = [];
      for (let i = 0; i < coursesData.length; i++) {
        const course = coursesData[i];
        try {
          console.log(`Fetching assignments for course ${course.id}...`);
          const assignments = await assignmentService.getAssignments(course.id);
          console.log(`Found ${assignments.length} assignments for ${course.code}`);

          assignments.forEach(assignment => {
            // Add due date event
            if (assignment.due_date) {
              allEvents.push({
                id: assignment.id,
                title: `${assignment.title}`,
                start: new Date(assignment.due_date),
                end: new Date(assignment.due_date),
                courseId: course.id,
                courseName: course.name,
                courseCode: course.code,
                color: courseColors[i % courseColors.length],
                type: 'due',
                assignmentType: assignment.type,
                points: assignment.points_possible
              });
            }

            // Add start date event if available
            if (assignment.start_date) {
              allEvents.push({
                id: `start-${assignment.id}`,
                title: `${assignment.title} (Opens)`,
                start: new Date(assignment.start_date),
                end: new Date(assignment.start_date),
                courseId: course.id,
                courseName: course.name,
                courseCode: course.code,
                color: courseColors[i % courseColors.length],
                type: 'start',
                assignmentType: assignment.type,
                assignmentId: assignment.id
              });
            }
          });
        } catch (error) {
          console.error(`Error fetching assignments for course ${course.id}:`, error);
        }
      }

      console.log('Total events created:', allEvents.length);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError(error.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = selectedCourse === 'all'
    ? events
    : events.filter(event => event.courseId === parseInt(selectedCourse));

  const handleEventClick = (event) => {
    const assignmentId = event.type === 'start' ? event.assignmentId : event.id;
    navigate(`/courses/${event.courseId}/assignments/${assignmentId}`);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        opacity: event.type === 'start' ? 0.7 : 1,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 4px'
      }
    };
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-container">
          <div className="loading-spinner">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-page">
        <div className="calendar-container">
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h2>Error Loading Calendar</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchCalendarData}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <div className="calendar-header">
          <h1 className="calendar-title">Assignment Calendar</h1>

          <div className="calendar-controls">
            <button
              className="btn btn-secondary"
              onClick={() => setDate(new Date())}
            >
              Today
            </button>

            <div className="course-filter">
              <label htmlFor="course-select">Filter by Course:</label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="course-select"
              >
                <option value="all">All Courses</option>
                {courses.map((course, index) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="calendar-legend">
          <h3 className="legend-title">Legend:</h3>
          <div className="legend-items">
            {courses.map((course, index) => (
              <div key={course.id} className="legend-item">
                <span
                  className="legend-color"
                  style={{ backgroundColor: courseColors[index % courseColors.length] }}
                ></span>
                <span className="legend-text">
                  {course.code} - {course.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <p>No assignments scheduled</p>
          </div>
        ) : (
          <div className="calendar-wrapper">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              popup
              tooltipAccessor={(event) => `${event.title} - ${event.courseName}`}
            />
          </div>
        )}

        <div className="calendar-footer">
          <div className="upcoming-assignments">
            <h3>Upcoming Deadlines</h3>
            <div className="upcoming-list">
              {filteredEvents
                .filter(event => event.type === 'due' && new Date(event.start) >= new Date())
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 5)
                .map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className="upcoming-item"
                    onClick={() => handleEventClick(event)}
                  >
                    <span
                      className="upcoming-color"
                      style={{ backgroundColor: event.color }}
                    ></span>
                    <div className="upcoming-info">
                      <div className="upcoming-title">{event.title}</div>
                      <div className="upcoming-course">{event.courseCode}</div>
                    </div>
                    <div className="upcoming-date">
                      {moment(event.start).format('MMM DD, YYYY')}
                    </div>
                  </div>
                ))}
              {filteredEvents.filter(event => event.type === 'due' && new Date(event.start) >= new Date()).length === 0 && (
                <p className="no-upcoming">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
