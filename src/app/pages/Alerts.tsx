import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { AlertCard } from '../components/AlertCard';
import { alertsApi, type Alert } from '../../lib/api';

type FilterStatus = 'all' | 'open' | 'acknowledged' | 'resolved';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    alertsApi.list({ limit: 200 })
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const updated = await alertsApi.update(id, { status });
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e: any) {
      alert('Failed to update: ' + e.message);
    }
  };

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);
  const openCount = alerts.filter((a) => a.status === 'open').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Alerts & Emergencies" 
        subtitle="Real-time monitoring of security alerts" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 border border-red-200 p-6 rounded-[16px] shadow-sm">
            <div className="text-4xl font-semibold text-destructive mb-2">{openCount}</div>
            <div className="text-red-700 uppercase tracking-wide text-sm font-medium">Open Alerts</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-[16px] shadow-sm">
            <div className="text-4xl font-semibold text-warning mb-2">{acknowledgedCount}</div>
            <div className="text-amber-700 uppercase tracking-wide text-sm font-medium">Acknowledged</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-6 rounded-[16px] shadow-sm">
            <div className="text-4xl font-semibold text-success mb-2">{resolvedCount}</div>
            <div className="text-green-700 uppercase tracking-wide text-sm font-medium">Resolved</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-foreground mb-4">All Alerts</h3>
          <div className="flex gap-3 mb-6">
            {(['all', 'open', 'acknowledged', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-[12px] border capitalize ${filter === f ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-white text-secondary-foreground hover:bg-secondary border-border'}`}
              >
                {f === 'open' ? 'Open' : f === 'acknowledged' ? 'Acknowledged' : f === 'resolved' ? 'Resolved' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading alerts…</p>}
        {error && <p className="text-destructive text-sm">Failed to load: {error}</p>}
        {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((alert) => {
            const validType = ['accident', 'panic', 'fire', 'intrusion'].includes(alert.alert_type)
              ? (alert.alert_type as 'accident' | 'panic' | 'fire' | 'intrusion')
              : 'intrusion';
            const elapsed = Math.round((Date.now() - new Date(alert.created_at).getTime()) / 60000);
            const timeLabel = elapsed < 1 ? 'Just now' : elapsed < 60 ? `${elapsed} minutes ago` : elapsed < 1440 ? `${Math.round(elapsed / 60)} hours ago` : `${Math.round(elapsed / 1440)} days ago`;
            return (
              <div key={alert.id} className="relative">
                <AlertCard
                  type={validType}
                  location={alert.location}
                  time={timeLabel}
                  status={alert.status}
                />
                {alert.status !== 'resolved' && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    {alert.status === 'open' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'acknowledged')}
                        className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-[8px] hover:bg-amber-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-[8px] hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
}