import { useEffect, useState } from 'react';
import { Award, BarChart2, BrainCircuit, Clock3, MessageSquareText, RefreshCw } from 'lucide-react';
import { submissionService } from '../../services/submission.service';

const riskStyle: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

const StudentResultsView = () => {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response: any = await submissionService.getAllMySubmissions();
        setSubmissions(response?.result || response?.data?.result || []);
      } catch (requestError) {
        console.error('Failed to fetch published grades', requestError);
        setError('Unable to load your submission results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const published = submissions.filter((submission) => submission.grade);
  const averageScore = published.length
    ? published.reduce((sum, submission) => sum + (submission.grade.score / submission.grade.maxScore) * 10, 0) / published.length
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FE] pb-20">
      <div className="bg-[#1B2559] pt-12 pb-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">My submission results</h1>
            <p className="text-blue-200 mt-2 text-lg">Only grades explicitly published by your lecturer are shown as final.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/20">
              <p className="text-xs font-bold text-blue-200 uppercase">Published</p>
              <p className="text-2xl font-black text-white">{published.length}</p>
            </div>
            <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/20">
              <p className="text-xs font-bold text-blue-200 uppercase">Average</p>
              <p className="text-2xl font-black text-white">{averageScore.toFixed(1)} / 10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 -mt-12 relative z-10 space-y-5">
        {loading ? (
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-20 text-center">
            <RefreshCw className="w-10 h-10 text-[#4318FF] animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-bold">Loading your results...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-[24px] border border-red-100 p-8 text-center text-red-700 font-bold">{error}</div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-20 text-center">
            <BarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No submissions yet</h3>
            <p className="text-sm text-gray-500 mt-2">Your submitted assignments and published grades will appear here.</p>
          </div>
        ) : (
          submissions.map((submission) => {
            const grade = submission.grade;
            const evaluation = submission.aiEvaluation;
            const subject = submission.class?.subjectSnapshot;
            return (
              <div key={submission._id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mr-5 shrink-0">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#4318FF] uppercase tracking-wider">
                        {subject?.code || 'Subject'} · {submission.class?.classCode || 'Class'}
                      </p>
                      <h2 className="text-xl font-black text-[#1B2559] mt-1">{submission.gradeItem?.title || 'Assignment'}</h2>
                      <p className="text-sm text-gray-500 mt-1">{subject?.name || 'Academic submission'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {evaluation && (
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">AI transparency risk</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-bold uppercase ${riskStyle[evaluation.riskLevel] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          <BrainCircuit className="w-3.5 h-3.5 mr-1" /> {evaluation.riskLevel}
                        </span>
                      </div>
                    )}
                    <div className="min-w-40 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Lecturer grade</p>
                      {grade ? (
                        <p className="text-3xl font-black text-[#4318FF]">{grade.score} <span className="text-base text-gray-400">/ {grade.maxScore}</span></p>
                      ) : (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold">
                          <Clock3 className="w-4 h-4 mr-1" /> Awaiting lecturer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {grade?.feedback && (
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-start text-sm text-gray-700">
                    <MessageSquareText className="w-5 h-5 text-[#F26F21] mr-3 shrink-0" />
                    <div><p className="font-bold text-[#1B2559] mb-1">Lecturer feedback</p><p>{grade.feedback}</p></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentResultsView;
