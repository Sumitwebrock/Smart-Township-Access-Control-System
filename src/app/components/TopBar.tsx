import React from 'react';
import { Bell, Search } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function TopBar({ title, subtitle, showSearch = false }: TopBarProps) {
  return (
    <header className="bg-card border-b border-border px-8 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent rounded-[12px] w-64 transition-all"
              />
            </div>
          )}

          <button className="relative p-2 hover:bg-secondary rounded-[12px] transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          <div className="flex items-center gap-2 text-sm text-foreground bg-secondary px-4 py-2 rounded-[12px]">
            <span className="text-muted-foreground">Today:</span>
            <span className="font-medium">Saturday, Feb 28, 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}