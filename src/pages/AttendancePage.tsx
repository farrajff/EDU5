import { useState } from 'react';
import { Search, CalendarDays, CheckCircle2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getHijriDateDetails } from '../components/HijriCalendar';

export function AttendancePage() {
  const { state, updateState, syncData, syncInProgress } = useApp();

  // Deduplicate student list dynamically by ID to avoid React duplicate key collisions/Double rendering/flickers
  const uniqueStudentsMap = new Map();
  (state.students || []).forEach(s => {
    if (s && s.id) {
      const idKey = s.id.trim();
      if (!uniqueStudentsMap.has(idKey)) {
        uniqueStudentsMap.set(idKey, s);
      }
    }
  });
  const uniqueStudentsList = Array.from(uniqueStudentsMap.values());

  const students = uniqueStudentsList.filter(s => s.status !== 'archived' && !s.class?.includes('أرشيف') && !s.class?.includes('ارشيف'));
  const classesList = state.classes || [];
  const activeClassesList = classesList.filter(c => !c.includes('أرشيف') && !c.includes('ارشيف') && !c.includes('الأرشيف'));
  const attendance = state.attendance || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dy = String(now.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  });
  
  const selectedClass = state.selectedClass || 'الكل';
  const setSelectedClass = (newClass: string) => {
    updateState({ selectedClass: newClass });
  };

  const handleSave = async () => {
    await syncData();
  };

  const classes = ['الكل', ...activeClassesList];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.includes(searchTerm) || s.id?.includes(searchTerm);
    const matchesClass = selectedClass === 'الكل' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ar');
  });

  const getStatus = (studentId: string) => {
    const record = attendance.find(a => {
      if (a.studentId !== studentId) return false;
      if (!a.date) return false;
      const rDateStr = a.date.split('T')[0];
      return rDateStr === selectedDate;
    });
    return record?.status || 'present';
  };

  const updateStatus = (studentId: string, status: string) => {
    const newAttendance = [...attendance];
    const index = newAttendance.findIndex(a => {
      if (a.studentId !== studentId) return false;
      if (!a.date) return false;
      const rDateStr = a.date.split('T')[0];
      return rDateStr === selectedDate;
    });
    
    if (index >= 0) {
      newAttendance[index] = { ...newAttendance[index], status, date: new Date(selectedDate).toISOString() };
    } else {
      newAttendance.push({ studentId, status, date: new Date(selectedDate).toISOString() });
    }
    updateState({ attendance: newAttendance });
  };

  const stats = {
    present: students.filter(s => getStatus(s.id) === 'present').length,
    absent: students.filter(s => getStatus(s.id) === 'absent').length,
    late: students.filter(s => getStatus(s.id) === 'late').length,
  };

  const formatArabicLocalDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'غير محدد';
    const weekdaysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthsArabic = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${weekdaysArabic[d.getDay()]}، ${d.getDate()} ${monthsArabic[d.getMonth()]}`;
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Date Picker Card */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[210px]">
          <div className="space-y-2">
            <p className="text-xs font-black text-slate-450 uppercase tracking-widest">تاريخ كشف الحضور</p>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 leading-tight">
                  {formatArabicLocalDate(selectedDate)}
                </h3>
                {(() => {
                  try {
                    const hj = getHijriDateDetails(new Date(selectedDate));
                    return (
                      <span className="text-emerald-605 text-emerald-600 text-xs font-black block mt-1 bg-emerald-55 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 select-none">
                        {hj.day} {hj.monthName} {hj.year} هـ
                      </span>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <CalendarDays size={20} strokeWidth={2} />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-450 block">اختر تاريخاً لتعديل التحضير:</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 outline-none text-sm font-extrabold text-slate-750 focus:border-indigo-500 transition-all font-sans"
              />
              <button 
                onClick={() => {
                  const now = new Date();
                  const yr = now.getFullYear();
                  const mo = String(now.getMonth() + 1).padStart(2, '0');
                  const dy = String(now.getDate()).padStart(2, '0');
                  setSelectedDate(`${yr}-${mo}-${dy}`);
                }}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs sm:text-sm font-extrabold transition-all"
              >
                اليوم
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="lg:col-span-8 bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden grid grid-cols-3 gap-2 sm:gap-6">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 border-l border-slate-800 space-y-1 sm:space-y-2">
            <p className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">حاضر</p>
            <p className="text-2xl sm:text-4xl font-extrabold text-emerald-400 leading-none">{stats.present}</p>
            <span className="inline-block bg-emerald-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold tracking-wide border border-emerald-505/10 text-emerald-400">
              {students.length > 0 ? Math.round((stats.present / students.length) * 100) : 0}٪ مستمر
            </span>
          </div>

          <div className="relative z-10 border-l border-slate-800 space-y-1 sm:space-y-2">
            <p className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">غائب</p>
            <p className="text-2xl sm:text-4xl font-extrabold text-rose-400 leading-none">{stats.absent}</p>
            <span className="inline-block bg-rose-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold tracking-wide border border-rose-505/10 text-rose-400">تنبيه الغياب</span>
          </div>

          <div className="relative z-10 space-y-1 sm:space-y-2">
            <p className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">متأخر</p>
            <p className="text-2xl sm:text-4xl font-extrabold text-amber-400 leading-none">{stats.late}</p>
            <span className="inline-block bg-amber-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold tracking-wide border border-amber-501/10 text-amber-400">مراجعة</span>
          </div>
        </div>
      </section>

      {/* List Search & Filter */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 w-full lg:w-auto">قائمة التحضير <span className="text-xs sm:text-sm text-slate-450 ml-2">({filteredStudents.length} طالباً)</span></h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto sm:items-center">
            <div className="relative flex-1 lg:w-64 group w-full">
              <Search className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="البحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 hover:bg-slate-100/50 focus:bg-white focus:border-indigo-500 outline-none text-xs sm:text-sm transition-all"
              />
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 items-center w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-black text-slate-450 shrink-0">الصف:</span>
              {classes.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedClass(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-2 shrink-0 ${
                    selectedClass === c
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Rows */}
        <div className="space-y-3 px-1 sm:px-2 pb-6">
          {sortedStudents.length > 0 ? sortedStudents.map((student, index) => {
            const status = getStatus(student.id);
            return (
              <div key={student.id} className="bg-slate-50 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between group transition-all hover:shadow-md hover:bg-white border border-slate-200/50 hover:border-indigo-200">
                <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                    <span className="text-sm sm:text-base font-extrabold">{index + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-800 text-sm sm:text-base group-hover:text-indigo-600 transition-colors truncate">{index + 1}. {student.name}</p>
                    <p className="text-[11px] sm:text-xs font-extrabold text-slate-550 flex items-center gap-1.5 mt-0.5 sm:mt-1">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      الفصل: {student.class}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto mt-3 md:mt-0">
                  <button 
                    onClick={() => updateStatus(student.id, 'present')}
                    className={`flex-1 md:flex-none px-4 sm:px-6 py-2 sm:py-1.5 rounded-lg text-xs font-extrabold transition-all min-h-[38px] ${
                    status === 'present' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
                  }`}>
                    حاضر
                  </button>
                  <button 
                    onClick={() => updateStatus(student.id, 'absent')}
                    className={`flex-1 md:flex-none px-4 sm:px-6 py-2 sm:py-1.5 rounded-lg text-xs font-extrabold transition-all min-h-[38px] ${
                    status === 'absent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                  }`}>
                    غائب
                  </button>
                  <button 
                    onClick={() => updateStatus(student.id, 'late')}
                    className={`flex-1 md:flex-none px-4 sm:px-6 py-2 sm:py-1.5 rounded-lg text-xs font-extrabold transition-all min-h-[38px] ${
                    status === 'late' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                  }`}>
                    متأخر
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 text-xs text-slate-400">
               لا يوجد طلاب مضافين حالياً. يرجى إضافة طلاب من صفحة "إدارة الفصول".
             </div>
          )}
        </div>
      </section>
      
      <button 
        onClick={handleSave}
        disabled={syncInProgress}
        className="fixed bottom-20 lg:bottom-6 left-4 sm:left-6 py-3.5 sm:py-4 px-5 sm:px-6 bg-slate-900 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-xl hover:bg-black active:scale-[0.98] transition-all group z-40 flex items-center gap-2.5 sm:gap-3 cursor-pointer disabled:opacity-75"
      >
        <span>{syncInProgress ? 'جاري المزامنة...' : 'حفظ سحابي'}</span>
        <CheckCircle2 size={16} className={`transition-transform group-hover:rotate-12 ${syncInProgress ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

