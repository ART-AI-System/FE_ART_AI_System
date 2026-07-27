import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import LoginPage from './pages/auth/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerSubjects from './pages/lecturer/LecturerSubjects';
import LecturerSubjectDetail from './pages/lecturer/LecturerSubjectDetail';
import StudentLayout from './layouts/StudentLayout';
import LecturerLayout from './layouts/LecturerLayout';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentSubmission from './pages/student/StudentSubmission';
import StudentSubmitSuccess from './pages/student/StudentSubmitSuccess';
import StudentClassesPage from './pages/student/StudentClassesPage';
import StudentClassDetailPage from './pages/student/StudentClassDetailPage';
import StudentResultsView from './pages/student/StudentResultsView';
import LecturerGradingSubjects from './pages/lecturer/LecturerGradingSubjects';
import LecturerGradingList from './pages/lecturer/LecturerGradingList';
import LecturerGradingDetail from './pages/lecturer/LecturerGradingDetail';
import LecturerAssignmentCreate from './pages/lecturer/LecturerAssignmentCreate';
import LecturerSubmissionList from './pages/lecturer/LecturerSubmissionList';
import LecturerCreateTestPage from './pages/lecturer/LecturerCreateTestPage';
import LecturerEditSlotPage from './pages/lecturer/LecturerEditSlotPage';
import StudentTakeTestPage from './pages/student/StudentTakeTestPage';
import ClassGradebook from './pages/lecturer/ClassGradebook';
import StudentMessagesPage from './pages/student/StudentMessagesPage';
import LecturerMessagesPage from './pages/lecturer/LecturerMessagesPage';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSemesters from './pages/admin/AdminSemesters';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminClasses from './pages/admin/AdminClasses';

// Subject Head Pages
import SubjectHeadLayout from './layouts/SubjectHeadLayout';
import SubjectHeadDashboardPage from './pages/subjectHead/SubjectHeadDashboardPage';
import SuspiciousCasesPage from './pages/subjectHead/SuspiciousCasesPage';
import SubjectHeadMessagesPage from './pages/subjectHead/SubjectHeadMessagesPage';
import GradeReportsApprovalPage from './pages/subjectHead/GradeReportsApprovalPage';
import SubjectAnalyticsPage from './pages/subjectHead/SubjectAnalyticsPage';

import SettingsPage from './pages/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const roleHome: Record<string, string> = {
  STUDENT: '/student/home',
  LECTURER: '/lecturer/dashboard',
  ADMIN: '/admin/dashboard',
};

function RoleRoute({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm font-bold text-gray-500">Checking access...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const normalizedRole = user.role?.toUpperCase();
  if (!roles.includes(normalizedRole)) {
    return <Navigate to={roleHome[normalizedRole] || '/login'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Student Routes */}
      <Route path="/student" element={<RoleRoute roles={['STUDENT']}><StudentLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/student/home" replace />} />
        <Route path="home" element={<StudentDashboard />} />
        <Route path="subjects" element={<StudentClassesPage />} />
        <Route path="classes/:id" element={<StudentClassDetailPage />} />
        <Route path="schedule" element={<div className="text-xl font-bold">Schedule Page</div>} />
        
        <Route path="assignments">
          <Route index element={<StudentAssignments />} />
          <Route path=":assignmentId/submit" element={<StudentSubmission />} />
          <Route path=":assignmentId/test" element={<StudentTakeTestPage />} />
          <Route path="success" element={<StudentSubmitSuccess />} />
        </Route>
        
        <Route path="news" element={<div className="text-xl font-bold">News Page</div>} />
        <Route path="messages" element={<StudentMessagesPage />} />
        <Route path="results" element={<StudentResultsView />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Lecturer Routes */}
      <Route path="/lecturer" element={<RoleRoute roles={['LECTURER']}><LecturerLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/lecturer/dashboard" replace />} />
        <Route path="dashboard" element={<LecturerDashboard />} />
        <Route path="subjects" element={<LecturerSubjects />} />
        <Route path="subjects/:subjectId" element={<LecturerSubjectDetail />} />
        <Route path="assignments/create" element={<LecturerAssignmentCreate />} />
        <Route path="assignments/:assignmentId/edit" element={<LecturerAssignmentCreate />} />
        <Route path="tests/create" element={<LecturerCreateTestPage />} />
        <Route path="slots/:slotId/edit" element={<LecturerEditSlotPage />} />
        <Route path="assignments/:assignmentId/submissions" element={<LecturerSubmissionList />} />
        <Route path="classes/:classId/gradebook" element={<ClassGradebook />} />
        <Route path="grading" element={<LecturerGradingSubjects />} />
        <Route path="grading/:classId" element={<LecturerGradingList />} />
        <Route path="reports" element={<Navigate to="/lecturer/dashboard" replace />} />
        <Route path="news" element={<div className="text-xl font-bold">News Page</div>} />
        <Route path="messages" element={<LecturerMessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Lecturer Grading Detail (Full Screen) */}
      <Route path="/lecturer/grading/detail/:submissionId" element={<RoleRoute roles={['LECTURER']}><LecturerGradingDetail /></RoleRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<RoleRoute roles={['ADMIN']}><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<div className="text-xl font-bold p-6">Users Page</div>} />
        <Route path="students" element={<div className="text-xl font-bold p-6">Students Page</div>} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="semesters" element={<AdminSemesters />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Subject Head Routes */}
      <Route path="/subject-head" element={<SubjectHeadLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SubjectHeadDashboardPage />} />
        <Route path="grade-approvals" element={<GradeReportsApprovalPage />} />
        <Route path="suspicious-cases" element={<SuspiciousCasesPage />} />
        <Route path="subjects" element={<SubjectAnalyticsPage />} />
        <Route path="messages" element={<SubjectHeadMessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/headsubject/*" element={<Navigate to="/subject-head/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
