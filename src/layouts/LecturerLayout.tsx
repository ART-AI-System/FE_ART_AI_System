import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import LecturerSidebar from '../components/layout/LecturerSidebar';
import LecturerTopbar from '../components/layout/LecturerTopbar';
import { useAuth } from '../context/AuthContext';

const LecturerLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  // Basic breadcrumb generation based on route for demo purposes
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.includes('grading')) {
      return ['Grading'];
    }
    return ['Dashboard'];
  };

  const getTitle = () => {
    if (location.pathname.includes('grading')) {
      return 'Manage Grading';
    }
    return 'Lecturer Dashboard';
  };

  if (loading) return null;

  const rawUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const effectiveUser = user || rawUser;
  if (!effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  const role = (effectiveUser.role || '').toLowerCase();
  if (role !== 'lecturer') {
    if (role === 'subject_head' || role === 'headsubject') {
      return <Navigate to="/subject-head/dashboard" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/home" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FE] font-inter">
      <LecturerSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        mobileSidebarOpen={mobileSidebarOpen} 
        setMobileSidebarOpen={setMobileSidebarOpen} 
      />

      <main className={`flex-1 flex flex-col h-screen relative transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[280px]'}`}>
        <LecturerTopbar 
          setMobileSidebarOpen={setMobileSidebarOpen} 
          breadcrumbs={generateBreadcrumbs()}
          title={getTitle()}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-10 scroll-smooth bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LecturerLayout;
