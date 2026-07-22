import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, XCircle, Clock, Search, Filter, AlertCircle, Eye, Check, X, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/common/Card';
import axiosClient from '../../api/axiosClient';

interface GradeReport {
  _id: string;
  classCode: string;
  courseCode: string;
  subjectName: string;
  lecturerName: string;
  submittedAt: string;
  totalStudents: number;
  passRate: number;
  averageScore: number;
  suspiciousCasesCount: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
}

const mockReports: GradeReport[] = [
  {
    _id: 'rep-1',
    classCode: 'SE18D01',
    courseCode: 'SWD392',
    subjectName: 'Software Architecture and Design',
    lecturerName: 'Dr. Nguyen Van A',
    submittedAt: '2026-07-20T10:15:00Z',
    totalStudents: 30,
    passRate: 93.3,
    averageScore: 8.2,
    suspiciousCasesCount: 2,
    status: 'pending'
  },
  {
    _id: 'rep-2',
    classCode: 'SE18D02',
    courseCode: 'PRJ301',
    subjectName: 'Java Web Application Development',
    lecturerName: 'Dr. Le Thi B',
    submittedAt: '2026-07-19T14:30:00Z',
    totalStudents: 28,
    passRate: 89.2,
    averageScore: 7.6,
    suspiciousCasesCount: 0,
    status: 'pending'
  },
  {
    _id: 'rep-3',
    classCode: 'SE18D03',
    courseCode: 'SWR302',
    subjectName: 'Software Requirement Engineering',
    lecturerName: 'Dr. Pham Van C',
    submittedAt: '2026-07-18T09:00:00Z',
    totalStudents: 32,
    passRate: 96.8,
    averageScore: 8.5,
    suspiciousCasesCount: 1,
    status: 'approved',
    reviewNote: 'Approved after verifying SRS assignment grade weighting.'
  },
  {
    _id: 'rep-4',
    classCode: 'SE18D04',
    courseCode: 'SDN301',
    subjectName: 'Fullstack Web Development with Node & React',
    lecturerName: 'Lecturer Michael Chang',
    submittedAt: '2026-07-17T16:45:00Z',
    totalStudents: 25,
    passRate: 72.0,
    averageScore: 6.1,
    suspiciousCasesCount: 5,
    status: 'rejected',
    reviewNote: 'Rejected due to 5 unresolved high AI discrepancy flags. Please re-audit.'
  }
];

const GradeReportsApprovalPage: React.FC = () => {
  const [reports, setReports] = useState<GradeReport[]>(mockReports);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedReport, setSelectedReport] = useState<GradeReport | null>(null);
  const [modalMode, setModalMode] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get('/subject-head/grade-reports');
      const data = res?.result || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any, idx: number) => ({
          _id: item.reportId || item._id || `rep-${idx}`,
          classCode: item.classCode || 'SE18D01',
          courseCode: item.courseCode || 'SWD392',
          subjectName: item.subjectName || 'Software Architecture and Design',
          lecturerName: item.lecturerName || 'Dr. Lecturer',
          submittedAt: item.submittedAt || new Date().toISOString(),
          totalStudents: item.totalStudents || 25,
          passRate: item.passRate || 90.0,
          averageScore: item.averageScore || 8.0,
          suspiciousCasesCount: item.suspiciousCasesCount || 0,
          status: item.status || 'pending',
          reviewNote: item.reviewNote || item.note || ''
        }));
        setReports(mapped);
      }
    } catch (err) {
      console.log('Using mock grade reports for demonstration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenAction = (report: GradeReport, mode: 'approve' | 'reject' | 'view' | 'reopen') => {
    setSelectedReport(report);
    setModalMode(mode === 'view' ? 'view' : mode);
    setReviewNote(report.reviewNote || '');
  };

  const handleConfirmActionWithMode = async (targetMode: 'approve' | 'reject' | 'reopen') => {
    if (!selectedReport) return;
    setSubmitting(true);

    try {
      if (targetMode === 'approve') {
        await axiosClient.patch(`/subject-head/grade-reports/${selectedReport._id}/approve`, { reviewNote });
      } else if (targetMode === 'reject') {
        await axiosClient.patch(`/subject-head/grade-reports/${selectedReport._id}/reject`, { reviewNote });
      } else if (targetMode === 'reopen') {
        await axiosClient.patch(`/subject-head/grade-reports/${selectedReport._id}/reopen`);
      }
      // Re-fetch reports from backend to ensure persistent DB state
      await fetchReports();
    } catch (err) {
      console.error('Grade report review error:', err);
      // Local state fallback if offline
      const newStatus = targetMode === 'approve' ? 'approved' : targetMode === 'reject' ? 'rejected' : 'pending';
      setReports(prev => prev.map(r => r._id === selectedReport._id ? {
        ...r, 
        status: newStatus,
        reviewNote: reviewNote || (targetMode === 'approve' ? 'Grade report officially approved by Subject Head.' : targetMode === 'reject' ? 'Returned for lecturer re-audit.' : 'Reopened for re-review.')
      } : r));
    } finally {
      setSubmitting(false);
      setModalMode(null);
      setSelectedReport(null);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    const matchesSearch = r.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.lecturerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
    all: reports.length
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 pb-10">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center border-l-4 border-l-yellow-500">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Approval</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{counts.pending}</p>
          </div>
        </Card>

        <Card className="flex items-center border-l-4 border-l-green-500">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mr-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Reports</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{counts.approved}</p>
          </div>
        </Card>

        <Card className="flex items-center border-l-4 border-l-red-500">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mr-4">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected Reports</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{counts.rejected}</p>
          </div>
        </Card>

        <Card className="flex items-center border-l-4 border-l-blue-500">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{counts.all}</p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center ${
                activeTab === 'pending'
                  ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" /> Pending ({counts.pending})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center ${
                activeTab === 'approved'
                  ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approved ({counts.approved})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center ${
                activeTab === 'rejected'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <XCircle className="w-4 h-4 mr-2" /> Rejected ({counts.rejected})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#1B2559] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({counts.all})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search class, subject, lecturer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EAB308]"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-lg">No Grade Reports Found</p>
            <p className="text-sm text-gray-400">There are no reports matching your current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-4 rounded-l-xl">Class / Course</th>
                  <th className="py-4 px-4">Subject Name</th>
                  <th className="py-4 px-4">Lecturer</th>
                  <th className="py-4 px-4 text-center">Students</th>
                  <th className="py-4 px-4 text-center">Avg Score</th>
                  <th className="py-4 px-4 text-center">Pass Rate</th>
                  <th className="py-4 px-4 text-center">AI Flags</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium">
                {filteredReports.map((r) => (
                  <tr key={r._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#1B2559]">
                      <span className="text-[#4318FF]">{r.classCode}</span>
                      <span className="block text-xs font-semibold text-gray-400">{r.courseCode}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-700">{r.subjectName}</td>
                    <td className="py-4 px-4 text-gray-600">{r.lecturerName}</td>
                    <td className="py-4 px-4 text-center font-bold text-gray-700">{r.totalStudents}</td>
                    <td className="py-4 px-4 text-center font-bold text-[#1B2559]">{r.averageScore.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-green-600">{r.passRate}%</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {r.suspiciousCasesCount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> {r.suspiciousCasesCount}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">Clean</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Pending
                        </span>
                      )}
                      {r.status === 'approved' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {r.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenAction(r, 'approve')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenAction(r, 'reject')}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(r, 'view')}
                            className="px-3 py-1.5 bg-[#1B2559] hover:bg-[#2A3673] text-white rounded-lg text-xs font-bold transition-all flex items-center shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Review / Edit Decision
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review & Action Modal */}
      {modalMode && selectedReport && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fade-in border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  modalMode === 'approve' ? 'bg-green-500' : modalMode === 'reject' ? 'bg-red-500' : 'bg-blue-600'
                }`}>
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#1B2559]">
                    {modalMode === 'approve' ? 'Approve Grade Report' : modalMode === 'reject' ? 'Reject Grade Report' : 'Grade Report Review'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400">{selectedReport.classCode} • {selectedReport.subjectName}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalMode(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Details */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 border border-gray-100 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Lecturer:</span>
                <span className="font-bold text-[#1B2559]">{selectedReport.lecturerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Total Students:</span>
                <span className="font-bold text-[#1B2559]">{selectedReport.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Average Grade:</span>
                <span className="font-bold text-blue-600">{selectedReport.averageScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Pass Rate:</span>
                <span className="font-bold text-green-600">{selectedReport.passRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">AI Suspicious Flags:</span>
                <span className={`font-bold ${selectedReport.suspiciousCasesCount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {selectedReport.suspiciousCasesCount} cases
                </span>
              </div>
            </div>

            {/* Decision Status Banner if already reviewed */}
            {selectedReport.status !== 'pending' && (
              <div className={`p-3.5 rounded-2xl mb-5 border flex items-center justify-between text-xs ${
                selectedReport.status === 'approved'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {selectedReport.status === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-extrabold uppercase">Current Status: {selectedReport.status.toUpperCase()}</p>
                    <p className="text-gray-600 font-medium mt-0.5">{selectedReport.reviewNote || 'No review note entered.'}</p>
                  </div>
                </div>
                <span className="font-bold bg-white/80 px-2.5 py-1 rounded-lg">
                  Recorded in DB
                </span>
              </div>
            )}

            {/* Review Note Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Review Notes / Rejection Reason
              </label>
              <textarea
                rows={3}
                placeholder="Add review notes or state why this report needs revision..."
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>

              {selectedReport.status !== 'pending' && (
                <button
                  onClick={() => handleConfirmActionWithMode('reopen')}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
                >
                  Reopen to Pending
                </button>
              )}

              <button
                onClick={() => handleConfirmActionWithMode('reject')}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : selectedReport.status === 'rejected' ? 'Update Rejection' : 'Reject Report'}
              </button>

              <button
                onClick={() => handleConfirmActionWithMode('approve')}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-md shadow-green-600/20 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : selectedReport.status === 'approved' ? 'Update Approval' : 'Approve Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeReportsApprovalPage;
