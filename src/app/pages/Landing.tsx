import React from 'react';
import { Link } from 'react-router';
import { DoorOpen, UserCheck, Shield } from 'lucide-react';
import { Button } from '../components/Button';

export default function Landing() {
  // To use a custom logo, replace the Shield icon below with:
  // <img src="/path-to-your-logo.png" alt="Company Logo" className="w-full h-full object-contain" />
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-2 border-border rounded-[16px] mb-6 shadow-lg p-3">
            {/* NTPC Logo - Replace with actual NTPC logo path */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/0/09/NTPC_Limited_Logo.svg/1200px-NTPC_Limited_Logo.svg.png" 
              alt="NTPC Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Smart Township Access Control
          </h1>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Admin Login Card */}
          <Link to="/admin">
            <div className="bg-white border-2 border-border hover:border-primary rounded-[16px] p-8 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-[14px] mb-6 group-hover:bg-primary group-hover:shadow-md transition-all">
                <DoorOpen className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Admin Login
              </h2>
              <Button variant="primary" size="lg" className="w-full">
                Enter Admin Dashboard
              </Button>
            </div>
          </Link>

          {/* Visitor Access Card */}
          <Link to="/visitor-registration">
            <div className="bg-white border-2 border-border hover:border-success rounded-[16px] p-8 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-[14px] mb-6 group-hover:bg-success group-hover:shadow-md transition-all">
                <UserCheck className="w-8 h-8 text-success group-hover:text-success-foreground transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Visitor Registration
              </h2>
              <Button variant="success" size="lg" className="w-full">
                Open Registration Terminal
              </Button>
            </div>
          </Link>

          {/* Employee Registration Card */}
          <Link to="/employee-registration">
            <div className="bg-white border-2 border-border hover:border-primary rounded-[16px] p-8 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-[14px] mb-6 group-hover:bg-primary group-hover:shadow-md transition-all">
                <Shield className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Employee Registration
              </h2>
              <Button variant="primary" size="lg" className="w-full">
                Add Employee
              </Button>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Township Access Control System. All entries are monitored 24/7.</p>
        </div>
      </div>
    </div>
  );
}