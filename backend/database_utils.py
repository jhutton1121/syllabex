#!/usr/bin/env python
"""
Database Utility Scripts for Syllabex LMS

Provides utilities for backing up, restoring, and managing the database.

Usage:
    python database_utils.py backup
    python database_utils.py restore backup.json
    python database_utils.py reset
    python database_utils.py seed
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Add the backend directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import connection, transaction

User = get_user_model()


def backup_database(output_file=None):
    """Backup database to JSON file"""
    if output_file is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'backup_{timestamp}.json'
    
    print(f"Backing up database to {output_file}...")
    
    try:
        with open(output_file, 'w') as f:
            call_command('dumpdata', 
                        '--natural-foreign', 
                        '--natural-primary',
                        '--indent=2',
                        stdout=f)
        
        print(f"✓ Database backed up successfully to {output_file}")
        file_size = os.path.getsize(output_file)
        print(f"  File size: {file_size:,} bytes")
        return True
        
    except Exception as e:
        print(f"✗ Backup failed: {str(e)}")
        return False


def restore_database(input_file):
    """Restore database from JSON file"""
    if not os.path.exists(input_file):
        print(f"✗ File not found: {input_file}")
        return False
    
    print(f"Restoring database from {input_file}...")
    print("⚠ This will add data to the existing database.")
    
    confirm = input("Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Restore cancelled.")
        return False
    
    try:
        call_command('loaddata', input_file)
        print(f"✓ Database restored successfully from {input_file}")
        return True
        
    except Exception as e:
        print(f"✗ Restore failed: {str(e)}")
        return False


def reset_database():
    """Reset database (delete all data and rerun migrations)"""
    print("⚠ WARNING: This will delete ALL data in the database!")
    print("This action cannot be undone.")
    
    confirm = input("Type 'DELETE ALL DATA' to confirm: ")
    if confirm != 'DELETE ALL DATA':
        print("Reset cancelled.")
        return False
    
    print("\nResetting database...")
    
    try:
        # Get database engine
        db_engine = settings.DATABASES['default']['ENGINE']
        print(f"  Database engine: {db_engine}")
        
        # Get all table names using database-specific SQL
        tables = []
        with connection.cursor() as cursor:
            if 'postgresql' in db_engine:
                # PostgreSQL
                cursor.execute("""
                    SELECT tablename FROM pg_tables 
                    WHERE schemaname = 'public'
                """)
                tables = [table[0] for table in cursor.fetchall()]
            elif 'sqlite' in db_engine:
                # SQLite
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                """)
                tables = [table[0] for table in cursor.fetchall()]
            elif 'mysql' in db_engine:
                # MySQL
                cursor.execute("SHOW TABLES")
                tables = [table[0] for table in cursor.fetchall()]
            else:
                print(f"✗ Unsupported database engine: {db_engine}")
                print("  Supported engines: PostgreSQL, SQLite, MySQL")
                return False
        
        if not tables:
            print("  No tables found to delete.")
        else:
            print(f"  Found {len(tables)} tables to drop")
            
            # Drop all tables using database-specific syntax
            with connection.cursor() as cursor:
                if 'postgresql' in db_engine:
                    # PostgreSQL - supports CASCADE
                    for table in tables:
                        print(f"    Dropping table: {table}")
                        cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
                elif 'sqlite' in db_engine:
                    # SQLite - need to disable foreign keys first
                    cursor.execute("PRAGMA foreign_keys = OFF")
                    for table in tables:
                        print(f"    Dropping table: {table}")
                        cursor.execute(f'DROP TABLE IF EXISTS "{table}"')
                    cursor.execute("PRAGMA foreign_keys = ON")
                elif 'mysql' in db_engine:
                    # MySQL - disable foreign key checks
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                    for table in tables:
                        print(f"    Dropping table: {table}")
                        cursor.execute(f'DROP TABLE IF EXISTS `{table}`')
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            print("  ✓ All tables dropped")
        
        # Run migrations
        print("\nRunning migrations...")
        call_command('migrate', '--run-syncdb')
        
        print("✓ Database reset successfully")
        print("\nNext steps:")
        print("  1. Create a superuser: python manage.py createsuperuser")
        print("  2. Load seed data (optional): python database_utils.py seed")
        
        return True
        
    except Exception as e:
        print(f"✗ Reset failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def seed_database():
    """Seed database with sample data"""
    print("Seeding database with sample data...")
    
    try:
        from users.models import User, StudentProfile, TeacherProfile
        from courses.models import Course, CourseEnrollment
        from assignments.models import Assignment
        from django.utils import timezone
        from datetime import timedelta
        
        with transaction.atomic():
            # Create users if they don't exist
            print("\nCreating users...")
            
            # Create teacher
            teacher_email = "teacher@syllabex.com"
            if not User.objects.filter(email=teacher_email).exists():
                teacher_user = User.objects.create_user(
                    email=teacher_email,
                    password="teacher123"
                )
                teacher_profile = TeacherProfile.objects.create(
                    user=teacher_user,
                    employee_id="TCH001",
                    department="Computer Science"
                )
                print(f"  ✓ Created teacher: {teacher_email}")
            else:
                teacher_profile = TeacherProfile.objects.get(user__email=teacher_email)
                print(f"  → Teacher already exists: {teacher_email}")
            
            # Create students
            students = []
            for i in range(1, 4):
                student_email = f"student{i}@syllabex.com"
                if not User.objects.filter(email=student_email).exists():
                    student_user = User.objects.create_user(
                        email=student_email,
                        password="student123"
                    )
                    student_profile = StudentProfile.objects.create(
                        user=student_user,
                        student_id=f"STU{i:03d}"
                    )
                    students.append(student_profile)
                    print(f"  ✓ Created student: {student_email}")
                else:
                    student_profile = StudentProfile.objects.get(user__email=student_email)
                    students.append(student_profile)
                    print(f"  → Student already exists: {student_email}")
            
            # Create course
            print("\nCreating courses...")
            course_code = "CS101"
            if not Course.objects.filter(code=course_code).exists():
                course = Course.objects.create(
                    code=course_code,
                    name="Introduction to Computer Science",
                    description="Learn the fundamentals of computer science",
                    teacher=teacher_profile,
                    is_active=True
                )
                print(f"  ✓ Created course: {course_code}")
            else:
                course = Course.objects.get(code=course_code)
                print(f"  → Course already exists: {course_code}")
            
            # Enroll students
            print("\nEnrolling students...")
            for student in students:
                if not CourseEnrollment.objects.filter(
                    student=student, 
                    course=course
                ).exists():
                    CourseEnrollment.objects.create(
                        student=student,
                        course=course,
                        status='active'
                    )
                    print(f"  ✓ Enrolled: {student.student_id} in {course_code}")
                else:
                    print(f"  → Already enrolled: {student.student_id} in {course_code}")
            
            # Create assignments
            print("\nCreating assignments...")
            assignments_data = [
                {
                    'type': 'quiz',
                    'title': 'Python Basics Quiz',
                    'description': 'Test your knowledge of Python fundamentals',
                    'points_possible': 50,
                    'days_until_due': 7
                },
                {
                    'type': 'homework',
                    'title': 'Variables and Data Types',
                    'description': 'Complete the exercises on variables and data types',
                    'points_possible': 100,
                    'days_until_due': 14
                },
                {
                    'type': 'test',
                    'title': 'Midterm Exam',
                    'description': 'Comprehensive test covering all topics',
                    'points_possible': 200,
                    'days_until_due': 30
                },
            ]
            
            for assignment_data in assignments_data:
                title = assignment_data['title']
                if not Assignment.objects.filter(
                    course=course,
                    title=title
                ).exists():
                    due_date = timezone.now() + timedelta(days=assignment_data['days_until_due'])
                    Assignment.objects.create(
                        course=course,
                        type=assignment_data['type'],
                        title=title,
                        description=assignment_data['description'],
                        due_date=due_date,
                        points_possible=assignment_data['points_possible']
                    )
                    print(f"  ✓ Created assignment: {title}")
                else:
                    print(f"  → Assignment already exists: {title}")
        
        print("\n✓ Database seeded successfully!")
        print("\nSample Accounts:")
        print("  Teacher: teacher@syllabex.com / teacher123")
        print("  Student 1: student1@syllabex.com / student123")
        print("  Student 2: student2@syllabex.com / student123")
        print("  Student 3: student3@syllabex.com / student123")
        
        return True
        
    except Exception as e:
        print(f"✗ Seeding failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def show_stats():
    """Show database statistics"""
    print("Database Statistics")
    print("=" * 50)
    
    try:
        from users.models import User, StudentProfile, TeacherProfile, AdminProfile
        from courses.models import Course, CourseEnrollment
        from assignments.models import Assignment, AssignmentSubmission
        from gradebook.models import GradeEntry
        
        stats = {
            'Users': User.objects.count(),
            'Students': StudentProfile.objects.count(),
            'Teachers': TeacherProfile.objects.count(),
            'Admins': AdminProfile.objects.count(),
            'Courses': Course.objects.count(),
            'Active Courses': Course.objects.filter(is_active=True).count(),
            'Enrollments': CourseEnrollment.objects.count(),
            'Assignments': Assignment.objects.count(),
            'Submissions': AssignmentSubmission.objects.count(),
            'Grades': GradeEntry.objects.count(),
        }
        
        for key, value in stats.items():
            print(f"{key:.<40} {value:>8}")
        
        print("=" * 50)
        
    except Exception as e:
        print(f"✗ Error getting statistics: {str(e)}")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Database Utilities for Syllabex LMS")
        print("=" * 50)
        print("\nSupports: SQLite, PostgreSQL, MySQL")
        print("\nUsage:")
        print("  python database_utils.py backup [filename]")
        print("    - Backup database to JSON file")
        print("\n  python database_utils.py restore <filename>")
        print("    - Restore database from JSON file")
        print("\n  python database_utils.py reset")
        print("    - Reset database (⚠ DELETES ALL DATA)")
        print("\n  python database_utils.py seed")
        print("    - Seed database with sample data")
        print("\n  python database_utils.py stats")
        print("    - Show database statistics")
        print("\n" + "=" * 50)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'backup':
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        backup_database(output_file)
    
    elif command == 'restore':
        if len(sys.argv) < 3:
            print("✗ Please specify input file")
            print("Usage: python database_utils.py restore <filename>")
            sys.exit(1)
        restore_database(sys.argv[2])
    
    elif command == 'reset':
        reset_database()
    
    elif command == 'seed':
        seed_database()
    
    elif command == 'stats':
        show_stats()
    
    else:
        print(f"✗ Unknown command: {command}")
        print("Valid commands: backup, restore, reset, seed, stats")
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
