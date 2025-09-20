import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-soft">
      <AdminHeader />
      <div className="flex pt-16">
        <AdminSidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};