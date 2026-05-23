import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';
export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <Outlet />
      </main>
      <Toaster position="top-center" richColors />
    </div>);

}