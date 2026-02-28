import React from 'react';
import { TopBar } from '../components/TopBar';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';

export default function Employees() {
  const employees = [
    { id: 1, name: 'Rajesh Kumar', empId: 'EMP001', house: 'A-204', department: 'Engineering', rfidStatus: 'active' },
    { id: 2, name: 'Priya Sharma', empId: 'EMP002', house: 'B-108', department: 'HR', rfidStatus: 'active' },
    { id: 3, name: 'Amit Patel', empId: 'EMP003', house: 'C-312', department: 'Operations', rfidStatus: 'active' },
    { id: 4, name: 'Sita Mehta', empId: 'EMP004', house: 'A-105', department: 'Finance', rfidStatus: 'inactive' },
    { id: 5, name: 'Ravi Kumar', empId: 'EMP005', house: 'D-401', department: 'IT', rfidStatus: 'active' },
  ];

  const columns = [
    { key: 'empId', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'house', label: 'House Number' },
    { key: 'department', label: 'Department' },
    {
      key: 'rfidStatus',
      label: 'RFID Status',
      render: (value: string) => (
        <StatusBadge status={value === 'active' ? 'success' : 'danger'} size="sm">
          {value === 'active' ? 'Active' : 'Inactive'}
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

        <DataTable columns={columns} data={employees} />
      </main>
    </div>
  );
}