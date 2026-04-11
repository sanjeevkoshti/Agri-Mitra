import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole = null }) => {
  const token = localStorage.getItem('mc_token');
  const profile = JSON.parse(localStorage.getItem('mc_profile') || 'null');
  const location = useLocation();

  // 1. Check if logged in
  if (!token || !profile) {
    // Redirect to login and remember the page they were trying to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if the user has the required role (if specified)
  if (allowedRole && profile.role !== allowedRole) {
    // Redirect to the correct dashboard based on their actual role
    const fallbackPath = profile.role === 'farmer' ? '/farmer-dash' : '/marketplace';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
