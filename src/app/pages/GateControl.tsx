import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { CreditCard, Camera, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router';

type AccessStatus = 'waiting' | 'scanned' | 'approved' | 'denied';

export default function GateControl() {
  const [rfidStatus, setRfidStatus] = useState<'waiting' | 'scanned'>('waiting');
  const [accessResult, setAccessResult] = useState<AccessStatus>('waiting');
  const [currentPerson, setCurrentPerson] = useState<{name: string, house: string} | null>(null);

  const recentEntries = [
    { time: '09:23', name: 'Rajesh Kumar', house: 'A-204', status: 'approved' as const, gate: 'Gate 1' },
    { time: '09:18', name: 'Priya Sharma', house: 'B-108', status: 'approved' as const, gate: 'Gate 2' },
    { time: '09:15', name: 'Unknown', house: 'N/A', status: 'denied' as const, gate: 'Gate 1' },
    { time: '09:10', name: 'Amit Patel', house: 'C-312', status: 'approved' as const, gate: 'Gate 1' },
    { time: '09:05', name: 'Sita Mehta', house: 'A-105', status: 'approved' as const, gate: 'Gate 2' },
  ];

  const simulateScan = () => {
    setRfidStatus('scanned');
    setCurrentPerson({ name: 'Rahul Verma', house: 'B-215' });
    
    setTimeout(() => {
      setAccessResult('approved');
      setTimeout(() => {
        setRfidStatus('waiting');
        setAccessResult('waiting');
        setCurrentPerson(null);
      }, 3000);
    }, 1500);
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
          <Button variant="secondary" size="lg">
            View All Gates
          </Button>
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
                    {rfidStatus === 'waiting' ? 'Waiting for RFID...' : 'RFID Detected'}
                  </p>
                </div>
              </div>

              {currentPerson && (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Person Name</p>
                      <p className="text-2xl font-semibold text-foreground">{currentPerson.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">House Number</p>
                      <p className="text-xl font-semibold text-foreground">{currentPerson.house}</p>
                    </div>
                  </div>
                </>
              )}

              {accessResult === 'approved' && (
                <div className="flex items-center gap-4 p-6 bg-green-50 border-2 border-green-500 rounded-[14px]">
                  <CheckCircle className="w-12 h-12 text-success" />
                  <div>
                    <p className="text-2xl font-semibold text-success">ACCESS APPROVED</p>
                    <p className="text-sm text-green-600">Gate opening...</p>
                  </div>
                </div>
              )}

              {accessResult === 'denied' && (
                <div className="flex items-center gap-4 p-6 bg-red-50 border-2 border-red-500 rounded-[14px]">
                  <XCircle className="w-12 h-12 text-destructive" />
                  <div>
                    <p className="text-2xl font-semibold text-destructive">ACCESS DENIED</p>
                    <p className="text-sm text-red-600">Unauthorized entry attempt</p>
                  </div>
                </div>
              )}

              {accessResult === 'waiting' && !currentPerson && (
                <button 
                  onClick={simulateScan}
                  className="w-full p-6 border-2 border-dashed border-border rounded-[14px] text-muted-foreground hover:border-primary hover:text-primary hover:bg-blue-50 transition-all"
                >
                  Click to simulate RFID scan
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-[12px]">
                <p className="text-2xl font-semibold text-success">1,234</p>
                <p className="text-sm text-muted-foreground mt-1">Approved Today</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-[12px]">
                <p className="text-2xl font-semibold text-destructive">23</p>
                <p className="text-sm text-muted-foreground mt-1">Denied Today</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-[12px]">
                <p className="text-2xl font-semibold text-primary">4</p>
                <p className="text-sm text-muted-foreground mt-1">Gates Active</p>
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
            {recentEntries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-secondary rounded-[12px] hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground font-mono text-sm w-16">{entry.time}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.house}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{entry.gate}</span>
                  <StatusBadge status={entry.status === 'approved' ? 'success' : 'danger'} size="sm">
                    {entry.status === 'approved' ? 'Approved' : 'Denied'}
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