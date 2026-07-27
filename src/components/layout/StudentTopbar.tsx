import React, { useState, useEffect } from 'react';
import { Menu, Search, CalendarDays, ChevronDown, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { semesterService } from '../../services/semester.service';

interface StudentTopbarProps {
  setMobileSidebarOpen: (val: boolean) => void;
}

const StudentTopbar: React.FC<StudentTopbarProps> = ({ setMobileSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [currentSemesterId, setCurrentSemesterId] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#F4F7FE] flex items-center justify-between px-4 sticky top-0 z-10 shrink-0 lg:hidden">
      <button 
        onClick={() => setMobileSidebarOpen(true)}
        className="p-2 text-gray-500 hover:text-[#4318FF] transition-colors rounded-lg hover:bg-white"
      >
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
};

export default StudentTopbar;
