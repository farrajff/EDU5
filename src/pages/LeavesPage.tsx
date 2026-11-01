import { useState } from 'react';
import { 
  UserCheck, 
  ShieldAlert, 
  HelpCircle,
  Search,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

export function LeavesPage() {
  const { state, updateState } = useApp();
  const students = (state.students || []).filter(s => s.status !== 'archived' && !s.class?.includes('أرشيف'));
  const classesList = state.classes || [];
  const attendance = state.attendance || [];

  const [searchTerm, setSearchTerm] = useState('');
  
  const selectedClass = state.selectedClass || 'الكل';
  const setSelectedClass = (newClass: string) => {
    updateState({ selectedClass: newClass });
  };

  const classes = ['الكل', ...classesList];

  const updateStatus = (studentId: string, newStatus: string) => {
    const newAttendance = [...attendance];
    const index = newAttendance.findIndex(a => a.studentId === studentId);
    if (index >= 0) {
      newAttendance[index] = { ...newAttendance[index], status: newStatus, date: new Date().toISOString() };
    } else {
      newAttendance.push({ studentId, status: newStatus, date: new Date().toISOString() });
    }
    updateState({ attendance: newAttendance });
  };

  const getStatus = (studentId: string) => {
    const record = attendance.find(a => a.studentId === studentId);
    return record?.status || 'present';
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.includes(searchTerm) || s.id?.includes(searchTerm);
    const matchesClass = selectedClass === 'الكل' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  }).sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ar');
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'absent': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'restroom': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'with_deputy': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'with_counselor': return 'bg-sky-50 text-sky-700 border-sky-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-black text-slate-800">نظام الاستئذان والتواجد</h2>
        <p className="text-sm font-semibold text-slate-450 mt-1">متابعة أماكن تواجد الطلاب وتحديثات تصاريح الخروج المؤقت خلال الحصة الدراسية</p>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="بحث عن اسم طالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-extrabold transition-all"
          />
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 items-center w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-black text-slate-450 shrink-0">الصف:</span>
          {classes.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedClass(c)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-2 shrink-0 ${
                selectedClass === c
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Permits Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-650">الطالب</th>
                <th className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-650 text-center">الحالة الحالية</th>
                <th className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-650 text-center">تحديث الموقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                const status = getStatus(student.id);
                return (
                  <tr 
                    key={student.id}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border transition-colors ${
                          status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          status === 'absent' ? 'bg-rose-550/10 text-rose-600 border-rose-100' :
                          status === 'restroom' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          status === 'with_deputy' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-sky-50 text-sky-600 border-sky-100'
                        }`}>
                          {student.name?.[0]}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                          <p className="text-xs font-bold text-slate-450 mt-1">{student.class}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(status)}`}>
                        {status === 'present' && 'حاضر'}
                        {status === 'absent' && 'غائب'}
                        {status === 'restroom' && 'حمام'}
                        {status === 'with_deputy' && 'وكيل'}
                        {status === 'with_counselor' && 'موجه'}
                        {status === 'late' && 'متأخر'}
                        {status === 'none' && 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                         <button 
                           onClick={() => updateStatus(student.id, 'present')}
                           className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                           title="حاضر"
                         >
                           <UserCheck size={14} />
                         </button>
                         <button 
                           onClick={() => updateStatus(student.id, 'restroom')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${status === 'restroom' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-purple-50 hover:text-purple-600'}`}
                           title="دورة مياه"
                         >
                           دورة مياه
                         </button>
                         <button 
                           onClick={() => updateStatus(student.id, 'with_deputy')}
                           className={`p-2 rounded-lg transition-all ${status === 'with_deputy' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500'}`}
                           title="وكيل"
                         >
                           <ShieldAlert size={14} />
                         </button>
                         <button 
                           onClick={() => updateStatus(student.id, 'with_counselor')}
                           className={`p-2 rounded-lg transition-all ${status === 'with_counselor' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-sky-50 hover:text-sky-500'}`}
                           title="موجه"
                         >
                           <HelpCircle size={14} />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                    لا يوجد طلاب مضافين للعرض.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white rounded-xl text-indigo-600 border border-slate-100 shadow-sm shrink-0">
              <ShieldAlert size={20} />
           </div>
           <div>
              <p className="text-sm font-black text-slate-800">تلميح إداري</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">تحديد حالة الطالب هنا يؤثر مباشرة على تلوين خانة الاسم في كشف الدرجات للتمييز البصري السريع.</p>
           </div>
        </div>
        <div className="flex gap-6 text-center">
           <div>
              <p className="text-lg font-extrabold text-slate-800">{attendance.filter(p => p.status === 'restroom').length}</p>
              <p className="text-[11px] font-black text-purple-650 mt-0.5 uppercase tracking-wider">حمام</p>
           </div>
           <div>
              <p className="text-lg font-extrabold text-slate-800">{attendance.filter(p => p.status === 'with_deputy').length}</p>
              <p className="text-[11px] font-black text-amber-650 mt-0.5 uppercase tracking-wider">وكيل</p>
           </div>
           <div>
              <p className="text-lg font-extrabold text-slate-800">{attendance.filter(p => p.status === 'with_counselor').length}</p>
              <p className="text-[11px] font-black text-indigo-650 mt-0.5 uppercase tracking-wider">موجه</p>
           </div>
        </div>
      </div>
    </div>
  );
}
