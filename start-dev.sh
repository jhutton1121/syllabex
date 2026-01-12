#!/bin/bash

echo "Starting Syllabex LMS Development Environment..."
echo ""

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo ""
    echo "Running migrations..."
    python manage.py migrate
    echo ""
    echo "Please create a superuser for Django admin:"
    python manage.py createsuperuser
    cd ..
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "Starting backend server..."
cd backend
source venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 5

echo ""
echo "Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Syllabex LMS is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Django Admin: http://localhost:8000/admin"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
