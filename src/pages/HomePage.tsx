import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Star, 
  BrainCircuit, 
  TrendingUp, 
  ArrowUpRight, 
  CalendarDays, 
  Sparkles, 
  Clock, 
  StickyNote, 
  Plus, 
  Trash2, 
  FileCheck, 
  AlertCircle,
  RefreshCw,
  Award,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getHijriDateDetails } from '../components/HijriCalendar';

export function HomePage() {
  const { state, updateState, syncData, syncInProgress } = useApp();
  const students = (state.students || [])
    .filter((s: any) => s.status !== 'archived' && !s.class?.includes('أرشيف'))
    .sort((a: any, b: any) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, 'ar');
    });
  const attendance = state.attendance || [];
  const homework = state.homework || [];
  const grades = state.grades || [];

  // Local reminders state persistent in localStorage
  const [reminders, setReminders] = useState<string[]>(() => {
    const saved = localStorage.getItem('teacher_dashboard_reminders');
    return saved ? JSON.parse(saved) : [
      'حصر درجات اختبار منتصف الفصل لطلاب العاشر أ',
      'تجهيز أوراق عمل مراجعة سورة البقرة',
      'تحديث كشف الغياب لأسبوع المراجعة الأكاديمي الحالي'
    ];
  });
  const [newReminderText, setNewReminderText] = useState('');
  const [dateTimeStr, setDateTimeStr] = useState('');

  // Update current date/time on mount
  useEffect(() => {
    const formatCurrentDateTime = () => {
      const today = new Date();
      // Format to beautiful Arabic Hijri date
      try {
        const hj = getHijriDateDetails(today);
        const weekdayStr = today.toLocaleDateString('ar-SA', { weekday: 'long' });
        const dateStr = `${weekdayStr}، ${hj.day} ${hj.monthName} ${hj.year} هـ`;
        setDateTimeStr(dateStr);
      } catch (e) {
        const dateStr = today.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        setDateTimeStr(dateStr);
      }
    };

    formatCurrentDateTime();
    const interval = setInterval(formatCurrentDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save reminders to localStorage when they change
  useEffect(() => {
    localStorage.setItem('teacher_dashboard_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const handleAddReminder = () => {
    if (newReminderText.trim() === '') return;
    setReminders(prev => [...prev, newReminderText.trim()]);
    setNewReminderText('');
  };

  const handleRemoveReminder = (index: number) => {
    setReminders(prev => prev.filter((_, i) => i !== index));
  };

  const updateStudentAttendanceStatus = (studentId: string, status: string) => {
    const newAttendance = [...attendance];
    const index = newAttendance.findIndex(a => a.studentId === studentId);
    if (index >= 0) {
      newAttendance[index] = { ...newAttendance[index], status, date: new Date().toISOString() };
    } else {
      newAttendance.push({ studentId, status, date: new Date().toISOString() });
    }
    updateState({ attendance: newAttendance });
  };

  const getAttendanceStatus = (studentId: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD locally
    const record = attendance.find(a => {
      if (a.studentId !== studentId) return false;
      if (!a.date) return false;
      return a.date.split('T')[0] === todayStr;
    });
    return record?.status || 'present';
  };

  // Stats calculation
  const totalStudents = students.length;
  const presentCount = students.filter(s => {
    const status = getAttendanceStatus(s.id);
    return status === 'present' || status === 'late';
  }).length;
  const absentCount = students.filter(s => getAttendanceStatus(s.id) === 'absent').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const activeHomeworksCount = homework.filter(h => h.status === 'active').length;

  // Helper to calculate student overall performance percentage
  const getStudentPercentageInfo = (studentId: string, name: string) => {
    const sem = state.currentSemester || '1';
    const per = state.currentPeriod || '1';
    const g = grades.find((g: any) => g.studentId === studentId && g.semester === sem && g.period === per);
    
    if (g) {
      // 1. Homework (out of 10) - each checked homework slot represents exactly 1 mark
      const hwScore = g.homework ? g.homework.filter(Boolean).length : 0;
      
      // 2. Participation (out of 10) - each checked participation slot represents exactly 1 mark
      const partScore = g.participation ? g.participation.filter(Boolean).length : 0;
      
      // 3. Quran (Recitation, Tajweed, Hifz)
      const registeredRecitationCount = g.recitation ? g.recitation.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
      const recitationScore = registeredRecitationCount > 0 
        ? (g.recitation.slice(0, registeredRecitationCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredRecitationCount)
        : 0;

      const registeredTajweedCount = g.tajweed ? g.tajweed.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
      const tajweedScore = registeredTajweedCount > 0 
        ? (g.tajweed.slice(0, registeredTajweedCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredTajweedCount)
        : 0;

      const registeredHifzCount = g.hifz ? g.hifz.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
      const hifzTestsScore = registeredHifzCount > 0
        ? (g.hifz.slice(0, registeredHifzCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredHifzCount)
        : 0;

      const taskScore = parseFloat(g.task) || 0; // (out of 5)
      const oralScore = parseFloat(g.oral) || 0; // (out of 15)
      const writtenScore = parseFloat(g.written) || 0; // (out of 45)

      const quranTotal = recitationScore + tajweedScore + hifzTestsScore; // (out of 15)
      const totalScore = hwScore + partScore + quranTotal + taskScore + oralScore + writtenScore;

      if (totalScore > 0) {
        return { percentage: Math.round(Math.min(100, totalScore)), isFallback: false };
      }
    }
    
    return { percentage: 0, isFallback: true };
  };

  const getStudentPercentage = (studentId: string, name: string) => {
    return getStudentPercentageInfo(studentId, name).percentage;
  };

  // Compile sorted and filtered outstanding students list of current semester across all classes
  const activeStudents = students.filter((s: any) => s.status === 'active' && !s.class.includes('أرشيف'));
  const currentSem = state.currentSemester || '1';
  const currentPer = state.currentPeriod || '1';
  const hasAnyActualGrades = grades.some((g: any) => g.semester === currentSem && g.period === currentPer && (
    (g.homework && g.homework.some(Boolean)) ||
    (g.participation && g.participation.some(Boolean)) ||
    (g.recitation && g.recitation.some((s: any) => parseFloat(s) > 0)) ||
    (g.tajweed && g.tajweed.some((s: any) => parseFloat(s) > 0)) ||
    (g.hifz && g.hifz.some((s: any) => parseFloat(s) > 0)) ||
    parseFloat(g.task) > 0 ||
    parseFloat(g.written) > 0
  ));

  const outstandingStudents = activeStudents
    .map((student: any) => {
      const info = getStudentPercentageInfo(student.id, student.name);
      return {
        ...student,
        percentage: info.percentage,
        isFallback: info.isFallback
      };
    })
    .filter((s: any) => !s.isFallback && s.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  // Compute an average grade if grades exist based on all active students who actually have grades
  const activeStudentsGroup = students.filter((s: any) => s.status === 'active' && !s.class?.includes('أرشيف'));
  const gradedActiveStudents = activeStudentsGroup
    .map((s: any) => ({ name: s.name, id: s.id, info: getStudentPercentageInfo(s.id, s.name) }))
    .filter(item => !item.info.isFallback);

  const averageGrade = gradedActiveStudents.length > 0 
    ? Math.round(gradedActiveStudents.reduce((sum, item) => sum + item.info.percentage, 0) / gradedActiveStudents.length) 
    : 0;

  // Dynamic class statistics calculation to make the bar chart adaptive and fully connected to real live actions
  const classesList = (state.classes || []).filter(c => !c.includes('أرشيف'));
  const classStats = classesList.map((clsName: string, idx: number) => {
    const clsStudents = students.filter((s: any) => s.class === clsName);
    const totalCount = clsStudents.length;
    
    let rate = 0;
    if (totalCount > 0) {
      const gradedCls = clsStudents
        .map(s => getStudentPercentageInfo(s.id, s.name))
        .filter(info => !info.isFallback);
      if (gradedCls.length > 0) {
        const totalSum = gradedCls.reduce((sum, info) => sum + info.percentage, 0);
        rate = Math.round(totalSum / gradedCls.length);
      }
    }

    if (totalCount > 0 && rate > 0) {
      rate = Math.min(100, Math.max(35, rate));
    } else {
      rate = 0;
    }

    const colors = [
      'bg-indigo-650 bg-indigo-600',
      'bg-indigo-505 bg-indigo-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];
    const color = colors[idx % colors.length];

    return {
      label: clsName,
      rate,
      total: totalCount,
      color
    };
  });

  return (
    <div className="space-y-4">
      
      {/* Dynamic Welcome Hero Badge - Tighter & Sleeker */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-4 text-white border border-slate-800 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-550/20 px-3 py-1 rounded-full text-indigo-300 text-xs font-extrabold animate-pulse">
              <Sparkles size={13} />
              <span>الدراسات الإسلامية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">أهلاً بك مجدداً 🌟</h1>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base font-medium max-w-2xl">
              يوم تربوي جديد ومثمر ينتظر طلابك. تتبع وتحديث درجاتهم وحضورهم وحفظهم بكل سهولة وسرعة تلقائياً.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 shadow-sm self-stretch sm:self-auto justify-center shrink-0">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-inner">
              <Clock size={18} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none">تاريخ اليوم</p>
              <h4 className="text-xs sm:text-sm md:text-base font-black text-white mt-1 whitespace-nowrap">{dateTimeStr || 'جاري التحميل...'}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid - Compact, Inline design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Total Students Stat */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg border bg-indigo-50 border-indigo-100/65 text-indigo-600 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              <Users size={19} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 leading-none">إجمالي الطلاب</p>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
                {totalStudents} <span className="text-xs text-slate-450 font-bold">طالب</span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-black text-emerald-600 shrink-0">
            +{totalStudents}
            <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Attendance stats */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg border bg-amber-50 border-amber-100/65 text-amber-600 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              <CalendarDays size={19} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 leading-none">نسبة الحضور</p>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
                {attendanceRate}%
              </h3>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-450 text-left shrink-0">
            {presentCount} ح / {absentCount} غ
          </div>
        </div>

        {/* Active homeworks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg border bg-rose-50 border-rose-100/65 text-rose-600 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              <BrainCircuit size={19} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 leading-none">مهام أعمال السنة</p>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
                {activeHomeworksCount} <span className="text-xs text-slate-450 font-bold">مهمة</span>
              </h3>
            </div>
          </div>
          <span className="bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-xs font-extrabold text-rose-700 shrink-0">
            {activeHomeworksCount > 0 ? 'مستمر' : 'كامل'}
          </span>
        </div>

      </div>

      {/* Cohesive Dynamic Dashboard Widgets Grid - Single Compact Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Dynamic visually designed Bar Chart of Class Active engagement - Fully Connected to real classes state */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-5 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">نشاط الصفوف التفاعلي</h3>
              <p className="text-xs font-bold text-slate-450">معدل تفاعل وإنجاز الطلاب التراكمي حسب الصف</p>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-black text-slate-500">محدث تلقائياً</span>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2.5 pt-6 px-1">
            {classStats.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative cursor-pointer min-w-[45px]">
                {/* Tooltip on hover */}
                <div className="absolute -top-7 bg-slate-800 text-white rounded px-2 py-1 text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow whitespace-nowrap z-10">
                  {item.rate}% {item.total > 0 && `(${item.total} طالب)`}
                </div>
                
                <div className="w-full bg-slate-50/80 rounded-md h-28 flex items-end overflow-hidden border border-slate-200/30 relative shadow-inner">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${item.rate}%` }}
                    transition={{ duration: 0.9, delay: idx * 0.04 }}
                    className={`w-full ${item.color} rounded-t-sm`}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-550 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center" title={item.label}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Teacher sticky reminders and board - Connected to localStorage */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between min-h-[300px] relative z-10 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
              <div className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg">
                <StickyNote size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800">مفكرة التدوين السريعة</h3>
                <p className="text-xs font-bold text-slate-450">سجل هنا التنبيهات والأفكار السريعة</p>
              </div>
            </div>

            {/* Sticky Notes List */}
            <div className="space-y-1.5 max-h-[125px] overflow-y-auto no-scrollbar pr-1">
              <AnimatePresence initial={false}>
                {reminders.map((reminder, idx) => (
                  <motion.div 
                    layout
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-2 md:p-2.5 bg-amber-50/40 border border-amber-100/30 rounded-lg group/item animate-fade-in"
                  >
                    <div className="flex items-center gap-2 text-right min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <p className="text-[13px] sm:text-sm font-bold text-slate-800 leading-snug truncate">{reminder}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveReminder(idx)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors shrink-0"
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {reminders.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 italic">لا توجد ملاحظات. سجل فكرتك بالأسفل.</div>
              )}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 w-full">
            <div className="flex items-center gap-1.5 w-full">
              <input 
                type="text" 
                placeholder="تذكير جديد عاجل..."
                value={newReminderText}
                onChange={(e) => setNewReminderText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddReminder();
                }}
                className="flex-1 min-w-0 w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
              <button 
                onClick={handleAddReminder}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all cursor-pointer shrink-0"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* Top Outstanding Students Showcase */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">أوائل الطلبة</h3>
                <p className="text-xs font-bold text-slate-450 mt-0.5">الترتيب التراكمي لأفضل مستويات التحصيل على مستوى جميع الصفوف</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-1 gap-3.5">
              {outstandingStudents.map((student, i) => {
                const rankColor = i === 0 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-black' 
                  : i === 1 
                    ? 'bg-slate-50 text-slate-700 border-slate-200 font-bold' 
                    : 'bg-orange-50/70 text-orange-705 text-orange-700 border-orange-150 font-bold';
                
                return (
                  <div key={student.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100/80 hover:bg-slate-50/80 transition-all bg-slate-50/10 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm shrink-0 shadow-sm ${rankColor}`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 pr-1">
                        <p className="text-sm md:text-base font-extrabold text-slate-850 break-words leading-tight whitespace-normal">{student.name}</p>
                        <p className="text-xs text-slate-550 font-semibold mt-1">{student.class}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500 shrink-0">
                      <Star size={15} fill="currentColor" />
                      <span className="text-sm md:text-base font-black text-amber-600">{student.percentage}%</span>
                    </div>
                  </div>
                );
              })}
               {outstandingStudents.length === 0 && (
                 <div className="col-span-full text-center py-10 text-slate-450 font-extrabold text-xs">
                   لا تتوفر درجات مرصودة حالياً لعرض أوائل الطلبة. يرجى رصد الدرجات أولاً.
                 </div>
               )}
            </div>
          </div>

          <p className="text-xs font-extrabold text-slate-450 leading-normal text-right pt-3 border-t border-slate-50 shrink-0 mt-4">
            * يحسب الترتيب تلقائياً حسب كشف التحصيل.
          </p>
        </div>

      </div>

      {/* سجل عمليات الاستعلام البوابة الطلابية */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg shrink-0">
              <Search size={18} />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-black text-slate-800">سجل عمليات البحث في البوابة الطلابية</h3>
              <p className="text-xs font-bold text-slate-450 mt-0.5">الطلاب الذين تم البحث عن أسمائهم واستعراض ملفاتهم مؤخراً عبر بوابة الطلاب المباشرة</p>
            </div>
          </div>
          {(state.searchedStudentIds || []).length > 0 && (
            <button 
              onClick={() => updateState({ searchedStudentIds: [] })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Trash2 size={13} />
              <span>مسح السجل</span>
            </button>
          )}
        </div>

        {(() => {
          const searchedIds = state.searchedStudentIds || [];
          const searchedStudentsList = searchedIds
            .map((id: string) => (state.students || []).find((s: any) => s.id === id))
            .filter(Boolean);

          if (searchedStudentsList.length > 0) {
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchedStudentsList.map((student: any) => {
                  const percentage = getStudentPercentage(student.id, student.name);
                  
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-150 bg-slate-50/20 hover:bg-slate-50/80 transition-all shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center font-black text-xs shrink-0">
                          {student.name?.[0]}
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 break-words">{student.name}</p>
                          <p className="text-[10px] text-slate-450 font-bold mt-0.5">{student.class}</p>
                        </div>
                      </div>
                      {percentage > 0 ? (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100/60 shrink-0">
                          <span className="text-xs font-black">{percentage}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                          <span className="text-[10px] font-bold">لا درجات</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <div className="text-center py-10 text-slate-450 bg-slate-50/30 border border-dashed border-slate-200 rounded-xl max-w-3xl mx-auto">
              <p className="text-xs sm:text-sm font-bold text-slate-700">لا توجد عمليات بحث مسجلة حالياً</p>
              <p className="text-[11px] font-semibold text-slate-450 mt-1.5 leading-relaxed max-w-xl mx-auto px-4">
                عند دخول الطلاب أو أولياء الأمور إلى البوابة الطلابية والاستعلام عن درجات الطالب بالاسم، ستظهر لك أسمائهم هنا فوراً وبشكل تلقائي لتسهيل المتابعة اليومية.
              </p>
            </div>
          );
        })()}
      </div>

    </div>
  );
}

