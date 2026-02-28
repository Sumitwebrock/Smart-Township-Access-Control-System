import React from 'react';
import { TopBar } from '../components/TopBar';
import { StatCard } from '../components/StatCard';
import { Users, Home, LogIn, AlertTriangle, UserPlus, DoorOpen } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/Button';

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Dashboard" 
        subtitle="Overview of township access control system" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Quick Access Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-[16px] p-6 mb-8 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-4">Quick Access</h3>
          <div className="flex gap-4">
            <Link to="/visitor-registration" target="_blank">
              <Button variant="primary" size="lg">
                <UserPlus className="w-5 h-5" />
                Visitor Registration Terminal
              </Button>
            </Link>
            <Link to="/admin/gate-control">
              <Button variant="secondary" size="lg">
                <DoorOpen className="w-5 h-5" />
                Gate Control
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Open Visitor Registration in a new tab for gate security personnel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value="2,847"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: '+12 this month', direction: 'up' }}
          />
          <StatCard
            title="Total Families"
            value="1,523"
            icon={<Home className="w-5 h-5" />}
            trend={{ value: '+8 this month', direction: 'up' }}
          />
          <StatCard
            title="Today Entries"
            value="1,847"
            icon={<LogIn className="w-5 h-5" />}
            trend={{ value: '+142 from yesterday', direction: 'up' }}
          />
          <StatCard
            title="Active Alerts"
            value="3"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: '-2 from yesterday', direction: 'down' }}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { time: '09:23 AM', event: 'Gate 1 - Access Granted', person: 'Rajesh Kumar', house: 'A-204' },
                { time: '09:18 AM', event: 'Gate 2 - Visitor Entry', person: 'Priya Sharma', house: 'B-108' },
                { time: '09:15 AM', event: 'Gate 1 - Access Denied', person: 'Unknown Vehicle', house: 'N/A' },
                { time: '09:10 AM', event: 'Gate 1 - Access Granted', person: 'Amit Patel', house: 'C-312' },
                { time: '09:05 AM', event: 'Gate 2 - Access Granted', person: 'Sita Mehta', house: 'A-105' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-secondary rounded-[12px] hover:shadow-sm transition-shadow">
                  <div className="text-sm text-muted-foreground font-medium w-20">{activity.time}</div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-sm">{activity.event}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{activity.person} • {activity.house}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Approved Entries Today</span>
                <span className="text-2xl font-semibold text-success">1,789</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Denied Entries Today</span>
                <span className="text-2xl font-semibold text-destructive">58</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Pending Approvals</span>
                <span className="text-2xl font-semibold text-warning">12</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-[12px]">
                <span className="text-muted-foreground text-sm font-medium">Active Gates</span>
                <span className="text-2xl font-semibold text-primary">4/4</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}