import React from 'react';
import { Menu, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';

interface LecturerTopbarProps {
  setMobileSidebarOpen: (val: boolean) => void;
  breadcrumbs: string[];
  title: string;
}

const LecturerTopbar: React.FC<LecturerTopbarProps> = ({ setMobileSidebarOpen, breadcrumbs, title }) => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shrink-0 lg:hidden">
      <div className="flex items-center">
        <button 
          onClick={() => setMobileSidebarOpen(true)}
          className="mr-4 p-2 text-gray-500 hover:text-[#F26F21] transition-colors rounded-lg hover:bg-white lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      {/* Header Actions (Empty for now, can be populated by context or generic actions) */}
      <div className="flex items-center space-x-3">
        {/* Actions could go here */}
      </div>
    </header>
  );
};

export default LecturerTopbar;
