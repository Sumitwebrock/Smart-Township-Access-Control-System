import React from 'react';
import { TopBar } from '../components/TopBar';
import { AlertCard } from '../components/AlertCard';
import { StatusBadge } from '../components/StatusBadge';

export default function Alerts() {
  const alerts = [
    { id: 1, type: 'panic' as const, location: 'Block A - House 204', time: '2 minutes ago', status: 'active' as const },
    { id: 2, type: 'fire' as const, location: 'Block C - Parking Area', time: '15 minutes ago', status: 'investigating' as const },
    { id: 3, type: 'intrusion' as const, location: 'Gate 3 - Service Entrance', time: '1 hour ago', status: 'resolved' as const },
    { id: 4, type: 'accident' as const, location: 'Main Road - Near Gate 1', time: '3 hours ago', status: 'resolved' as const },
  ];

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const investigatingCount = alerts.filter(a => a.status === 'investigating').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Alerts & Emergencies" 
        subtitle="Real-time monitoring of security alerts" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 border border-red-200 p-6 rounded-[16px] shadow-sm">
            <div className="text-4xl font-semibold text-destructive mb-2">{activeCount}</div>
            <div className="text-red-700 uppercase tracking-wide text-sm font-medium">Active Alerts</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-[16px] shadow-sm">
            <div className="text-4xl font-semibold text-warning mb-2">{investigatingCount}</div>
            <div className="text-amber-700 uppercase tracking-wide text-sm font-medium">Investigating</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-6 rounded-[16px] shadow-sm">
            <div className="text-4xl font-semibold text-success mb-2">{resolvedCount}</div>
            <div className="text-green-700 uppercase tracking-wide text-sm font-medium">Resolved</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-foreground mb-4">All Alerts</h3>
          <div className="flex gap-3 mb-6">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-[12px] shadow-sm">All</button>
            <button className="px-4 py-2 bg-white text-secondary-foreground hover:bg-secondary rounded-[12px] border border-border">Active</button>
            <button className="px-4 py-2 bg-white text-secondary-foreground hover:bg-secondary rounded-[12px] border border-border">Investigating</button>
            <button className="px-4 py-2 bg-white text-secondary-foreground hover:bg-secondary rounded-[12px] border border-border">Resolved</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              type={alert.type}
              location={alert.location}
              time={alert.time}
              status={alert.status}
            />
          ))}
        </div>
      </main>
    </div>
  );
}