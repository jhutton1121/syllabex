#!/usr/bin/env python
"""
Database Setup and Verification Script for Syllabex LMS

This script helps verify database configuration and provides
helpful diagnostics for PostgreSQL setup.

Usage:
    python setup_database.py
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.db import connection
from django.core.management import call_command
from django.core.exceptions import ImproperlyConfigured


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_success(text):
    """Print success message"""
    print(f"✓ {text}")


def print_error(text):
    """Print error message"""
    print(f"✗ {text}")


def print_info(text):
    """Print info message"""
    print(f"ℹ {text}")


def check_database_config():
    """Check database configuration from settings"""
    print_header("Database Configuration Check")
    
    db_config = settings.DATABASES['default']
    
    print_info("Current database settings:")
    print(f"  Engine: {db_config['ENGINE']}")
    print(f"  Name: {db_config['NAME']}")
    if db_config['USER']:
        print(f"  User: {db_config['USER']}")
    if db_config['HOST']:
        print(f"  Host: {db_config['HOST']}")
    if db_config['PORT']:
        print(f"  Port: {db_config['PORT']}")
    
    if 'sqlite' in db_config['ENGINE']:
        print_success("SQLite configuration detected")
        print_info("SQLite is great for development and testing")
        print_info("For production, consider PostgreSQL. Update your .env file with:")
        print("    DB_ENGINE=django.db.backends.postgresql")
        print("    DB_NAME=syllabex_db")
        print("    DB_USER=postgres")
        print("    DB_PASSWORD=your_password")
        print("    DB_HOST=localhost")
        print("    DB_PORT=5432")
        return True  # SQLite is a valid configuration
    elif 'postgresql' in db_config['ENGINE']:
        print_success("PostgreSQL configuration detected")
        return True
    elif 'mysql' in db_config['ENGINE']:
        print_success("MySQL configuration detected")
        return True
    else:
        print_info(f"Database engine: {db_config['ENGINE']}")
        print_info("This database engine may work but is not officially tested")
        return True  # Allow other engines to proceed


def test_database_connection():
    """Test database connection"""
    print_header("Database Connection Test")
    
    db_engine = settings.DATABASES['default']['ENGINE']
    
    try:
        with connection.cursor() as cursor:
            # Use database-specific version query
            if 'sqlite' in db_engine:
                cursor.execute("SELECT sqlite_version();")
            elif 'postgresql' in db_engine:
                cursor.execute("SELECT version();")
            elif 'mysql' in db_engine:
                cursor.execute("SELECT version();")
            else:
                # Try a simple query that works on most databases
                cursor.execute("SELECT 1;")
            
            result = cursor.fetchone()
            version = result[0] if result else "Unknown"
            print_success("Successfully connected to database")
            print_info(f"Database version: {version}")
            return True
    except Exception as e:
        print_error("Failed to connect to database")
        print(f"  Error: {str(e)}")
        print("\nTroubleshooting steps:")
        if 'sqlite' in db_engine:
            print("  1. Check that the database file path is valid")
            print("  2. Verify write permissions on the directory")
            print("  3. Try deleting db.sqlite3 and running migrations again")
        elif 'postgresql' in db_engine:
            print("  1. Verify PostgreSQL is running")
            print("  2. Check database credentials in .env file")
            print("  3. Ensure database exists: CREATE DATABASE syllabex_db;")
            print("  4. Verify user has proper permissions")
        elif 'mysql' in db_engine:
            print("  1. Verify MySQL is running")
            print("  2. Check database credentials in .env file")
            print("  3. Ensure database exists: CREATE DATABASE syllabex_db;")
            print("  4. Verify user has proper permissions")
        else:
            print("  1. Check database credentials in .env file")
            print("  2. Ensure database server is running")
            print("  3. Verify database exists and user has permissions")
        return False


def check_migrations():
    """Check migration status"""
    print_header("Migration Status Check")
    
    try:
        # Get migration status
        from django.db.migrations.executor import MigrationExecutor
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            print_info(f"Found {len(plan)} pending migrations")
            print("\nTo apply migrations, run:")
            print("  python manage.py migrate")
            return False
        else:
            print_success("All migrations have been applied")
            return True
    except Exception as e:
        print_error("Error checking migrations")
        print(f"  Error: {str(e)}")
        return False


def show_migration_list():
    """Show detailed migration status"""
    print_header("Detailed Migration Status")
    
    try:
        call_command('showmigrations', '--list')
        return True
    except Exception as e:
        print_error("Error showing migrations")
        print(f"  Error: {str(e)}")
        return False


def check_database_tables():
    """Check if database tables exist"""
    print_header("Database Tables Check")
    
    try:
        # Use Django's database introspection (database-agnostic)
        from django.db import connection
        
        # Get list of tables using Django's introspection
        existing_tables = connection.introspection.table_names()
        
        if existing_tables:
            print_success(f"Found {len(existing_tables)} tables in database:")
            
            expected_tables = [
                'users',
                'student_profiles',
                'teacher_profiles',
                'admin_profiles',
                'courses',
                'course_enrollments',
                'assignments',
                'assignment_submissions',
                'grade_entries',
            ]
            
            for table in expected_tables:
                if table in existing_tables:
                    print_success(f"  {table}")
                else:
                    print_error(f"  {table} (missing)")
            
            # Show any extra tables (excluding Django system tables)
            extra_tables = [t for t in existing_tables 
                          if t not in expected_tables 
                          and not t.startswith('django_')
                          and not t.startswith('auth_')
                          and not t.startswith('sqlite_')]
            if extra_tables:
                print_info("Additional tables found:")
                for table in extra_tables:
                    print(f"  - {table}")
            
            return len([t for t in expected_tables if t in existing_tables]) == len(expected_tables)
        else:
            print_error("No tables found in database")
            print_info("Run migrations to create tables: python manage.py migrate")
            return False
            
    except Exception as e:
        print_error("Error checking database tables")
        print(f"  Error: {str(e)}")
        return False


def check_indexes():
    """Check if database indexes exist"""
    print_header("Database Indexes Check")
    
    try:
        # Get database engine
        db_engine = settings.DATABASES['default']['ENGINE']
        
        # Get list of tables using Django's introspection
        existing_tables = connection.introspection.table_names()
        
        # Count indexes using database-specific SQL
        total_indexes = 0
        table_indexes = {}
        
        with connection.cursor() as cursor:
            if 'postgresql' in db_engine:
                # PostgreSQL
                cursor.execute("""
                    SELECT tablename, indexname
                    FROM pg_indexes
                    WHERE schemaname = 'public'
                    ORDER BY tablename, indexname;
                """)
                for table, index in cursor.fetchall():
                    if table not in table_indexes:
                        table_indexes[table] = []
                    table_indexes[table].append(index)
                    total_indexes += 1
                    
            elif 'sqlite' in db_engine:
                # SQLite - query indexes for each table
                for table in existing_tables:
                    if not table.startswith('sqlite_'):
                        cursor.execute(f"PRAGMA index_list('{table}')")
                        indexes = cursor.fetchall()
                        if indexes:
                            table_indexes[table] = [idx[1] for idx in indexes]
                            total_indexes += len(indexes)
                            
            elif 'mysql' in db_engine:
                # MySQL
                cursor.execute("""
                    SELECT TABLE_NAME, INDEX_NAME
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                    ORDER BY TABLE_NAME, INDEX_NAME;
                """)
                for table, index in cursor.fetchall():
                    if table not in table_indexes:
                        table_indexes[table] = []
                    table_indexes[table].append(index)
                    total_indexes += 1
            else:
                print_info(f"Database: {db_engine}")
                print_info("Index checking not supported for this database engine")
                print_info("(Indexes are still created, just can't display them)")
                return True
        
        if total_indexes > 0:
            print_success(f"Found {total_indexes} indexes")
            
            print_info("Indexes per table:")
            for table in sorted(table_indexes.keys()):
                print(f"  {table}: {len(table_indexes[table])} indexes")
            
            return True
        else:
            print_info("No indexes found (or tables don't exist yet)")
            return False
            
    except Exception as e:
        print_error("Error checking indexes")
        print(f"  Error: {str(e)}")
        return False


def check_superuser():
    """Check if superuser exists"""
    print_header("Superuser Check")
    
    try:
        from users.models import User
        
        superusers = User.objects.filter(is_superuser=True)
        
        if superusers.exists():
            print_success(f"Found {superusers.count()} superuser(s)")
            for user in superusers:
                print(f"  - {user.email}")
            return True
        else:
            print_info("No superuser found")
            print("To create a superuser, run:")
            print("  python manage.py createsuperuser")
            return False
            
    except Exception as e:
        print_error("Error checking superuser")
        print(f"  Error: {str(e)}")
        return False


def run_all_checks():
    """Run all database checks"""
    print("\n" + "=" * 70)
    print("  Syllabex LMS - Database Setup Verification")
    print("=" * 70)
    
    results = {
        'config': check_database_config(),
        'connection': False,
        'migrations': False,
        'tables': False,
        'indexes': False,
        'superuser': False,
    }
    
    if results['config']:
        results['connection'] = test_database_connection()
    
    if results['connection']:
        results['migrations'] = check_migrations()
        show_migration_list()
        results['tables'] = check_database_tables()
        results['indexes'] = check_indexes()
        results['superuser'] = check_superuser()
    
    # Final summary
    print_header("Setup Summary")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print(f"\nPassed: {passed}/{total} checks")
    
    if passed == total:
        print_success("\n✓ Database is fully configured and ready!")
        print_info("You can now start the development server:")
        print("  python manage.py runserver")
    else:
        print_error("\n✗ Some checks failed. Please review the output above.")
        print_info("\nFor detailed setup instructions, see:")
        print("  backend/POSTGRESQL_SETUP.md")
    
    print("\n" + "=" * 70 + "\n")


if __name__ == '__main__':
    try:
        run_all_checks()
    except KeyboardInterrupt:
        print("\n\nSetup verification cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
