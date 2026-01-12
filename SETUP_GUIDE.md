# Syllabex LMS - Complete Setup Guide

This guide will walk you through setting up and testing the Syllabex LMS application.

## Quick Start

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser for Django admin
python manage.py createsuperuser
# Enter email: admin@example.com
# Enter password: (your password)

# Start backend server
python manage.py runserver
```

Backend is now running at `http://localhost:8000`

### Step 2: Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm start
```

Frontend is now running at `http://localhost:3000`

## Testing the Application

### 1. Register Users

Visit `http://localhost:3000/register`

**Register a Teacher:**
- Email: teacher@test.com
- Password: TestPass123!
- Confirm Password: TestPass123!
- Role: Teacher
- Employee ID: TCH001
- Department: Computer Science

**Register a Student:**
- Email: student@test.com
- Password: TestPass123!
- Confirm Password: TestPass123!
- Role: Student
- Student ID: STU001
- Date of Birth: (optional)

### 2. Login as Teacher

1. Go to `http://localhost:3000/login`
2. Email: teacher@test.com
3. Password: TestPass123!
4. You'll be redirected to Teacher Dashboard

### 3. Create a Course

1. From Teacher Dashboard, click "Create New Course"
2. Fill in course details:
   - Code: CS101
   - Name: Introduction to Python
   - Description: Learn Python programming basics
   - Make sure it's Active
3. Click "Create Course" (Note: course creation UI may need to be added)

Alternative: Use Django Admin
1. Go to `http://localhost:8000/admin/`
2. Login with superuser credentials
3. Go to "Courses" → "Add Course"
4. Fill in details and select your teacher profile
5. Save

### 4. Enroll Student in Course

Use Django Admin:
1. Go to `http://localhost:8000/admin/`
2. Go to "Course Enrollments" → "Add Course Enrollment"
3. Select the student (STU001)
4. Select the course (CS101)
5. Status: Active
6. Save

### 5. Create an Assignment

1. Login as teacher@test.com
2. From Teacher Dashboard, click "Create New Assignment"
3. Fill in assignment details:
   - Course: CS101 - Introduction to Python
   - Type: Homework
   - Title: Python Basics Exercise
   - Description: Write a program that prints "Hello, World!"
   - Due Date: (select a future date)
   - Points Possible: 100
4. Click "Create Assignment"

### 6. Submit Assignment as Student

1. Logout and login as student@test.com
2. You'll see the assignment on Student Dashboard
3. Click "View Assignment"
4. Type your answer in the text area
5. Click "Submit Assignment"

### 7. Grade Assignment as Teacher

1. Logout and login as teacher@test.com
2. From Teacher Dashboard, find the assignment
3. Click "View Submissions"
4. You'll see the student's submission

To grade (via Django Admin for now):
1. Go to `http://localhost:8000/admin/`
2. Go to "Grade Entries" → "Add Grade Entry"
3. Select the enrollment (student in course)
4. Select the assignment
5. Enter grade (e.g., 95 out of 100)
6. Add comments (optional)
7. Save

### 8. View Grades as Student

1. Login as student@test.com
2. View grades in the dashboard (grades display may need enhancement)

## Testing API Endpoints

### Using Django Admin

1. Go to `http://localhost:8000/admin/`
2. Explore all the models:
   - Users
   - Student Profiles
   - Teacher Profiles
   - Admin Profiles
   - Courses
   - Course Enrollments
   - Assignments
   - Assignment Submissions
   - Grade Entries

### Using API Directly

You can test endpoints using tools like Postman or curl:

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"TestPass123!"}'
```

This returns JWT tokens. Use the access token for authenticated requests:

**Get Courses:**
```bash
curl http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Issues

### Backend won't start

**Issue:** Port 8000 already in use
**Solution:** Stop other Django processes or use different port:
```bash
python manage.py runserver 8001
```

**Issue:** Database errors
**Solution:** Delete `db.sqlite3` and run migrations again:
```bash
rm db.sqlite3
python manage.py migrate
```

### Frontend won't start

**Issue:** Port 3000 already in use
**Solution:** Stop other React processes or the app will prompt to use different port

**Issue:** API connection errors
**Solution:** Make sure backend is running on port 8000 and `.env` has correct API URL

### CORS Errors

**Solution:** Check `backend/config/settings.py` CORS settings include:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

### Authentication Issues

**Issue:** Tokens not working
**Solution:** 
1. Clear browser localStorage
2. Login again
3. Check browser console for errors

## Database Schema

The application uses the following main models:

```
User (email-based authentication)
├── StudentProfile (student_id, date_of_birth)
├── TeacherProfile (employee_id, department)
└── AdminProfile (employee_id, permissions_level)

Course (code, name, teacher)
└── CourseEnrollment (student, course, status)
    └── GradeEntry (enrollment, assignment, grade)

Assignment (course, type, title, due_date)
└── AssignmentSubmission (assignment, student, answer)
```

## Next Steps

1. **Enhance UI:** Add more styling and improve user experience
2. **Add Features:**
   - Course creation UI for teachers
   - Grading UI for teachers
   - Better grade display for students
   - Assignment edit functionality
   - File uploads
3. **Testing:** Write unit and integration tests
4. **Deployment:** Configure for production deployment

## Development Tips

### Backend Changes

After making model changes:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend Changes

React will auto-reload when you save files.

### Viewing Logs

- Backend: Check terminal running Django server
- Frontend: Check browser console (F12)

## Support

If you encounter issues:
1. Check terminal outputs for error messages
2. Check browser console for frontend errors
3. Verify all services are running
4. Check Django admin for data consistency

## Production Considerations

Before deploying to production:

1. **Security:**
   - Change `SECRET_KEY` in `.env`
   - Set `DEBUG=False`
   - Use PostgreSQL instead of SQLite
   - Enable HTTPS
   - Update `ALLOWED_HOSTS`

2. **Performance:**
   - Add database indexes
   - Enable caching
   - Use production WSGI server (gunicorn)
   - Use production web server (nginx)

3. **Frontend:**
   - Build React app: `npm run build`
   - Serve static files properly
   - Update API URL to production backend

Happy coding! 🚀
