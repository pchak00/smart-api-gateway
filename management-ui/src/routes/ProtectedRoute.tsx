import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { AdminRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  blockUnauthorizedRoute?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  blockUnauthorizedRoute = false
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const { showToast } = useToast();
  const hasShownUnauthorizedToast = useRef(false);
  const isMissingRequiredRole = Boolean(requiredRole && role !== requiredRole);
  const shouldBlockRoute = !isLoading && isAuthenticated && isMissingRequiredRole && blockUnauthorizedRoute;

  useEffect(() => {
    if (shouldBlockRoute && !hasShownUnauthorizedToast.current) {
      hasShownUnauthorizedToast.current = true;
      showToast({
        message: 'You need Owner access to perform this action.',
        type: 'error',
        duration: 3000,
        dismissible: true
      });
    }
  }, [shouldBlockRoute, showToast]);

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

  if (shouldBlockRoute) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
