import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Clock, LogIn, UserCheck, XCircle } from 'lucide-react';
import { entryLogsApi, type EntryLog } from '../../lib/api';

const typeConfig = {
  employee: {
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
};

type FilterType = 'all' | 'employee' | 'visitor';

function toDisplayDate(input: string): Date {
  if (!input) return new Date();

  const hasTimezone = /[zZ]|[+\-]\d{2}:\d{2}$/.test(input);
  const normalized = input.includes('T') ? input : input.replace(' ', 'T');
  const iso = hasTimezone ? normalized : `${normalized}Z`;

  return new Date(iso);
}

export default function Recent() {
  const [logs, setLogs] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    entryLogsApi.list({ limit: 100 })
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
    const interval = setInterval(() => {
      entryLogsApi.list({ limit: 100 }).then(setLogs).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.person_type === filter);

  // Group by date label
  const grouped: Record<string, EntryLog[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  filtered.forEach((log) => {
    const d = toDisplayDate(log.entry_time).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : d;
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(log);
  });

  const employeeCount = logs.filter((l) => l.person_type === 'employee').length;
  const visitorCount = logs.filter((l) => l.person_type === 'visitor').length;

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: logs.length },
    { key: 'employee', label: 'Access Granted', count: employeeCount },
    { key: 'visitor', label: 'Visitor Entry', count: visitorCount },
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
              <p className="text-sm text-muted-foreground font-medium">Employee Entries</p>
              <p className="text-2xl font-semibold text-foreground">{employeeCount}</p>
            </div>
          </div>
          <div className="bg-card border border-blue-200 rounded-[16px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-100 rounded-[12px] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Visitor Entries</p>
              <p className="text-2xl font-semibold text-foreground">{visitorCount}</p>
            </div>
          </div>
          <div className="bg-card border border-amber-200 rounded-[16px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-100 rounded-[12px] flex items-center justify-center">
              <XCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Still Inside</p>
              <p className="text-2xl font-semibold text-foreground">{logs.filter((l) => !l.exit_time).length}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
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
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
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

          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No events found.</div>
          ) : (
            Object.entries(grouped).map(([date, activities]) => (
              <div key={date}>
                <div className="px-6 py-2 bg-secondary border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{date}</span>
                </div>
                <div className="divide-y divide-border">
                  {activities.map((log) => {
                    const cfg = typeConfig[log.person_type] ?? typeConfig.employee;
                    const Icon = cfg.icon;
                    return (
                      <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors">
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                          <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground capitalize">
                              {log.gate_id ?? 'Gate'} – {log.person_type} entry
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Person #{log.person_id}
                            {log.vehicle_number && (
                              <span className="ml-2 text-xs bg-secondary border border-border px-2 py-0.5 rounded-full font-mono">
                                {log.vehicle_number}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {toDisplayDate(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

