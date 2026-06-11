import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SUPER_ADMIN' | 'READ_ONLY_ADMIN';
  blockUnauthorizedRoute?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  blockUnauthorizedRoute = false
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      return;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && role !== requiredRole) {
    // If blockUnauthorizedRoute is true, show toast and redirect
    if (blockUnauthorizedRoute) {
      useEffect(() => {
        showToast({
          message: 'You need SUPER_ADMIN access to perform this action.',
          type: 'error',
          duration: 3000,
          dismissible: true
        });
      }, [showToast]);

      return <Navigate to="/" replace />;
    }
    // Otherwise, render the page but controls will be disabled
  }

  return <>{children}</>;
};

