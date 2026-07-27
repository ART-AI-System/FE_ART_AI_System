import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Send, ChevronRight, Sparkles } from 'lucide-react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import SubmissionFileViewer from '../../components/lecturer/SubmissionFileViewer';
import EvaluationPanel from '../../components/lecturer/EvaluationPanel';
import axiosClient from '../../api/axiosClient';
import { gradeService } from '../../services/grade.service';
import { reviewService } from '../../services/review.service';

const LecturerGradingDetail: React.FC = () => {
  const { submissionId: id } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetStudentId = searchParams.get('studentId') || undefined;
  
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: '',
    reviewStatus: 'pending',
    reviewComment: '',
    rubricScores: [] as Array<{ criterionId: string; name: string; score: number; maxPoints: number; comment?: string }>,
    aiAdvisoryRunId: undefined as string | undefined,
    lecturerAdjustmentReason: ''
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [gradeItem, setGradeItem] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const subRes: any = await axiosClient.get(`/submissions/${id}`);
        const subData = subRes.result || subRes.data || subRes;
        setSubmission(subData);

        if (subData?.gradeItemId) {
          try {
            const gradeItemRes: any = await axiosClient.get(`/grade-items/standalone/${subData.gradeItemId}`);
            setGradeItem(gradeItemRes.result || gradeItemRes.data || gradeItemRes);
          } catch (e) {
            console.error('Failed to load grade item', e);
          }
        }

        if (targetStudentId) {
          try {
            const stRes: any = await axiosClient.get(`/users/${targetStudentId}`);
            setStudent(stRes.result || stRes.data || stRes);
          } catch (e) {
            console.error('Failed to load specific student info', e);
          }
        } else if (subData?.studentId) {
          if (typeof subData.studentId === 'object' && subData.studentId.fullName) {
            setStudent(subData.studentId);
          } else {
            try {
              const stRes: any = await axiosClient.get(`/users/${subData.studentId}`);
              setStudent(stRes.result || stRes.data || stRes);
            } catch (e) {
              console.error('Failed to load student info', e);
            }
          }
        }

        try {
          const aiRes: any = await axiosClient.get(`/submissions/${id}/ai-evaluation`);
          setAiEvaluation(aiRes.result || aiRes.data || aiRes);
        } catch (e) {
          console.error('Failed to load ai evaluation', e);
        }
      } catch (err) {
        console.error('Failed to load submission detail', err);
      }
    };
    fetchData();
  }, [id]);

  const handlePublishGrade = async () => {
    if (gradeData.reviewStatus === 'pending') {
      alert('Please choose a lecturer review status before publishing the final grade.');
      return;
    }
    if ((submission?.gradeItemId?.rubric || []).length > 0 && gradeData.rubricScores.length === 0) {
      alert('Please score every academic rubric criterion before publishing.');
      return;
    }
    setIsPublishing(true);
    try {
      if (id && submission) {
        await reviewService.createReview(id, {
          reviewStatus: gradeData.reviewStatus as 'pending' | 'reviewed' | 'needs_revision' | 'flagged',
          comment: gradeData.reviewComment
        });
        await gradeService.createGrade(id, {
          score: Number(gradeData.score),
          maxScore: submission?.gradeItemId?.maxScore || 10,
          feedback: gradeData.feedback,
          studentId: targetStudentId,
          rubricScores: gradeData.rubricScores,
          aiAdvisoryRunId: gradeData.aiAdvisoryRunId,
          lecturerAdjustmentReason: gradeData.lecturerAdjustmentReason
        });
      }
      alert('Your lecturer-authored grade and review were published successfully.');
      navigate(-1);
    } catch (err) {
      console.error('Failed to publish grade', err);
      alert('Failed to publish grade and review');
    } finally {
      setIsPublishing(false);
    }
  };

  const isFlagged = aiEvaluation?.riskLevel === 'high';
  const dependencyScore = aiEvaluation?.aiDependencyScore;

  const isTest = gradeItem?.type === 'test';
  
  const getTestScore = () => {
    if (!isTest || !submission?.note || !gradeItem?.questions) return 0;
    try {
      const answers = JSON.parse(submission.note);
      let score = 0;
      gradeItem.questions.forEach((q: any) => {
        const selectedOptionId = answers[q._id];
        const correctOption = q.options.find((o: any) => o.isCorrect);
        if (correctOption && selectedOptionId === correctOption._id) {
          score += q.points;
        }
      });
      return score;
    } catch {
      return 0;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-inter animate-fade-in absolute inset-0 z-50">
      {/* TOP HEADER (Compact) */}
      <header className="h-16 bg-[#1B2559] text-white flex items-center justify-between px-6 shrink-0 shadow-md relative z-20">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 mr-4 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">
              <Link to="/lecturer/grading" className="hover:text-white transition-colors">Grading</Link>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="hover:text-white transition-colors">{submission?.courseCode || 'Course'}</span>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="hover:text-white transition-colors">{submission?.classCode || 'Class'} ({submission?.gradeItemName || 'Grade Item'})</span>
            </div>
            <h1 className="text-sm font-bold">{student ? `${student.fullName || student.username} (${student.studentCode || student.email || 'N/A'})` : 'Loading Student...'}</h1>
          </div>
          
          {isFlagged ? (
            <div className="ml-6 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full flex items-center">
              <AlertTriangle className="w-3 h-3 text-red-400 mr-2" />
              <span className="text-xs font-bold text-red-200">High AI-transparency risk ({dependencyScore ?? 'N/A'} dependency score)</span>
            </div>
          ) : (
            <div className="ml-6 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              <span className="text-xs font-bold text-green-200">
                {aiEvaluation ? `${aiEvaluation.riskLevel || 'low'} AI-transparency risk` : 'AI transparency not evaluated'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {isTest ? (
            <button 
              onClick={async () => {
                if (window.confirm('Are you sure you want to allow this student to retake the test? Their current submission will be permanently deleted.')) {
                  try {
                    await axiosClient.delete(`/submissions/${id}`);
                    alert('Submission deleted. Student can now retake the test.');
                    navigate(-1);
                  } catch (e) {
                    console.error('Failed to allow retake', e);
                    alert('Failed to delete submission.');
                  }
                }
              }}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-all flex items-center"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Allow Retake
            </button>
          ) : (
            <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-all flex items-center">
              <RefreshCcw className="w-4 h-4 mr-2" /> Request Resubmit
            </button>
          )}
          <button className="px-4 py-2 bg-white/10 text-white border border-white/20 text-xs font-bold rounded-lg hover:bg-white/20 transition-all flex items-center">
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </button>
          <button 
            onClick={handlePublishGrade}
            disabled={isPublishing}
            className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-lg flex items-center ${isPublishing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F26F21] hover:bg-[#D95D1A] shadow-orange-500/30'}`}
          >
            <Send className="w-4 h-4 mr-2" /> {isPublishing ? 'Publishing...' : 'Publish Grade'}
          </button>
        </div>
      </header>

      {/* SPLIT VIEW CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: FILE VIEWER OR TEST SCORE */}
        {isTest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white border-r border-gray-200">
            <h2 className="text-2xl font-bold text-[#1B2559] mb-4">Test Auto-Graded Score</h2>
            <div className="w-40 h-40 rounded-full border-[10px] border-green-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
              <span className="text-5xl font-extrabold text-green-600">{getTestScore()}</span>
            </div>
            <p className="text-gray-500 font-medium text-lg">Total Points: {gradeItem?.totalPoints || 10}</p>
          </div>
        ) : (
          <SubmissionFileViewer submissionId={id || ''} submissionInfo={submission} />
        )}

        {/* RIGHT PANE: EVALUATION PANEL */}
        <EvaluationPanel
          submissionId={id || ''}
          aiEvaluation={aiEvaluation}
          maxScore={submission?.gradeItemId?.maxScore || 10}
          rubric={submission?.gradeItemId?.rubric || []}
          onChange={(data) => setGradeData(data)}
        />
      </div>
    </div>
  );
};

export default LecturerGradingDetail;
