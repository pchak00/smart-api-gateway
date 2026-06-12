import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { demoClientsList } from '../utils/demoData';
import { ClientDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PrimaryButton, DangerButton } from '../components/Button';

export const ClientsListPage: React.FC = () => {
  const { role } = useAuth();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const isSuperAdmin = role === 'SUPER_ADMIN';

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await api.getClients();
        setClients(data);
        setIsDemoData(false);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClients(demoClientsList);
        setIsDemoData(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <PrimaryButton
          disabled={!isSuperAdmin}
          tooltip={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
          className={!isSuperAdmin ? 'bg-blue-600 text-white opacity-50' : 'bg-blue-600 text-white hover:bg-blue-700'}
        >
          + Create Client
        </PrimaryButton>
      </div>

      {isDemoData && (
        <div className="mb-6 inline-flex rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800">
          Showing demo data
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">API Key</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => {
              const routeId = client.id ?? index + 1;
              const planName = client.plan?.planName ?? client.planName ?? 'Unknown';

              return (
                <tr key={client.id ?? client.apiKey} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{client.clientName}</td>
                  <td className="px-6 py-3 text-sm font-mono text-gray-600">{client.apiKey}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{planName}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      client.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm space-x-2">
                    <Link to={`/clients/${routeId}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                    <DangerButton
                      disabled={!isSuperAdmin}
                      tooltip={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
                      className={!isSuperAdmin ? 'text-red-400 opacity-50 pointer-events-none' : 'text-red-600 hover:underline'}
                    >
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
