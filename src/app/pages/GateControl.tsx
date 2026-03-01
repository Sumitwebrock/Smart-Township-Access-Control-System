import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { CreditCard, Camera, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router';
import { rfidApi, entryLogsApi, type EntryLog, type Employee } from '../../lib/api';

type AccessStatus = 'waiting' | 'scanning' | 'approved' | 'denied';

export default function GateControl() {
  const [rfidInput, setRfidInput] = useState('');
  const [accessResult, setAccessResult] = useState<AccessStatus>('waiting');
  const [scanMessage, setScanMessage] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [recentLogs, setRecentLogs] = useState<EntryLog[]>([]);

  const fetchRecentLogs = () => {
    const today = new Date().toISOString().split('T')[0];
    entryLogsApi.list({ from_date: today, to_date: today, limit: 10 })
      .then(setRecentLogs)
      .catch(() => {});
  };

  useEffect(() => {
    fetchRecentLogs();
    const interval = setInterval(fetchRecentLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    if (!rfidInput.trim()) return;
    setAccessResult('scanning');
    try {
      const result = await rfidApi.scan(rfidInput.trim(), 'Gate 1');
      if (result.access_granted) {
        setAccessResult('approved');
        setCurrentEmployee(result.employee ?? null);
        setScanMessage(result.message);
        fetchRecentLogs();
      } else {
        setAccessResult('denied');
        setScanMessage(result.message);
        setCurrentEmployee(null);
      }
    } catch (e: any) {
      setAccessResult('denied');
      setScanMessage(e.message ?? 'Scan failed');
      setCurrentEmployee(null);
    }
    setTimeout(() => {
      setAccessResult('waiting');
      setScanMessage('');
      setCurrentEmployee(null);
      setRfidInput('');
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Gate Control" 
        subtitle="Real-time access monitoring and control" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Quick Action Buttons */}
        <div className="mb-6 flex gap-4">
          <Link to="/visitor-registration" target="_blank">
            <Button variant="primary" size="lg">
              <UserPlus className="w-5 h-5" />
              Open Visitor Registration
            </Button>
          </Link>
          <Link to="/employee-registration" target="_blank">
            <Button variant="secondary" size="lg">
              <UserPlus className="w-5 h-5" />
              Open Employee Registration
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Access Status Card */}
          <div className="xl:col-span-2 bg-card border border-border rounded-[16px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-foreground">Access Status - Gate 1</h3>
              <StatusBadge status="success">Active</StatusBadge>
            </div>

            <div className="bg-secondary rounded-[14px] p-8 mb-6 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-[12px] flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RFID Status</p>
                  <p className="text-lg font-semibold text-foreground">
                    {accessResult === 'waiting' ? 'Waiting for RFID…' : accessResult === 'scanning' ? 'Processing…' : 'RFID Scanned'}
                  </p>
                </div>
              </div>

              {currentEmployee && (
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Person Name</p>
                    <p className="text-2xl font-semibold text-foreground">{currentEmployee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">House Number</p>
                    <p className="text-xl font-semibold text-foreground">{currentEmployee.house_number}</p>
                  </div>
                </div>
              )}

              {accessResult === 'approved' && (
                <div className="flex items-center gap-4 p-6 bg-green-50 border-2 border-green-500 rounded-[14px] mb-4">
                  <CheckCircle className="w-12 h-12 text-success" />
                  <div>
                    <p className="text-2xl font-semibold text-success">ACCESS APPROVED</p>
                    <p className="text-sm text-green-600">{scanMessage}</p>
                  </div>
                </div>
              )}

              {accessResult === 'denied' && (
                <div className="flex items-center gap-4 p-6 bg-red-50 border-2 border-red-500 rounded-[14px] mb-4">
                  <XCircle className="w-12 h-12 text-destructive" />
                  <div>
                    <p className="text-2xl font-semibold text-destructive">ACCESS DENIED</p>
                    <p className="text-sm text-red-600">{scanMessage}</p>
                  </div>
                </div>
              )}

              {accessResult === 'waiting' && (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="Enter RFID tag and press Enter or Scan"
                    className="flex-1 px-4 py-3 bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-[12px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button variant="primary" onClick={handleScan} disabled={!rfidInput.trim()}>
                    Scan
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-[12px]">
                <p className="text-2xl font-semibold text-success">
                  {recentLogs.filter((l) => !l.exit_time).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Currently Inside</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-[12px]">
                <p className="text-2xl font-semibold text-primary">{recentLogs.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Today's Entries</p>
              </div>
            </div>
          </div>

          {/* Live Camera Feed */}
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-4">Live Camera Feed</h3>
            <div className="aspect-[3/4] bg-secondary rounded-[14px] flex items-center justify-center mb-4 border border-border">
              <Camera className="w-16 h-16 text-muted-foreground" />
            </div>
            <p className="text-sm text-center text-muted-foreground">Gate 1 - Main Entrance</p>
          </div>
        </div>

        {/* Recent Entry Logs */}
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-4">Recent Entry Logs</h3>
          <div className="space-y-2">
            {recentLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">No entries today yet.</p>
            )}
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-secondary rounded-[12px] hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground font-mono text-sm w-20">
                    {new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <p className="font-medium text-foreground text-sm capitalize">{log.person_type} #{log.person_id}</p>
                    <p className="text-sm text-muted-foreground">{log.vehicle_number ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{log.gate_id ?? '—'}</span>
                  <StatusBadge status={log.exit_time ? 'success' : 'info'} size="sm">
                    {log.exit_time ? 'Exited' : 'Inside'}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}