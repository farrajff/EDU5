import { useState } from 'react';
import { Search, Download, Printer, Award, Calculator, Sparkles, BookOpen, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

function normalizeArabic(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/\s+/g, ' ');
}

export function NoorPage() {
  const { state, updateState } = useApp();
  const studentsList = [...(state.students || [])].sort((a: any, b: any) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ar');
  });
  const classesList = state.classes || [];
  const grades = state.grades || [];

  const [searchTerm, setSearchTerm] = useState('');

  const selectedClass = (state.selectedClass && state.selectedClass !== 'الكل') 
    ? state.selectedClass 
    : (classesList[0] || '');

  const setSelectedClass = (newClass: string) => {
    updateState({ selectedClass: newClass });
  };

  const getSubgrades = (studentId: string, semester: string, period: string) => {
    const g = grades.find((g: any) => g.studentId === studentId && g.semester === semester && g.period === period) || {
      homework: Array(10).fill(false),
      participation: Array(10).fill(false),
      recitation: Array(4).fill(0),
      tajweed: Array(4).fill(0),
      hifz: Array(4).fill(0),
      task: 0,
      oral: 0,
      written: 0
    };

    // homework (out of 10) - each checked homework slot represents exactly 1 mark
    const hwScore = g.homework ? g.homework.filter(Boolean).length : 0;
    
    // participation (out of 10) - each checked participation slot represents exactly 1 mark
    const partScore = g.participation ? g.participation.filter(Boolean).length : 0;
    
    // Recitation (out of 5)
    const registeredRecitationCount = g.recitation ? g.recitation.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    const recitationScore = registeredRecitationCount > 0 
      ? (g.recitation.slice(0, registeredRecitationCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredRecitationCount)
      : 0;

    // Tajweed (out of 5)
    const registeredTajweedCount = g.tajweed ? g.tajweed.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    const tajweedScore = registeredTajweedCount > 0 
      ? (g.tajweed.slice(0, registeredTajweedCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredTajweedCount)
      : 0;

    // Hifz (out of 5)
    const registeredHifzCount = g.hifz ? g.hifz.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    const hifzTestsScore = registeredHifzCount > 0
      ? (g.hifz.slice(0, registeredHifzCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredHifzCount)
      : 0;

    const taskScore = parseFloat(g.task) || 0;
    
    // Calculate Oral out of 15 (sum of averages of recitation, tajweed, hifz)
    const oralScore = parseFloat((recitationScore + tajweedScore + hifzTestsScore).toFixed(1));
    const writtenScore = parseFloat(g.written) || 0;

    // Classwork / Year Work (أعمال السنة) max 40:
    // Homework (10) + Participation (10) + Short/Daily evaluations (recitation 5 + tajweed 5 + hifz 5) + Performative task (5) = 40
    const examYearWork = hwScore + partScore + recitationScore + tajweedScore + hifzTestsScore + taskScore;
    const classworkScore = parseFloat(examYearWork.toFixed(1));

    // Exam grade (درجة الاختبار) max 60:
    // Oral Exam (15) + Written Exam (45) = 60
    const examFinalScore = oralScore + writtenScore;
    const examScore = parseFloat(examFinalScore.toFixed(1));

    const totalNoor = parseFloat((classworkScore + examScore).toFixed(1));

    let rating = 'غير محدد';
    let ratingColor = 'text-slate-450';
    if (totalNoor >= 90) {
      rating = 'ممتاز';
      ratingColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
    } else if (totalNoor >= 80) {
      rating = 'جيد جداً';
      ratingColor = 'text-blue-600 bg-blue-50 border-blue-100';
    } else if (totalNoor >= 65) {
      rating = 'جيد';
      ratingColor = 'text-amber-600 bg-amber-50 border-amber-100';
    } else if (totalNoor >= 50) {
      rating = 'مقبول';
      ratingColor = 'text-indigo-600 bg-indigo-50 border-indigo-100';
    } else if (totalNoor > 0) {
      rating = 'ضعيف';
      ratingColor = 'text-rose-600 bg-rose-50 border-rose-100';
    }

    return {
      classwork: classworkScore, // Out of 40
      exam: examScore,           // Out of 60
      total: totalNoor,          // Out of 100
      rating,
      ratingColor,
      details: {
        hwScore,
        partScore,
        recitationScore,
        tajweedScore,
        hifzTestsScore,
        taskScore,
        oralScore,
        writtenScore
      }
    };
  };

  const currentSemester = state.currentSemester || '1';
  const currentPeriod = state.currentPeriod || '1';

  const classStudents = studentsList.filter(s => s.class?.trim() === selectedClass?.trim());
  const filteredStudents = classStudents.filter(s => {
    const sNameNormalized = normalizeArabic(s.name || '');
    const sIdNormalized = (s.id || '').trim().toLowerCase();
    const searchNormalized = normalizeArabic(searchTerm);
    return !searchTerm || sNameNormalized.includes(searchNormalized) || sIdNormalized.includes(searchNormalized);
  });

  const studentsWithNoorGrades = filteredStudents.map(s => {
    const noor = getSubgrades(s.id, currentSemester, currentPeriod);
    return {
      ...s,
      noor
    };
  });

  // Calculations for stats
  const classworkAverage = classStudents.length > 0
    ? parseFloat((classStudents.reduce((sum, s) => sum + getSubgrades(s.id, currentSemester, currentPeriod).classwork, 0) / classStudents.length).toFixed(1))
    : 0;

  const examAverage = classStudents.length > 0
    ? parseFloat((classStudents.reduce((sum, s) => sum + getSubgrades(s.id, currentSemester, currentPeriod).exam, 0) / classStudents.length).toFixed(1))
    : 0;

  const passRate = classStudents.length > 0
    ? Math.round((classStudents.filter(s => getSubgrades(s.id, currentSemester, currentPeriod).total >= 50).length / classStudents.length) * 100)
    : 0;

  const topStudent = classStudents.length > 0
    ? classStudents.map(s => ({
        name: s.name,
        total: getSubgrades(s.id, currentSemester, currentPeriod).total
      })).reduce((top, s) => s.total > top.total ? s : top, { name: 'لا يوجد', total: 0 })
    : { name: 'لا يوجد', total: 0 };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (studentsWithNoorGrades.length === 0) return;
    
    // Arabic headers with double quotes for safety
    const headers = ["اسم الطالب", "أعمال السنة (40)", "الاختبار النهائي (60)"];
    const rows = studentsWithNoorGrades.map(s => [
      `"${(s.name || '').replace(/"/g, '""')}"`,
      s.noor.classwork,
      s.noor.exam
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `رصد_نور_الصف_${selectedClass}_الفترة_${currentPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:space-y-4 text-right" dir="rtl">
      {/* Header card */}
      <header className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white border border-teal-700 shadow-xl relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 bg-emerald-500/25 border border-emerald-400/20 w-fit px-3 py-1 rounded-full">
              <Sparkles size={11} className="text-emerald-300 animate-pulse" />
              <span className="text-xs font-extrabold text-emerald-200">الرصد التلقائي المتوافق مع نظام نور</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Award className="text-amber-400" size={26} />
              رصد نظام نور الرسمي
            </h1>
            <p className="text-sm text-emerald-100/90 mt-2 leading-relaxed">
              تقسيم درجات المادة تلقائياً إلى عامودين رئيسيين: <strong className="text-white">أعمال السنة (40 درجة)</strong> و<strong className="text-white">درجة الاختبار النهائي (60 درجة)</strong> مع حساب المجموع والتقدير تلقائياً لكل طالب من درجاته المسجلة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download size={14} />
              تصدير ملف نور CSV
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Printer size={14} />
              طباعة كشف الرصد
            </button>
          </div>
        </div>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 print:hidden">
        <div className="bg-white border border-slate-200/70 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Calculator size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-450 truncate">أعمال السنة</p>
            <h3 className="text-base sm:text-lg font-black text-slate-800 mt-0.5">{classworkAverage} <span className="text-[10px] sm:text-xs text-slate-400">/ 40</span></h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-455 truncate">درجة الاختبار</p>
            <h3 className="text-base sm:text-lg font-black text-slate-800 mt-0.5">{examAverage} <span className="text-[10px] sm:text-xs text-slate-400">/ 60</span></h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-455 truncate">نسبة النجاح</p>
            <h3 className="text-base sm:text-lg font-black text-slate-800 mt-0.5">{passRate}%</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-black text-slate-455 truncate">الأول على الصف</p>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 truncate" title={topStudent.name}>{topStudent.name}</h3>
            <p className="text-[10px] sm:text-[11px] text-amber-600 font-bold mt-0.5">{topStudent.total} د</p>
          </div>
        </div>
      </section>

      {/* Roster Controls */}
      <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-center print:hidden">
        <div className="relative w-full md:flex-1 group">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الرقم التعريفي للرصد السريع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-xs sm:text-sm font-bold transition-all"
          />
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-1.5 items-center w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-black text-slate-450 shrink-0">الصف:</span>
          {classesList.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedClass(c)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all border-2 shrink-0 ${
                selectedClass === c
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Mobile Swipe Hint */}
      <div className="lg:hidden flex items-center justify-between gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800">
        <span>👈 اسحب الجدول أفقياً لعرض أعمال السنة والاختبار 👉</span>
      </div>

      {/* PDF/Print view cover */}
      <div className="hidden print:block text-center mx-auto space-y-1 mb-4">
        <h1 className="text-lg font-black text-slate-900 border-b pb-1">كشف رصد درجات الطلاب المتكامل (نظام نور)</h1>
        <p className="text-xs font-bold text-slate-500">مدرسة الدراسات الإسلامية | الصف والتربية: {selectedClass} | الفصل الدراسي: {currentSemester} - الفترة {currentPeriod}</p>
      </div>

      {/* Core Noor Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-800">قائمة رصد الصف الحالي ({selectedClass})</h3>
            <p className="text-[10px] sm:text-xs font-bold text-slate-450 mt-0.5">الفصل الدراسي {currentSemester} - الفترة {currentPeriod}</p>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-slate-400">نظام نور</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 font-extrabold text-slate-500 text-xs sm:text-sm">
                <th className="px-3 sm:px-6 py-3.5 sticky right-0 bg-slate-50/95 z-20 border-l border-slate-200 w-[150px] min-w-[150px] sm:w-[220px] sm:min-w-[220px]">اسم الطالب</th>
                <th className="px-4 py-4 text-center border-r border-slate-100 bg-emerald-50/30 text-emerald-800">
                  <div className="font-extrabold text-xs">أعمال السنة</div>
                  <div className="text-[11px] opacity-75 mt-0.5 font-medium">الحد الأقصى (40)</div>
                </th>
                <th className="px-4 py-4 text-center border-r border-slate-100 bg-indigo-50/30 text-indigo-800">
                  <div className="font-extrabold text-xs">درجة الاختبار</div>
                  <div className="text-[11px] opacity-75 mt-0.5 font-medium">الحد الأقصى (60)</div>
                </th>
                <th className="px-4 py-4 text-center border-r border-slate-100 bg-slate-50">
                  <div className="font-extrabold text-xs">المجموع النهائي</div>
                  <div className="text-[11px] opacity-75 mt-0.5 font-medium">الحد الأقصى (100)</div>
                </th>
                <th className="px-4 py-4 text-center border-r border-slate-100">الحالة / التقدير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-705">
              {studentsWithNoorGrades.length > 0 ? studentsWithNoorGrades.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-3 sm:px-6 py-3.5 font-black sticky right-0 bg-white z-10 border-l border-slate-100 w-[150px] min-w-[150px] sm:w-[220px] sm:min-w-[220px]">
                     <div className="text-slate-850 font-sans text-xs sm:text-sm md:text-base truncate" title={s.name}>{s.name}</div>
                  </td>
                  
                  {/* Classwork Columns (out of 40) */}
                  <td className="px-4 py-4 text-center border-r border-slate-100 font-black text-emerald-700 bg-emerald-50/10 text-base">
                    {s.noor.classwork}
                  </td>

                  {/* Exam column (out of 60) */}
                  <td className="px-4 py-4 text-center border-r border-slate-100 font-black text-indigo-700 bg-indigo-50/10 text-base">
                    {s.noor.exam}
                  </td>

                  {/* Total column (out of 100) */}
                  <td className="px-4 py-4 text-center border-r border-slate-100 font-black text-slate-900 text-base bg-slate-50/30">
                    {s.noor.total}
                  </td>

                  {/* Grade Rating */}
                  <td className="px-4 py-4 text-center border-r border-slate-100 whitespace-nowrap">
                    <span className={`px-3 py-1 font-extrabold rounded-full text-xs border ${s.noor.ratingColor}`}>
                      {s.noor.rating}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-slate-400 font-semibold italic">
                    لا يوجد طلاب مسجلين في هذا الفصيل حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Signature block for official printer reports */}
      <div className="hidden print:flex justify-between items-center text-xs font-black text-slate-700 mx-4 mt-8">
        <div className="text-center space-y-4">
          <p>توقيع معلم المادة</p>
          <p className="border-t pt-1 w-24 border-slate-300 mx-auto"></p>
        </div>
        <div className="text-center space-y-4">
          <p>توقيع موجه المادة</p>
          <p className="border-t pt-1 w-24 border-slate-300 mx-auto"></p>
        </div>
        <div className="text-center space-y-4">
          <p>اعتماد مدير المدرسة</p>
          <p className="border-t pt-1 w-24 border-slate-300 mx-auto"></p>
        </div>
      </div>
    </div>
  );
}
