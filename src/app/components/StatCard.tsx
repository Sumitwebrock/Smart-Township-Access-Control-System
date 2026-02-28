import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-[16px] shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="text-muted-foreground text-sm uppercase tracking-wide font-medium">{title}</div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="text-3xl font-semibold text-foreground mb-2">{value}</div>
      {trend && (
        <div className={`text-sm font-medium ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
}