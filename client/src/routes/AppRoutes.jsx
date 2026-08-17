import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import DashboardLayout from '../components/layout/DashboardLayout';
import PublicLayout from '../components/layout/PublicLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';

// Admin
import AdminLogin from '../pages/admin/AdminLogin';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CourseManagement from '../pages/admin/CourseManagement';
import ClassScheduling from '../pages/admin/ClassScheduling';
import UserManagement from '../pages/admin/UserManagement';

// Dashboard / Course
import DashboardHome from '../pages/dashboard/Home';
import CourseList from '../pages/dashboard/CourseList';
import CourseDetails from '../pages/dashboard/CourseDetails';
import Checkout from '../pages/dashboard/Checkout';
import StudentClasses from '../pages/dashboard/StudentClasses';
import Profile from '../pages/dashboard/Profile';
import PaymentHistory from '../pages/dashboard/PaymentHistory';
import MyLearning from '../pages/dashboard/MyLearning';
import Certificates from '../pages/dashboard/Certificates';
import Settings from '../pages/dashboard/Settings';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes with PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          {/* Auth Routes inside PublicLayout for Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="classes" element={<ClassScheduling />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* Protected User Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* The base path for Dashboard is now /dashboard/... */}
            <Route index element={<DashboardHome />} />
            <Route path="classes" element={<StudentClasses />} />
            <Route path="learning" element={<MyLearning />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
          {/* Checkout needs protection but doesn't necessarily need the dashboard layout wrapper depending on design, but let's keep it separate or in dashboard */}
          <Route path="/checkout/:id" element={<Checkout />} />
        </Route>
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
