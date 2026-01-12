# Database Migrations Guide

This document describes the database migrations for the Syllabex LMS project.

## Migration Overview

The project uses Django's migration system to manage database schema changes. All migrations have been created and are ready to apply.

## Existing Migrations

### Users App (0001_initial)

Creates the core authentication models:

**Tables Created:**
- `users` - Custom user model with email-based authentication
  - Fields: email (unique, indexed), password, is_active, is_staff, is_superuser, created_at, updated_at
  - Includes Django's built-in groups and permissions support

- `student_profiles` - Student-specific profile data
  - Fields: user (OneToOne FK), student_id (unique, indexed), date_of_birth, enrollment_date
  
- `teacher_profiles` - Teacher-specific profile data
  - Fields: user (OneToOne FK), employee_id (unique, indexed), department, hire_date
  
- `admin_profiles` - Admin-specific profile data
  - Fields: user (OneToOne FK), employee_id (unique, indexed), permissions_level

**Indexes:**
- Email (unique constraint + index)
- Student ID (unique constraint + index)
- Employee ID for teachers (unique constraint + index)
- Employee ID for admins (unique constraint + index)

### Courses App (0001_initial & 0002_initial)

Creates course and enrollment models:

**Tables Created:**
- `courses` - Course information
  - Fields: code (unique, indexed), name, description, teacher (FK), is_active (indexed), created_at, updated_at
  - Ordered by: created_at (descending)
  
- `course_enrollments` - Student course enrollments
  - Fields: student (FK, indexed), course (FK, indexed), enrolled_at, status (indexed)
  - Unique constraint: (student, course)
  - Status choices: active, dropped, completed
  - Ordered by: enrolled_at (descending)

**Indexes:**
- Course code (unique constraint + index)
- Teacher foreign key (index)
- Course is_active flag (index)
- Enrollment student foreign key (index)
- Enrollment course foreign key (index)
- Enrollment status (index)

### Assignments App (0001_initial & 0002_initial)

Creates assignment and submission models:

**Tables Created:**
- `assignments` - All assignment types (quiz, test, homework)
  - Fields: course (FK, indexed), type (indexed), title, description, due_date (indexed), points_possible, created_at, updated_at
  - Type choices: quiz, test, homework
  - Ordered by: due_date (descending)
  
- `assignment_submissions` - Student assignment submissions
  - Fields: assignment (FK, indexed), student (FK, indexed), answer, submitted_at (indexed), is_late
  - Unique constraint: (assignment, student)
  - Ordered by: submitted_at (descending)

**Proxy Models Created:**
- `Quiz` - Proxy model filtering type='quiz'
- `Test` - Proxy model filtering type='test'
- `Homework` - Proxy model filtering type='homework'

**Indexes:**
- Assignment course foreign key (index)
- Assignment type (index)
- Assignment due_date (index)
- Submission assignment foreign key (index)
- Submission student foreign key (index)
- Submission submitted_at (index)

### Gradebook App (0001_initial & 0002_initial)

Creates grade tracking models:

**Tables Created:**
- `grade_entries` - Individual grade records
  - Fields: enrollment (FK, indexed), assignment (FK, indexed), grade (Decimal), graded_by (FK to Teacher), graded_at (indexed), comments
  - Unique constraint: (enrollment, assignment)
  - Ordered by: graded_at (descending)

**Indexes:**
- Enrollment foreign key (index)
- Assignment foreign key (index)
- Graded_at timestamp (index)

## Migration Dependencies

The migrations have the following dependency chain:

```
users.0001_initial
    ↓
courses.0001_initial → courses.0002_initial
    ↓                       ↓
assignments.0001_initial → assignments.0002_initial
    ↓                       ↓
gradebook.0001_initial → gradebook.0002_initial
```

Django automatically handles these dependencies when running migrations.

## Applying Migrations

### First Time Setup

1. **Ensure database is configured**:
   - SQLite: Works by default
   - PostgreSQL: See `POSTGRESQL_SETUP.md`

2. **Apply all migrations**:
```bash
python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, assignments, auth, contenttypes, courses, gradebook, sessions, users
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0001_initial... OK
  ...
  Applying users.0001_initial... OK
  Applying courses.0001_initial... OK
  Applying courses.0002_initial... OK
  Applying assignments.0001_initial... OK
  Applying assignments.0002_initial... OK
  Applying gradebook.0001_initial... OK
  Applying gradebook.0002_initial... OK
```

3. **Verify migrations**:
```bash
python manage.py showmigrations
```

All migrations should show `[X]`.

### Checking Migration Status

**Show all migrations**:
```bash
python manage.py showmigrations
```

**Show migrations for specific app**:
```bash
python manage.py showmigrations users
python manage.py showmigrations courses
```

**Show SQL for a migration** (without applying):
```bash
python manage.py sqlmigrate users 0001
```

### Rolling Back Migrations

**Rollback to a specific migration**:
```bash
# Rollback users app to initial state
python manage.py migrate users 0001

# Rollback all migrations for an app
python manage.py migrate users zero
```

**Rollback all apps**:
```bash
python manage.py migrate --fake-initial
```

⚠️ **Warning**: Rolling back migrations can result in data loss. Always backup your database first.

## Creating New Migrations

When you modify models, create new migrations:

1. **Make changes to models** in `models.py`

2. **Create migrations**:
```bash
python manage.py makemigrations
```

3. **Review the migration file** in `app_name/migrations/`

4. **Test the migration** on a development database:
```bash
python manage.py migrate
```

5. **Add migration to version control**:
```bash
git add app_name/migrations/xxxx_migration_name.py
git commit -m "Add migration for model changes"
```

### Best Practices for Migrations

1. **Always review generated migrations** before applying
2. **Test migrations on development database first**
3. **Create separate migrations for different changes**
4. **Add data migrations when needed** (not just schema)
5. **Document complex migrations** with comments
6. **Never edit applied migrations** (create new ones instead)
7. **Backup database before applying migrations** in production

## Data Migrations

To create data migrations (for populating or transforming data):

```bash
python manage.py makemigrations --empty app_name
```

Then edit the migration file to add data operations.

Example data migration:
```python
from django.db import migrations

def populate_data(apps, schema_editor):
    Model = apps.get_model('app_name', 'ModelName')
    Model.objects.create(field='value')

class Migration(migrations.Migration):
    dependencies = [
        ('app_name', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(populate_data),
    ]
```

## Migration Commands Reference

```bash
# Show migration status
python manage.py showmigrations

# Show specific app migrations
python manage.py showmigrations users

# Create new migrations
python manage.py makemigrations

# Create migrations for specific app
python manage.py makemigrations users

# Apply all migrations
python manage.py migrate

# Apply specific app migrations
python manage.py migrate users

# Show SQL for migration
python manage.py sqlmigrate users 0001

# Rollback to specific migration
python manage.py migrate users 0001

# Rollback all migrations for an app
python manage.py migrate users zero

# Mark migrations as applied without running
python manage.py migrate --fake

# Verify database matches migrations
python manage.py migrate --check
```

## Troubleshooting

### "Table already exists" Error

This usually happens when the database has tables but Django thinks migrations haven't been applied.

**Solution**:
```bash
python manage.py migrate --fake-initial
```

### Conflicting Migrations

If multiple developers create migrations simultaneously:

1. Delete your migration file
2. Pull the latest changes
3. Recreate your migrations
4. Django will merge them automatically

### Migration Dependencies

If you get dependency errors:

1. Check the `dependencies` list in your migration file
2. Ensure required migrations exist
3. Run migrations in the correct order

### Reset Migrations (Development Only)

⚠️ **WARNING**: This will delete all data!

```bash
# Delete database
rm db.sqlite3  # or drop PostgreSQL database

# Delete all migration files except __init__.py
# (in each app's migrations folder)

# Recreate migrations
python manage.py makemigrations
python manage.py migrate
```

## Performance Considerations

The current schema includes several optimizations:

1. **Indexes on Foreign Keys**: All foreign key relationships are indexed
2. **Indexes on Lookup Fields**: email, student_id, employee_id, code are indexed
3. **Indexes on Filter Fields**: is_active, status, type, due_date are indexed
4. **Unique Constraints**: Prevent duplicate data and improve lookup performance

These optimizations support:
- Fast course lookups by code
- Fast student/teacher lookups by ID
- Efficient enrollment queries
- Quick assignment filtering by type and due date
- Fast submission and grade lookups

## Database Constraints

The schema enforces data integrity through:

1. **Unique Constraints**:
   - User email
   - Student ID
   - Teacher/Admin employee ID
   - Course code
   - (Assignment, Student) for submissions
   - (Enrollment, Assignment) for grades

2. **Foreign Key Constraints**:
   - CASCADE on course/assignment deletion
   - SET_NULL for grade's graded_by field

3. **Check Constraints** (enforced by Django):
   - Assignment type choices
   - Enrollment status choices
   - Decimal precision for grades

## Next Steps

After applying migrations:

1. ✅ Verify all migrations applied: `python manage.py showmigrations`
2. ✅ Check database tables exist: `python setup_database.py`
3. ✅ Create superuser: `python manage.py createsuperuser`
4. ✅ Access admin interface: http://localhost:8000/admin/
5. ➡️ Create API endpoints for models
6. ➡️ Test database performance with seed data

## Additional Resources

- [Django Migrations Documentation](https://docs.djangoproject.com/en/4.2/topics/migrations/)
- [PostgreSQL Performance Guide](https://www.postgresql.org/docs/current/performance-tips.html)
- Project documentation: `README.md`, `POSTGRESQL_SETUP.md`
