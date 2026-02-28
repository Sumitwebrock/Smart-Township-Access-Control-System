import React from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export function DataTable({ columns, data, emptyMessage = 'No data available' }: DataTableProps) {
  return (
    <div className="bg-card border border-border rounded-[16px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-secondary/50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-foreground">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}