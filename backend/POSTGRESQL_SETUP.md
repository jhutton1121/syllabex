# PostgreSQL Database Setup Guide

This guide will help you configure PostgreSQL for the Syllabex LMS project.

## Prerequisites

- PostgreSQL installed on your system
- Python virtual environment activated
- Required packages installed from `requirements.txt`

## Installation Steps

### 1. Install PostgreSQL

**Windows:**
- Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
- Run the installer and follow the setup wizard
- Note down the password you set for the `postgres` user
- Default port is `5432`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

Open PostgreSQL command line (psql):

**Windows:**
- Use pgAdmin or open Command Prompt:
```cmd
psql -U postgres
```

**macOS/Linux:**
```bash
sudo -u postgres psql
```

Then run these commands:
```sql
-- Create database
CREATE DATABASE syllabex_db;

-- Create a dedicated user (optional but recommended for production)
CREATE USER syllabex_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE syllabex_db TO syllabex_user;

-- Connect to the database
\c syllabex_db

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO syllabex_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO syllabex_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO syllabex_user;

-- Exit psql
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syllabex_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Important Notes:**
- Replace `your_postgres_password` with your actual PostgreSQL password
- For production, use a strong `SECRET_KEY` (can generate with: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
- If you created a dedicated user (`syllabex_user`), use that username and password

### 4. Verify Database Connection

Test the connection:
```bash
python manage.py check --database default
```

### 5. Verify Database Setup

Test the database configuration:
```bash
python setup_database.py
```

This script supports both SQLite and PostgreSQL and will verify your connection.

### 6. Run Migrations

The migrations already exist in the project. Apply them to your database:

```bash
# Apply all migrations
python manage.py migrate

# Verify migrations were applied
python manage.py showmigrations
```

This command works with both SQLite and PostgreSQL.

Expected output should show all migrations with [X] marks:
```
assignments
 [X] 0001_initial
 [X] 0002_initial
courses
 [X] 0001_initial
 [X] 0002_initial
gradebook
 [X] 0001_initial
 [X] 0002_initial
users
 [X] 0001_initial
```

### 6. Create Superuser

Create an admin account:
```bash
python manage.py createsuperuser
```

Enter your email and password when prompted.

### 7. Start Development Server

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/admin/` to verify the setup.

## Database Schema Overview

The migrations create the following tables:

### Users App
- `users` - Custom user model (email-based authentication)
- `student_profiles` - Student-specific information
- `teacher_profiles` - Teacher-specific information
- `admin_profiles` - Admin-specific information

### Courses App
- `courses` - Course information
- `course_enrollments` - Student enrollment in courses

### Assignments App
- `assignments` - All assignment types (quiz, test, homework)
- `assignment_submissions` - Student submissions

### Gradebook App
- `grade_entries` - Grades for assignments

## Database Indexes

The following indexes are automatically created for optimal performance:

### Users
- `email` (unique index)
- `student_id` (unique index)
- `employee_id` (unique index for teachers and admins)

### Courses
- `code` (unique index)
- `teacher_id` (foreign key index)
- `is_active` (index)

### Assignments
- `course_id` (foreign key index)
- `type` (index)
- `due_date` (index)

### Submissions
- `assignment_id` (foreign key index)
- `student_id` (foreign key index)
- `submitted_at` (index)
- Unique constraint: (`assignment_id`, `student_id`)

### Grades
- `enrollment_id` (foreign key index)
- `assignment_id` (foreign key index)
- `graded_at` (index)
- Unique constraint: (`enrollment_id`, `assignment_id`)

## Troubleshooting

### Common Issues

**1. Connection Refused**
- Verify PostgreSQL is running: `pg_ctl status` or check service status
- Check if port 5432 is open and not blocked by firewall
- Verify `DB_HOST` and `DB_PORT` in `.env`

**2. Authentication Failed**
- Double-check `DB_USER` and `DB_PASSWORD` in `.env`
- Ensure the user has proper permissions on the database

**3. Database Does Not Exist**
- Create the database using the commands in Step 2
- Verify `DB_NAME` matches the database name in PostgreSQL

**4. Permission Denied**
- Grant proper privileges to your database user (see Step 2)
- For PostgreSQL 15+, ensure schema privileges are granted

**5. Migration Errors**
- If migrations fail, check PostgreSQL logs
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Try running migrations individually: `python manage.py migrate users`, etc.

### PostgreSQL Commands

```bash
# Check if PostgreSQL is running
pg_ctl status

# Start PostgreSQL
pg_ctl start

# Stop PostgreSQL
pg_ctl stop

# Restart PostgreSQL
pg_ctl restart

# View all databases
psql -U postgres -c "\l"

# View all tables in syllabex_db
psql -U postgres -d syllabex_db -c "\dt"
```

## Switching from SQLite to PostgreSQL

If you previously used SQLite and want to migrate to PostgreSQL:

1. **Backup SQLite data** (optional):
```bash
python manage.py dumpdata > backup.json
```

2. **Update `.env` file** with PostgreSQL settings

3. **Delete existing SQLite database**:
```bash
# Windows
del db.sqlite3

# macOS/Linux
rm db.sqlite3
```

4. **Run migrations on PostgreSQL**:
```bash
python manage.py migrate
```

5. **Load backup data** (optional):
```bash
python manage.py loaddata backup.json
```

6. **Create new superuser** (if not loading backup):
```bash
python manage.py createsuperuser
```

## Production Recommendations

For production deployment:

1. **Use a dedicated PostgreSQL user** (not `postgres`)
2. **Set strong passwords** for all database users
3. **Enable SSL connections** to the database
4. **Configure connection pooling** (e.g., using pgBouncer)
5. **Set up regular backups** using `pg_dump`
6. **Monitor database performance** and optimize queries
7. **Use environment variables** for sensitive configuration
8. **Set `DEBUG=False`** in production
9. **Use a production-grade secret key**
10. **Configure proper `ALLOWED_HOSTS`**

## Next Steps

After setting up PostgreSQL:

1. ✅ Database configured and connected
2. ✅ Migrations applied
3. ✅ Superuser created
4. ➡️ Set up Django REST Framework API endpoints
5. ➡️ Configure JWT authentication
6. ➡️ Build React frontend
7. ➡️ Test API integration

## Resources

- [Django Database Documentation](https://docs.djangoproject.com/en/4.2/ref/databases/#postgresql-notes)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)
