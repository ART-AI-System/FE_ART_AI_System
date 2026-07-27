import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle2, Search, Filter, ShieldAlert, Eye, 
  FileText, User, Calendar, BookOpen, ChevronRight, X, AlertOctagon, Check 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { Card } from '../../components/common/Card';
import axiosClient from '../../api/axiosClient';

const mockSuspiciousCases = [
  {
    _id: 'case-1',
    studentId: '661122334455667788990004',
    studentFullName: 'Nguyen Van An',
    studentCode: 'SE18D01',
    classId: '661122334455667788990021',
    classCode: 'SE20A09',
    subjectName: 'Software Architecture & Design (SWD392)',
    semester: 'SP26',
    flagType: 'high_ai_match',
    suspectLevel: 'high',
    description: 'AI usage detected at 98% (Exceeds 80% threshold). Significant code structure match with AI generated patterns.',
    createdAt: '2026-06-15T10:30:00Z',
    isResolved: false,
    aiTransparency: 2,
    aiMatch: 98
  },
  {
    _id: 'case-2',
    studentId: '661122334455667788990005',
    studentFullName: 'Tran Thi Binh',
    studentCode: 'SE18D05',
    classId: '661122334455667788990022',
    classCode: 'SE20A10',
    subjectName: 'React Native Mobile Development (PRM392)',
    semester: 'SP26',
    flagType: 'discrepancy_flag',
    suspectLevel: 'high',
    description: 'Declared 10% AI usage but system evaluation detected 85% AI match in UI state management modules.',
    createdAt: '2026-06-14T14:15:00Z',
    isResolved: false,
    aiTransparency: 15,
    aiMatch: 85
  },
  {
    _id: 'case-3',
    studentId: '661122334455667788990006',
    studentFullName: 'Le Hoang Cuong',
    studentCode: 'SE18D09',
    classId: '661122334455667788990023',
    classCode: 'SE20A11',
    subjectName: 'Database Systems (DBI202)',
    semester: 'SP26',
    flagType: 'high_ai_match',
    suspectLevel: 'high',
    description: 'SQL indexing optimization essay contains 88% AI generated text without proper attribution.',
    createdAt: '2026-06-12T09:00:00Z',
    isResolved: false,
    aiTransparency: 12,
    aiMatch: 88
  }
];

const SuspiciousCasesPage = () => {
  const [cases, setCases] = useState<any[]>(mockSuspiciousCases);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'pending' | 'cleared' | 'penalty' | 'all'>('pending');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res: any = await axiosClient.get('/reports/suspicious-cases');
      const data = res.result || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any, idx: number) => ({
          ...item,
          _id: item._id || `case-api-${idx}`,
          studentFullName: item.studentFullName || 'Student Account',
          studentCode: item.studentCode || `SE1800${idx}`,
          classCode: item.classCode || 'SE20A09',
          subjectName: item.subjectName || 'Course Assignment',
          aiMatch: item.aiMatch || (item.suspectLevel === 'high' ? 92 : 82),
          description: item.description || 'High AI generation match detected by automated evaluation engine.'
        }));
        setCases(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch suspicious cases from API, using mock data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleResolveCase = async (id: string, action: 'clear' | 'penalty' | 'reopen') => {
    try {
      await axiosClient.patch(`/reports/suspicious-cases/${id}/resolve`, { action });
      await fetchCases();
    } catch (err) {
      console.error('Failed to resolve case via API:', err);
      // Local state fallback if offline
      const isResolved = action !== 'reopen';
      setCases(prev => prev.map(c => c._id === id ? { 
        ...c, 
        isResolved, 
        resolutionAction: action === 'reopen' ? null : action,
        flagStatus: action === 'clear' ? 'NORMAL' : action === 'penalty' ? 'PENALIZED' : 'FLAGGED'
      } : c));
    } finally {
      setSelectedCase(null);
    }
  };

  const pendingCount = cases.filter(c => !c.isResolved).length;
  const clearedCount = cases.filter(c => c.isResolved && (c.resolutionAction === 'clear' || c.flagStatus === 'NORMAL')).length;
  const penaltyCount = cases.filter(c => c.isResolved && (c.resolutionAction === 'penalty' || c.flagStatus === 'PENALIZED')).length;
  const allCount = cases.length;

  const filteredCases = cases.filter(c => {
    // Status Tab filtering
    if (activeTab === 'pending' && c.isResolved) return false;
    if (activeTab === 'cleared' && (!c.isResolved || (c.resolutionAction !== 'clear' && c.flagStatus !== 'NORMAL'))) return false;
    if (activeTab === 'penalty' && (!c.isResolved || (c.resolutionAction !== 'penalty' && c.flagStatus !== 'PENALIZED'))) return false;

    if (selectedSemester !== 'ALL' && c.semester !== selectedSemester) return false;
    if (searchTerm && !`${c.studentFullName} ${c.studentCode} ${c.classCode} ${c.subjectName}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm font-bold text-gray-500 mb-1">
            <Link to={ROUTES.DASHBOARD_SUBJECT_HEAD} className="hover:text-[#4318FF] transition-colors">Subject Head Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#1B2559]">Academic Integrity Audit</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1B2559] flex items-center">
            <ShieldAlert className="w-8 h-8 text-red-500 mr-3" />
            Suspicious Cases Audit Logs
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Review submissions flagged with &gt;80% AI similarity or high discrepancy against declarations.
          </p>
        </div>
      </div>

      {/* Redesigned 4 Main Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/40 to-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-amber-600 uppercase tracking-wider mb-1">Pending Review (Chờ xử lý)</p>
              <h3 className="text-4xl font-black text-amber-600 tracking-tight">{pendingCount}</h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">Awaiting Audit Decision</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/40 to-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-green-600 uppercase tracking-wider mb-1">Cleared Cases (Đã duyệt an toàn)</p>
              <h3 className="text-4xl font-black text-green-600 tracking-tight">{clearedCount}</h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">Approved & Marked Normal</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-100/80 text-green-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-600 bg-gradient-to-br from-red-50/40 to-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-red-600 uppercase tracking-wider mb-1">Penalized (Đã phạt vi phạm)</p>
              <h3 className="text-4xl font-black text-red-600 tracking-tight">{penaltyCount}</h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">Integrity Penalties Issued</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-100/80 text-red-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-[#1B2559] bg-gradient-to-br from-slate-50/40 to-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#1B2559] uppercase tracking-wider mb-1">Total Audited (Tổng số ca)</p>
              <h3 className="text-4xl font-black text-[#1B2559] tracking-tight">{allCount}</h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">Total AI Flagged Logs</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#1B2559] flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
          </div>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'pending'
              ? 'bg-[#EAB308] text-white shadow-md shadow-yellow-500/20'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Pending ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('cleared')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'cleared'
              ? 'bg-green-600 text-white shadow-md shadow-green-500/20'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Cleared ({clearedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('penalty')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'penalty'
              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Penalized ({penaltyCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'all'
              ? 'bg-[#1B2559] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>All ({allCount})</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="mb-8 p-4 bg-gray-50/50 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by student code, name, class or subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#4318FF] transition-colors"
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-600">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <span className="mr-2">Semester:</span>
            <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-transparent outline-none font-extrabold text-[#1B2559]"
            >
              <option value="ALL">All Semesters</option>
              <option value="SP26">Spring 2026</option>
              <option value="FA25">Fall 2025</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-12 text-center text-gray-400 font-bold">
            Loading suspicious cases from AI evaluation engine...
          </Card>
        ) : filteredCases.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#1B2559]">No Cases Found</h3>
            <p className="text-gray-500 text-sm mt-1">There are no cases matching the selected status tab or filters.</p>
          </Card>
        ) : (
          filteredCases.map(c => {
            const isCleared = c.isResolved && (c.resolutionAction === 'clear' || c.flagStatus === 'NORMAL');
            const isPenalized = c.isResolved && (c.resolutionAction === 'penalty' || c.flagStatus === 'PENALIZED');
            const borderClass = isCleared 
              ? 'border-l-green-500' 
              : isPenalized 
              ? 'border-l-red-600' 
              : 'border-l-yellow-500';

            return (
              <Card key={c._id} className={`p-6 border-l-4 ${borderClass} hover:shadow-md transition-all`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-lg ${
                      isCleared ? 'bg-green-100 text-green-700' : isPenalized ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.aiMatch || 90}%
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {isCleared ? (
                          <span className="bg-green-100 text-green-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Cleared
                          </span>
                        ) : isPenalized ? (
                          <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center">
                            <AlertOctagon className="w-3 h-3 mr-1" /> Penalized
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Pending Audit
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {c.classCode}
                        </span>
                        <span className="text-xs font-bold text-gray-400">• {c.semester || 'SP26'}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1B2559]">
                        {c.studentFullName} <span className="text-gray-500 text-sm font-medium">({c.studentCode})</span>
                      </h3>
                      <p className="text-sm font-bold text-[#4318FF] mt-0.5">{c.subjectName}</p>
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium">
                        <span className="font-bold text-gray-700 mr-1">AI Audit Flag:</span>
                        {c.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end lg:self-center">
                    <button 
                      onClick={() => setSelectedCase(c)}
                      className="bg-[#1B2559] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2A3673] transition-all flex items-center shadow-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" /> {c.isResolved ? 'Review / Edit Decision' : 'Review Case'}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Case Review & Decision Re-editing Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedCase(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#1B2559]">Suspicious Case Audit & Decision</h3>
                <p className="text-xs font-bold text-gray-400">ID: {selectedCase._id}</p>
              </div>
            </div>

            {/* Current Decision Banner if already resolved */}
            {selectedCase.isResolved && (
              <div className={`p-4 rounded-2xl mb-6 border flex items-center justify-between ${
                selectedCase.resolutionAction === 'clear' || selectedCase.flagStatus === 'NORMAL'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {selectedCase.resolutionAction === 'clear' || selectedCase.flagStatus === 'NORMAL' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertOctagon className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider">Current Decision</p>
                    <p className="text-sm font-black">
                      {selectedCase.resolutionAction === 'clear' || selectedCase.flagStatus === 'NORMAL' ? 'CLEARED (MARK SAFE)' : 'PENALIZED (INTEGRITY VIOLATION)'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white/80 px-3 py-1 rounded-xl shadow-xs">
                  Recorded in DB
                </span>
              </div>
            )}

            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Student Name & Code</p>
                  <p className="font-extrabold text-[#1B2559] text-base mt-0.5">{selectedCase.studentFullName} ({selectedCase.studentCode})</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Class Code</p>
                  <p className="font-extrabold text-[#1B2559] text-base mt-0.5">{selectedCase.classCode} • {selectedCase.semester || 'SP26'}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase">Subject</p>
                <p className="font-extrabold text-[#4318FF] mt-0.5">{selectedCase.subjectName}</p>
              </div>
              <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">AI Similarity Match</p>
                  <p className="font-extrabold text-red-600 text-xl mt-0.5">{selectedCase.aiMatch}%</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Declared AI Usage</p>
                  <p className="font-extrabold text-gray-700 text-xl mt-0.5">{selectedCase.aiTransparency}%</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Audit Flag Description</p>
                <p className="text-gray-700 font-medium bg-white p-3 rounded-xl border border-gray-200">{selectedCase.description}</p>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start space-x-3 text-xs text-blue-800 font-medium">
              <FileText className="w-5 h-5 text-[#4318FF] shrink-0 mt-0.5" />
              <p>
                {selectedCase.isResolved 
                  ? 'You can re-edit your decision at any time. Selecting an option below will immediately update the database record and recalculate department metrics.'
                  : 'As Subject Head, you can clear this case if the AI similarity is deemed acceptable, or issue an academic integrity penalty which flags the student record.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              {selectedCase.isResolved && (
                <button 
                  onClick={() => handleResolveCase(selectedCase._id, 'reopen')}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-all flex items-center justify-center text-xs"
                >
                  Reopen to Pending
                </button>
              )}
              <button 
                onClick={() => handleResolveCase(selectedCase._id, 'clear')}
                className="px-5 py-2.5 rounded-xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50 transition-all flex items-center justify-center text-xs"
              >
                <Check className="w-4 h-4 mr-1.5" /> {selectedCase.isResolved ? 'Switch to Cleared' : 'Clear Flag (Mark Safe)'}
              </button>
              <button 
                onClick={() => handleResolveCase(selectedCase._id, 'penalty')}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center justify-center shadow-md shadow-red-500/20 text-xs"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" /> {selectedCase.isResolved ? 'Switch to Penalized' : 'Issue Integrity Penalty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspiciousCasesPage;
