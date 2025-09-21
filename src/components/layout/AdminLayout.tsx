import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { Topbar } from './Topbar';
import { BotPlanPanel } from './BotPlanPanel';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <Topbar />

      {/* Header + Sidebar */}
      <AdminHeader />
      <div className="flex flex-col lg:flex-row pt-16">
        {/* Sidebar (always on the left) */}
        <AdminSidebar />

        {/* Main content area */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-6">
          <Outlet />

          {/* Mobile: BotPlanPanel shows below content */}
          <div className="mt-6 block lg:hidden">
            <BotPlanPanel />
          </div>
        </main>

        {/* Desktop: BotPlanPanel on the right */}
        <aside className="w-80 p-4 hidden lg:block">
          <BotPlanPanel />
        </aside>
      </div>
    </div>
  );
};

