import React from 'react';
import { TopBar } from '../components/TopBar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function Settings() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-secondary">
      <TopBar 
        title="Settings" 
        subtitle="System configuration and preferences" 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <div className="bg-card border border-border rounded-[16px] p-8 mb-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">System Settings</h3>
            <div className="space-y-6">
              <Input label="System Name" defaultValue="Township Access Control System" />
              <Input label="Location" defaultValue="Corporate Township - Gate 1" />
              <Input label="Administrator Email" type="email" defaultValue="admin@township.com" />
              
              <div className="pt-4">
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[16px] p-8 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-[12px] border border-border">
                <div>
                  <p className="font-medium text-foreground">Auto-lock Gates</p>
                  <p className="text-sm text-muted-foreground mt-1">Automatically lock gates after entry</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-[12px] border border-border">
                <div>
                  <p className="font-medium text-foreground">Alert Notifications</p>
                  <p className="text-sm text-muted-foreground mt-1">Send email alerts for emergencies</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}