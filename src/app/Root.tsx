import React from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './components/Sidebar';

export default function Root() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <Outlet />
    </div>
  );
}
