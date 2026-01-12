# Syllabex Backend - Django REST API

This is the Django backend for the Syllabex Learning Management System.

## Features

- **Custom User Authentication**: Email-based authentication with JWT tokens
- **Role-based Access**: Separate profiles for Students, Teachers, and Admins
- **Course Management**: Create and manage courses with enrollments
- **Assignment System**: Support for Quizzes, Tests, and Homework with submissions
- **Gradebook**: Track and calculate student grades
- **API Root**: Welcome page at `/` with endpoint information

## Tech Stack

- Django 4.2.9
- Django REST Framework
- Simple JWT for authentication
- PostgreSQL/SQLite database
- CORS headers for React frontend integration

## Project Structure

```
backend/
├── config/              # Django project settings
├── users/               # User models and authentication
├── courses/             # Course and enrollment models
├── assignments/         # Assignment and submission models
├── gradebook/           # Grade tracking models
├── manage.py
└── requirements.txt
```

## Installation

### Prerequisites

- Python 3.8+
- PostgreSQL (optional, SQLite is used by default for development)

### Setup Steps

1. **Create a virtual environment**:
```bash
python -m venv venv
```

2. **Activate the virtual environment**:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure database**:
   
   **Option A: SQLite (Quick Start)**
   - No configuration needed - works out of the box
   - Good for development and testing
   
   **Option B: PostgreSQL (Recommended for Production)**
   - Install PostgreSQL on your system
   - Create a database: `CREATE DATABASE syllabex_db;`
   - Copy `env.template` to `.env` and configure:
     ```
     DB_ENGINE=django.db.backends.postgresql
     DB_NAME=syllabex_db
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=5432
     ```
   - See `POSTGRESQL_SETUP.md` for detailed instructions

5. **Verify database setup** (optional):
```bash
python setup_database.py
```

6. **Run migrations**:
```bash
python manage.py migrate
```

7. **Create a superuser**:
```bash
python manage.py createsuperuser
```

8. **Run the development server**:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## API Endpoints

### Root
- `GET /` - API welcome page with endpoint information

### Authentication
- `POST /api/auth/login/` - Obtain JWT token pair
- `POST /api/auth/refresh/` - Refresh JWT token

### Admin Interface
- `GET /admin/` - Django admin interface

*Additional API endpoints for users, courses, assignments, and gradebook will be added in the next phase.*

## Database Models

### Users App
- **User**: Custom user model with email authentication
- **StudentProfile**: Student-specific information
- **TeacherProfile**: Teacher-specific information
- **AdminProfile**: Admin-specific information

### Courses App
- **Course**: Course information and teacher assignment
- **CourseEnrollment**: Links students to courses

### Assignments App
- **Assignment**: Base model for all assignment types
- **Quiz/Test/Homework**: Proxy models for specific assignment types
- **AssignmentSubmission**: Student submissions

### Gradebook App
- **GradeEntry**: Individual grade records linked to enrollments

## Development

### Database Operations

**Verify Database Setup**:
```bash
python setup_database.py
```

**Create Migrations**:
```bash
python manage.py makemigrations
```

**Apply Migrations**:
```bash
python manage.py migrate
```

**Check Migration Status**:
```bash
python manage.py showmigrations
```

**Access Database Shell**:
```bash
# Django ORM shell
python manage.py shell

# Direct database shell
python manage.py dbshell
```

### Testing

**Run Tests**:
```bash
python manage.py test
```

**Run Specific App Tests**:
```bash
python manage.py test users
python manage.py test courses
python manage.py test assignments
python manage.py test gradebook
```

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in environment
2. Configure a production-grade database (PostgreSQL)
3. Set a secure `SECRET_KEY`
4. Configure proper `ALLOWED_HOSTS`
5. Set up static file serving
6. Use a production WSGI server (gunicorn, uWSGI)
7. Configure HTTPS and security headers

## Next Steps

- Implement API views and serializers for all apps
- Add custom permissions for role-based access
- Create comprehensive API documentation
- Add automated tests
- Implement file upload support for assignments
- Add email notifications

## License

Copyright © 2026 Syllabex
