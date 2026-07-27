import React, { useState, useEffect } from 'react';
import { BookOpen, Users, BarChart2, ShieldAlert, CheckCircle2, Search, ArrowUpRight, GraduationCap, ChevronRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import axiosClient from '../../api/axiosClient';

interface DepartmentSubject {
  _id: string;
  code: string;
  name: string;
  credits: number;
  activeClassesCount: number;
  totalStudents: number;
  passRate: number;
  averageGrade: number;
  aiDependencyRate: number;
  assignedLecturers: string[];
}

const mockSubjects: DepartmentSubject[] = [
  {
    _id: 'subj-1',
    code: 'SWD392',
    name: 'Software Architecture and Design',
    credits: 3,
    activeClassesCount: 4,
    totalStudents: 120,
    passRate: 91.5,
    averageGrade: 8.1,
    aiDependencyRate: 35.2,
    assignedLecturers: ['Dr. Nguyen Van A', 'Dr. Le Thi B']
  },
  {
    _id: 'subj-2',
    code: 'PRJ301',
    name: 'Java Web Application Development',
    credits: 3,
    activeClassesCount: 5,
    totalStudents: 145,
    passRate: 86.0,
    averageGrade: 7.4,
    aiDependencyRate: 22.0,
    assignedLecturers: ['Dr. Nguyen Van A', 'Dr. Pham Van C']
  },
  {
    _id: 'subj-3',
    code: 'SWR302',
    name: 'Software Requirement Engineering',
    credits: 3,
    activeClassesCount: 3,
    totalStudents: 90,
    passRate: 95.0,
    averageGrade: 8.4,
    aiDependencyRate: 15.8,
    assignedLecturers: ['Dr. Le Thi B']
  },
  {
    _id: 'subj-4',
    code: 'SDN301',
    name: 'Fullstack Web Development with Node & React',
    credits: 3,
    activeClassesCount: 3,
    totalStudents: 85,
    passRate: 78.4,
    averageGrade: 6.8,
    aiDependencyRate: 48.6,
    assignedLecturers: ['Lecturer Michael Chang', 'Dr. Pham Van C']
  }
];

const SubjectAnalyticsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<DepartmentSubject[]>(mockSubjects);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res: any = await axiosClient.get('/subject-head/classes');
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Process if real backend API exists
        }
      } catch (err) {
        console.log('Using mock department subjects for analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClasses = subjects.reduce((acc, curr) => acc + curr.activeClassesCount, 0);
  const totalStudents = subjects.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const avgPassRate = (subjects.reduce((acc, curr) => acc + curr.passRate, 0) / subjects.length).toFixed(1);
  const avgAiDependency = (subjects.reduce((acc, curr) => acc + curr.aiDependencyRate, 0) / subjects.length).toFixed(1);

  return (
    <div className="space-y-8 animate-fade-in p-2 pb-10">
      {/* Top Department Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4318FF] mr-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Curriculum Subjects</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{subjects.length}</p>
          </div>
        </Card>

        <Card className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mr-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Enrolled Students</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{totalStudents}</p>
          </div>
        </Card>

        <Card className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mr-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dept Pass Rate</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{avgPassRate}%</p>
          </div>
        </Card>

        <Card className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 mr-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg AI Usage Rate</p>
            <p className="text-2xl font-extrabold text-[#1B2559]">{avgAiDependency}%</p>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1B2559]">Department Subjects & Performance</h2>
            <p className="text-xs text-gray-500 font-medium">Curriculum oversight and AI usage trends by subject</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subject code or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            />
          </div>
        </div>

        {/* Subjects Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubjects.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-extrabold rounded-lg mb-2">
                    {s.code} • {s.credits} Credits
                  </span>
                  <h3 className="text-lg font-bold text-[#1B2559] group-hover:text-[#4318FF] transition-colors">{s.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-[#4318FF] transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats Progress Bars */}
              <div className="space-y-3 my-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-500">Pass Rate:</span>
                    <span className="text-green-600">{s.passRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.passRate}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-500">AI Dependency Level:</span>
                    <span className={s.aiDependencyRate > 40 ? 'text-red-500' : 'text-yellow-600'}>{s.aiDependencyRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.aiDependencyRate > 40 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${s.aiDependencyRate}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                <div>
                  <span className="font-bold text-[#1B2559]">{s.activeClassesCount}</span> Active Classes ({s.totalStudents} Students)
                </div>
                <div className="text-right font-bold text-gray-600">
                  Avg Grade: <span className="text-[#4318FF]">{s.averageGrade.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SubjectAnalyticsPage;
