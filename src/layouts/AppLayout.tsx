import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`
          min-h-screen transition-all duration-300
          ${sidebarCollapsed
            ? "lg:ml-[var(--sidebar-collapsed-width)]"
            : "lg:ml-[var(--sidebar-width)]"
          }
        `}
      >
        <Header onMenuClick={toggleMobileMenu} />

        <main className="p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
