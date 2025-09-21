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

      {/* Keep header + sidebar */}
      <AdminHeader />
      <div className="flex pt-16">
        <AdminSidebar />

        {/* Main content + Right side panel */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-6">
          <Outlet />
        </main>

        {/* Right side panel for plan toggles */}
        <aside className="w-80 p-4 hidden lg:block">
          <BotPlanPanel />
        </aside>
      </div>
    </div>
  );
};
