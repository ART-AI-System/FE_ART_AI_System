import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BrainCircuit, LayoutDashboard, ShieldAlert, 
  MessageCircle, Settings, X 
} from 'lucide-react';

interface SubjectHeadSidebarProps {
  sidebarCollapsed?: boolean;
  mobileSidebarOpen?: boolean;
  setMobileSidebarOpen?: (val: boolean) => void;
}

const SubjectHeadSidebar: React.FC<SubjectHeadSidebarProps> = ({ 
  sidebarCollapsed = false, 
  mobileSidebarOpen = false, 
  setMobileSidebarOpen = () => {} 
}) => {
  const location = useLocation();

  const navItemClass = (path: string) => {
    const isActive = location.pathname.includes(path);
    return `flex items-center px-4 py-3.5 font-medium rounded-xl transition-all relative ${
      isActive 
        ? 'bg-white/10 text-white font-bold' 
        : 'text-yellow-100 hover:text-white hover:bg-white/5'
    }`;
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-[#1B2559] fixed h-full z-30 flex flex-col shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? 'w-[88px]' : 'w-[280px]'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="h-24 flex items-center px-8 border-b border-white/10 shrink-0 relative overflow-hidden">
          <Link to="/subject-head/dashboard" className="flex items-center w-full">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg shadow-yellow-500/30 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-extrabold text-white tracking-tight whitespace-nowrap">
                ART-AI<span className="text-[#EAB308] text-xs align-top ml-1">SUBJECT HEAD</span>
              </span>
            )}
          </Link>
          
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden absolute right-4 text-yellow-200 hover:text-white z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <Link to="/subject-head/dashboard" className={navItemClass('/subject-head/dashboard')}>
            {location.pathname.includes('/subject-head/dashboard') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#EAB308] rounded-r-full"></div>}
            <LayoutDashboard className={`w-5 h-5 mr-4 ${location.pathname.includes('/subject-head/dashboard') ? 'text-[#EAB308]' : 'opacity-70'} shrink-0`} />
            {!sidebarCollapsed && <span className="whitespace-nowrap">Overview Dashboard</span>}
          </Link>

          <Link to="/subject-head/suspicious-cases" className={navItemClass('/subject-head/suspicious-cases')}>
            {location.pathname.includes('/subject-head/suspicious-cases') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#EAB308] rounded-r-full"></div>}
            <ShieldAlert className={`w-5 h-5 mr-4 ${location.pathname.includes('/subject-head/suspicious-cases') ? 'text-[#EAB308]' : 'opacity-70'} shrink-0`} />
            {!sidebarCollapsed && <span className="whitespace-nowrap">Suspicious AI Cases</span>}
            {!sidebarCollapsed && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>}
          </Link>

          <div className="pt-8 pb-2 relative flex items-center px-4">
            {!sidebarCollapsed ? (
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider w-full">Communication</p>
            ) : (
              <div className="w-5 h-[2px] bg-white/20 rounded-full"></div>
            )}
          </div>
          
          <Link to="/subject-head/messages" className={navItemClass('/subject-head/messages')}>
            {location.pathname.includes('/subject-head/messages') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#EAB308] rounded-r-full"></div>}
            <MessageCircle className={`w-5 h-5 mr-4 ${location.pathname.includes('/subject-head/messages') ? 'text-[#EAB308]' : 'opacity-70'} shrink-0`} />
            {!sidebarCollapsed && <span className="whitespace-nowrap">Messages</span>}
          </Link>

          <Link to="/subject-head/settings" className={navItemClass('/subject-head/settings')}>
            {location.pathname.includes('/subject-head/settings') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#EAB308] rounded-r-full"></div>}
            <Settings className={`w-5 h-5 mr-4 ${location.pathname.includes('/subject-head/settings') ? 'text-[#EAB308]' : 'opacity-70'} shrink-0`} />
            {!sidebarCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default SubjectHeadSidebar;
