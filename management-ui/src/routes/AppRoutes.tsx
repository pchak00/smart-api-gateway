import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientsListPage } from '../pages/ClientsListPage';
import { PlansPage } from '../pages/PlansPage';
import { RouteLimitsPage } from '../pages/RouteLimitsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { AbuseAlertsPage } from '../pages/AbuseAlertsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AppLayout as MainLayout } from '../layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';


export const AppRoutes: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsListPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="route-limits" element={<RouteLimitsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="abuse-alerts" element={<AbuseAlertsPage />} />
          <Route
            path="admin-users"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN" blockUnauthorizedRoute={true}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

