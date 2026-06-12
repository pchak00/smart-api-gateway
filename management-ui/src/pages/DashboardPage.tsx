import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { demoAnalyticsData } from '../utils/demoData';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPlans: 0,
    totalRequests: 0,
  });
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const clients = await api.getClients();
        const plans = await api.getPlans();
        setStats({
          totalClients: clients.length,
          totalPlans: plans.length,
          totalRequests: demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0)
        });
        setIsDemoData(true);
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Use demo data on error
        setStats({
          totalClients: 100,
          totalPlans: 3,
          totalRequests: 4210
        });
        setIsDemoData(true);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-medium">Total Clients</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-medium">Total Plans</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPlans}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm font-medium">Total Requests</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequests}</p>
        </div>
      </div>

      {/* Role info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>You are logged in as:</strong> {role === 'SUPER_ADMIN' ? 'Administrator' : 'Viewer'} ({role})
        </p>
      </div>

      {isDemoData && (
        <div className="mt-4 inline-flex rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800">
          Showing demo data
        </div>
      )}
    </div>
  );
};
