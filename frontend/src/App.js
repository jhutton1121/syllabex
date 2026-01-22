import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import CourseDetail from './pages/CourseDetail';
import TakeAssignment from './pages/TakeAssignment';
import CreateAssignment from './pages/CreateAssignment';
import CreateCourse from './pages/CreateCourse';
import ViewSubmissions from './pages/ViewSubmissions';
import GradeSubmission from './pages/GradeSubmission';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import CourseManagement from './pages/admin/CourseManagement';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User Dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              }
            />

            {/* Course Routes */}
            <Route
              path="/courses/:courseId"
              element={
                <PrivateRoute>
                  <CourseDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments/:assignmentId"
              element={
                <PrivateRoute>
                  <TakeAssignment />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments/:assignmentId/edit"
              element={
                <PrivateRoute>
                  <CreateAssignment />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments/create"
              element={
                <PrivateRoute>
                  <CreateAssignment />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments/:assignmentId/submissions"
              element={
                <PrivateRoute>
                  <ViewSubmissions />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments/:assignmentId/submissions/:submissionId"
              element={
                <PrivateRoute>
                  <GradeSubmission />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requireAdmin>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <PrivateRoute requireAdmin>
                  <CourseManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses/create"
              element={
                <PrivateRoute requireAdmin>
                  <CreateCourse />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses/:courseId"
              element={
                <PrivateRoute requireAdmin>
                  <AdminCourseDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute requireAdmin>
                  <UserManagement />
                </PrivateRoute>
              }
            />

            {/* Legacy redirects - remove old student/teacher routes */}
            <Route path="/student/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/teacher/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/student/assignments/:id" element={<Navigate to="/dashboard" replace />} />
            <Route path="/teacher/courses/create" element={<Navigate to="/admin/courses/create" replace />} />
            <Route path="/teacher/assignments/create" element={<Navigate to="/dashboard" replace />} />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
