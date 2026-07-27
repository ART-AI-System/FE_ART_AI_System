import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { semesterService } from '../../services/semester.service';

export const LecturerHeader = () => {
  const location = useLocation();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [currentSemesterId, setCurrentSemesterId] = useState('');
  
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const [semestersList, currentSem] = await Promise.all([
          semesterService.getSemesters(),
          semesterService.getCurrentSemester()
        ]);
        setSemesters(semestersList);
        if (currentSem) setCurrentSemesterId(currentSem._id);
      } catch (error) {
        console.error("Failed to load semesters for header", error);
      }
    };
    fetchSemesters();
  }, []);

  if (location.pathname === ROUTES.DASHBOARD_LECTURER) {
    // Keep it empty, we don't render title anymore
  } else if (location.pathname === ROUTES.CLASSES) {
    // Keep it empty, we don't render title anymore
  } else if (location.pathname === ROUTES.GRADING_SUBJECTS) {
    // Keep it empty, we don't render title anymore
  } else if (location.pathname === ROUTES.NEWS) {
    // Keep it empty, we don't render title anymore
  } else {
    // Hide default header for all other Lecturer pages (they use custom edge-to-edge headers)
    return null;
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-10 sticky top-0 z-10 shrink-0">
      
      <div className="flex items-center space-x-6">

        <NotificationDropdown />

        <div className="flex items-center pl-6 border-l border-gray-200 gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-[#1B2559]">Dr. Nguyen Van A</p>
            <p className="text-xs font-medium text-gray-500">Lecturer</p>
          </div>
          <img src="https://ui-avatars.com/api/?name=Lecturer&background=f97316&color=fff" className="w-10 h-10 rounded-full shadow-md cursor-pointer border-2 border-white" alt="Avatar" />
        </div>
      </div>
    </header>
  );
};

export default LecturerHeader;
