import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import SearchPage from './pages/SearchPage';
import ByDate from './pages/ByDate';
import EmployeeTimeline from './pages/EmployeeTimeline';
import DepartmentHeads from './pages/DepartmentHeads';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Layout><Attendance /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Layout><SearchPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/by-date"
            element={
              <ProtectedRoute>
                <Layout><ByDate /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/:employeeName/:departmentName"
            element={
              <ProtectedRoute>
                <Layout><EmployeeTimeline /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/department-heads"
            element={
              <ProtectedRoute>
                <Layout><DepartmentHeads /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;