import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const adminToken = localStorage.getItem('adminToken');
  const location = useLocation();

  // If there's no admin token, redirect to admin login
  if (!adminToken) {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // If authenticated as admin, render the child routes
  return <Outlet />;
};

export default AdminProtectedRoute;
