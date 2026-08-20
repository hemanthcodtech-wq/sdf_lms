import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import DashboardLayout from '../components/layout/DashboardLayout';
import PublicLayout from '../components/layout/PublicLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import TermsAndConditions from '../pages/public/TermsAndConditions';
import PrivacyPolicy from '../pages/public/PrivacyPolicy';
import RefundPolicy from '../pages/public/RefundPolicy';

// Admin
import AdminLogin from '../pages/admin/AdminLogin';
import AdminLayout from '../components/admin/AdminLayout';
import AdminProtectedRoute from '../components/admin/AdminProtectedRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CourseManagement from '../pages/admin/CourseManagement';
import UserManagement from '../pages/admin/UserManagement';
import MaterialManagement from '../pages/admin/MaterialManagement';
import AdminRecords from '../pages/admin/AdminRecords';

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
import Wishlist from '../pages/dashboard/Wishlist';
import HelpSupport from '../pages/dashboard/HelpSupport';

const AppRoutes = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes with PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/return-policy" element={<RefundPolicy />} />
          <Route path="/cancellation-policy" element={<RefundPolicy />} />
          {/* Auth Routes inside PublicLayout for Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        
        {/* Admin Login (Unprotected) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protected Admin Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="materials" element={<MaterialManagement />} />
            <Route path="records" element={<AdminRecords />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Route>

        {/* Protected User Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* The base path for Dashboard is now /dashboard/... */}
            <Route index element={<DashboardHome />} />
            <Route path="learning" element={<MyLearning />} />
            <Route path="learning/:courseId" element={<StudentClasses />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="support" element={<HelpSupport />} />
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
