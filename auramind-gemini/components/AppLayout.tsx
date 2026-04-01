import React from 'react';
import { Outlet } from 'react-router-dom';
import CosmicSidebar from './CosmicSidebar';
import MobileNav from './MobileNav';
import { UserProfile } from '../types';

interface AppLayoutProps {
  user: UserProfile;
  onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-arch-fg selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black antialiased relative overflow-hidden">
      {/* ARCHITECTURAL BACKGROUND EFFECTS */}
      <div className="fixed inset-0 arch-grid-overlay opacity-20 pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vh] bg-neutral-100 dark:bg-neutral-900/40 blur-[200px] rounded-full pointer-events-none opacity-50" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-neutral-100 dark:bg-neutral-900/40 blur-[180px] rounded-full pointer-events-none opacity-50" />

      {/* PERSISTENT SIDEBAR */}
      <CosmicSidebar onLogout={onLogout} user={user} isAdmin={user.isAdmin} />

      {/* CONTENT AREA */}
      <main className="pl-0 lg:pl-20 xl:pl-64 min-h-screen transition-all duration-500 relative z-10 pb-20 lg:pb-0">
        <div className="max-w-[1500px] mx-auto p-4 sm:p-8 md:p-12 xl:p-16">
          <Outlet />
        </div>
      </main>

      {/* MOBILE NAV (BOTTOM BAR) */}
      <MobileNav />
    </div>
  );
};

export default AppLayout;
