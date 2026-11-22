import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Remember where the user wanted to go (optional convenience for Login).
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
