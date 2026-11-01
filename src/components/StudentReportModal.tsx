import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  User, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  CheckSquare, 
  Award, 
  FileText, 
  FileBadge 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getHijriDateDetails } from './HijriCalendar';

interface StudentReportModalProps {
  student: any;
  onClose: () => void;
}

function getSundayOfWeek(d: Date): Date {
  const sunday = new Date(d);
  const day = d.getDay();
  sunday.setDate(d.getDate() - day);
  return sunday;
}

export function StudentReportModal({ student, onClose }: StudentReportModalProps) {
  const { state } = useApp();
  const [showDetailedGrades, setShowDetailedGrades] = useState(false);

  if (!student) return null;

  const currentSemester = state.currentSemester || '1';
  const currentPeriod = state.currentPeriod || '1';
  const grades = state.grades || [];
  const attendance = state.attendance || [];
  const allStudents = (state.students || []).filter((s: any) => s.status !== 'archived');
  const classmates = allStudents.filter((s: any) => s.class === student.class);

  const getStudentGrades = (studentId: string) => {
    return grades.find((g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod) || {
      homework: Array(10).fill(false),
      participation: Array(10).fill(false),
      recitation: Array(4).fill(0),
      tajweed: Array(4).fill(0),
      hifz: Array(4).fill(0),
      task: 0,
      oral: 0,
      written: 0
    };
  };

  const getAverage = (arr: any[]) => {
    if (!arr) return 0;
    const registeredCount = arr.reduce((max: number, score: any, idx: number) => {
      const val = parseFloat(score);
      return val > 0 ? idx + 1 : max;
    }, 0);
    return registeredCount > 0 
      ? (arr.slice(0, registeredCount).reduce((subA: number, subB: any) => subA + (parseFloat(subB) || 0), 0) / registeredCount)
      : 0;
  };

  const calculateStudentScores = (studentId: string) => {
    const g = getStudentGrades(studentId);

    const hwScore = g.homework ? g.homework.filter(Boolean).length : 0;
    const partScore = g.participation ? g.participation.filter(Boolean).length : 0;

    const recitationScore = getAverage(g.recitation);
    const tajweedScore = getAverage(g.tajweed);
    const hifzTestsScore = getAverage(g.hifz);

    const taskScore = parseFloat(g.task) || 0;
    const quranTotal = recitationScore + tajweedScore + hifzTestsScore;
    const oralScore = parseFloat(g.oral) || parseFloat(quranTotal.toFixed(1)) || 0;
    const writtenScore = parseFloat(g.written) || 0;

    const hideOralExam = !!state.hideOralExam;
    const maxScore = 100;
    const totalScore = hwScore + partScore + quranTotal + taskScore + (hideOralExam ? 0 : oralScore) + writtenScore;
    const percentage = Math.round(Math.min(100, (totalScore / maxScore) * 100));

    return {
      hwScore,
      partScore,
      recitationScore: parseFloat(recitationScore.toFixed(1)),
      tajweedScore: parseFloat(tajweedScore.toFixed(1)),
      hifzTestsScore: parseFloat(hifzTestsScore.toFixed(1)),
      quranTotal: parseFloat(quranTotal.toFixed(1)),
      taskScore,
      oralScore: parseFloat(oralScore.toFixed(1)),
      writtenScore,
      totalScore: parseFloat(Math.min(maxScore, totalScore).toFixed(1)),
      maxScore,
      percentage
    };
  };

  const scoreInfo = calculateStudentScores(student.id);

  // Status text and colors matching Student Portal
  const getStatusText = (percentage: number) => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 65) return 'جيد';
    if (percentage >= 50) return 'مقبول';
    return 'ضعيف (غير مجتاز)';
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (percentage >= 80) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (percentage >= 65) return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    if (percentage >= 50) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
  };

  // Rank calculation matching Student Portal
  const getStudentRank = () => {
    if (scoreInfo.totalScore <= 15) {
      return { rankText: 'يظهر بعد رصد أكثر من 15 درجة' };
    }

    const classmatesWithScores = classmates
      .map(s => ({
        studentId: s.id,
        totalScore: calculateStudentScores(s.id).totalScore
      }))
      .filter(s => s.totalScore > 15);

    classmatesWithScores.sort((a, b) => b.totalScore - a.totalScore);

    let rank = 1;
    const ranksMap: { [studentId: string]: { rank: number; isTied: boolean } } = {};
    for (let i = 0; i < classmatesWithScores.length; i++) {
      if (i > 0 && classmatesWithScores[i].totalScore < classmatesWithScores[i - 1].totalScore) {
        rank = i + 1;
      }
      const currentScore = classmatesWithScores[i].totalScore;
      const isTied = classmatesWithScores.filter(c => c.totalScore === currentScore).length > 1;
      ranksMap[classmatesWithScores[i].studentId] = { rank, isTied };
    }

    const currentRankInfo = ranksMap[student.id];
    if (!currentRankInfo) {
      return { rankText: 'يظهر بعد رصد أكثر من 15 درجة' };
    }

    const ordinals: { [key: number]: string } = {
      1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
      6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر',
      11: 'الحادي عشر', 12: 'الثاني عشر', 13: 'الثالث عشر', 14: 'الرابع عشر', 15: 'الخامس عشر',
      16: 'السادس عشر', 17: 'السابع عشر', 18: 'الثامن عشر', 19: 'التاسع عشر', 20: 'العشرون'
    };

    const ordinalStr = ordinals[currentRankInfo.rank] || `الـ ${currentRankInfo.rank}`;
    const rankText = currentRankInfo.isTied ? `${ordinalStr} مكرر` : ordinalStr;
    return { rankText };
  };

  const rankInfo = getStudentRank();

  // Attendance
  const rawAtt = attendance.filter((a: any) => a.studentId === student.id);
  const seenDates = new Set<string>();
  const studentAttendance = rawAtt.filter((a: any) => {
    if (!a.date) return false;
    const dateStr = a.date.split('T')[0];
    if (seenDates.has(dateStr)) return false;
    seenDates.add(dateStr);
    return true;
  });
  const absencesCount = studentAttendance.filter((a: any) => a.status === 'absent').length;

  // Deficiencies: ONLY registered items in صفحة أعمال السنة that student has not completed
  const g = getStudentGrades(student.id);

  // 1. Incomplete homeworks from state.homework
  const systemHws = state.homework || [];
  const incompleteHws: string[] = [];
  const chronologicalHws = [...systemHws].reverse();
  chronologicalHws.forEach((hw: any) => {
    const originalIdx = systemHws.indexOf(hw);
    const isCompleted = g.homework?.[originalIdx] === true;
    if (!isCompleted) {
      incompleteHws.push(hw.title || `الواجب ${originalIdx + 1}`);
    }
  });

  // 2. Incomplete memorization from state.memorizationTasks
  const systemHifzTasks = state.memorizationTasks || [];
  const incompleteHifzs: string[] = [];
  const chronologicalHifzs = [...systemHifzTasks].sort((a: any, b: any) => {
    const isSeedA = a.id?.startsWith('hifz-seed');
    const isSeedB = b.id?.startsWith('hifz-seed');
    if (isSeedA && !isSeedB) return -1;
    if (!isSeedA && isSeedB) return 1;
    if (isSeedA && isSeedB) return (a.id || '').localeCompare(b.id || '');
    const tsA = parseInt(a.id?.replace('hifz-', '') || '0') || 0;
    const tsB = parseInt(b.id?.replace('hifz-', '') || '0') || 0;
    return tsA - tsB;
  });

  chronologicalHifzs.forEach((task: any, idx: number) => {
    let isCompletedByGrade = false;
    const hGrade = g.hifz?.[idx];
    if (hGrade !== undefined && hGrade !== null && String(hGrade).trim() !== '' && String(hGrade).trim() !== '-' && parseFloat(hGrade) > 0) {
      isCompletedByGrade = true;
    }
    const isCompleted = isCompletedByGrade || task.completedStudents?.includes(student.id) || false;
    if (!isCompleted) {
      incompleteHifzs.push(task.title || `تسميع جزء الحفظ رقم ${idx + 1}`);
    }
  });

  // 3. Performance Task from state.performanceTasks
  const isTaskCompleted = (parseFloat(g.task) || 0) > 0;
  const systemPerfTasks = state.performanceTasks || [];
  const performanceTaskTitle = systemPerfTasks.length > 0 ? systemPerfTasks[0]?.title : null;

  const hijri = getHijriDateDetails(new Date());

  let recommendation = 'ما شاء الله تبارك الله، أداء رائع ومتميز وتفوق مستمر في جميع بنود المادة، استمر على هذا العطاء والاجتهاد.';
  if (scoreInfo.totalScore >= 90) {
    recommendation = 'ما شاء الله تبارك الله، أداء رائع ومتميز وتفوق مستمر في جميع بنود المادة، استمر على هذا العطاء والاجتهاد.';
  } else if (scoreInfo.totalScore >= 80) {
    recommendation = 'مستوى متقدم وجهود طيبة ومباركة، مع مزيد من التركيز والمراجعة المستمرة ستصل إلى أعلى درجات الإتقان والتميز.';
  } else if (scoreInfo.totalScore >= 65) {
    recommendation = 'مستوى جيد وأداء مرضي، يحتاج الطالب إلى مزيد من العناية بإنجاز الواجبات اليومية والمراجعة والمشاركة الصفية.';
  } else if (scoreInfo.totalScore >= 50) {
    recommendation = 'يحتاج الطالب إلى خطة علاجية ومتابعة مكثفة في الواجبات والقرآن الكريم للارتقاء بمستواه التحصيلي.';
  } else {
    recommendation = 'تنبيه: الطالب بحاجة ماسة لمتابعة مستمرة بين البيت والمدرسة لتدارك الفاقد التعليمي وتحسين المشاركة والواجبات.';
  }

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs cursor-pointer overflow-y-auto"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden cursor-default my-auto text-right print:fixed print:inset-0 print:max-w-none print:max-h-none print:m-0 print:rounded-none print:border-none print:shadow-none"
        dir="rtl"
      >
        {/* Header with Blue Vertical Line, Title, Student Info, Print & Close */}
        <div className="bg-white border-b border-slate-200/80 p-4 sm:p-5 relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 sm:h-7 bg-blue-600 rounded-full shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  تقرير الطالب
                </h2>
                <span className="text-xs font-black bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full font-sans">
                  {student.class}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-600 font-bold flex-wrap pt-0.5 font-sans">
                <span className="text-slate-800 font-extrabold flex items-center gap-1">
                  <User size={14} className="text-blue-600" />
                  <span>اسم الطالب:</span>
                  <span className="text-blue-900 font-black text-sm sm:text-base">{student.name}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">
                  الفصل {currentSemester === '1' ? 'الأول' : 'الثاني'} (الفترة {currentPeriod === '1' ? 'الأولى' : 'الثانية'})
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">
                  {hijri.day} {hijri.monthName} {hijri.year}هـ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs font-sans"
                title="طباعة التقرير"
              >
                <Printer size={15} />
                <span className="hidden sm:inline">طباعة التقرير</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body - Scrollable matching Student Portal structure */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 print:overflow-visible print:p-0">
          {/* Official Print Header (Only visible on print) */}
          <div className="hidden print:flex flex-col gap-1 border-b-2 border-slate-800 pb-3 mb-3 text-right">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-black text-slate-900">المملكة العربية السعودية • وزارة التعليم</div>
                <div className="text-xs font-extrabold text-blue-700 mt-0.5">تقرير أداء ومتابعة الطالب الفصلي الشامل</div>
              </div>
              <div className="text-left text-xs font-bold text-slate-700">
                <div>الصف: <strong className="text-slate-900">{student.class}</strong></div>
                <div>الفصل: <strong>{currentSemester === '1' ? 'الأول' : 'الثاني'}</strong> • الفترة: <strong>{currentPeriod === '1' ? 'الأولى' : 'الثانية'}</strong></div>
                <div>التاريخ: <strong>{hijri.day} {hijri.monthName} {hijri.year}هـ</strong></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-700 pt-1.5 border-t border-slate-200 mt-1">
              <span>اسم الطالب: <strong className="text-slate-900 font-black text-sm">{student.name}</strong></span>
              <span>المجموع الكلي: <strong className="text-blue-700 font-mono font-black text-sm">{scoreInfo.totalScore} / {scoreInfo.maxScore}</strong> (نسبة {scoreInfo.percentage}%)</span>
            </div>
          </div>

          {/* 1. Active Period Banner matching Student Portal */}
          <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-800 font-sans">الفترة الدراسية النشطة حالياً:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-sm font-sans">
                <span className="text-slate-400 font-bold">الفصل الدراسي:</span>
                <span className="text-indigo-600 font-black">{currentSemester === '1' ? 'الأول' : 'الثاني'}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-sm font-sans">
                <span className="text-slate-400 font-bold">الفترة:</span>
                <span className="text-violet-600 font-black">{currentPeriod === '1' ? 'الأولى' : 'الثانية'}</span>
              </div>
            </div>
          </div>

          {/* 2. Profile Card Header matching Student Portal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 bg-indigo-600 h-1.5 right-0" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-slate-100 to-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-200 font-extrabold text-2xl shadow-inner shrink-0">
                  {student.name?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-sans">{student.name}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 tracking-wide font-sans">
                    الصف الدراسي: <span className="text-indigo-600 font-extrabold">{student.class}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">مستوى التقدم الدراسي الكلي</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(scoreInfo.percentage)}`}>
                    {getStatusText(scoreInfo.percentage)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 font-sans">المجموع الكلي للدرجات</p>
                <p className="text-xl font-black text-slate-850 font-sans">
                  {scoreInfo.totalScore} <span className="text-xs text-slate-400 font-semibold font-sans">/ {scoreInfo.maxScore} نقطة</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 font-sans">المعدل المئوي المحقق</p>
                <p className="text-xl font-black text-indigo-600 font-sans">{scoreInfo.percentage}٪</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 font-sans">ترتيب الطالب على الصف</p>
                <p className={`text-xl font-black font-sans ${scoreInfo.totalScore > 15 ? 'text-amber-600' : 'text-slate-400 text-sm'}`}>
                  {rankInfo.rankText}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 font-sans">عدد أيام الغياب</p>
                <p className="text-xl font-black text-rose-600 font-sans">
                  {absencesCount} <span className="text-xs text-slate-400 font-semibold font-sans">أيام</span>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Grading Distribution matching Student Portal */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-indigo-600 animate-pulse" size={22} />
                <div>
                  <h4 className="font-black text-2xl text-slate-950 font-sans">توزيع الدرجات</h4>
                  <p className="text-sm text-slate-500 mt-0.5 font-bold font-sans">
                    {state.hideOralExam ? 'توزيع الـ 85 درجة للتقويم والدرجة المستحقة للطالب' : 'توزيع الـ 100 درجة للتقويم والدرجة المستحقة للطالب'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${state.hideOralExam ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-4 pt-1`}>
              {/* Homework */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الواجبات المنزلية</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                    {scoreInfo.hwScore} <span className="text-sm text-slate-400 font-semibold font-sans">/ ١٠ د</span>
                  </p>
                </div>
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(scoreInfo.hwScore / 10) * 100}%` }} />
                </div>
              </div>

              {/* Participation */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">المشاركة الصفية</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                    {scoreInfo.partScore} <span className="text-sm text-slate-400 font-semibold font-sans">/ ١٠ د</span>
                  </p>
                </div>
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${(scoreInfo.partScore / 10) * 100}%` }} />
                </div>
              </div>

              {/* Quran Activity */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">القرآن الكريم</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                    {scoreInfo.quranTotal} <span className="text-sm text-slate-400 font-semibold font-sans">/ ١٥ د</span>
                  </p>
                </div>
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(scoreInfo.quranTotal / 15) * 100}%` }} />
                </div>
              </div>

              {/* Task */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">المهمة الأدائية والنشاط</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                    {scoreInfo.taskScore} <span className="text-sm text-slate-400 font-semibold font-sans">/ ٥ د</span>
                  </p>
                </div>
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${(scoreInfo.taskScore / 5) * 100}%` }} />
                </div>
              </div>

              {/* Oral Exam - hidden if hideOralExam */}
              {!state.hideOralExam && (
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                  <div>
                    <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الاختبار الشفهي</p>
                    <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                      {scoreInfo.oralScore} <span className="text-sm text-slate-400 font-semibold font-sans">/ ١٥ د</span>
                    </p>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                    <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${(scoreInfo.oralScore / 15) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Written Exam */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الاختبار التحريري</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                    {scoreInfo.writtenScore} <span className="text-sm text-slate-400 font-semibold font-sans">/ ٤٥ د</span>
                  </p>
                </div>
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${(scoreInfo.writtenScore / 45) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 4. نواقص الطالب (Student Deficiencies) - ONLY registered items in صفحة أعمال السنة that student has not completed */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-[#115e3b] text-right font-sans">نواقص الطالب</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Homework column */}
              <div className="bg-[#f8fafc]/70 p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">الواجبات</h4>
                    {incompleteHws.length > 0 ? (
                      <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs font-sans">
                        {incompleteHws.length}
                      </span>
                    ) : (
                      <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {incompleteHws.map((title: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-base font-sans"
                      >
                        {title}
                      </div>
                    ))}
                    {incompleteHws.length === 0 && (
                      <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-[#115e3b] text-base flex flex-col items-center justify-center gap-1 font-sans">
                        <span className="text-[10px] bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full font-bold">مكتمل</span>
                        <span>لا يوجد نقص</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Memorization column */}
              <div className="bg-[#f8fafc]/70 p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">الحفظ</h4>
                    {incompleteHifzs.length > 0 ? (
                      <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs font-sans">
                        {incompleteHifzs.length}
                      </span>
                    ) : (
                      <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {incompleteHifzs.map((title: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-base font-sans"
                      >
                        {title}
                      </div>
                    ))}
                    {incompleteHifzs.length === 0 && (
                      <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-[#115e3b] text-base flex flex-col items-center justify-center gap-1 font-sans">
                        <span className="text-[10px] bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full font-bold">مكتمل</span>
                        <span>لا يوجد نقص</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Performance column */}
              <div className="bg-[#f8fafc]/70 p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">المهمة الأدائية</h4>
                    {isTaskCompleted ? (
                      <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                    ) : !performanceTaskTitle ? (
                      <span className="bg-[#f1f5f9] text-slate-500 px-3 py-1 rounded-full text-xs font-bold font-sans">لا توجد مهام</span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs font-sans">
                        ١
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {isTaskCompleted ? (
                      <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-[#115e3b] text-base flex flex-col items-center justify-center gap-1 font-sans">
                        <span className="text-[10px] bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full font-bold">مكتمل</span>
                        <span>لا يوجد نقص</span>
                      </div>
                    ) : !performanceTaskTitle ? (
                      <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-slate-400 text-base flex flex-col items-center justify-center gap-1 font-sans">
                        <span>لم يتم رصد تفاصيل مهمة بعد</span>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-[15px] font-sans">
                        {performanceTaskTitle}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 5. تقويم الغياب هجري (Hijri Absence Calendar) - matching Student Portal */}
          {!state.hideAbsenceCalendarInStudentPortal && studentAttendance.some((a: any) => a.status === 'absent') && (
            <div className="space-y-2 pt-2 flex flex-col items-center">
              <h3 className="text-sm font-bold text-[#115e3b] text-center font-sans">تقويم الغياب هجري</h3>
              
              {(() => {
                const today = new Date();
                const formatToYYYYMMDD = (date: Date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };

                const getHijriWeekDays = (weekOffset: number) => {
                  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
                  const weekDays = [];
                  
                  const refDate = new Date();
                  refDate.setDate(today.getDate() + (weekOffset * 7));
                  const sun = getSundayOfWeek(refDate);
                  
                  for (let i = 0; i < 5; i++) {
                    const d = new Date(sun);
                    d.setDate(sun.getDate() + i);
                    const hj = getHijriDateDetails(d);
                    const dateStr = formatToYYYYMMDD(d);
                    
                    const record = studentAttendance.find((a: any) => a.date && a.date.startsWith(dateStr));
                    const isAbsent = record?.status === 'absent';
                    
                    weekDays.push({
                      dayName: dayNames[i],
                      hijriDayNum: hj.day,
                      hijriMonthName: hj.monthName,
                      isAbsent
                    });
                  }
                  return weekDays;
                };

                const currentWeek = getHijriWeekDays(0);
                const previousWeek = getHijriWeekDays(-1);

                const currentHasAbsence = currentWeek.some(day => day.isAbsent);
                const previousHasAbsence = previousWeek.some(day => day.isAbsent);

                const showCurrent = currentHasAbsence || (!currentHasAbsence && !previousHasAbsence);
                const showPrevious = previousHasAbsence || (!currentHasAbsence && !previousHasAbsence);

                const gridColsClass = (showCurrent && showPrevious) ? 'grid-cols-2 max-w-md' : 'grid-cols-1 max-w-xs';

                return (
                  <div className={`grid ${gridColsClass} gap-3 bg-white border border-slate-100 p-3 rounded-2xl shadow-xs font-sans w-full`}>
                    {showCurrent && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-center text-slate-400 mb-1">الأسبوع الحالي</p>
                        {currentWeek.map((day, idx) => (
                          <div 
                            key={idx}
                            className={`flex justify-between items-center px-2 py-1 rounded-lg font-bold text-xs border transition-all ${
                              day.isAbsent 
                                ? 'bg-[#fb2c36] text-white border-[#fb2c36] shadow-xs' 
                                : 'bg-[#f8fafc]/40 text-slate-700 border-slate-100/50 hover:bg-slate-50'
                            }`}
                          >
                            <span className={day.isAbsent ? 'text-white' : 'text-slate-400'}>{day.dayName}</span>
                            <span className={day.isAbsent ? 'text-white font-sans' : 'text-slate-600 font-sans'}>
                              {day.hijriDayNum} {day.hijriMonthName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {showPrevious && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-center text-slate-400 mb-1">الأسبوع السابق</p>
                        {previousWeek.map((day, idx) => (
                          <div 
                            key={idx}
                            className={`flex justify-between items-center px-2 py-1 rounded-lg font-bold text-xs border transition-all ${
                              day.isAbsent 
                                ? 'bg-[#fb2c36] text-white border-[#fb2c36] shadow-xs' 
                                : 'bg-[#f8fafc]/40 text-slate-700 border-slate-100/50 hover:bg-slate-50'
                            }`}
                          >
                            <span className={day.isAbsent ? 'text-white' : 'text-slate-400'}>{day.dayName}</span>
                            <span className={day.isAbsent ? 'text-white font-sans' : 'text-slate-600 font-sans'}>
                              {day.hijriDayNum} {day.hijriMonthName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. Toggle for full grades sheet matching Student Portal */}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center print:hidden">
            <button
              type="button"
              onClick={() => setShowDetailedGrades(!showDetailedGrades)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#115e3b] font-black rounded-2xl text-xs transition-all border border-slate-200 shadow-xs cursor-pointer active:scale-95 font-sans"
            >
              {showDetailedGrades ? 'إخفاء كشف الدرجات التفصيلي ▴' : 'عرض كشف درجات التحصيل الدراسي والبطاقات التفصيلية كاملة ▾'}
            </button>
          </div>

          {/* Detailed Scores Card */}
          {showDetailedGrades && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-2 font-sans"
            >
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
                  <div className="flex items-center gap-2">
                    <FileBadge className="text-indigo-600" size={18} />
                    <h4 className="font-extrabold text-base text-slate-800">بيان درجات التحصيل الدراسي والفترات</h4>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quran */}
                    <div className="p-4 bg-emerald-50/20 border border-emerald-100/70 rounded-xl space-y-3 col-span-1 md:col-span-2">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5 font-sans text-sm">
                          <BookOpen size={16} className="text-emerald-600 animate-pulse" /> القرآن الكريم (تلاوة وتجويد وحفظ)
                        </span>
                        <span className="font-black text-emerald-700 text-sm">
                          {scoreInfo.quranTotal} / 15
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 flex">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(scoreInfo.quranTotal / 15) * 100}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">التلاوة</span>
                          <span className="font-black text-emerald-700">{scoreInfo.recitationScore} / 5</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">التجويد</span>
                          <span className="font-black text-emerald-700">{scoreInfo.tajweedScore} / 5</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">الحفظ</span>
                          <span className="font-black text-emerald-700">{scoreInfo.hifzTestsScore} / 5</span>
                        </div>
                      </div>
                    </div>

                    {/* Homework */}
                    <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                          <CheckCircle2 size={14} className="text-blue-500" /> إنجاز الواجبات
                        </span>
                        <span className="font-black text-blue-600 font-mono text-sm">{scoreInfo.hwScore} / 10</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(scoreInfo.hwScore / 10) * 100}%` }} />
                      </div>
                    </div>

                    {/* Participation */}
                    <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                          <TrendingUp size={14} className="text-teal-500" /> المشاركة الصفية
                        </span>
                        <span className="font-black text-teal-600 font-mono text-sm">{scoreInfo.partScore} / 10</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(scoreInfo.partScore / 10) * 100}%` }} />
                      </div>
                    </div>

                    {/* Task */}
                    <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                          <CheckSquare size={14} className="text-amber-500" /> المهمة الأدائية
                        </span>
                        <span className="font-black text-amber-600 font-mono text-sm">{scoreInfo.taskScore} / 5</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(scoreInfo.taskScore / 5) * 100}%` }} />
                      </div>
                    </div>

                    {/* Oral */}
                    {!state.hideOralExam && (
                      <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                            <Award size={14} className="text-orange-500" /> الاختبار الشفهي
                          </span>
                          <span className="font-black text-orange-600 font-mono text-sm">{scoreInfo.oralScore} / 15</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(scoreInfo.oralScore / 15) * 100}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Written */}
                    <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2 col-span-1 md:col-span-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                          <FileText size={14} className="text-rose-500" /> الاختبار التحريري
                        </span>
                        <span className="font-black text-rose-600 font-mono text-sm">{scoreInfo.writtenScore} / 45</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(scoreInfo.writtenScore / 45) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7. Teacher Recommendation & Guidance */}
          <div className="p-4 bg-gradient-to-r from-blue-50/60 via-slate-50 to-emerald-50/40 rounded-2xl border border-blue-100/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-blue-900 font-sans">
              <TrendingUp size={15} className="text-blue-600" />
              <span>ملاحظات وتوجيهات معلم المادة</span>
            </div>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed font-sans">
              {recommendation}
            </p>
          </div>

          {/* Printable Signatures */}
          <div className="hidden print:grid grid-cols-4 gap-4 pt-6 text-center text-xs font-black text-slate-700 border-t border-slate-200 mt-4">
            <div>معلم المادة: ....................</div>
            <div>المرشد الطلابي: ....................</div>
            <div>ولي أمر الطالب: ....................</div>
            <div>مدير المدرسة: ....................</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs hover:shadow-sm transition-all cursor-pointer font-sans"
          >
            <Printer size={15} />
            <span>طباعة التقرير</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors cursor-pointer font-sans"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
