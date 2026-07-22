import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SubjectHeadSidebar from '../components/layout/SubjectHeadSidebar';
import SubjectHeadHeader from '../components/layout/SubjectHeadHeader';

const SubjectHeadLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

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
