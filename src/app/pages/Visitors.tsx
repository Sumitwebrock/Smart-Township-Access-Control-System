import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { visitorsApi, type Visitor } from '../../lib/api';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    visitorsApi.list({ limit: 200 })
      .then(setVisitors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async (id: number, currentlyBlocked: boolean) => {
    try {
      const updated = await visitorsApi.update(id, { is_blocked: !currentlyBlocked });
      setVisitors((prev) => prev.map((v) => (v.id === id ? updated : v)));
    } catch (e: any) {
      alert('Failed to update: ' + e.message);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'phone',
      label: 'Phone Number',
    },
    {
      key: 'vehicle_number',
      label: 'Vehicle Number',
      render: (value: string | null) => value ? <span className="font-mono">{value}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'visit_count',
      label: 'Visit Count',
      render: (value: number) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'is_blocked',
      label: 'Status',
      render: (value: boolean) => (
        <StatusBadge status={!value ? 'success' : 'danger'} size="sm">
          {!value ? 'Allowed' : 'Blocked'}
        </StatusBadge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (_: any, row: Visitor) => (
        <Button
          variant={row.is_blocked ? 'success' : 'danger'}
          size="sm"
          onClick={() => handleToggleStatus(row.id, row.is_blocked)}
        >
          {row.is_blocked ? 'Unblock' : 'Block'}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Visitors Management" 
        subtitle="Monitor and manage visitor access" 
        showSearch 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Visitors: <span className="font-semibold text-foreground">{visitors.length}</span></p>
          </div>
          <Button variant="primary">Add New Visitor</Button>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading visitors…</p>}
        {error && <p className="text-destructive text-sm">Failed to load: {error}</p>}
        {!loading && !error && <DataTable columns={columns} data={visitors} />}
      </main>
    </div>
  );
}