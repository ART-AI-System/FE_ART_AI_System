import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface SubjectHeadHeaderProps {
  setMobileSidebarOpen: (val: boolean) => void;
  title?: string;
}

const SubjectHeadHeader: React.FC<SubjectHeadHeaderProps> = ({ 
  setMobileSidebarOpen,
  title = 'Subject Head Workspace'
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#1B2559]">{title}</h1>
          <p className="text-xs text-gray-500 font-medium">Academic Audit & AI Discrepancy Monitoring</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#EAB308] to-[#CA8A04] flex items-center justify-center text-white font-bold shadow-md shadow-yellow-500/20">
            {user?.name ? user.name.charAt(0) : 'H'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-[#1B2559]">{user?.name || 'Dr. Tran Minh Hoang'}</p>
            <p className="text-xs font-semibold text-[#EAB308] uppercase tracking-wider">Subject Head</p>
          </div>
          <button 
            onClick={logout} 
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SubjectHeadHeader;
