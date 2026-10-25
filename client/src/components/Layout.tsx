import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-1 relative">
        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 max-w-[80vw] h-full bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Desktop Fixed Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area (extra bottom padding for mobile bottom bar) */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};
export default Layout;
