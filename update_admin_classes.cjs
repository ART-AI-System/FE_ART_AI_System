const fs = require('fs');
const file = 'd:/khoanc/project/FE_ART_AI_System/src/pages/admin/AdminClasses.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
content = content.replace('const [showAddModal, setShowAddModal] = useState(false);', 
  'const [showAddModal, setShowAddModal] = useState(false);\n  const [showImportModal, setShowImportModal] = useState(false);\n  const [importFile, setImportFile] = useState<File | null>(null);');

// 2. Add handleImportAndCreateClass before return (
content = content.replace('  return (',
  `  const handleImportAndCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return alert('Please upload an Excel file.');
    
    if (!formData.subjectId || !formData.lecturerId || !formData.classCode || !formData.semesterId) {
      alert('Please fill out all required fields (Class Code, Semester, Subject, Lecturer).');
      return;
    }

    setImporting(true);
    setImportSummary(null);
    try {
      const payload = new FormData();
      payload.append('file', importFile);
      payload.append('classCode', formData.classCode);
      payload.append('semesterId', formData.semesterId);
      payload.append('subjectId', formData.subjectId);
      payload.append('lecturerId', formData.lecturerId);
      
      const response = await classService.importAndCreateClass(payload);
      setImportSummary(response.importResult);
      alert('Class created and students imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      setFormData({
        classCode: '',
        semesterId: '',
        subjectId: '',
        lecturerId: ''
      });
      fetchData();
    } catch (err: any) {
      alert('Failed to import and create class: ' + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
    }
  };

  return (`);

// 3. Add Import Button
content = content.replace(/<button[^>]+onClick=\{openAddModal\}[^>]+>\s*<Plus[^>]+>\s*Add Class\s*<\/button>/, `$&
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ classCode: '', semesterId: '', subjectId: '', lecturerId: '' });
              setImportFile(null);
              setShowImportModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center shadow-md shadow-blue-500/20 ml-3"
          >
            <Users className="w-4 h-4 mr-2" />
            Import Excel & Create Class
          </button>`);

// 4. Add Import Modal below Add Modal
content = content.replace('{/* Add Modal */}', `{/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center"><Users className="w-5 h-5 mr-2" /> Import Excel & Create Class</h3>
            </div>
            
            <form onSubmit={handleImportAndCreateClass} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#064E3B] mb-1">Class Code</label>
                <input 
                  type="text" 
                  required
                  value={formData.classCode}
                  onChange={e => setFormData({...formData, classCode: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., SE1601"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#064E3B] mb-1">Semester</label>
                  <select
                    required
                    value={formData.semesterId}
                    onChange={e => setFormData({...formData, semesterId: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(s => <option key={s._id} value={s._id}>{s.name} ({s.year})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#064E3B] mb-1">Subject</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={e => setFormData({...formData, subjectId: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.code}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#064E3B] mb-1">Lecturer</label>
                <select
                  required
                  value={formData.lecturerId}
                  onChange={e => setFormData({...formData, lecturerId: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Lecturer</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#064E3B] mb-1">Excel File</label>
                <FileUpload
                  accept=".xlsx,.xls,.csv"
                  onFileSelect={(file) => setImportFile(file)}
                  selectedFile={importFile}
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                <button 
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={importing || !importFile}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}`);

fs.writeFileSync(file, content);
