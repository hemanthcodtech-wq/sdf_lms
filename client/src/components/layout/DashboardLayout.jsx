import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-bg-cream font-inter">
      <TopNav />
      
      {/* Main Content Area */}
      {/* On desktop, add top padding for fixed navbar. On mobile, add bottom padding for fixed bottom bar */}
      <main className="md:pt-20 pb-20 md:pb-8 min-h-screen">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default DashboardLayout;
