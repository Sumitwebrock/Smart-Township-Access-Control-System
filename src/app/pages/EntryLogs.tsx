import React from 'react';
import { TopBar } from '../components/TopBar';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Input } from '../components/Input';
import { Calendar, Search } from 'lucide-react';

export default function EntryLogs() {
  const logs = [
    { id: 1, timestamp: '2026-02-28 09:23:45', name: 'Rajesh Kumar', house: 'A-204', vehicle: 'MH 12 AB 1234', gate: 'Gate 1', type: 'Resident', status: 'approved' },
    { id: 2, timestamp: '2026-02-28 09:18:32', name: 'Priya Sharma', house: 'B-108', vehicle: 'MH 12 CD 5678', gate: 'Gate 2', type: 'Visitor', status: 'approved' },
    { id: 3, timestamp: '2026-02-28 09:15:21', name: 'Unknown', house: 'N/A', vehicle: 'UP 80 GH 3456', gate: 'Gate 1', type: 'Unknown', status: 'denied' },
    { id: 4, timestamp: '2026-02-28 09:10:15', name: 'Amit Patel', house: 'C-312', vehicle: 'GJ 01 EF 9012', gate: 'Gate 1', type: 'Resident', status: 'approved' },
    { id: 5, timestamp: '2026-02-28 09:05:08', name: 'Sita Mehta', house: 'A-105', vehicle: 'DL 03 IJ 7890', gate: 'Gate 2', type: 'Resident', status: 'approved' },
    { id: 6, timestamp: '2026-02-28 09:02:45', name: 'Delivery Person', house: 'B-215', vehicle: 'MH 04 KL 2345', gate: 'Gate 3', type: 'Visitor', status: 'approved' },
    { id: 7, timestamp: '2026-02-28 08:58:30', name: 'Ravi Kumar', house: 'D-401', vehicle: 'MH 12 MN 6789', gate: 'Gate 1', type: 'Resident', status: 'approved' },
    { id: 8, timestamp: '2026-02-28 08:55:12', name: 'Unknown', house: 'N/A', vehicle: 'RJ 14 OP 3456', gate: 'Gate 2', type: 'Unknown', status: 'denied' },
  ];

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Person',
    },
    {
      key: 'house',
      label: 'House',
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'gate',
      label: 'Gate',
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: string) => (
        <StatusBadge 
          status={value === 'Resident' ? 'info' : value === 'Visitor' ? 'warning' : 'danger'} 
          size="sm"
        >
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <StatusBadge status={value === 'approved' ? 'success' : 'danger'} size="sm">
          {value === 'approved' ? 'Approved' : 'Denied'}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Entry Logs" 
        subtitle="Complete history of all entry attempts" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, vehicle, or house number..."
              className="w-full pl-10 pr-4 py-3 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-[12px] shadow-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              className="pl-10 pr-4 py-3 bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-[12px] w-48 shadow-sm"
            />
          </div>
        </div>

        <DataTable columns={columns} data={logs} />
      </main>
    </div>
  );
}