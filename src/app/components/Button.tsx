import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow';
  
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-blue-600',
    success: 'bg-success text-success-foreground hover:bg-green-600',
    danger: 'bg-destructive text-destructive-foreground hover:bg-red-600',
    secondary: 'bg-white text-secondary-foreground hover:bg-secondary border border-border',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-[12px]',
    md: 'px-6 py-3 rounded-[14px]',
    lg: 'px-8 py-4 rounded-[14px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}