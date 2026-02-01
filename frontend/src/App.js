import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Layout from './components/Layout';

// Public Pages
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Student Pages
import UserDashboard from './pages/student/UserDashboard';
import TakeAssignment from './pages/student/TakeAssignment';

// Instructor Pages
import CreateAssignment from './pages/instructor/CreateAssignment';
import ViewSubmissions from './pages/instructor/ViewSubmissions';
import GradeSubmission from './pages/instructor/GradeSubmission';

// Course Pages
import CourseDetail from './pages/course/CourseDetail';
import CreateCourse from './pages/course/CreateCourse';
import PageView from './pages/course/PageView';
import PageEditor from './pages/course/PageEditor';

// Shared Pages
import AccountPage from './pages/shared/AccountPage';
import CalendarPage from './pages/shared/CalendarPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseManagement from './pages/admin/CourseManagement';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import UserManagement from './pages/admin/UserManagement';
import AISettings from './pages/admin/AISettings';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Layout>
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

            {/* Account Page */}
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <AccountPage />
                </PrivateRoute>
              }
            />

            {/* Calendar Page */}
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <CalendarPage />
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

            {/* Page Routes */}
            <Route
              path="/courses/:courseId/pages/create"
              element={
                <PrivateRoute>
                  <PageEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/pages/:pageId/edit"
              element={
                <PrivateRoute>
                  <PageEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/pages/:pageId"
              element={
                <PrivateRoute>
                  <PageView />
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

            <Route
              path="/admin/ai-settings"
              element={
                <PrivateRoute requireAdmin>
                  <AISettings />
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
            </Layout>
          </div>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
