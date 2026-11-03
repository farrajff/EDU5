import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  ClipboardList, 
  BrainCircuit, 
  Timer, 
  Eye, 
  Bell, 
  Calendar, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Edit,
  Trash2,
  Award,
  Users,
  Trophy,
  ChevronDown,
  ChevronUp,
  Star,
  BookOpen,
  Save,
  Lightbulb,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface MemorizationTask {
  id: string;
  title: string;
  surah: string;
  verses: string;
  requiredTask: string;
  status: 'new' | 'revision';
  publishDate: string;
  dueDate: string;
  completedStudents: string[]; // array of studentIds
}

type TabType = 'assignments' | 'performance' | 'memorization';

export function YearlyWorkPage() {
  const { state, updateState, syncData, syncInProgress } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('assignments');

  // --- Common Context States ---
  const students = (state.students || [])
    .filter((s: any) => s.status !== 'archived' && !s.class?.includes('أرشيف'))
    .sort((a: any, b: any) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, 'ar');
    });
  const classesList = state.classes || [];
  const currentSemester = state.currentSemester || '1';
  const currentPeriod = state.currentPeriod || '1';
  const grades = state.grades || [];

  const [selectedClass, setSelectedClass] = useState('الكل');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- Accordion states for the Reports (collapsed by default) ---
  const [isHwReportCollapsed, setIsHwReportCollapsed] = useState(true);
  const [isPerfReportCollapsed, setIsPerfReportCollapsed] = useState(true);
  const [isMemorizationReportCollapsed, setIsMemorizationReportCollapsed] = useState(true);

  // Sync selected class to state if needed for consistency
  useEffect(() => {
    if (state.selectedClass && state.selectedClass !== selectedClass) {
      setSelectedClass(state.selectedClass);
    }
  }, [state.selectedClass]);

  const handleClassChange = (c: string) => {
    setSelectedClass(c);
    updateState({ selectedClass: c });
  };

  const filteredStudents = selectedClass === 'الكل' 
    ? students 
    : students.filter((s: any) => s.class?.trim() === selectedClass?.trim());


  // ==========================================
  // --- 1. Assignments Tab States & Functions ---
  // ==========================================
  const homeworks = state.homework || [];
  const [isHwCreateOpen, setIsHwCreateOpen] = useState(false);
  const [newHwTitle, setNewHwTitle] = useState('');
  const [newHwDesc, setNewHwDesc] = useState('');
  const [newHwDueDate, setNewHwDueDate] = useState('');

  const [isHwEditOpen, setIsHwEditOpen] = useState(false);
  const [hwToEdit, setHwToEdit] = useState<any>(null);
  const [editHwTitle, setEditHwTitle] = useState('');
  const [editHwDesc, setEditHwDesc] = useState('');
  const [editHwDueDate, setEditHwDueDate] = useState('');

  const handleCreateHomework = () => {
    if (newHwTitle.trim() === '') return;
    const newHw = {
      id: `واجب-${Date.now()}`,
      title: newHwTitle,
      description: newHwDesc,
      publishDate: 'اليوم',
      dueDate: newHwDueDate || 'غير محدد',
      status: 'active' as const,
      submissions: 0,
      totalStudents: students.length
    };
    updateState({ homework: [...homeworks, newHw] });
    setNewHwTitle('');
    setNewHwDesc('');
    setNewHwDueDate('');
    setIsHwCreateOpen(false);
  };

  const handleDeleteHomework = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الواجب؟')) {
      const updated = homeworks.filter((h: any) => h.id !== id);
      updateState({ homework: updated });
    }
  };

  const handleOpenEditHw = (hw: any) => {
    setHwToEdit(hw);
    setEditHwTitle(hw.title);
    setEditHwDesc(hw.description || '');
    setEditHwDueDate(hw.dueDate || '');
    setIsHwEditOpen(true);
  };

  const handleSaveEditHomework = () => {
    if (!hwToEdit || editHwTitle.trim() === '') return;
    const updated = homeworks.map((h: any) => {
      if (h.id === hwToEdit.id) {
        return {
          ...h,
          title: editHwTitle,
          description: editHwDesc,
          dueDate: editHwDueDate || 'غير محدد'
        };
      }
      return h;
    });
    updateState({ homework: updated });
    setIsHwEditOpen(false);
    setHwToEdit(null);
  };


  // ==========================================
  // --- 2. Performance Tasks Tab States ---
  // ==========================================
  const tasks = state.performanceTasks || [];
  const [isPerfCreateOpen, setIsPerfCreateOpen] = useState(false);
  const [newPerfTitle, setNewPerfTitle] = useState('');
  const [newPerfDesc, setNewPerfDesc] = useState('');
  const [newPerfDueDate, setNewPerfDueDate] = useState('');

  const [isPerfEditOpen, setIsPerfEditOpen] = useState(false);
  const [perfToEdit, setPerfToEdit] = useState<any>(null);
  const [editPerfTitle, setEditPerfTitle] = useState('');
  const [editPerfDesc, setEditPerfDesc] = useState('');
  const [editPerfDueDate, setEditPerfDueDate] = useState('');

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleCreatePerfTask = () => {
    if (newPerfTitle.trim() === '') return;
    const newTask = {
      id: `مهمة-${Date.now()}`,
      title: newPerfTitle,
      description: newPerfDesc,
      publishDate: 'اليوم',
      dueDate: newPerfDueDate || 'غير محدد',
      status: 'active' as const,
    };
    updateState({ performanceTasks: [newTask, ...tasks] });
    setNewPerfTitle('');
    setNewPerfDesc('');
    setNewPerfDueDate('');
    setIsPerfCreateOpen(false);
  };

  const handleDeletePerfTask = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة الأدائية؟')) {
      const updated = tasks.filter((t: any) => t.id !== id);
      updateState({ performanceTasks: updated });
      if (expandedTaskId === id) {
        setExpandedTaskId(null);
      }
    }
  };

  const handleOpenEditPerf = (task: any) => {
    setPerfToEdit(task);
    setEditPerfTitle(task.title);
    setEditPerfDesc(task.description || '');
    setEditPerfDueDate(task.dueDate || '');
    setIsPerfEditOpen(true);
  };

  const handleSaveEditPerf = () => {
    if (!perfToEdit || editPerfTitle.trim() === '') return;
    const updated = tasks.map((t: any) => {
      if (t.id === perfToEdit.id) {
        return {
          ...t,
          title: editPerfTitle,
          description: editPerfDesc,
          dueDate: editPerfDueDate || 'غير محدد'
        };
      }
      return t;
    });
    updateState({ performanceTasks: updated });
    setIsPerfEditOpen(false);
    setPerfToEdit(null);
  };

  const getStudentTaskGrade = (studentId: string) => {
    const sGrades = grades.find(
      (g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod
    );
    return sGrades ? parseFloat(sGrades.task) || 0 : 0;
  };

  const updateStudentTaskGrade = (studentId: string, val: number) => {
    let rawVal = Math.min(5, Math.max(0, val));
    const index = grades.findIndex(
      (g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod
    );

    let updatedGrades = [...grades];
    if (index >= 0) {
      updatedGrades[index] = {
        ...updatedGrades[index],
        task: rawVal
      };
    } else {
      updatedGrades.push({
        studentId,
        semester: currentSemester,
        period: currentPeriod,
        homework: Array(10).fill(false),
        participation: Array(10).fill(false),
        recitation: Array(4).fill(0),
        tajweed: Array(4).fill(0),
        hifz: Array(4).fill(0),
        task: rawVal,
        oral: 0,
        written: 0
      });
    }

    const finalGrades = updatedGrades.map((g: any) => {
      if (g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod) {
        const getAverage = (arr: number[]) => {
          if (!arr) return 0;
          const registeredCount = arr.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0);
          return registeredCount > 0 
            ? (arr.slice(0, registeredCount).reduce((subA: number, subB: number) => subA + (parseFloat(subB as any) || 0), 0) / registeredCount)
            : 0;
        };
        const oralScore = parseFloat((getAverage(g.recitation) + getAverage(g.tajweed) + getAverage(g.hifz)).toFixed(1));
        return {
          ...g,
          oral: oralScore
        };
      }
      return g;
    });

    updateState({ grades: finalGrades });
  };


  // ==========================================
  // --- 3. Memorization Tab States ---
  // ==========================================
  const initialHifzTasks: MemorizationTask[] = [
    {
      id: 'hifz-seed-1',
      title: 'حفظ سورة النجم',
      surah: 'سورة النجم',
      verses: '1-20',
      requiredTask: 'تسميع غيباً مع التجويد والتركيز على أحكام النون الساكنة',
      status: 'new',
      publishDate: 'منذ يومين',
      dueDate: 'الخميس القادم',
      completedStudents: students.slice(0, 2).map((s: any) => s.id)
    },
    {
      id: 'hifz-seed-2',
      title: 'مراجعة الجزء الثلاثين (عمّ)',
      surah: 'سورة النبأ والنازعات',
      verses: 'كاملة',
      requiredTask: 'مراجعة تثبيت عامة تمهيداً للاختبار الشفهي',
      status: 'revision',
      publishDate: 'منذ أسبوع',
      dueDate: 'مستمر للتقييم الشفهي',
      completedStudents: students.slice(1, 3).map((s: any) => s.id)
    }
  ];

  const memorizationTasks: MemorizationTask[] = state.memorizationTasks || initialHifzTasks;

  const [isHifzCreateOpen, setIsHifzCreateOpen] = useState(false);
  const [newHifzTitle, setNewHifzTitle] = useState('');
  const [newHifzSurah, setNewHifzSurah] = useState('');
  const [newHifzVerses, setNewHifzVerses] = useState('');
  const [newHifzRequired, setNewHifzRequired] = useState('');
  const [newHifzStatus, setNewHifzStatus] = useState<'new' | 'revision'>('new');
  const [newHifzDueDate, setNewHifzDueDate] = useState('');

  const [isHifzEditOpen, setIsHifzEditOpen] = useState(false);
  const [hifzToEdit, setHifzToEdit] = useState<MemorizationTask | null>(null);
  const [editHifzTitle, setEditHifzTitle] = useState('');
  const [editHifzSurah, setEditHifzSurah] = useState('');
  const [editHifzVerses, setEditHifzVerses] = useState('');
  const [editHifzRequired, setEditHifzRequired] = useState('');
  const [editHifzStatus, setEditHifzStatus] = useState<'new' | 'revision'>('new');
  const [editHifzDueDate, setEditHifzDueDate] = useState('');

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [activeRosterTask, setActiveRosterTask] = useState<MemorizationTask | null>(null);

  // Close any active modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHwCreateOpen(false);
        setIsHwEditOpen(false);
        setIsPerfCreateOpen(false);
        setIsPerfEditOpen(false);
        setIsHifzCreateOpen(false);
        setIsHifzEditOpen(false);
        setIsRosterModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const syncStudentMemorization = (updatedTasks: MemorizationTask[]) => {
    const latestTask = updatedTasks[0];
    const newMemorization = students.map((student: any) => {
      const isCompleted = latestTask?.completedStudents?.includes(student.id);
      if (latestTask) {
        return {
          studentId: student.id,
          surah: latestTask.surah || 'غير محدد',
          verses: latestTask.verses || 'كاملة',
          requiredTask: latestTask.requiredTask || 'تسميع المهمة الأدائية',
          progress: isCompleted ? 100 : 0,
          status: latestTask.status || 'new',
          updatedAt: new Date().toISOString()
        };
      } else {
        return {
          studentId: student.id,
          surah: 'غير محدد',
          verses: 'لا يوجد بيانات',
          progress: 0,
          status: 'new',
          requiredTask: 'لم يحدد بعد'
        };
      }
    });

    updateState({
      memorizationTasks: updatedTasks,
      memorization: newMemorization
    });
  };

  useEffect(() => {
    if (!state.memorizationTasks) {
      syncStudentMemorization(initialHifzTasks);
    }
  }, []);

  const handleSaveAllHifz = async () => {
    const success = await syncData();
    if (success) {
      setToastMsg('تم حفظ مهام الحفظ ومزامنتها على Google Drive بنجاح! ✓');
    } else {
      setToastMsg('تم حفظ المهام محلياً على جهازك.');
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreateHifzTask = () => {
    if (newHifzTitle.trim() === '') return;
    const newTask: MemorizationTask = {
      id: `hifz-${Date.now()}`,
      title: newHifzTitle,
      surah: newHifzSurah || 'غير محدد',
      verses: newHifzVerses || 'كاملة',
      requiredTask: newHifzRequired || 'تسميع غيباً',
      status: newHifzStatus,
      publishDate: 'اليوم',
      dueDate: newHifzDueDate || 'غير محدد',
      completedStudents: []
    };
    const updated = [newTask, ...memorizationTasks];
    syncStudentMemorization(updated);
    setNewHifzTitle('');
    setNewHifzSurah('');
    setNewHifzVerses('');
    setNewHifzRequired('');
    setNewHifzStatus('new');
    setNewHifzDueDate('');
    setIsHifzCreateOpen(false);
  };

  const handleDeleteHifzTask = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف مهمة الحفظ هذه؟')) {
      const updated = memorizationTasks.filter(t => t.id !== id);
      syncStudentMemorization(updated);
    }
  };

  const handleOpenEditHifz = (task: MemorizationTask) => {
    setHifzToEdit(task);
    setEditHifzTitle(task.title);
    setEditHifzSurah(task.surah);
    setEditHifzVerses(task.verses);
    setEditHifzRequired(task.requiredTask);
    setEditHifzStatus(task.status);
    setEditHifzDueDate(task.dueDate);
    setIsHifzEditOpen(true);
  };

  const handleSaveEditHifz = () => {
    if (!hifzToEdit || editHifzTitle.trim() === '') return;
    const updated = memorizationTasks.map(t => {
      if (t.id === hifzToEdit.id) {
        return {
          ...t,
          title: editHifzTitle,
          surah: editHifzSurah,
          verses: editHifzVerses,
          requiredTask: editHifzRequired,
          status: editHifzStatus,
          dueDate: editHifzDueDate || 'غير محدد'
        };
      }
      return t;
    });
    syncStudentMemorization(updated);
    setIsHifzEditOpen(false);
    setHifzToEdit(null);
  };

  const handleOpenRosterModal = (task: MemorizationTask) => {
    setActiveRosterTask(task);
    setIsRosterModalOpen(true);
  };

  const toggleStudentCompletion = (studentId: string) => {
    if (!activeRosterTask) return;
    const updatedTasks = memorizationTasks.map(t => {
      if (t.id === activeRosterTask.id) {
        const completed = [...(t.completedStudents || [])];
        const idx = completed.indexOf(studentId);
        if (idx >= 0) {
          completed.splice(idx, 1);
        } else {
          completed.push(studentId);
        }
        return { ...t, completedStudents: completed };
      }
      return t;
    });

    const updatedActiveTask = updatedTasks.find(t => t.id === activeRosterTask.id);
    if (updatedActiveTask) {
      setActiveRosterTask(updatedActiveTask);
    }
    syncStudentMemorization(updatedTasks);
  };

  // ==========================================
  // --- Rendering calculations ---
  // ==========================================
  const activeHwCount = homeworks.filter(h => h.status === 'active').length;
  const submissionsPerfCount = filteredStudents.filter(s => getStudentTaskGrade(s.id) > 0).length;
  const submissionsPerfPercentage = filteredStudents.length > 0 
    ? Math.round((submissionsPerfCount / filteredStudents.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 text-right pb-10" dir="rtl" id="yearly-work-page-root">
       {/* 🧭 Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-btn-assignments"
          >
            <ClipboardCheck size={16} />
            <span>الواجبات ({homeworks.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'performance'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-btn-performance"
          >
            <ClipboardList size={16} />
            <span>المهمة الأدائية ({tasks.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('memorization')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'memorization'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-btn-memorization"
          >
            <BrainCircuit size={16} />
            <span>متابعة الحفظ ({memorizationTasks.length})</span>
          </button>
        </div>

        {/* Dynamic global class filter directly on tabs menu */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-black text-slate-450 shrink-0">الصف:</span>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {['الكل', ...classesList].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => handleClassChange(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  selectedClass === c
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📝 TABS CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* ========================================================================= */}
          {/* 1. ASSIGNMENTS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'assignments' && (
            <div className="space-y-6" id="assignments-tab-content">
              {/* Stats Banner */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-2xl -mr-32 -mt-32 pointer-events-none" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">إحصائيات الواجبات</span>
                      <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-2 leading-tight">إدارة الواجبات المدرسية</h3>
                      <p className="mt-4 text-sm font-semibold text-slate-500 max-w-sm leading-relaxed">لديك {activeHwCount} واجبات نشطة حالياً. يتم توزيع الواجبات الجديدة على جميع الطلاب تلقائياً لتسهيل المتابعة.</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                      <ClipboardCheck size={20} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="relative z-10 flex gap-12 mt-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-slate-800">{homeworks.length}</span>
                      <span className="text-xs font-bold text-slate-450 mt-1 uppercase tracking-wider">إجمالي الواجبات</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-650 bg-indigo-650 bg-indigo-600 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:rotate-3 transition-transform">
                    <Bell size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">خاصية ذكية</p>
                  <h4 className="text-lg font-bold">الربط مع كشف الدرجات</h4>
                  <p className="text-sm text-indigo-100 mt-2 leading-relaxed px-4">أول واجب يتم إنشاؤه يرتبط تلقائياً بالخانة الأولى في قسم الواجبات بكشف الدرجات الرسمي.</p>
                  <button 
                    onClick={() => setIsHwCreateOpen(true)}
                    className="mt-6 px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-black text-sm shadow-sm hover:bg-slate-50 transition-all"
                    id="add-hw-banner-btn"
                  >
                    إضافة واجب جديد
                  </button>
                </div>
              </section>

              {/* Header */}
              <div className="flex items-end justify-between border-b border-slate-150 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">سجل الواجبات المدرسية</h3>
                  <p className="text-sm text-slate-450 mt-0.5 font-semibold">إدارة ومتابعة تسليمات المجموعات الدراسية</p>
                </div>
                <button 
                  onClick={() => setIsHwCreateOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
                  id="add-hw-header-btn"
                >
                  <Plus size={14} />
                  واجب جديد للفصول
                </button>
              </div>

              {/* Tasks list */}
              <div className="space-y-4">
                {homeworks.length > 0 ? [...homeworks].reverse().map((hw: any) => {
                  const hwSubmissions = hw.submissions || 0;
                  const totalCountForClass = filteredStudents.length;
                  const displaySubCount = selectedClass === 'الكل' ? hwSubmissions : Math.round(hwSubmissions * (totalCountForClass / (students.length || 1)));
                  const fillPercentage = totalCountForClass > 0 
                    ? Math.min(100, Math.round((displaySubCount / totalCountForClass) * 100))
                    : 0;

                  return (
                    <div key={hw.id} className="group bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md hover:border-slate-300/80 transition-all relative">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform border ${
                          hw.status === 'active' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          <ClipboardCheck size={20} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{hw.title}</h4>
                          <p className="text-slate-500 text-sm mt-1 truncate max-w-md">{hw.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-450">
                              <Calendar size={12} className="text-slate-400" /> {hw.publishDate}
                            </span>
                            <span className={`flex items-center gap-0.5 text-xs font-bold ${hw.status === 'active' ? 'text-amber-600' : 'text-slate-400'}`}>
                              <Timer size={12} className="opacity-80" /> {hw.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 min-w-[200px] w-full md:w-auto">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPercentage}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between w-full text-xs font-bold text-slate-450 uppercase tracking-wide">
                          <span>تم التسليم: {displaySubCount} / {totalCountForClass} طالباً</span>
                          <span className="text-indigo-600 font-bold text-sm">{fillPercentage}%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                           onClick={() => handleOpenEditHw(hw)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all"
                          title="تعديل الواجب"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteHomework(hw.id)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all"
                          title="حذف الواجب"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-sm text-slate-400 italic bg-white border border-dashed rounded-2xl">لا يوجد واجبات نشطة حالياً.</div>
                )}
              </div>

              {/* Incomplete list */}
              <section className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 transition-all">
                <div 
                  onClick={() => setIsHwReportCollapsed(!isHwReportCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-lg">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-800">تقرير الطلاب لمتابعة تسليم الواجبات</h4>
                        <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                          {filteredStudents.length} طالباً
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">انقر هنا لعرض تفاصيل تسليمات الواجبات لجميع طلاب الفصل الحالي</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                    {isHwReportCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>

                {!isHwReportCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50"
                  >
                    {(() => {
                      const homeworksList = [...(homeworks || [])].reverse();
                      
                      if (homeworksList.length === 0) {
                        return (
                          <div className="col-span-full text-center py-8 text-sm text-slate-400 italic">
                            لا توجد واجبات مضافة حالياً في النظام لتحديد حالة التسليم.
                          </div>
                        );
                      }

                      return filteredStudents.map(student => {
                        const sGrades = grades.find((g: any) => g.studentId === student.id && g.semester === currentSemester && g.period === currentPeriod) || {
                          homework: Array(10).fill(false)
                        };
                        
                        const incompleteHws = homeworksList.map((hw: any) => {
                          const originalIdx = homeworks.indexOf(hw);
                          const isDone = originalIdx >= 0 ? (sGrades.homework?.[originalIdx] || false) : false;
                          return isDone ? null : hw;
                        }).filter((hw: any) => hw !== null);
                        
                        const isCompleted = incompleteHws.length === 0;

                        return (
                          <div key={student.id} className={`p-4 rounded-xl border transition-all ${
                            isCompleted 
                              ? 'bg-emerald-50/10 border-emerald-100 shadow-sm' 
                              : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md'
                          }`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCompleted 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                  : 'bg-indigo-50/50 border-indigo-100 text-indigo-600'
                              }`}>
                                {student.name ? student.name.trim()[0] : '؟'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">{student.name}</p>
                                <p className="text-xs text-slate-400 font-semibold">{student.class}</p>
                              </div>
                            </div>

                            {isCompleted ? (
                              <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100/40">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                <span className="text-xs font-bold text-emerald-700">أتم جميع الواجبات المسجلة بنجاح ✨</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 no-scrollbar-thin">
                                {incompleteHws.map((hw: any) => (
                                  <div key={hw.id} className="flex justify-between items-center p-2 bg-rose-50/50 rounded-lg border border-rose-100/40 gap-2">
                                    <span className="text-xs font-bold text-rose-700 truncate" title={hw.title}>{hw.title}</span>
                                    <span className="shrink-0 px-2 py-0.5 bg-white rounded-md text-[9px] font-bold text-rose-500 border border-rose-100 font-black">لم يسلم</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </motion.div>
                )}
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PERFORMANCE TASKS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'performance' && (
            <div className="space-y-6" id="performance-tab-content">
              {/* Stats Banner */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/40 rounded-full blur-2xl -mr-32 -mt-32 pointer-events-none" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">إحصائيات المهام الأدائية</span>
                      <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-2 leading-tight">إدارة المهام الأدائية والطلاب</h3>
                      <p className="mt-4 text-sm font-semibold text-slate-500 max-w-sm leading-relaxed">
                        تتيح لك هذه المنصة إسناد المهام ومتابعة رصد درجاتها مباشرة لجميع الطلاب ويرتبط هذا تلقائياً بخانة "الأدائية (5)" بكشف الدرجات.
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                      <ClipboardList size={20} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="relative z-10 flex gap-12 mt-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-slate-800">{tasks.length}</span>
                      <span className="text-xs font-bold text-slate-450 mt-1 uppercase tracking-wider">إجمالي المهام المضافة</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-amber-600">{submissionsPerfPercentage}%</span>
                      <span className="text-xs font-bold text-slate-450 mt-1 uppercase tracking-wider">نسبة الإنجاز للفصل الحالي</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-550 bg-amber-500 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:rotate-3 transition-transform">
                    <Trophy size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <p className="text-xs font-bold text-amber-100 uppercase tracking-widest mb-1">تزامن فوري</p>
                  <h4 className="text-lg font-bold">المرونة في الرصد والتقييم</h4>
                  <p className="text-sm text-amber-50 mt-2 leading-relaxed px-4 font-semibold">
                    رصد الدرجة وتأكيد إكمال الواجبات يثبت تلقائياً بـ 5 من 5 في كشوف المتابعة والتقارير الأكاديمية.
                  </p>
                  <button 
                    onClick={() => setIsPerfCreateOpen(true)}
                    className="mt-6 px-6 py-2.5 bg-white text-amber-600 rounded-xl font-black text-sm shadow-sm hover:bg-slate-50 transition-all font-semibold"
                    id="add-perf-banner-btn"
                  >
                    إضافة مهمة أدائية
                  </button>
                </div>
              </section>

              {/* Header */}
              <div className="flex items-end justify-between border-b border-slate-150 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">قائمة المهام والأنشطة الأدائية</h3>
                  <p className="text-sm text-slate-450 mt-0.5 font-semibold">رصد ومتابعة إنجاز الطلاب للمهام الصيفية والصفيّة</p>
                </div>
                <button 
                  onClick={() => setIsPerfCreateOpen(true)}
                  className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 transition-all flex items-center gap-1.5 shadow-sm"
                  id="add-perf-header-btn"
                >
                  <Plus size={14} />
                  مهمة جديدة للفصول
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-4">
                {tasks.length > 0 ? tasks.map((task: any) => {
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <div key={task.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center transform bg-amber-50 border border-amber-100 text-amber-500 shrink-0">
                            <ClipboardList size={20} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <h4 className="text-base font-bold text-slate-800 hover:text-amber-605 transition-colors truncate">{task.title}</h4>
                            <p className="text-slate-500 text-sm mt-1 truncate max-w-md">{task.description || "لا يوجد وصف لهذه المهمة"}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1 text-xs font-semibold text-slate-450">
                                <Calendar size={12} className="text-slate-400" /> {task.publishDate}
                              </span>
                              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-650">
                                <Timer size={12} className="opacity-80" /> تاريخ التسليم: {task.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5 min-w-[200px] w-full md:w-auto">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${submissionsPerfPercentage}%` }}
                              className="h-full bg-amber-500 rounded-full"
                            />
                          </div>
                          <div className="flex justify-between w-full text-xs font-bold text-slate-450 uppercase tracking-wide">
                            <span>مكتملة: {submissionsPerfCount} / {filteredStudents.length} طالباً</span>
                            <span className="text-amber-500 font-bold text-sm">{submissionsPerfPercentage}%</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className={`p-2 rounded-lg border transition-all text-slate-600 ${
                              isExpanded 
                                ? 'bg-amber-50 border-amber-200 text-amber-650' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                            }`}
                            title="رصد درجات هذه المهمة للطلاب"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button 
                            onClick={() => handleOpenEditPerf(task)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-amber-50 hover:border-amber-100 hover:text-amber-600 transition-all"
                            title="تعديل المهمة"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeletePerfTask(task.id)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all"
                            title="حذف المهمة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded grading table */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                          >
                            <div className="p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-black text-slate-700">رصد وتسجيل درجات المهمة: <span className="text-amber-500">{task.title}</span></h5>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('رصد الدرجة الكاملة (5 من 5) لجميع طلاب الصف المفلتر؟')) {
                                        filteredStudents.forEach(s => updateStudentTaskGrade(s.id, 5));
                                      }
                                    }}
                                    className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-black border border-amber-200"
                                  >
                                    منح الجميع 5/5
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('هل تريد تصفير درجات الكل بالفصل الحالي؟')) {
                                        filteredStudents.forEach(s => updateStudentTaskGrade(s.id, 0));
                                      }
                                    }}
                                    className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-black border border-slate-200"
                                  >
                                    تصفير درجات الكل
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredStudents.map((student: any) => {
                                  const currentGrade = getStudentTaskGrade(student.id);
                                  return (
                                    <div key={student.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all">
                                      <div className="min-w-0 flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                                          currentGrade >= 4 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
                                        }`}>
                                          {student.name ? student.name.trim()[0] : '؟'}
                                        </div>
                                        <div className="truncate text-right">
                                          <p className="text-sm font-bold text-slate-700 truncate" title={student.name}>{student.name}</p>
                                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{student.class}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {/* Fast 5/5 Toggle */}
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => updateStudentTaskGrade(student.id, currentGrade === 5 ? 0 : 5)}
                                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                                              currentGrade === 5 
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                            }`}
                                            title="منح كامل الدرجة (5/5)"
                                          >
                                            <CheckCircle2 size={14} />
                                          </button>
                                        </div>

                                        {/* Numeric field */}
                                        <div className="flex items-center gap-1">
                                          <input 
                                            type="number" 
                                            min="0"
                                            max="5"
                                            value={currentGrade || ''}
                                            onChange={(e) => updateStudentTaskGrade(student.id, parseFloat(e.target.value) || 0)}
                                            className="w-10 h-7 text-center bg-slate-50 rounded-lg text-sm font-bold text-slate-800 border border-slate-200 focus:bg-white focus:border-amber-500 outline-none transition"
                                            placeholder="0"
                                            id={`perf-task-grade-${student.id}`}
                                          />
                                          <span className="text-xs text-slate-400 font-bold">/5</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-sm text-slate-400 italic">
                    <ClipboardList className="mx-auto mb-3 text-slate-300 animate-pulse" size={32} />
                    لا توجد مهام أدائية مسجلة للفصل الحالي. اضغط على "إضافة مهمة أدائية جديدة" للبدء بالتقييم.
                  </div>
                )}
              </div>

              {/* Incomplete list */}
              <section className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 transition-all">
                <div 
                  onClick={() => setIsPerfReportCollapsed(!isPerfReportCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-600 border border-rose-150 rounded-lg">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-800">تقرير متابعة المهام الأدائية</h4>
                        <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                          {filteredStudents.length} طالباً
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">انقر هنا لعرض تفاصيل تقييم المهام الأدائية لجميع طلاب الفصل الحالي</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                    {isPerfReportCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>

                {!isPerfReportCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50"
                  >
                    {(() => {
                      if (tasks.length === 0) {
                        return (
                          <div className="col-span-full text-center py-8 text-sm text-slate-400 italic">
                            يرجى إضافة مهمة أدائية واحدة على الأقل لرصد حالة الطلاب وتحديث تقارير التقصير.
                          </div>
                        );
                      }

                      if (filteredStudents.length === 0) {
                        return (
                          <div className="col-span-full text-center py-8 text-sm text-slate-400 italic">
                            لا يوجد طلاب مسجلين في هذا الفصل.
                          </div>
                        );
                      }

                      return filteredStudents.map(student => {
                        const currentGrade = getStudentTaskGrade(student.id);
                        const isDone = currentGrade >= 3;

                        return (
                          <div key={student.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                            isDone 
                              ? 'bg-emerald-50/10 border-emerald-100 shadow-sm' 
                              : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDone 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                  : 'bg-rose-50 border-rose-200 text-rose-500'
                              }`}>
                                {student.name ? student.name.trim()[0] : '؟'}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-700">{student.name}</p>
                                <p className="text-xs text-slate-400 font-semibold">{student.class}</p>
                              </div>
                            </div>
                            <div className="text-left font-bold text-right shrink-0">
                              {isDone ? (
                                <>
                                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md block mb-1">مقبول ✓</span>
                                  <span className="text-xs text-emerald-700">الدرجة: {currentGrade} / 5</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md block mb-1">غير مكتملة</span>
                                  <span className="text-xs text-rose-600">الدرجة: {currentGrade} / 5</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </motion.div>
                )}
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. MEMORIZATION TAB */}
          {/* ========================================================================= */}
          {activeTab === 'memorization' && (
            <div className="space-y-6" id="memorization-tab-content">
              {/* Stats Banner */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/40 rounded-full blur-2xl -mr-32 -mt-32 pointer-events-none" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">إحصائيات الحفظ القرآني</span>
                      <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-2 leading-tight">متابعة الحفظ والتلاوة اليومية</h3>
                      <p className="mt-4 text-xs font-medium text-slate-500 max-w-sm leading-relaxed">تتيح لك هذه المنصة إنشاء وتعديل مهام الحفظ الجماعي لكافة الطلاب، ومتابعة نسبة تسيير وتسميع السور المقررة.</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                      <BrainCircuit size={20} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="relative z-10 flex gap-12 mt-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-slate-800">{memorizationTasks.length}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">مهام مقررة</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-indigo-600">{memorizationTasks.filter(t => t.status === 'new').length}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">سور جديدة</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-amber-600">{memorizationTasks.filter(t => t.status === 'revision').length}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">مراجعات جارية</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col justify-center items-center text-center relative overflow-hidden group">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:rotate-3 transition-transform">
                    <BookOpen size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">تحديث جماعي ذكي</p>
                  <h4 className="text-lg font-bold">مهام تسميع موحدة</h4>
                  <p className="text-xs text-emerald-50 mt-2 leading-relaxed px-4">عند إضافة مهمة حفظ، تُرصد تلقائياً لكافة الطلاب ومزامنتها لحظياً في الملفات السحابية للحلقة.</p>
                  <button 
                    onClick={() => setIsHifzCreateOpen(true)}
                    className="mt-6 px-6 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-sm transition-all"
                    id="add-hifz-banner-btn"
                  >
                    نشر مهمة جديدة
                  </button>
                </div>
              </section>

              {/* Save / Cloud action bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-slate-200/60 p-3 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-bold ml-auto">
                  تحديث سجلات الطلاب وإنجازهم التراكمي في الحفظ الشفهي والتلاوة
                </span>
                <button 
                  onClick={handleSaveAllHifz}
                  disabled={syncInProgress}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Save size={14} />
                  {syncInProgress ? 'جاري حفظ السحابة...' : 'حفظ وسحب التراكمي الآن'}
                </button>
              </div>

              {/* Header */}
              <div className="flex items-end justify-between border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">مهام التسميع المقررة للحلقة</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">سجل السور والمراجعات المجدولة للوحدات الدراسية</p>
                </div>
                <button 
                  onClick={() => setIsHifzCreateOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                  id="add-hifz-header-btn"
                >
                  <Plus size={14} />
                  مهمة جديدة للفصول
                </button>
              </div>

              {/* Task list container */}
              <div className="space-y-4">
                {memorizationTasks.length > 0 ? memorizationTasks.map((task: MemorizationTask) => {
                  const completedNum = task.completedStudents?.length || 0;
                  const totalNum = filteredStudents.length;
                  const displayCompleted = selectedClass === 'الكل' ? completedNum : task.completedStudents?.filter(id => filteredStudents.find(s => s.id === id)).length || 0;
                  const progressPercent = Math.round((displayCompleted / (totalNum || 1)) * 100);

                  return (
                    <div key={task.id} className="group bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md hover:border-slate-300/80 transition-all relative">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform border ${
                          task.status === 'new' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                          {task.status === 'new' ? <Star size={20} strokeWidth={2} /> : <BookOpen size={20} strokeWidth={2} />}
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">{task.title}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              task.status === 'new' ? 'bg-emerald-50 text-emerald-750 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {task.status === 'new' ? 'تسميع جديد' : 'مراجعة'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1 truncate max-w-md">{task.requiredTask}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                              <Calendar size={12} className="text-slate-400" /> {task.publishDate}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                              <Timer size={12} className="text-slate-400" /> موعد التسليم: <span className="font-bold text-rose-600 mr-1">{task.dueDate}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              السورة/الموضوع: <span className="font-extrabold">{task.surah} | الآيات: {task.verses}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 min-w-[200px] w-full md:w-auto">
                        <div className="w-full h-1.5 bg-slate-150 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between w-full text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          <span>أتموا التسميع: {displayCompleted} / {totalNum} طالباً</span>
                          <span className="text-emerald-600 font-bold text-xs">{progressPercent}%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => handleOpenRosterModal(task)}
                          className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center gap-1 shadow-sm"
                          title="تسجيل وتسميع الطلاب"
                        >
                          <CheckCircle2 size={13} />
                          رصد المنجزين
                        </button>
                        <button 
                          onClick={() => handleOpenEditHifz(task)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                          title="تعديل المهمة"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteHifzTask(task.id)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all"
                          title="حذف المهمة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-xs text-slate-400 border border-dashed rounded-2xl bg-white italic">لا يوجد مهام حفظ نشطة حالياً. يمكنك إنشاء واحدة جديدة من الأعلى.</div>
                )}
              </div>

              {/* Incomplete / tardy list */}
              <section className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 mt-6 print:hidden transition-all">
                <div 
                  onClick={() => setIsMemorizationReportCollapsed(!isMemorizationReportCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-lg">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">تقرير الطلاب لمتابعة التسميع والحفظ</h4>
                        <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                          {filteredStudents.length} طالباً
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">انقر هنا لعرض مهام التسميع والحفظ لجميع طلاب الحلقة الحاليين</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                    {isMemorizationReportCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>

                {!isMemorizationReportCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50"
                  >
                    {(() => {
                      const hifzList = [...memorizationTasks];

                      if (hifzList.length === 0) {
                        return (
                          <div className="col-span-full text-center py-8 text-xs text-slate-400 italic">
                            لا توجد مهام تسميع مضافة حالياً في النظام لتحديد حالة المنجزين.
                          </div>
                        );
                      }

                      const chronologicalTasks = [...hifzList].sort((a: any, b: any) => {
                        const isSeedA = a.id?.startsWith('hifz-seed');
                        const isSeedB = b.id?.startsWith('hifz-seed');
                        if (isSeedA && !isSeedB) return -1;
                        if (!isSeedA && isSeedB) return 1;
                        if (isSeedA && isSeedB) return (a.id || '').localeCompare(b.id || '');
                        const tsA = parseInt(a.id?.replace('hifz-', '') || '0') || 0;
                        const tsB = parseInt(b.id?.replace('hifz-', '') || '0') || 0;
                        return tsA - tsB;
                      });

                      return filteredStudents.map(student => {
                        const sGrades = grades.find((g: any) => g.studentId === student.id && g.semester === currentSemester && g.period === currentPeriod) || { hifz: [] };
                        
                        const incompleteTasks = hifzList.filter(t => {
                          const chronoIndex = chronologicalTasks.findIndex(ct => ct.id === t.id);
                          let isCompletedByGrade = false;
                          if (chronoIndex >= 0 && chronoIndex < 4) {
                            const hGrade = sGrades.hifz?.[chronoIndex];
                            if (hGrade !== undefined && hGrade !== null && String(hGrade).trim() !== '' && String(hGrade).trim() !== '-') {
                              isCompletedByGrade = true;
                            }
                          }
                          const isCompleted = isCompletedByGrade || t.completedStudents?.includes(student.id) || false;
                          return !isCompleted;
                        });
                        const isCompleted = incompleteTasks.length === 0;

                        return (
                          <div key={student.id} className={`p-4 rounded-xl border transition-all ${
                            isCompleted 
                              ? 'bg-emerald-50/10 border-emerald-100 shadow-sm' 
                              : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md'
                          }`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCompleted 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                  : 'bg-indigo-50/50 border-indigo-100 text-indigo-600'
                              }`}>
                                {student.name ? student.name.trim()[0] : '؟'}
                              </div>
                              <div className="min-w-0 pr-0.5 text-right w-full">
                                <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{student.class}</p>
                              </div>
                            </div>

                            {isCompleted ? (
                              <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100/40">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                <span className="text-xs font-bold text-emerald-700">أتم جميع مهام الحفظ بنجاح ✨</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 no-scrollbar-thin text-right">
                                {incompleteTasks.map((tsk: MemorizationTask) => {
                                  const cIdx = chronologicalTasks.findIndex(ct => ct.id === tsk.id);
                                  return (
                                    <div 
                                      key={tsk.id} 
                                      onClick={() => {
                                        const updated = memorizationTasks.map(t => {
                                          if (t.id === tsk.id) {
                                            return { ...t, completedStudents: [...(t.completedStudents || []), student.id] };
                                          }
                                          return t;
                                        });
                                        syncStudentMemorization(updated);
                                      }}
                                      className="group/item flex justify-between items-center p-2 bg-rose-50/35 rounded-lg border border-rose-100/30 gap-2 cursor-pointer hover:bg-emerald-50 hover:border-emerald-100 transition-colors"
                                      title="انقر لتسجيل التسميع لهذا الطالب سريعاً"
                                    >
                                      <span className="text-[11px] font-bold text-rose-700 truncate group-hover/item:text-emerald-700" title={tsk.title}>
                                        {tsk.title} {cIdx >= 0 && cIdx < 4 && `(الخانة ${cIdx+1})`}
                                      </span>
                                      <span className="shrink-0 px-2 py-0.5 bg-white rounded-md text-[8px] font-bold text-rose-500 border border-rose-100 group-hover/item:text-emerald-500 group-hover/item:border-emerald-100 font-black">
                                        لم يُسمع ⚡ (رصد سريع)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </motion.div>
                )}
              </section>

              {/* Recommended Tips Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 relative overflow-hidden flex items-start gap-3 mt-4 print:hidden">
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0">
                  <Lightbulb size={20} className="text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">توصية تربوية مهمة</h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-relaxed text-right">
                    يُربط إنجاز الحفظ في هذا القسم تلقائياً مع حسابات الطلاب الفردية (بوابة الطالب). لتسجيل التسميع لمهمة ما، انقر فوق زر "رصد المنجزين" وحدد أسماء الطلاب المنجزين لتحديث درجتهم فوراً وتكبير تقدمهم.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 🔮 MODALS ROOT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {/* Homework Create Modal */}
        {isHwCreateOpen && (
          <div 
            onClick={() => setIsHwCreateOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-100 text-right"
            >
              <button 
                onClick={() => setIsHwCreateOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">إضافة واجب مدرسة جديد</h3>
                  <p className="text-xs text-slate-400 mt-0.5">سيتم تعميم هذا الواجب على كافة فصول المادة</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">عنوان الواجب</label>
                    <input 
                      type="text" 
                      value={newHwTitle}
                      onChange={(e) => setNewHwTitle(e.target.value)}
                      placeholder="مثال: الواجب الأول في أحكام التجويد"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-505 focus:border-indigo-500 outline-none text-xs font-bold text-right"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">Description / تعليمات</label>
                    <textarea 
                      value={newHwDesc}
                      onChange={(e) => setNewHwDesc(e.target.value)}
                      placeholder="التعليمات المطلوبة من الطالب لحل الواجب..."
                      className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs resize-none text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تاريخ التسليم النهائي</label>
                    <input 
                      type="text" 
                      value={newHwDueDate}
                      onChange={(e) => setNewHwDueDate(e.target.value)}
                      placeholder="مثال: الأربعاء المقبل"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleCreateHomework}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    نشر الواجب للجميع
                  </button>
                  <button 
                    onClick={() => setIsHwCreateOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Homework Edit Modal */}
        {isHwEditOpen && hwToEdit && (
          <div 
            onClick={() => setIsHwEditOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-100 text-right"
            >
              <button 
                onClick={() => setIsHwEditOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">تعديل الواجب المدرسي</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تعديل تفاصيل هذا الواجب المدرسي الموزع</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">عنوان الواجب</label>
                    <input 
                      type="text" 
                      value={editHwTitle}
                      onChange={(e) => setEditHwTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs font-bold text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تعليمات الواجب</label>
                    <textarea 
                      value={editHwDesc}
                      onChange={(e) => setEditHwDesc(e.target.value)}
                      className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs resize-none text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تاريخ التسليم النهائي</label>
                    <input 
                      type="text" 
                      value={editHwDueDate}
                      onChange={(e) => setEditHwDueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveEditHomework}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    حفظ التغييرات
                  </button>
                  <button 
                    onClick={() => setIsHwEditOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Performance Task Create Modal */}
        {isPerfCreateOpen && (
          <div 
            onClick={() => setIsPerfCreateOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-100 text-right"
            >
              <button 
                onClick={() => setIsPerfCreateOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">إضافة مهمة أدائية جديدة</h3>
                  <p className="text-xs text-slate-400 mt-0.5">سيتم إضافة هذه المهمة وتوزيعها على كافة الطلاب</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">عنوان المهمة</label>
                    <input 
                      type="text" 
                      value={newPerfTitle}
                      onChange={(e) => setNewPerfTitle(e.target.value)}
                      placeholder="مثال: مطوية أحكام الميم الساكنة"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs font-bold text-right"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تفاصيل ووصف المهمة</label>
                    <textarea 
                      value={newPerfDesc}
                      onChange={(e) => setNewPerfDesc(e.target.value)}
                      placeholder="أدخل متطلبات المهمة والأهداف..."
                      className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs resize-none text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تاريخ التسليم النهائي</label>
                    <input 
                      type="text" 
                      value={newPerfDueDate}
                      onChange={(e) => setNewPerfDueDate(e.target.value)}
                      placeholder="مثال: الخميس القادم"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleCreatePerfTask}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs"
                  >
                    نشر المهمة للجميع
                  </button>
                  <button 
                    onClick={() => setIsPerfCreateOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Performance Task Edit Modal */}
        {isPerfEditOpen && perfToEdit && (
          <div 
            onClick={() => setIsPerfEditOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-100 text-right"
            >
              <button 
                onClick={() => setIsPerfEditOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">تعديل تفاصيل المهمة الأدائية</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تعديل بيانات هذه المهمة الموزعة</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">عنوان المهمة</label>
                    <input 
                      type="text" 
                      value={editPerfTitle}
                      onChange={(e) => setEditPerfTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs font-bold text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تفاصيل ووصف المهمة</label>
                    <textarea 
                      value={editPerfDesc}
                      onChange={(e) => setEditPerfDesc(e.target.value)}
                      className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs resize-none text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">تاريخ التسليم النهائي</label>
                    <input 
                      type="text" 
                      value={editPerfDueDate}
                      onChange={(e) => setEditPerfDueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveEditPerf}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs"
                  >
                    حفظ التغييرات
                  </button>
                  <button 
                    onClick={() => setIsPerfEditOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Memorization Hifz Create Modal */}
        {isHifzCreateOpen && (
          <div 
            onClick={() => setIsHifzCreateOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm" dir="rtl"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-100 text-right"
            >
              <button 
                onClick={() => setIsHifzCreateOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">مهمة حفظ وتسميع جديدة</h3>
                  <p className="text-xs text-slate-400 mt-0.5">سيتم تعميم هذه السورة والمهمة على تلاوة جميع الطلاب بالحلقة</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">العنوان العام للمهمة</label>
                    <input 
                      type="text" 
                      value={newHifzTitle}
                      onChange={(e) => setNewHifzTitle(e.target.value)}
                      placeholder="مثال: حفظ سورة النجم كاملة"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs font-bold text-right"
                      autoFocus
                    />
                  </div>



                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">التعليمات والمهمة المطلوبة بالتفصيل</label>
                    <textarea 
                      value={newHifzRequired}
                      onChange={(e) => setNewHifzRequired(e.target.value)}
                      placeholder="أدخل معايير الحفظ المطلوب والتطبيق..."
                      className="w-full h-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs resize-none text-right"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block pb-1">نوع المهمة</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setNewHifzStatus('new')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${newHifzStatus === 'new' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                          تسميع جديد
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNewHifzStatus('revision')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${newHifzStatus === 'revision' ? 'bg-amber-50 text-amber-700 border-amber-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                          مراجعة السور
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">موعد التسليم النهائي</label>
                      <input 
                        type="text" 
                        value={newHifzDueDate}
                        onChange={(e) => setNewHifzDueDate(e.target.value)}
                        placeholder="مثال: الخميس المقبل"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs font-bold text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleCreateHifzTask}
                    className="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs shadow-sm"
                  >
                    نشر المهمة الدراسية
                  </button>
                  <button 
                    onClick={() => setIsHifzCreateOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Memorization Hifz Edit Modal */}
        {isHifzEditOpen && hifzToEdit && (
          <div 
            onClick={() => setIsHifzEditOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm" dir="rtl"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-100 text-right"
            >
              <button 
                onClick={() => setIsHifzEditOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">تعديل مهمة الحفظ والآيات</h3>
                  <p className="text-xs text-slate-400 mt-0.5">قم بتعديل تفاصيل المقرر التراكمي للحلقة</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">العنوان العام للمهمة</label>
                    <input 
                      type="text" 
                      value={editHifzTitle}
                      onChange={(e) => setEditHifzTitle(e.target.value)}
                      placeholder="عنوان التسميع المقرّر..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs font-bold text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block mr-1">التعليمات المطلوبة بالتفصيل</label>
                    <textarea 
                      value={editHifzRequired}
                      onChange={(e) => setEditHifzRequired(e.target.value)}
                      className="w-full h-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs resize-none text-right"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block pb-1">نوع المهمة</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setEditHifzStatus('new')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${editHifzStatus === 'new' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                          تسميع جديد
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditHifzStatus('revision')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${editHifzStatus === 'revision' ? 'bg-amber-50 text-amber-700 border-amber-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                          مراجعة
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">موعد التسليم النهائي</label>
                      <input 
                        type="text" 
                        value={editHifzDueDate}
                        onChange={(e) => setEditHifzDueDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs font-bold text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveEditHifz}
                    className="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs"
                  >
                    حفظ التعديلات
                  </button>
                  <button 
                    onClick={() => setIsHifzEditOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Memorization Roster Modal */}
        {isRosterModalOpen && activeRosterTask && (
          <div 
            onClick={() => setIsRosterModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm" dir="rtl"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 text-right flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setIsRosterModalOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors z-20"
              >
                <X size={18} />
              </button>

              {(() => {
                const chronologicalTasks = [...memorizationTasks].sort((a: any, b: any) => {
                  const isSeedA = a.id?.startsWith('hifz-seed');
                  const isSeedB = b.id?.startsWith('hifz-seed');
                  if (isSeedA && !isSeedB) return -1;
                  if (!isSeedA && isSeedB) return 1;
                  if (isSeedA && isSeedB) return (a.id || '').localeCompare(b.id || '');
                  const tsA = parseInt(a.id?.replace('hifz-', '') || '0') || 0;
                  const tsB = parseInt(b.id?.replace('hifz-', '') || '0') || 0;
                  return tsA - tsB;
                });
                const chronoIndex = chronologicalTasks.findIndex(ct => ct.id === activeRosterTask.id);

                const completedStudentsCount = students.filter(student => {
                  const sGrades = grades.find((g: any) => g.studentId === student.id && g.semester === currentSemester && g.period === currentPeriod) || { hifz: [] };
                  let isCompletedByGrade = false;
                  if (chronoIndex >= 0 && chronoIndex < 4) {
                    const hGrade = sGrades.hifz?.[chronoIndex];
                    if (hGrade !== undefined && hGrade !== null && String(hGrade).trim() !== '' && String(hGrade).trim() !== '-') {
                      isCompletedByGrade = true;
                    }
                  }
                  return isCompletedByGrade || activeRosterTask.completedStudents?.includes(student.id) || false;
                }).length;

                return (
                  <>
                    <div className="mb-4">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider font-sans">سجل تسميع سور الحفظ اليومية</span>
                      <h3 className="text-base font-black text-slate-800 mt-1">تحديد المنجزين: {activeRosterTask.title}</h3>
                      <p className="text-xs text-slate-450 mt-1 flex-wrap">انقر على المربع بجانب الطالب للرصد المباشر للتسميع بنجاح (100% إنجاز).</p>
                      <div className="flex justify-between items-center bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/40 text-[11px] font-extrabold text-slate-600 mt-2">
                        <span>السورة المقرّرة: {activeRosterTask.surah} ({activeRosterTask.verses}) {chronoIndex >= 0 && chronoIndex < 4 && `(الخانة ${chronoIndex+1})`}</span>
                        <span>النسبة الكلية: {Math.round((completedStudentsCount / (students.length || 1)) * 100)}%</span>
                      </div>
                    </div>

                    {/* List of students filtered for selectedClass */}
                    <div className="overflow-y-auto pr-1 py-1 flex-1 space-y-2 max-h-[45vh] no-scrollbar">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student: any) => {
                          const sGrades = grades.find((g: any) => g.studentId === student.id && g.semester === currentSemester && g.period === currentPeriod) || { hifz: [] };
                          let isCompletedByGrade = false;
                          let scoreEntered = '';
                          if (chronoIndex >= 0 && chronoIndex < 4) {
                            const hGrade = sGrades.hifz?.[chronoIndex];
                            if (hGrade !== undefined && hGrade !== null && String(hGrade).trim() !== '' && String(hGrade).trim() !== '-') {
                              isCompletedByGrade = true;
                              scoreEntered = String(hGrade).trim();
                            }
                          }
                          const isCompleted = isCompletedByGrade || activeRosterTask.completedStudents?.includes(student.id) || false;

                          return (
                            <div 
                              key={student.id} 
                              onClick={() => toggleStudentCompletion(student.id)}
                              className={`flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50/80 transition-all cursor-pointer ${
                                isCompleted 
                                  ? 'bg-emerald-50/30 border-emerald-300' 
                                  : 'bg-white border-slate-150'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0 ${
                                  isCompleted 
                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                    : 'border-slate-350 bg-slate-50'
                                }`}>
                                  {isCompleted && <Check size={12} strokeWidth={3} />}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-extrabold text-slate-700">{student.name}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold">{student.class}</p>
                                </div>
                              </div>
                              
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                isCompleted 
                                  ? 'bg-emerald-100/70 text-emerald-800 font-extrabold' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {isCompletedByGrade 
                                  ? `تم بوضع درجة بالرصد (${scoreEntered}) ✓` 
                                  : isCompleted 
                                    ? 'تم رصد التسميع غيباً ✓' 
                                    : 'لم يسمع بعد'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-400 font-semibold">لا يوجد طلاب متطابقين مع تصفية الصف الحالي.</div>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-2 pt-4 border-t border-slate-150 mt-4 shrink-0">
                <button 
                  onClick={() => setIsRosterModalOpen(false)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                >
                  حفظ وتأكيد رصد الطلاب
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toastMsg && (
        <div className="fixed bottom-24 lg:bottom-10 left-4 sm:left-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-black border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
