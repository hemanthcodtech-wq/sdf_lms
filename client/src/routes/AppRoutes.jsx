import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import DashboardLayout from '../components/layout/DashboardLayout';
import Home from '../pages/dashboard/Home';

import AdminLogin from '../pages/admin/AdminLogin';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CourseManagement from '../pages/admin/CourseManagement';

import CourseList from '../pages/dashboard/CourseList';
import CourseDetails from '../pages/dashboard/CourseDetails';
import Checkout from '../pages/dashboard/Checkout';
import StudentClasses from '../pages/dashboard/StudentClasses';
import Profile from '../pages/dashboard/Profile';
import PaymentHistory from '../pages/dashboard/PaymentHistory';
import MyLearning from '../pages/dashboard/MyLearning';
import Certificates from '../pages/dashboard/Certificates';
import Settings from '../pages/dashboard/Settings';

import ClassScheduling from '../pages/admin/ClassScheduling';
import UserManagement from '../pages/admin/UserManagement';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="classes" element={<ClassScheduling />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* User Dashboard & Course Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Home />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          <Route path="classes" element={<StudentClasses />} />
          <Route path="learning" element={<MyLearning />} />
          <Route path="checkout/:id" element={<Checkout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="payment-history" element={<PaymentHistory />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
