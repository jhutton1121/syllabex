# Database Quick Reference

Quick reference guide for common database operations in Syllabex LMS.

## Initial Setup

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/Mac:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure database (create .env file)
# Copy env.template to .env and update values

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Start server
python manage.py runserver
```

## Common Commands

### Database Verification

```bash
# Verify database setup
python setup_database.py

# Check migration status
python manage.py showmigrations

# View database statistics
python database_utils.py stats
```

### Migrations

```bash
# Apply all migrations
python manage.py migrate

# Show pending migrations
python manage.py showmigrations

# Create new migrations (after model changes)
python manage.py makemigrations

# View SQL for a migration
python manage.py sqlmigrate users 0001
```

### Database Management

**Note:** All database utilities support both SQLite and PostgreSQL.

```bash
# Backup database
python database_utils.py backup
# or with custom filename:
python database_utils.py backup my_backup.json

# Restore database
python database_utils.py restore backup.json

# Reset database (development only - deletes all data)
python database_utils.py reset

# Seed with sample data
python database_utils.py seed

# View statistics
python database_utils.py stats
```

### Shortcuts (using wrapper scripts)

**Windows:**
```cmd
# Same as: python database_utils.py [command]
db.bat backup
db.bat restore backup.json
db.bat seed
db.bat stats
```

**Unix/Mac:**
```bash
# Make executable first:
chmod +x db.sh

# Then use:
./db.sh backup
./db.sh restore backup.json
./db.sh seed
./db.sh stats
```

## PostgreSQL Setup

### Quick PostgreSQL Setup

```bash
# 1. Install PostgreSQL (Windows/Mac/Linux)

# 2. Create database
psql -U postgres
CREATE DATABASE syllabex_db;
\q

# 3. Configure .env file
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syllabex_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# 4. Apply migrations
python manage.py migrate
```

For detailed PostgreSQL setup, see `POSTGRESQL_SETUP.md`.

## Django Shell Commands

```bash
# Open Django shell
python manage.py shell
```

### Common Shell Operations

```python
# Import models
from users.models import User, StudentProfile, TeacherProfile
from courses.models import Course, CourseEnrollment
from assignments.models import Assignment
from gradebook.models import GradeEntry

# Count records
User.objects.count()
Course.objects.count()

# Get all users
users = User.objects.all()

# Get specific user by email
user = User.objects.get(email='user@example.com')

# Get student profile
student = StudentProfile.objects.get(student_id='STU001')

# Get all active courses
active_courses = Course.objects.filter(is_active=True)

# Get course with enrollments
course = Course.objects.prefetch_related('enrollments').get(code='CS101')

# Get assignments for a course
assignments = Assignment.objects.filter(course=course)

# Create a new user
user = User.objects.create_user(
    email='newuser@example.com',
    password='password123'
)
```

## Database Schema

### Tables

```
users                   - Custom user accounts
student_profiles        - Student information
teacher_profiles        - Teacher information
admin_profiles         - Admin information
courses                - Course information
course_enrollments     - Student-course relationships
assignments            - All assignment types
assignment_submissions - Student submissions
grade_entries          - Student grades
```

### Key Relationships

```
User 1:1 StudentProfile
User 1:1 TeacherProfile
User 1:1 AdminProfile

TeacherProfile 1:N Course
Course 1:N Assignment
Course N:M StudentProfile (through CourseEnrollment)

Assignment 1:N AssignmentSubmission
StudentProfile 1:N AssignmentSubmission

CourseEnrollment 1:N GradeEntry
Assignment 1:N GradeEntry
```

## Sample Data (After Seeding)

```
Teacher Account:
  Email: teacher@syllabex.com
  Password: teacher123

Student Accounts:
  Email: student1@syllabex.com
  Password: student123
  
  Email: student2@syllabex.com
  Password: student123
  
  Email: student3@syllabex.com
  Password: student123

Course:
  Code: CS101
  Name: Introduction to Computer Science
  Students: 3 enrolled
  Assignments: 3 (quiz, homework, test)
```

## Troubleshooting

### Can't connect to database?

```bash
# Check database configuration
python setup_database.py

# Verify .env file exists with correct settings
cat .env  # Unix/Mac
type .env  # Windows
```

### Migrations not applying?

```bash
# Check for errors
python manage.py migrate --verbosity 3

# Try fake-initial for existing tables
python manage.py migrate --fake-initial
```

### Need to reset everything?

```bash
# For SQLite (development):
del db.sqlite3  # Windows
rm db.sqlite3   # Unix/Mac
python manage.py migrate

# For PostgreSQL:
python database_utils.py reset
```

## Environment Variables (.env)

Required variables:

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syllabex_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Performance Tips

1. **Use select_related() for foreign keys**:
```python
# Instead of:
courses = Course.objects.all()
# Use:
courses = Course.objects.select_related('teacher')
```

2. **Use prefetch_related() for reverse relations**:
```python
# Instead of:
course = Course.objects.get(id=1)
# Use:
course = Course.objects.prefetch_related('enrollments').get(id=1)
```

3. **Add indexes for frequently queried fields**:
   - Already done for: email, student_id, course_code, etc.

4. **Use database connection pooling** (production):
   - Consider pgBouncer for PostgreSQL

## Backup Strategy

### Development

```bash
# Quick backup before major changes
python database_utils.py backup
```

### Production

```bash
# Regular backups (add to cron/scheduled task)
python database_utils.py backup backup_$(date +%Y%m%d).json

# PostgreSQL native backup
pg_dump -U postgres syllabex_db > backup.sql

# Restore PostgreSQL backup
psql -U postgres syllabex_db < backup.sql
```

## Admin Interface

```
URL: http://localhost:8000/admin/

Features:
- User management
- Course management
- Assignment management
- Grade management
- Built-in authentication
```

## API Endpoints (Future)

```
POST /api/auth/login/          - Login
POST /api/auth/refresh/        - Refresh token
GET  /api/users/me/            - Current user
GET  /api/courses/             - List courses
GET  /api/assignments/         - List assignments
POST /api/assignments/submit/  - Submit assignment
GET  /api/gradebook/           - View grades
```

## Files Overview

```
backend/
├── config/                 - Django settings
├── users/                  - User models
├── courses/                - Course models
├── assignments/            - Assignment models
├── gradebook/              - Grade models
├── manage.py               - Django management
├── setup_database.py       - DB verification script
├── database_utils.py       - DB utilities
├── db.bat / db.sh          - Utility wrappers
├── env.template            - Environment template
├── README.md               - Main documentation
├── POSTGRESQL_SETUP.md     - PostgreSQL guide
├── MIGRATIONS.md           - Migration details
└── DATABASE_QUICK_REFERENCE.md - This file
```

## Support

For detailed information:
- PostgreSQL setup: `POSTGRESQL_SETUP.md`
- Migration details: `MIGRATIONS.md`
- Project overview: `README.md`
- Django docs: https://docs.djangoproject.com/
