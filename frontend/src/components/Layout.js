import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import LeftSidebar from './LeftSidebar';
import './Layout.css';

function Layout({ children }) {
  const { isSidebarOpen, isSidebarExpanded, toggleSidebar, toggleSidebarExpand } = useSidebar();
  const location = useLocation();

  // Public routes where layout should not be applied
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // If it's a public route, just render children without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="layout-container">
      <LeftSidebar
        isOpen={isSidebarOpen}
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onToggleExpand={toggleSidebarExpand}
      />
      <main className={`main-content ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
        {children}
      </main>
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

export default Layout;
