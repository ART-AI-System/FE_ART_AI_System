import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import SubjectHeadSidebar from '../components/layout/SubjectHeadSidebar';
import SubjectHeadHeader from '../components/layout/SubjectHeadHeader';
import { useAuth } from '../context/AuthContext';

const SubjectHeadLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  const getTitle = () => {
    if (location.pathname.includes('suspicious-cases')) {
      return 'Suspicious AI Cases Audit';
    }
    if (location.pathname.includes('messages')) {
      return 'Messages & Communications';
    }
    if (location.pathname.includes('settings')) {
      return 'Account Settings';
    }
    return 'Subject Head Overview';
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
  if (role !== 'subject_head' && role !== 'headsubject') {
    if (role === 'lecturer') {
      return <Navigate to="/lecturer/dashboard" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/home" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FE] font-inter">
      <SubjectHeadSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        mobileSidebarOpen={mobileSidebarOpen} 
        setMobileSidebarOpen={setMobileSidebarOpen} 
      />

      <main className={`flex-1 flex flex-col h-screen relative transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[280px]'}`}>
        <SubjectHeadHeader 
          setMobileSidebarOpen={setMobileSidebarOpen} 
          title={getTitle()}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SubjectHeadLayout;
