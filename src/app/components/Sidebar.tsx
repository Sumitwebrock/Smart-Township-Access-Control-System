import React from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  DoorOpen, 
  UserCheck, 
  ScrollText, 
  AlertTriangle, 
  Users, 
  Settings,
  Clock
} from 'lucide-react';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/gate-control', icon: DoorOpen, label: 'Gate Control' },
  { path: '/admin/visitors', icon: UserCheck, label: 'Visitors' },
  { path: '/admin/entry-logs', icon: ScrollText, label: 'Entry Logs' },
  { path: '/admin/recent', icon: Clock, label: 'Recent' },
  { path: '/admin/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/admin/employees', icon: Users, label: 'Employees' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-[12px] flex items-center justify-center shadow-sm">
            <DoorOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground">Township Access</h1>
            <p className="text-xs text-muted-foreground">Control System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold text-white">SA</span>
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">Security Admin</p>
            <p className="text-xs text-muted-foreground">admin@township.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}