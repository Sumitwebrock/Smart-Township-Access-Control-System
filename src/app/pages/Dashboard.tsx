import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { StatCard } from '../components/StatCard';
import { Users, Home, LogIn, AlertTriangle, UserPlus, DoorOpen } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/Button';
import { employeesApi, entryLogsApi, alertsApi, visitorsApi, type EntryLog } from '../../lib/api';

export default function Dashboard() {
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [todayLogs, setTodayLogs] = useState<EntryLog[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<number | null>(null);
  const [recentLogs, setRecentLogs] = useState<EntryLog[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    employeesApi.list({ limit: 200 }).then((r) => setEmployeeCount(r.length)).catch(() => {});
    visitorsApi.list({ limit: 200 }).then((r) => setVisitorCount(r.length)).catch(() => {});
    alertsApi.list({ status: 'open', limit: 200 }).then((r) => setActiveAlerts(r.length)).catch(() => {});
    entryLogsApi.list({ from_date: today, to_date: today, limit: 500 }).then((r) => {
      setTodayLogs(r);
      setRecentLogs(r.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Dashboard" 
        subtitle="Overview of township access control system" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Quick Access Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-[16px] p-6 mb-8 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-4">Quick Access</h3>
          <div className="flex gap-4">
            <Link to="/visitor-registration" target="_blank">
              <Button variant="primary" size="lg">
                <UserPlus className="w-5 h-5" />
                Visitor Registration Terminal
              </Button>
            </Link>
            <Link to="/admin/gate-control">
              <Button variant="secondary" size="lg">
                <DoorOpen className="w-5 h-5" />
                Gate Control
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Open Visitor Registration in a new tab for gate security personnel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={employeeCount !== null ? employeeCount.toLocaleString() : '…'}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Total Visitors"
            value={visitorCount !== null ? visitorCount.toLocaleString() : '…'}
            icon={<Home className="w-5 h-5" />}
          />
          <StatCard
            title="Today Entries"
            value={todayLogs.length > 0 ? todayLogs.length.toLocaleString() : '0'}
            icon={<LogIn className="w-5 h-5" />}
          />
          <StatCard
            title="Active Alerts"
            value={activeAlerts !== null ? String(activeAlerts) : '…'}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {recentLogs.length === 0 && (
                <p className="text-sm text-muted-foreground">No entries today yet.</p>
              )}
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-secondary rounded-[12px] hover:shadow-sm transition-shadow">
                  <div className="text-sm text-muted-foreground font-medium w-24 shrink-0">
                    {new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-sm capitalize">
                      {log.gate_id ?? 'Gate'} – {log.person_type} entry
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Person #{log.person_id}{log.vehicle_number ? ` • ${log.vehicle_number}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Employee Entries Today</span>
                <span className="text-2xl font-semibold text-success">
                  {todayLogs.filter((l) => l.person_type === 'employee').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Visitor Entries Today</span>
                <span className="text-2xl font-semibold text-primary">
                  {todayLogs.filter((l) => l.person_type === 'visitor').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Still Inside</span>
                <span className="text-2xl font-semibold text-warning">
                  {todayLogs.filter((l) => !l.exit_time).length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Active Alerts</span>
                <span className="text-2xl font-semibold text-destructive">{activeAlerts ?? '…'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}