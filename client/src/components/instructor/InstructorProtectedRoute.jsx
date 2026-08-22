import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const InstructorProtectedRoute = () => {
  const instructorToken = localStorage.getItem('instructorToken');
  const location = useLocation();

  if (!instructorToken) {
    return <Navigate to={`/instructor/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
};

export default InstructorProtectedRoute;
