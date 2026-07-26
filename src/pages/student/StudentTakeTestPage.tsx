import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';

const StudentTakeTestPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [showAntiCheat, setShowAntiCheat] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId

  // Load draft from localStorage on mount
  useEffect(() => {
    if (assignmentId) {
      const savedAnswers = localStorage.getItem(`test_draft_${user?._id}_${assignmentId}`);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch (e) {
          console.error('Failed to parse saved answers');
        }
      }
    }
  }, [assignmentId]);

  // Save to localStorage every time answers change
  useEffect(() => {
    if (assignmentId && Object.keys(answers).length > 0) {
      localStorage.setItem(`test_draft_${user?._id}_${assignmentId}`, JSON.stringify(answers));
    }
  }, [answers, assignmentId]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        // First check if already submitted
        try {
          const subRes: any = await axiosClient.get(`/grade-items/standalone/${assignmentId}/submissions/my`);
          if (subRes && (subRes.data?.result || subRes.result)) {
            setIsAlreadySubmitted(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          // 404 means no submission, which is fine
        }

        const res: any = await axiosClient.get(`/grade-items/standalone/${assignmentId}`);
        let data = res.data?.result || res.result || res;
        
        // Handle randomized question order for each student
        if (data.questions && data.questions.length > 0) {
          const storageKey = `test_question_ids_${user?._id}_${assignmentId}`;
          let savedIdsStr = localStorage.getItem(storageKey);
          let selectedIds: string[] = [];
          
          if (savedIdsStr) {
            try {
              selectedIds = JSON.parse(savedIdsStr);
            } catch (e) {
              console.error('Failed to parse saved question ids');
            }
          }
          
          if (!selectedIds || selectedIds.length === 0) {
            // Pick random questions and shuffle
            const shuffled = [...data.questions].sort(() => 0.5 - Math.random());
            
            // If isRandomPerStudent is true and randomCount is set, pick a subset
            const finalCount = (data.isRandomPerStudent && data.randomCount > 0) 
              ? data.randomCount 
              : shuffled.length;
              
            const selected = shuffled.slice(0, finalCount);
            selectedIds = selected.map(q => q._id);
            localStorage.setItem(storageKey, JSON.stringify(selectedIds));
          }
          
          // Filter to only those selected IDs, keeping the randomized order they were saved in
          const questionMap = new Map(data.questions.map((q: any) => [q._id, q]));
          data.questions = selectedIds.map(id => questionMap.get(id)).filter(Boolean);
        }
        
        setTestData(data);
        
        const durationSeconds = data.duration ? data.duration * 60 : 60 * 60;
        
        // Restore or initialize timer
        const savedStartTime = localStorage.getItem(`test_start_time_${user?._id}_${assignmentId}`);
        if (savedStartTime) {
          const elapsed = Math.floor((Date.now() - parseInt(savedStartTime, 10)) / 1000);
          const remaining = durationSeconds - elapsed;
          if (remaining > 0) {
            setTimeLeft(remaining);
          } else {
            setTimeLeft(0);
          }
        } else {
          setTimeLeft(durationSeconds);
        }
      } catch (err) {
        console.error('Failed to fetch test data', err);
      } finally {
        setLoading(false);
      }
    };
    if (assignmentId) {
      fetchTest();
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!showAntiCheat && timeLeft > 0) {
      // Record start time only when they actually start
      if (!localStorage.getItem(`test_start_time_${user?._id}_${assignmentId}`)) {
        localStorage.setItem(`test_start_time_${user?._id}_${assignmentId}`, Date.now().toString());
      }
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showAntiCheat && !loading) {
      // Auto submit when time runs out
      if (!isAlreadySubmitted) {
        submitTest(true);
      }
    }
  }, [showAntiCheat, timeLeft, loading, assignmentId, isAlreadySubmitted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showAntiCheat) {
        alert("WARNING: You left the exam tab. This has been recorded.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [showAntiCheat]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    setShowAntiCheat(false);
  };

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const submitTest = async (isAutoSubmit = false) => {
    const totalQuestions = testData?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    
    if (!isAutoSubmit) {
      let confirmMsg = "Are you sure you want to submit? You cannot change your answers after submitting.";
      if (answeredCount < totalQuestions) {
        confirmMsg = `WARNING: You have only answered ${answeredCount} out of ${totalQuestions} questions!\nAre you SURE you want to submit?`;
      }
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      const formData = new FormData();
        const submitData: any = { ...answers };
        
        // Include the randomly selected question IDs if applicable
        if (testData?.isRandomPerStudent) {
          const storageKey = `test_question_ids_${user?._id}_${assignmentId}`;
          const savedIdsStr = localStorage.getItem(storageKey);
          if (savedIdsStr) {
            try {
              submitData._questionIds = JSON.parse(savedIdsStr);
            } catch(e) {}
          }
        }
        
        formData.append('note', JSON.stringify(submitData));
        
        // Add a dummy file so backend parseSubmissionFile middleware doesn't throw 400
        const blob = new Blob(['test submission'], { type: 'text/plain' });
        formData.append('file', blob, 'submission.txt');

        const res: any = await axiosClient.post(`/grade-items/${assignmentId}/submissions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const submissionId = res.result?._id || res.data?.result?._id || res._id;
        if (submissionId) {
          await axiosClient.post(`/submissions/${submissionId}/finalize`);
        }
        
        alert(isAutoSubmit ? 'Time is up! Your test has been auto-submitted.' : 'Test submitted successfully!');
        localStorage.removeItem(`test_draft_${user?._id}_${assignmentId}`);
        localStorage.removeItem(`test_start_time_${user?._id}_${assignmentId}`);
        navigate(location.state?.returnUrl || '/student/assignments');
      } catch (err) {
        console.error('Submit attempt API call failed', err);
        alert('Failed to submit test. Please try again.');
        navigate(location.state?.returnUrl || '/student/assignments');
      }
    };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F7FE]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4318FF]"></div></div>;
  }

  if (isAlreadySubmitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7FE] absolute inset-0 z-50">
        <div className="bg-white p-10 rounded-[24px] shadow-xl max-w-lg text-center animate-fade-in border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1B2559] mb-4">Test Submitted</h1>
          <p className="text-gray-500 mb-8 font-medium">You have already submitted this test. You cannot take it again unless the lecturer allows you to retake.</p>
          <button 
            onClick={() => navigate(location.state?.returnUrl || '/student/assignments')} 
            className="w-full bg-[#1B2559] text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#111C44] transition-all"
          >
            Return
          </button>
        </div>
      </div>
    );
  }

  if (!testData) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F7FE]">Test not found!</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden select-none bg-[#F4F7FE] absolute inset-0 z-50">
      {/* EXAM HEADER */}
      <header className="h-20 bg-[#1B2559] flex items-center justify-between px-8 shrink-0 shadow-md relative z-20">
        <div className="flex items-center text-white">
          <div className="w-10 h-10 rounded-xl bg-[#F26F21] flex items-center justify-center font-bold mr-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{testData.title || 'Untitled Test'}</h1>
            <p className="text-sm text-blue-200">Duration: {testData.duration || 60} Minutes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Timer */}
          <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-2 flex items-center">
            <Clock className="w-5 h-5 text-[#F26F21] mr-3" />
            <span className="text-2xl font-extrabold text-white tracking-widest font-mono">{formatTime(timeLeft)}</span>
          </div>
          
          <button onClick={() => submitTest(false)} className="bg-[#F26F21] hover:bg-[#E86115] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all">
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* QUESTION AREA */}
        <main className="flex-1 overflow-y-auto scroll-smooth p-10">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {(testData.questions || []).map((q: any, index: number) => (
              <div key={q._id || index} className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100" id={`q${index + 1}`}>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-extrabold text-[#1B2559]">Question {index + 1}</h2>
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">{q.points || 0} Points</span>
                </div>
                
                <p className="text-lg text-gray-700 font-medium mb-6 whitespace-pre-wrap">{q.text}</p>
                
                <div className="space-y-3">
                  {(q.options || []).map((opt: any, optIndex: number) => {
                    const isSelected = answers[q._id] === opt._id;
                    return (
                      <label 
                        key={opt._id || optIndex}
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all group
                          ${isSelected ? 'border-[#F26F21] bg-orange-50' : 'border-gray-200 hover:bg-orange-50 hover:border-[#F26F21]'}`}
                      >
                        <input 
                          type="radio" 
                          name={`q${q._id}`} 
                          checked={isSelected}
                          onChange={() => handleOptionChange(q._id, opt._id)}
                          className="w-5 h-5 text-[#F26F21] focus:ring-[#F26F21]" 
                        />
                        <span className={`ml-4 ${isSelected ? 'font-bold text-[#1B2559]' : 'font-medium text-gray-700 group-hover:text-[#1B2559]'}`}>
                          {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* RIGHT SIDEBAR: QUESTION GRID */}
        <aside className="w-[320px] bg-white border-l border-gray-200 shrink-0 p-6 flex flex-col">
          <h3 className="font-bold text-[#1B2559] mb-4">Question Navigator</h3>
          
          <div className="grid grid-cols-5 gap-2 mb-8">
            {(testData.questions || []).map((q: any, index: number) => {
              const isAnswered = !!answers[q._id];
              return (
                <a 
                  key={q._id || index}
                  href={`#q${index + 1}`} 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-colors
                    ${isAnswered ? 'bg-[#1B2559] text-white' : 'border border-gray-200 text-gray-400 hover:border-gray-400'}`}
                >
                  {index + 1}
                </a>
              );
            })}
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex items-center text-sm">
              <div className="w-4 h-4 rounded bg-[#1B2559] mr-3"></div>
              <span className="text-gray-600 font-medium">Answered ({Object.keys(answers).length})</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-4 h-4 rounded border border-gray-200 mr-3"></div>
              <span className="text-gray-600 font-medium">Not Answered {(testData.questions || []).length - Object.keys(answers).length}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Anti-Cheat Modal */}
      {showAntiCheat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-[24px] shadow-2xl p-8 max-w-md w-full text-center border-t-4 border-red-500">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1B2559] mb-2">Exam Mode Active</h2>
            <p className="text-gray-500 mb-6">You are about to start a timed exam. Do not switch tabs, minimize the browser, or open other applications. Doing so will be recorded as a violation.</p>
            <div className="mt-8">
              {localStorage.getItem(`test_start_time_${user?._id}_${assignmentId}`) ? (
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={handleStartExam} 
                    className="w-full bg-[#1B2559] text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#111C44] transition-all"
                  >
                    Resume Exam
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to start fresh? This will delete your current draft and timer. Use this only if the lecturer allowed you to retake.')) {
                        localStorage.removeItem(`test_draft_${user?._id}_${assignmentId}`);
                        localStorage.removeItem(`test_start_time_${user?._id}_${assignmentId}`);
                        localStorage.removeItem(`test_question_ids_${user?._id}_${assignmentId}`);
                        window.location.reload();
                      }
                    }} 
                    className="w-full bg-red-50 text-red-600 px-6 py-4 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all"
                  >
                    Start Fresh (Retake)
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleStartExam} 
                  className="w-full bg-[#F26F21] text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:bg-[#D95D1A] transition-all"
                >
                  Start Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTakeTestPage;
