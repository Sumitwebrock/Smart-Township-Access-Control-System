import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

export default function Visitors() {
  const [visitors, setVisitors] = useState([
    { id: 1, name: 'Amit Kumar', phone: '+91 98765 43210', vehicle: 'MH 12 AB 1234', visitCount: 15, status: 'allowed' },
    { id: 2, name: 'Priya Sharma', phone: '+91 98765 43211', vehicle: 'MH 12 CD 5678', visitCount: 8, status: 'allowed' },
    { id: 3, name: 'Ravi Patel', phone: '+91 98765 43212', vehicle: 'GJ 01 EF 9012', visitCount: 22, status: 'allowed' },
    { id: 4, name: 'Suspicious Person', phone: '+91 98765 43213', vehicle: 'UP 80 GH 3456', visitCount: 1, status: 'blocked' },
    { id: 5, name: 'Sita Devi', phone: '+91 98765 43214', vehicle: 'DL 03 IJ 7890', visitCount: 12, status: 'allowed' },
  ]);

  const handleToggleStatus = (id: number) => {
    setVisitors(visitors.map(visitor => 
      visitor.id === id 
        ? { ...visitor, status: visitor.status === 'allowed' ? 'blocked' : 'allowed' }
        : visitor
    ));
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
      key: 'vehicle',
      label: 'Vehicle Number',
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'visitCount',
      label: 'Visit Count',
      render: (value: number) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <StatusBadge status={value === 'allowed' ? 'success' : 'danger'} size="sm">
          {value === 'allowed' ? 'Allowed' : 'Blocked'}
        </StatusBadge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (_: any, row: any) => (
        <Button
          variant={row.status === 'allowed' ? 'danger' : 'success'}
          size="sm"
          onClick={() => handleToggleStatus(row.id)}
        >
          {row.status === 'allowed' ? 'Block' : 'Unblock'}
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

        <DataTable columns={columns} data={visitors} />
      </main>
    </div>
  );
}