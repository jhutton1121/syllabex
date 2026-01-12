# Syllabex LMS

A modern Learning Management System built with Django and React.

## Overview

Syllabex is a comprehensive LMS platform featuring:
- Custom Authentication with JWT tokens
- Role-Based Access (Students, Teachers, Admins)
- Course Management with enrollments
- Assignment System (Quizzes, Tests, Homework)
- Gradebook with grade tracking
- RESTful API backend
- Modern React frontend (in development)

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Visit http://localhost:8000/admin/

## Documentation

- [Backend README](backend/README.md) - Backend overview and setup
- [PostgreSQL Setup](backend/POSTGRESQL_SETUP.md) - Database configuration
- [Migrations Guide](backend/MIGRATIONS.md) - Database migrations
- [Quick Reference](backend/DATABASE_QUICK_REFERENCE.md) - Common operations

## Database Tools

```bash
# Verify database setup
python setup_database.py

# Database utilities
python database_utils.py backup
python database_utils.py seed
python database_utils.py stats
```

## Tech Stack

**Backend:**
- Django 4.2.9
- Django REST Framework
- Simple JWT
- PostgreSQL / SQLite

**Frontend (Planned):**
- React 18
- React Router
- Axios

## Features

### Current Features

✅ User Management (email-based auth)
✅ Course Management
✅ Assignment System (Quiz/Test/Homework)
✅ Gradebook
✅ Database Optimization
✅ PostgreSQL Configuration

### Planned Features

🔜 RESTful API endpoints
🔜 React Frontend
🔜 File uploads
🔜 Email notifications

## Database Schema

**Users:** User, StudentProfile, TeacherProfile, AdminProfile
**Courses:** Course, CourseEnrollment
**Assignments:** Assignment, AssignmentSubmission
**Gradebook:** GradeEntry

See [MIGRATIONS.md](backend/MIGRATIONS.md) for details.

## Environment Configuration

Create `.env` in backend directory (see `backend/env.template`):

```env
DEBUG=True
SECRET_KEY=your-secret-key
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syllabex_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Sample Data

After running `python database_utils.py seed`:

- Teacher: teacher@syllabex.com / teacher123
- Student1: student1@syllabex.com / student123
- Student2: student2@syllabex.com / student123
- Student3: student3@syllabex.com / student123

## Project Status

**Current Phase:** Backend Foundation ✅

- ✅ Project structure
- ✅ User models
- ✅ Course models
- ✅ Assignment models
- ✅ Gradebook models
- ✅ Database migrations
- ✅ PostgreSQL configuration
- 🔜 API endpoints (next)
- 🔜 React frontend

## License

Copyright © 2026 Syllabex
