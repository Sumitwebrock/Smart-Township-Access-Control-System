import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-foreground text-sm">{label}</label>
      )}
      <input
        className={`w-full px-4 py-3 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-[12px] transition-all ${className}`}
        {...props}
      />
      {error && (
        <span className="text-destructive text-sm">{error}</span>
      )}
    </div>
  );
}