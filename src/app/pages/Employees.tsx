import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { employeesApi, type Employee } from '../../lib/api';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employeesApi.list({ limit: 200 })
      .then(setEmployees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'id', label: 'Employee ID', render: (v: number) => `EMP${String(v).padStart(3, '0')}` },
    { key: 'name', label: 'Name' },
    { key: 'house_number', label: 'House Number' },
    { key: 'rfid_tag', label: 'RFID Tag', render: (v: string) => <span className="font-mono text-sm">{v}</span> },
    { key: 'vehicle_number', label: 'Vehicle', render: (v: string | null) => v ? <span className="font-mono">{v}</span> : <span className="text-muted-foreground">—</span> },
    {
      key: 'is_active',
      label: 'RFID Status',
      render: (value: boolean) => (
        <StatusBadge status={value ? 'success' : 'danger'} size="sm">
          {value ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar
        title="Employees"
        subtitle="Manage employee access and RFID cards"
        showSearch
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Total Employees: <span className="font-semibold text-foreground">{employees.length}</span></p>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading employees…</p>}
        {error && <p className="text-destructive text-sm">Failed to load: {error}</p>}
        {!loading && !error && <DataTable columns={columns} data={employees} />}
      </main>
    </div>
  );
}