import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Clock, LogIn, UserCheck, XCircle, DoorOpen } from 'lucide-react';

const allActivities = [
  { time: '09:23 AM', date: 'Today', event: 'Gate 1 - Access Granted', person: 'Rajesh Kumar', house: 'A-204', type: 'granted' },
  { time: '09:18 AM', date: 'Today', event: 'Gate 2 - Visitor Entry', person: 'Priya Sharma', house: 'B-108', type: 'visitor' },
  { time: '09:15 AM', date: 'Today', event: 'Gate 1 - Access Denied', person: 'Unknown Vehicle', house: 'N/A', type: 'denied' },
  { time: '09:10 AM', date: 'Today', event: 'Gate 1 - Access Granted', person: 'Amit Patel', house: 'C-312', type: 'granted' },
  { time: '09:05 AM', date: 'Today', event: 'Gate 2 - Access Granted', person: 'Sita Mehta', house: 'A-105', type: 'granted' },
  { time: '08:55 AM', date: 'Today', event: 'Gate 3 - Access Granted', person: 'Vikram Singh', house: 'D-201', type: 'granted' },
  { time: '08:47 AM', date: 'Today', event: 'Gate 1 - Visitor Entry', person: 'Neha Gupta', house: 'B-302', type: 'visitor' },
  { time: '08:40 AM', date: 'Today', event: 'Gate 2 - Access Denied', person: 'Unregistered Vehicle', house: 'N/A', type: 'denied' },
  { time: '08:33 AM', date: 'Today', event: 'Gate 4 - Access Granted', person: 'Sunita Rao', house: 'C-110', type: 'granted' },
  { time: '08:21 AM', date: 'Today', event: 'Gate 1 - Access Granted', person: 'Mohan Das', house: 'A-408', type: 'granted' },
  { time: '11:50 PM', date: 'Yesterday', event: 'Gate 2 - Access Granted', person: 'Karan Verma', house: 'B-215', type: 'granted' },
  { time: '11:30 PM', date: 'Yesterday', event: 'Gate 1 - Access Denied', person: 'Unknown Person', house: 'N/A', type: 'denied' },
  { time: '10:45 PM', date: 'Yesterday', event: 'Gate 3 - Access Granted', person: 'Pooja Nair', house: 'D-104', type: 'granted' },
  { time: '09:20 PM', date: 'Yesterday', event: 'Gate 1 - Visitor Entry', person: 'Delivery Personnel', house: 'C-205', type: 'visitor' },
  { time: '06:15 PM', date: 'Yesterday', event: 'Gate 4 - Access Granted', person: 'Ravi Kumar', house: 'A-310', type: 'granted' },
];

const typeConfig = {
  granted: {
    label: 'Access Granted',
    icon: LogIn,
    bg: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  visitor: {
    label: 'Visitor Entry',
    icon: UserCheck,
    bg: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  denied: {
    label: 'Access Denied',
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
};

type FilterType = 'all' | 'granted' | 'visitor' | 'denied';

export default function Recent() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? allActivities : allActivities.filter(a => a.type === filter);

  const grouped: Record<string, typeof allActivities> = {};
  filtered.forEach(act => {
    if (!grouped[act.date]) grouped[act.date] = [];
    grouped[act.date].push(act);
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allActivities.length },
    { key: 'granted', label: 'Access Granted', count: allActivities.filter(a => a.type === 'granted').length },
    { key: 'visitor', label: 'Visitor Entry', count: allActivities.filter(a => a.type === 'visitor').length },
    { key: 'denied', label: 'Access Denied', count: allActivities.filter(a => a.type === 'denied').length },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar
        title="Recent Activity"
        subtitle="Live feed of all gateway events and access logs"
      />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-green-200 rounded-[16px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-green-100 rounded-[12px] flex items-center justify-center">
              <LogIn className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Access Granted</p>
              <p className="text-2xl font-semibold text-foreground">
                {allActivities.filter(a => a.type === 'granted').length}
              </p>
            </div>
          </div>
          <div className="bg-card border border-blue-200 rounded-[16px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-100 rounded-[12px] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Visitor Entries</p>
              <p className="text-2xl font-semibold text-foreground">
                {allActivities.filter(a => a.type === 'visitor').length}
              </p>
            </div>
          </div>
          <div className="bg-card border border-red-200 rounded-[16px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-red-100 rounded-[12px] flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Access Denied</p>
              <p className="text-2xl font-semibold text-foreground">
                {allActivities.filter(a => a.type === 'denied').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium transition-all border ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary'
              }`}
            >
              {f.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f.key ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No events found.</div>
          ) : (
            Object.entries(grouped).map(([date, activities]) => (
              <div key={date}>
                <div className="px-6 py-2 bg-secondary border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{date}</span>
                </div>
                <div className="divide-y divide-border">
                  {activities.map((activity, index) => {
                    const cfg = typeConfig[activity.type as keyof typeof typeConfig];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                          <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">{activity.event}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {activity.person}
                            {activity.house !== 'N/A' && (
                              <span className="ml-2 text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">
                                {activity.house}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
