import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ModeratorProtectedRoute = () => {
  const moderatorToken = localStorage.getItem('moderatorToken');
  const location = useLocation();

  if (!moderatorToken) {
    return <Navigate to={`/moderator/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
};

export default ModeratorProtectedRoute;
