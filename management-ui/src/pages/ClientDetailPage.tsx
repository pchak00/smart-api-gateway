import React from 'react';
import { useParams } from 'react-router-dom';
import { Activity, KeyRound, Server } from 'lucide-react';
import { EmptyState, PageHeader, Panel } from '../components/PageShell';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div>
      <PageHeader
        title={`Client ${id ?? ''}`.trim()}
        description="Inspect a gateway consumer profile, usage history, and policy context once the detail API is connected."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Server className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Client identity</h2>
              <p className="mt-1 text-sm text-slate-500">Name, status, and assigned plan.</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <KeyRound className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">API key</h2>
              <p className="mt-1 text-sm text-slate-500">Key visibility and rotation controls.</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Activity className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Usage</h2>
              <p className="mt-1 text-sm text-slate-500">Request and block history.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <EmptyState
          icon={Activity}
          title="Client detail shell"
          description="This polished detail layout is ready for live client stats, usage logs, and abuse signals in a later milestone."
        />
      </Panel>
    </div>
  );
};
