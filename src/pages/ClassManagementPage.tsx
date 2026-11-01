import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ArrowLeftRight, 
  Archive, 
  Plus, 
  Search, 
  Trash2, 
  FileUp,
  X,
  Settings,
  Edit2,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface Student {
  id: string;
  name: string;
  class: string;
  status: 'active' | 'archived';
}

export function ClassManagementPage() {
  const { state, updateState } = useApp();
  const students = state.students || [];
  const classesList = state.classes || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isManageClassesModalOpen, setIsManageClassesModalOpen] = useState(false);
  
  const [importNames, setImportNames] = useState('');
  const [importTargetClass, setImportTargetClass] = useState(classesList[0] || '');
  
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState('الكل');

  useEffect(() => {
    if (!importTargetClass && classesList.length > 0) {
      setImportTargetClass(selectedClass !== 'الكل' ? selectedClass : classesList[0]);
    }
  }, [classesList, selectedClass, importTargetClass]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [transferTargetClass, setTransferTargetClass] = useState('');

  useEffect(() => {
    if (studentToTransfer) {
      if (studentToTransfer.status === 'archived' || studentToTransfer.class.includes('أرشيف')) {
        const firstActiveClass = classesList.find(c => !c.includes('أرشيف')) || classesList[0] || '';
        setTransferTargetClass(firstActiveClass);
      } else {
        setTransferTargetClass(studentToTransfer.class);
      }
    } else {
      setTransferTargetClass('');
    }
  }, [studentToTransfer, classesList]);

  // Close any active modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImportModalOpen(false);
        setIsCreateClassModalOpen(false);
        setIsManageClassesModalOpen(false);
        setIsTransferModalOpen(false);
        setStudentToTransfer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredStudents = students.filter(s => {
    const nameMatch = s.name?.includes(searchTerm) || false;
    const idMatch = s.id?.includes(searchTerm) || false;
    const matchesSearch = nameMatch || idMatch;
    const matchesClass = selectedClass === 'الكل' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  }).sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ar');
  });

  const handleImport = () => {
    const names = importNames
      .split('\n')
      .map(n => n.replace(/[\r\n\u200B-\u200D\uFEFF]/g, '').trim())
      .filter(n => n !== '');
    
    const finalClass = importTargetClass || (selectedClass !== 'الكل' ? selectedClass : '') || classesList[0] || 'غير محدد';
    
    const newStudents: Student[] = names.map((name, index) => ({
      id: `طالب-${Date.now()}-${Math.floor(Math.random() * 1000) + index}`,
      name: name,
      class: finalClass,
      status: finalClass.includes('أرشيف') ? 'archived' : 'active'
    }));
    updateState({ students: [...students, ...newStudents] });
    setImportNames('');
    setIsImportModalOpen(false);
  };

  const handleCreateClass = () => {
    if (newClassName.trim() !== '') {
      if (!classesList.includes(newClassName.trim())) {
        updateState({ classes: [...classesList, newClassName.trim()] });
      }
      setNewClassName('');
      setIsCreateClassModalOpen(false);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(classesList[index]);
  };

  const saveEdit = (index: number) => {
    const oldName = classesList[index];
    const newName = editValue.trim();
    if (newName && newName !== oldName) {
      const newList = [...classesList];
      newList[index] = newName;
      updateState({ 
        classes: newList,
        students: students.map(s => s.class === oldName ? { ...s, class: newName } : s)
      });
      if (selectedClass === oldName) setSelectedClass(newName);
      if (importTargetClass === oldName) setImportTargetClass(newName);
    }
    setEditingIndex(null);
  };

  const deleteClass = (index: number) => {
    const className = classesList[index];
    const newList = classesList.filter((_, i) => i !== index);
    updateState({ 
      classes: newList,
      students: students.map(s => s.class === className ? { ...s, class: 'غير محدد' } : s)
    });
    if (selectedClass === className) setSelectedClass('الكل');
    if (importTargetClass === className) setImportTargetClass(newList[0] || 'غير محدد');
  };

  const moveStudent = (id: string, newClass: string) => {
    const targetClass = newClass || classesList.find(c => !c.includes('أرشيف')) || classesList[0] || 'غير محدد';
    updateState({
      students: students.map(s => 
        s.id === id ? { ...s, class: targetClass, status: targetClass.includes('أرشيف') ? 'archived' : 'active' } : s
      )
    });
  };

  const deleteStudent = (id: string) => {
    updateState({
      students: students.filter(s => s.id !== id)
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة الفصول والطلاب</h2>
          <p className="text-sm font-semibold text-slate-450 mt-1">تنظيم المجموعات، استيراد القوائم، والأرشفة الأكاديمية</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
          <button 
            onClick={() => {
              setIsImportModalOpen(true);
              setImportTargetClass(selectedClass !== 'الكل' ? selectedClass : (classesList[0] || ''));
            }}
            className="flex-1 lg:flex-none py-2.5 px-3.5 sm:px-4 bg-white border border-slate-200 rounded-xl text-slate-650 font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <FileUp size={16} />
            استيراد أسماء
          </button>
          <button 
            onClick={() => setIsCreateClassModalOpen(true)}
            className="flex-1 lg:flex-none py-2.5 px-3.5 sm:px-4 bg-indigo-600 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2} />
            إنشاء فصل جديد
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button 
            onClick={() => setIsManageClassesModalOpen(true)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shrink-0 hover:bg-indigo-50/50"
            title="إدارة قائمة الفصول"
          >
            <Settings size={16} />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
          {['الكل', ...classesList].map(c => (
            <button
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`px-4 py-1.5 rounded-lg text-sm font-black whitespace-nowrap transition-all ${
                selectedClass === c 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64 group">
          <Search className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="بحث عن طالب..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Students List Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredStudents.map((student) => (
            <motion.div
              layout
              key={student.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right" dir="rtl">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-200 relative shrink-0">
                    <Users size={18} strokeWidth={2} />
                    {student.status === 'archived' && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white leading-none">
                        <Archive size={8} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-slate-800 hover:text-indigo-600 transition-colors truncate">{student.name?.trim() || 'طالب غير مسمى'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                        student.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                      }`}>
                        {student.class}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {student.status === 'archived' || student.class.includes('أرشيف') ? (
                    <button 
                      onClick={() => {
                        const firstActiveClass = classesList.find(c => !c.includes('أرشيف')) || classesList[0] || '';
                        setStudentToTransfer(student);
                        setTransferTargetClass(firstActiveClass);
                        setIsTransferModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs sm:text-[13px] font-black transition-all cursor-pointer shadow-sm"
                      title="نقل الطالب من الأرشيف ليكون نشطاً في أحد الفصول"
                    >
                      <ArrowLeftRight size={12} className="text-emerald-500" />
                      <span>نقل الطالب من الأرشيف</span>
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setStudentToTransfer(student);
                          setTransferTargetClass(student.class);
                          setIsTransferModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-105 border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-lg text-xs sm:text-[13px] font-black transition-all cursor-pointer shadow-sm"
                        title="نقل الطالب إلى شعبة أو فصل آخر"
                      >
                        <ArrowLeftRight size={12} className="text-indigo-500" />
                        <span>نقل الطالب</span>
                      </button>
                      <button 
                        onClick={() => {
                          const archiveClass = classesList.find(c => c.includes('أرشيف')) || 'أرشيف عام';
                          const hasArchiveClass = classesList.includes(archiveClass);
                          const updatedClasses = hasArchiveClass ? classesList : [...classesList, archiveClass];
                          updateState({
                            classes: updatedClasses,
                            students: students.map(s => 
                              s.id === student.id ? { ...s, status: 'archived', class: archiveClass } : s
                            )
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs sm:text-[13px] font-black transition-all cursor-pointer shadow-sm"
                        title="نقل أو أرشفة الطالب وتجميد نشاطه مباشرة"
                      >
                        <Archive size={12} className="text-amber-500" />
                        <span>أرشفة</span>
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => deleteStudent(student.id)}
                    className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 hover:border-rose-150 rounded-lg transition-all cursor-pointer"
                    title="حذف الطالب"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div 
            onClick={() => setIsImportModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 border border-slate-100 overflow-hidden"
            >
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>
              
              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">استيراد مجموعة أسماء</h3>
                  <p className="text-xs text-slate-405 opacity-80 mt-1">أدخل الأسماء (اسم واحد في كل سطر)</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">اختيار الفصل المستهدف</label>
                    <div className="relative">
                      <select 
                        value={importTargetClass}
                        onChange={(e) => setImportTargetClass(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs appearance-none cursor-pointer outline-none focus:border-indigo-505 focus:bg-white"
                      >
                        {classesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                    </div>
                  </div>

                  <textarea
                    value={importNames}
                    onChange={(e) => setImportNames(e.target.value)}
                    placeholder="محمد أحمد...\nخالد فهد...\n..."
                    className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleImport}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    بدء الاستيراد
                  </button>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Classes Modal */}
      <AnimatePresence>
        {isManageClassesModalOpen && (
          <div 
            onClick={() => setIsManageClassesModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 border border-slate-100"
            >
              <button 
                onClick={() => setIsManageClassesModalOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">إدارة الفصول</h3>
                  <p className="text-xs text-slate-450 mt-1">تعديل مسميات الفصول أو حذفها</p>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                  {classesList.map((className, index) => (
                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 group">
                      {editingIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <input 
                            type="text" 
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-white border border-slate-350 rounded-lg px-3 py-1 text-xs outline-none"
                            autoFocus
                          />
                          <button 
                            onClick={() => saveEdit(index)}
                            className="p-1.5 bg-indigo-650 text-white rounded-lg bg-indigo-600"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 text-xs font-bold text-slate-700">
                            {className}
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => startEditing(index)}
                              className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 transition-all"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => deleteClass(index)}
                              className="p-1.5 bg-white text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setIsManageClassesModalOpen(false);
                    setIsCreateClassModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold text-xs rounded-xl border border-slate-200/60 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  إضافة فصل جديد للقائمة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreateClassModalOpen && (
          <div 
            onClick={() => setIsCreateClassModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-100 overflow-hidden"
            >
              <button 
                onClick={() => setIsCreateClassModalOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>
              
              <div className="relative z-10 space-y-4 text-center pt-2">
                <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-1">
                  <Plus size={24} />
                </div>
                
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">إنشاء فصل جديد</h3>
                  <p className="text-xs text-slate-450 opacity-80 mt-1">أدخل مسمى الفصل الدراسي الجديد</p>
                </div>

                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="مثال: الحادي عشر - ج"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs text-center font-bold"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
                />

                <div className="flex gap-2">
                  <button 
                    onClick={handleCreateClass}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    تأكيد الإنشاء
                  </button>
                  <button 
                    onClick={() => setIsCreateClassModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Student Modal */}
      <AnimatePresence>
        {isTransferModalOpen && studentToTransfer && (
          <div 
            onClick={() => {
              setIsTransferModalOpen(false);
              setStudentToTransfer(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-100 overflow-hidden text-right"
              dir="rtl"
            >
              <button 
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setStudentToTransfer(null);
                }}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-[110]"
              >
                <X size={18} />
              </button>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/40">
                    <ArrowLeftRight size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">نقل الطالب وتعديل الفصل الدراسي</h3>
                    <p className="text-[10px] font-bold text-slate-450 mt-0.5">تعديل فصول الطلاب وحفظ السجل الدراسي بالكامل</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">اسم الطالب:</span>
                    <span className="text-slate-800 font-extrabold">{studentToTransfer.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">الرقم الأكاديمي:</span>
                    <span className="text-slate-500 font-mono font-bold">{studentToTransfer.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">الفصل الحالي:</span>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">{studentToTransfer.class}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">اختيار الفصل المستهدف (نشط أو أرشيف)</label>
                  <div className="relative">
                    <select 
                      value={transferTargetClass}
                      onChange={(e) => setTransferTargetClass(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs appearance-none cursor-pointer outline-none focus:border-indigo-500 focus:bg-white font-bold text-slate-700"
                    >
                      {classesList.map(c => (
                        <option key={c} value={c}>
                          {c} {c.includes('أرشيف') ? '📁 (أرشيف)' : '🏫 (فصل نشط)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" size={14} />
                  </div>
                </div>

                {/* Reassurance grades preservation notice banner */}
                {studentToTransfer.status === 'archived' || studentToTransfer.class.includes('أرشيف') ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed text-emerald-850">
                    <span className="text-sm leading-none shrink-0">✨</span>
                    <div className="space-y-0.5 font-bold">
                      <p className="text-emerald-900 font-black text-[11px]">تنشيط وإلغاء أرشيف الطالب</p>
                      <p className="text-slate-500 font-medium">
                        سيتم استعادة الطالب بكافة درجاته وحفظه وسجل حضوره بالتزامن، لينتقل من الأرشيف ليكون نشطاً في فصل {transferTargetClass}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50/40 border border-emerald-100/50 p-3 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed text-emerald-850">
                    <span className="text-base leading-none shrink-0">✨</span>
                    <div className="space-y-0.5 font-bold">
                      <p className="text-emerald-900 font-black text-[11px]">حفظ تلقائي للدرجات والأرشفة</p>
                      <p className="text-slate-500 font-medium">
                        سيتم ربط درجات الطالب وسجل حضور وحفظ القرآن الكريم تلقائياً ببياناته، وسيتم نقلها بالكامل مع الطالب إلى {transferTargetClass.includes('أرشيف') ? 'قسم الأرشيف' : 'الفصل الدراسي المختار'}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => {
                      moveStudent(studentToTransfer.id, transferTargetClass);
                      setIsTransferModalOpen(false);
                      setStudentToTransfer(null);
                    }}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {studentToTransfer.status === 'archived' || studentToTransfer.class.includes('أرشيف') ? 'تأكيد نقل الطالب من الأرشيف' : 'تأكيد نقل الطالب'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setStudentToTransfer(null);
                    }}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 mx-auto">
            <Search size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">لم يتم العثور على نتائج</h3>
            <p className="text-xs text-slate-450 mt-1">جرب البحث بكلمات أخرى أو تغيير الفلتر</p>
          </div>
        </div>
      )}
    </div>
  );
}

