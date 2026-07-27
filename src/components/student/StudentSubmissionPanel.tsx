import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submissionService, type AiInteraction } from '../../services/submission.service';
import { classService } from '../../services/class.service';
import FileUploadSection from './FileUploadSection';
import AiDeclarationForm from './AiDeclarationForm';

interface Version {
  _id: string;
  versionNumber: number;
  fileName: string;
  createdAt: string;
}

interface StudentSubmissionPanelProps {
  assignment: any;
  submission: any;
  onRefresh: () => void;
}

const StudentSubmissionPanel: React.FC<StudentSubmissionPanelProps> = ({ assignment, submission, onRefresh }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [classData, setClassData] = useState<any>(null);
  const { user } = useAuth();
  const currentStudentId = user?.id || (user as any)?.studentId || (user as any)?._id || '';
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const [unavailableMembers, setUnavailableMembers] = useState<string[]>([]);
  
  // AI Interaction state from the form
  const [aiData, setAiData] = useState<any>({});

  const aiRequired = assignment?.aiInteractionRequired !== false; // assuming true by default or explicitly set
  const minAi = assignment?.minAiInteractions || 5;

  const status = submission?.status?.toUpperCase() || 'NOT_SUBMITTED';
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    if (status === 'GRADED' && submission?._id) {
      import('../../api/axiosClient').then((m) => {
        m.default.get(`/submissions/${submission._id}/grade`)
          .then((res: any) => setGradeResult(res.result || res.data?.result || res))
          .catch(console.error);
      });
    }
  }, [status, submission]);

  useEffect(() => {
    if (submission?._id) {
      submissionService.getSubmissionVersions(submission._id)
        .then((res: any) => setVersions(res.result || []))
        .catch(console.error);
        
      submissionService.getAiInteractions(submission._id)
        .then((res: any) => {
          const aiItems = res.result || res.data?.result || [];
          if (aiItems.length > 0) {
            setAiData(aiItems);
          }
        })
        .catch(console.error);
        
      if (submission.groupMembers && submission.groupMembers.length > 0) {
        setGroupMembers(submission.groupMembers.map((id: any) => typeof id === 'object' ? id._id || id : id));
      } else if (currentStudentId) {
        setGroupMembers(prev => prev.includes(currentStudentId) ? prev : [...prev, currentStudentId]);
      }
    } else if (currentStudentId) {
      setGroupMembers(prev => prev.includes(currentStudentId) ? prev : [...prev, currentStudentId]);
    }
  }, [submission, currentStudentId]);

  useEffect(() => {
    if (assignment?.classId) {
      classService.getClassById(assignment.classId).then((res) => setClassData(res)).catch(console.error);
    }
    if (assignment?.isGroupAssignment && assignment._id) {
      import('../../api/axiosClient').then((m) => {
        m.default.get(`/assignments/${assignment._id}/grouped-students`)
          .then((res: any) => setUnavailableMembers(res.result || res.data?.result || []))
          .catch(console.error);
      });
    }
  }, [assignment]);

  // If status becomes submitted/late, stop resubmitting mode
  useEffect(() => {
    if (status === 'SUBMITTED' || status === 'LATE') {
      setIsResubmitting(false);
    }
  }, [status]);

  const handleSaveDraft = async () => {
    if (!file && !submission) return;
    setIsUploading(true);
    setError('');
    try {
      if (file && !submission) {
        await submissionService.createSubmission(assignment._id, file, '', groupMembers);
      } else if (file && submission) {
        await submissionService.resubmitVersion(submission._id, file, '', groupMembers);
      } else if (!file && submission) {
        await submissionService.updateGroupMembers(submission._id, groupMembers);
      }
      onRefresh(); // Trigger parent to refetch
      alert('Draft saved successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalize = async (formData: any[]) => {
    setIsFinalizing(true);
    setError('');
    
    try {
      let currentSubmissionId = submission?._id;

      // 1. Upload or create new submission version
      if (!submission) {
        if (!file) throw new Error("Please upload a file first.");
        const res: any = await submissionService.createSubmission(assignment._id, file, '', groupMembers);
        currentSubmissionId = res?.result?._id || res?.data?.result?._id;
      } else {
        // If we have a submission, we create a new version (with or without a new file)
        const res: any = await submissionService.resubmitVersion(submission._id, file, '', groupMembers);
        currentSubmissionId = res?.result?._id || res?.data?.result?._id || currentSubmissionId;
      }
      
      if (!currentSubmissionId) {
        throw new Error("No submission found to finalize.");
      }

      // 2. Save AI Interactions
      if (formData && formData.length > 0) {
        await Promise.all(
          formData.map((interaction: any) => {
            return submissionService.createAiInteractions(currentSubmissionId, {
              aiTool: interaction.aiTool,
              usagePurpose: interaction.usagePurpose,
              promptContent: interaction.promptContent,
              aiResponseSummary: interaction.aiResponseSummary,
              studentDecision: interaction.studentDecision,
              reflectionText: interaction.reflectionText
            });
          })
        );
      }

      // 3. Finalize
      await submissionService.finalizeSubmission(currentSubmissionId);
      onRefresh();
      
      // Reset UI state to exit "Update mode"
      setIsResubmitting(false);
      setCurrentStep(1);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to finalize submission.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDownload = (versionId: string) => {
    submissionService.downloadSubmissionVersion(versionId).catch(console.error);
  };

  const handleDownloadLatest = () => {
    if (submission) {
      submissionService.downloadSubmissionLatest(submission._id).catch(console.error);
    }
  };

  const showForm = (status !== 'SUBMITTED' && status !== 'LATE' && status !== 'GRADED') || isResubmitting;

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-lg font-extrabold text-[#1B2559]">Submission Status</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          status === 'GRADED' ? 'bg-blue-100 text-blue-700' :
          status === 'SUBMITTED' ? 'bg-green-100 text-green-700' :
          status === 'LATE' ? 'bg-orange-100 text-orange-700' :
          status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
          'bg-gray-50 text-gray-400'
        }`}>
          {status}
        </span>
      </div>

      {showForm && (
        <div className="flex items-center space-x-2 absolute top-8 right-32 z-10">
          <button 
            onClick={() => setCurrentStep(1)}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep === 1 ? 'bg-[#4318FF] text-white shadow-md' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
            1
          </button>
          <div className={`w-10 h-0.5 ${currentStep === 2 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
          <button 
            onClick={() => {
              if (!file && !submission) {
                alert('Please upload a file first!');
                return;
              }
              setCurrentStep(2);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep === 2 ? 'bg-[#4318FF] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            2
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {showForm && (
        <div>
          <div className={currentStep === 1 ? 'block animate-fade-in' : 'hidden'}>
            <FileUploadSection onFileSelect={setFile} initialFileName={submission?.fileName} />
            
            {assignment?.isGroupAssignment && classData && classData.students && (
              <div className="mt-6 p-4 border border-gray-100 rounded-xl bg-gray-50/80">
                <h4 className="text-sm font-bold text-[#1B2559] mb-3">Group Members</h4>
                <p className="text-xs text-gray-500 mb-3">Select your group members. You are automatically selected as the representative submitter. Students already in a group cannot be selected.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
                  {(() => {
                    const trulyUnavailable = unavailableMembers.filter(id => {
                      if (!submission) return true;
                      if (submission.studentId === id || submission.studentId?._id === id) return false;
                      const initialMembers = submission.groupMembers || [];
                      return !initialMembers.some((m: any) => (m._id || m) === id);
                    });

                    return Array.from(new Map(classData.students.map((s: any) => [s.studentId, s])).values()).map((student: any) => {
                      const isCurrentUser = student.studentId === currentStudentId;
                      const isUnavailable = trulyUnavailable.includes(student.studentId) && !isCurrentUser;
                      
                      return (
                      <label key={student.studentId} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${isCurrentUser ? 'border-[#4318FF] bg-blue-50/30' : isUnavailable ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-[#4318FF] cursor-pointer'}`}>
                        <input 
                          type="checkbox" 
                          className="rounded text-[#4318FF] focus:ring-[#4318FF] w-4 h-4 disabled:opacity-50"
                          checked={isCurrentUser || groupMembers.includes(student.studentId)}
                          disabled={isCurrentUser || isUnavailable}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGroupMembers([...groupMembers, student.studentId]);
                            } else {
                              setGroupMembers(groupMembers.filter(id => id !== student.studentId));
                            }
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">
                            {student.fullName} {isCurrentUser && '(You)'} {isUnavailable && <span className="text-red-500 font-bold ml-1 text-[10px] uppercase">(Grouped)</span>}
                          </span>
                          <span className="text-xs text-gray-500">{student.studentCode}</span>
                        </div>
                      </label>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveDraft}
                disabled={isUploading || (!file && !submission)}
                className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 mr-4 disabled:opacity-50"
              >
                {isUploading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button 
                onClick={() => {
                  if (!file && !submission) {
                    alert('Please upload a file first!');
                    return;
                  }
                  setCurrentStep(2);
                }} 
                className="bg-gradient-to-br from-[#F26F21] to-[#F79C65] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-orange-200 hover:opacity-90 flex items-center"
              >
                Next: AI Declaration <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </button>
            </div>
          </div>
          
          <div className={currentStep === 2 ? 'block animate-fade-in' : 'hidden'}>
            <AiDeclarationForm 
              data={aiData}
              onChange={setAiData}
              handleSubmit={handleFinalize} 
              isSubmitting={isFinalizing} 
              aiDeclarationConfig={assignment?.aiDeclarationConfig}
            />
          </div>
        </div>
      )}

      {/* FINALIZED STATE */}
      {(status === 'SUBMITTED' || status === 'LATE' || status === 'GRADED') && !isResubmitting && (
        <div className="bg-green-50 rounded-2xl p-6 border border-green-100 mb-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-bold text-green-800 mb-1">
            {status === 'GRADED' ? 'Assignment Graded' : 'Submission Successful'}
          </h4>
          <p className="text-sm text-green-600 mb-6">
            {status === 'GRADED' 
              ? 'Your lecturer has graded this assignment.' 
              : 'Your assignment has been finalized and submitted to the lecturer.'}
          </p>
          
          {status === 'GRADED' && gradeResult && (
            <div className="w-full max-w-md bg-white rounded-xl border border-green-200 p-6 mb-6 text-left shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500 uppercase">Final Score</span>
                <span className="text-3xl font-extrabold text-[#4318FF]">{gradeResult.score} / {gradeResult.maxScore || 10}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-500 uppercase mb-2 block">Lecturer Feedback</span>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                  "{gradeResult.feedback || 'No additional feedback provided.'}"
                </p>
              </div>
            </div>
          )}

          {assignment?.isGroupAssignment && submission?.groupMembers?.length > 0 && classData?.students && (
            <div className="w-full max-w-md bg-white rounded-xl border border-green-200 p-4 mb-6 text-left shadow-sm">
              <span className="text-sm font-bold text-gray-500 uppercase mb-3 block border-b pb-2">Group Members</span>
              <ul className="space-y-2">
                {submission.groupMembers.map((memberId: string | any) => {
                  const idStr = typeof memberId === 'object' ? memberId._id || memberId.studentId : memberId;
                  const studentInfo = classData.students.find((s: any) => s.studentId === idStr);
                  const isSubmitter = idStr === (submission.studentId?._id || submission.studentId);
                  return (
                    <li key={idStr} className="text-sm font-medium text-gray-700 flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className={`w-2 h-2 rounded-full mr-3 ${isSubmitter ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      <span className="font-bold">{studentInfo ? studentInfo.fullName : 'Unknown Student'}</span>
                      <span className="text-xs text-gray-400 ml-2">({studentInfo?.studentCode || 'N/A'})</span>
                      {isSubmitter && <span className="ml-auto text-[10px] font-black uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Submitter</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button 
              onClick={handleDownloadLatest}
              className="flex items-center px-6 py-2.5 bg-white border border-green-200 text-green-700 rounded-xl text-sm font-bold hover:bg-green-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" /> Download Final File
            </button>
            {status !== 'GRADED' && (
              <button 
                onClick={() => {
                  setIsResubmitting(true);
                  setCurrentStep(1);
                }}
                className="flex items-center px-6 py-2.5 bg-[#1B2559] text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Update Submission
              </button>
            )}
          </div>
        </div>
      )}

      {/* VERSION HISTORY */}
      {versions.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h4 className="text-md font-bold text-[#1B2559] mb-4">Version History</h4>
          <div className="space-y-3">
            {versions.map((ver) => (
              <div key={ver._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-800">Version {ver.versionNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(ver.createdAt).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => handleDownload(ver._id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download Version"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentSubmissionPanel;
