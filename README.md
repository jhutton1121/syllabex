# Syllabex LMS - Like Canvas, but Better

A Django + React Learning Management System with user authentication, course management, assignments, and gradebook functionality.

## Features

### User Management
- **Three User Roles**: Students, Teachers, and Admins
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for each user type

### Core Functionality
- **Course Management**: Create and manage courses
- **Assignment System**: Create quizzes, tests, and homework
- **Gradebook**: Track and manage student grades
- **Submission System**: Students can submit assignments
- **Dashboard**: Role-specific dashboards for students and teachers

## Tech Stack

### Backend
- Django 4.2.9
- Django REST Framework
- Simple JWT for authentication
- PostgreSQL/SQLite database
- Django CORS headers

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- JWT decode for token handling

## Project Structure

```
syllabex/
├── backend/              # Django backend
│   ├── config/           # Django settings
│   ├── users/            # User models & authentication
│   ├── courses/          # Course models & API
│   ├── assignments/      # Assignment models & API
│   ├── gradebook/        # Gradebook models & API
│   ├── manage.py
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── context/      # React context
│   │   └── App.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

6. Run migrations:
```bash
python manage.py migrate
```

7. Create superuser (for Django admin):
```bash
python manage.py createsuperuser
```

8. Run development server:
```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
REACT_APP_API_URL=http://localhost:8000/api
```

4. Run development server:
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/users/register/` - User registration
- `GET /api/users/me/` - Get current user

### Courses
- `GET /api/courses/` - List courses
- `POST /api/courses/` - Create course (Teachers/Admins)
- `GET /api/courses/{id}/` - Course details
- `PUT /api/courses/{id}/` - Update course
- `POST /api/courses/{id}/enroll/` - Enroll student (Admins)
- `GET /api/courses/{id}/students/` - List enrolled students

### Assignments
- `GET /api/assignments/` - List assignments
- `POST /api/assignments/` - Create assignment (Teachers)
- `GET /api/assignments/{id}/` - Assignment details
- `PUT /api/assignments/{id}/` - Update assignment
- `DELETE /api/assignments/{id}/` - Delete assignment
- `POST /api/assignments/{id}/submit/` - Submit assignment (Students)
- `GET /api/assignments/{id}/submissions/` - View submissions (Teachers)

### Gradebook
- `GET /api/gradebook/` - List grades
- `POST /api/gradebook/` - Create grade (Teachers)
- `GET /api/gradebook/course/{id}/` - Course gradebook (Teachers)
- `GET /api/gradebook/student/{id}/` - Student grades

## User Roles

### Students
- View enrolled courses
- View and submit assignments
- View their own grades

### Teachers
- Create and manage courses
- Create, edit, and delete assignments
- View student submissions
- Grade assignments
- View course gradebook

### Admins
- Full access to Django admin interface
- Enroll students in courses
- Manage all users

## Testing the Application

### 1. Create Test Users

Register users with different roles:

**Student:**
- Email: student@example.com
- Role: Student
- Student ID: STU001

**Teacher:**
- Email: teacher@example.com
- Role: Teacher
- Employee ID: TCH001

### 2. Create a Course (as Teacher)

Login as teacher and create a course from the dashboard.

### 3. Enroll Student (as Admin)

Use Django admin (`http://localhost:8000/admin/`) to enroll the student in the course.

### 4. Create Assignment (as Teacher)

Create an assignment from the teacher dashboard.

### 5. Submit Assignment (as Student)

Login as student and submit the assignment.

### 6. Grade Assignment (as Teacher)

View submissions and grade them using the gradebook.

## Development Notes

### Database
- Currently using SQLite for development
- For production, configure PostgreSQL in `.env`

### CORS
- Configured to allow requests from `http://localhost:3000`
- Update `CORS_ALLOWED_ORIGINS` in settings for production

### Authentication
- JWT tokens expire after 60 minutes
- Refresh tokens expire after 7 days
- Tokens are automatically refreshed by the frontend

## Future Enhancements

- File upload support for assignments
- Rich text editor for descriptions
- Email notifications
- Real-time updates with WebSockets
- Analytics dashboard
- Agentic AI integration for administrative tasks

## License

This project is for educational purposes.

## Contact

For questions or issues, please create an issue in the repository.
