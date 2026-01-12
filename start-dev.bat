@echo off
echo Starting Syllabex LMS Development Environment...
echo.

REM Check if backend virtual environment exists
if not exist "backend\venv" (
    echo Creating virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    echo Installing dependencies...
    pip install -r requirements.txt
    echo.
    echo Running migrations...
    python manage.py migrate
    echo.
    echo Please create a superuser for Django admin:
    python manage.py createsuperuser
    cd ..
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting backend server...
start "Syllabex Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting frontend server...
start "Syllabex Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Syllabex LMS is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Django Admin: http://localhost:8000/admin
echo ========================================
echo.
echo Press any key to close this window (servers will continue running)
pause > nul
