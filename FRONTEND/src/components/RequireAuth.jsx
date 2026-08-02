import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show a loading spinner while checking the session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] bg-dot-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the page they tried to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
