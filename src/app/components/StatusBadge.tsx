import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'danger' | 'warning' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, children, size = 'md' }: StatusBadgeProps) {
  const statusStyles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs rounded-[12px]',
    md: 'px-4 py-2 text-sm rounded-[12px]',
  };

  const dotStyles = {
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <span className={`inline-flex items-center gap-2 border font-medium ${statusStyles[status]} ${sizeStyles[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {children}
    </span>
  );
}