import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Calendar, Search } from 'lucide-react';
import { entryLogsApi, type EntryLog } from '../../lib/api';

export default function EntryLogs() {
  const [logs, setLogs] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = (date?: string) => {
    setLoading(true);
    entryLogsApi
      .list({ limit: 200, from_date: date || undefined, to_date: date || undefined })
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.person_type.includes(s) ||
      (log.vehicle_number ?? '').toLowerCase().includes(s) ||
      (log.gate_id ?? '').toLowerCase().includes(s) ||
      String(log.person_id).includes(s)
    );
  });

  const columns = [
    {
      key: 'entry_time',
      label: 'Timestamp',
      render: (value: string) => (
        <span className="font-mono text-sm">{new Date(value).toLocaleString()}</span>
      ),
    },
    {
      key: 'person_id',
      label: 'Person ID',
      render: (value: number) => <span className="font-semibold">#{value}</span>,
    },
    {
      key: 'person_type',
      label: 'Type',
      render: (value: string) => (
        <StatusBadge
          status={value === 'employee' ? 'info' : 'warning'}
          size="sm"
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </StatusBadge>
      ),
    },
    {
      key: 'vehicle_number',
      label: 'Vehicle',
      render: (value: string | null) =>
        value ? <span className="font-mono">{value}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'gate_id',
      label: 'Gate',
      render: (value: string | null) => value ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'exit_time',
      label: 'Status',
      render: (value: string | null) => (
        <StatusBadge status={value ? 'success' : 'info'} size="sm">
          {value ? 'Exited' : 'Inside'}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by type, vehicle, gate, or person ID..."
              className="w-full pl-10 pr-4 py-3 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-[12px] shadow-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                fetchLogs(e.target.value || undefined);
              }}
              className="pl-10 pr-4 py-3 bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-[12px] w-48 shadow-sm"
            />
          </div>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading logs…</p>}
        {error && <p className="text-destructive text-sm">Failed to load: {error}</p>}
        {!loading && !error && <DataTable columns={columns} data={filtered} />}
      </main>
    </div>
  );
}