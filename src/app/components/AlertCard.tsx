import React from 'react';
import { StatusBadge } from './StatusBadge';

interface AlertCardProps {
  type: 'accident' | 'panic' | 'fire' | 'intrusion';
  location: string;
  time: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export function AlertCard({ type, location, time, status }: AlertCardProps) {
  const typeConfig = {
    accident: { label: 'Accident', color: 'warning' as const, icon: '⚠️' },
    panic: { label: 'Panic Alert', color: 'danger' as const, icon: '🚨' },
    fire: { label: 'Fire Emergency', color: 'danger' as const, icon: '🔥' },
    intrusion: { label: 'Intrusion Detected', color: 'danger' as const, icon: '🚪' },
  };

  const statusConfig = {
    open: { label: 'Open', color: 'danger' as const },
    acknowledged: { label: 'Acknowledged', color: 'warning' as const },
    resolved: { label: 'Resolved', color: 'success' as const },
  };

  const config = typeConfig[type];
  const statusCfg = statusConfig[status];

  return (
    <div className="bg-card border border-border p-6 rounded-[16px] hover:shadow-md transition-shadow shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className="text-foreground font-semibold">{config.label}</h4>
            <p className="text-sm text-muted-foreground mt-1">{location}</p>
          </div>
        </div>
        <StatusBadge status={statusCfg.color} size="sm">
          {statusCfg.label}
        </StatusBadge>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {time}
      </div>
    </div>
  );
}