import { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  Calendar, 
  GraduationCap, 
  ArrowLeft,
  BookMarked,
  UserCheck,
  FileBadge,
  Share2,
  Copy,
  Check,
  ClipboardList,
  Timer,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import HijriCalendar, { getHijriDateDetails } from '../components/HijriCalendar';

function getSundayOfWeek(d: Date): Date {
  const sunday = new Date(d);
  const day = d.getDay();
  sunday.setDate(d.getDate() - day);
  return sunday;
}

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

interface StudentPortalPageProps {
  onBackToTeacher: () => void;
  showBackToTeacher?: boolean;
}

export function StudentPortalPage({ onBackToTeacher, showBackToTeacher = false }: StudentPortalPageProps) {
  const { state, updateState } = useApp();
  const students = [...(state.students || [])].sort((a: any, b: any) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ar');
  });
  const grades = state.grades || [];
  const memorization = state.memorization || [];
  const attendance = state.attendance || [];
  const permits = state.permits || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showSearchList, setShowSearchList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDetailedGrades, setShowDetailedGrades] = useState(false);

  const handleSelectStudent = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSearchTerm(studentName);
    setShowSearchList(false);
    
    // Add to searched student IDs in state
    const currentSearches = state.searchedStudentIds || [];
    const updatedSearches = [studentId, ...currentSearches.filter((id: string) => id !== studentId)].slice(0, 10);
    updateState({ searchedStudentIds: updatedSearches });
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchList(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const portalSemester = state.currentSemester || '1';
  const portalPeriod = state.currentPeriod || '1';

  // Filter active students to make sure they can search
  const activeStudents = students.filter(s => s.status !== 'archived');

  const handleCopyLink = () => {
    // Generate standard direct portal link
    const directLink = `${window.location.origin}${window.location.pathname}?portal=student`;
    navigator.clipboard.writeText(directLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy direct link: ', err);
    });
  };

  const filteredSearch = activeStudents.filter(s => {
    const sNameNormalized = normalizeArabic(s.name || '');
    const searchNormalized = normalizeArabic(searchTerm);
    return sNameNormalized.includes(searchNormalized) || s.id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedStudent = activeStudents.find(s => s.id === selectedStudentId);

  // Calculations for chosen student
  const getStudentGrades = (studentId: string) => {
    return grades.find((g: any) => g.studentId === studentId && g.semester === portalSemester && g.period === portalPeriod) || {
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

  const getStudentHifz = (studentId: string) => {
    const defaultHifz = memorization.find((m: any) => m.studentId === studentId) || {
      surah: 'غير محدد',
      verses: 'لا يوجد بيانات',
      progress: 0,
      status: 'new',
      requiredTask: 'لم يحدد بعد'
    };

    // Calculate actual progress based on overall memorizationTasks completed by this student to ensure it updates instantly in the card
    const mTasks = state.memorizationTasks || [];
    if (mTasks.length > 0) {
      const sGrades = getStudentGrades(studentId);
      const hifzGrades = sGrades.hifz || [];

      // Sort tasks chronologically to map them to grade columns
      const chronologicalTasks = [...mTasks].sort((a: any, b: any) => {
        const isSeedA = a.id?.startsWith('hifz-seed');
        const isSeedB = b.id?.startsWith('hifz-seed');
        if (isSeedA && !isSeedB) return -1;
        if (!isSeedA && isSeedB) return 1;
        if (isSeedA && isSeedB) return (a.id || '').localeCompare(b.id || '');
        const tsA = parseInt(a.id?.replace('hifz-', '') || '0') || 0;
        const tsB = parseInt(b.id?.replace('hifz-', '') || '0') || 0;
        return tsA - tsB;
      });

      const completedCount = mTasks.filter((t: any) => {
        const chronoIndex = chronologicalTasks.findIndex((ct: any) => ct.id === t.id);
        let isCompletedByGrade = false;
        if (chronoIndex >= 0 && chronoIndex < 4) {
          const hGrade = hifzGrades[chronoIndex];
          if (hGrade !== undefined && hGrade !== null && String(hGrade).trim() !== '' && String(hGrade).trim() !== '-' && parseFloat(hGrade) > 0) {
            isCompletedByGrade = true;
          }
        }
        return isCompletedByGrade || t.completedStudents?.includes(studentId);
      }).length;

      const progress = Math.min(100, Math.round((completedCount / mTasks.length) * 100));
      return {
        ...defaultHifz,
        progress
      };
    }
    return defaultHifz;
  };

  const getStudentAttendance = (studentId: string) => {
    const rawAtt = attendance.filter(a => a.studentId === studentId);
    // Deduplicate by YYYY-MM-DD date to ensure count is accurate
    const seenDates = new Set<string>();
    return rawAtt.filter(a => {
      if (!a.date) return false;
      const dateStr = a.date.split('T')[0];
      if (seenDates.has(dateStr)) return false;
      seenDates.add(dateStr);
      return true;
    });
  };

  const checkHomeworkRecorded = (studentId: string) => {
    const hws = state.homework || [];
    if (hws.length > 0) return true;
    const g = grades.find((reg: any) => reg.studentId === studentId && reg.semester === portalSemester && reg.period === portalPeriod);
    if (!g) return false;
    return !!(g.homeworkRecorded || (g.homework && g.homework.some((h: boolean) => h === true)));
  };

  const checkHifzRecorded = (studentId: string) => {
    const mTasks = state.memorizationTasks || [];
    if (mTasks.length > 0) return true;
    const g = grades.find((reg: any) => reg.studentId === studentId && reg.semester === portalSemester && reg.period === portalPeriod);
    if (!g) return false;
    return !!(g.hifz && g.hifz.some((score: any) => parseFloat(score) > 0));
  };

  // Compute points and percentages
  const calculateScores = (studentId: string) => {
    const g = getStudentGrades(studentId);
    
    // Robust average calculator (fully compatible with string grids from inputs)
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

    // 1. Homework Score: each checked homework slot represents exactly 1 mark
    const hwScore = g.homework ? g.homework.filter(Boolean).length : 0;
    
    // 2. Participation Score: each checked participation slot represents exactly 1 mark
    const partScore = g.participation ? g.participation.filter(Boolean).length : 0;

    // 3. Quran Score (Recitation, Tajweed, Hifz):
    const recitationScore = getAverage(g.recitation);
    const tajweedScore = getAverage(g.tajweed);
    const hifzTestsScore = getAverage(g.hifz);

    const taskScore = parseFloat(g.task) || 0;     // (out of 5)
    const quranTotal = recitationScore + tajweedScore + hifzTestsScore; // (out of 15)
    const oralScore = parseFloat(g.oral) || parseFloat(quranTotal.toFixed(1)) || 0;     // (out of 15)
    const writtenScore = parseFloat(g.written) || 0; // (out of 45)
    
    // In a 100-point system: total is out of 100 even when oral exam card is hidden (without calculating oral score)
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
      taskScore,
      oralScore: parseFloat(oralScore.toFixed(1)),
      writtenScore,
      totalScore: parseFloat(Math.min(maxScore, totalScore).toFixed(1)),
      maxScore,
      percentage
    };
  };

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

  // Extract shortcomings intelligently
  const extractShortcomings = (studentId: string) => {
    const g = getStudentGrades(studentId);
    const hifz = getStudentHifz(studentId);
    const attList = getStudentAttendance(studentId);
    
    const issues: string[] = [];
    const hasHomeworkRecord = checkHomeworkRecorded(studentId);
    const hasHifzRecord = checkHifzRecorded(studentId);

    // 1. Missing Homeworks
    const registeredHwCount = Math.max(
      state.homework?.length || 0,
      g.homework ? g.homework.reduce((max: number, val: boolean, idx: number) => val ? idx + 1 : max, 0) : 0
    );
    if (g.homework && hasHomeworkRecord && registeredHwCount > 0) {
      const missingHwIndices = g.homework
        .slice(0, registeredHwCount)
        .map((status: boolean, i: number) => (!status ? i + 1 : null))
        .filter((v: any) => v !== null);
      if (missingHwIndices.length > 0) {
        issues.push(`لم يتم تسليم الواجبات رقم: ${missingHwIndices.join('، ')} (الدرجة الإجمالية ناقصة)`);
      }
    }

    // 2. Class Participation Slack
    const registeredPartCount = g.participation ? g.participation.reduce((max: number, val: boolean, idx: number) => val ? idx + 1 : max, 0) : 0;
    if (g.participation && registeredPartCount > 0) {
      const missingPartIndices = g.participation
        .slice(0, registeredPartCount)
        .map((status: boolean, i: number) => (!status ? i + 1 : null))
        .filter((v: any) => v !== null);
      if (missingPartIndices.length > 0) {
        issues.push(` غياب في المشاركة أو التفاعل بالحلقات رقم: ${missingPartIndices.join('، ')}`);
      }
    }

    // 3. Quiz & Tasks shortages
    const registeredRecitationCount = g.recitation ? g.recitation.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    if (g.recitation && registeredRecitationCount > 0) {
      g.recitation.slice(0, registeredRecitationCount).forEach((score: number, idx: number) => {
        if (score === 0 || score < 3.5) {
          issues.push(`تقييم متدني أو غير مسجل في تلاوة الحصة رقم ${idx + 1} (الدرجة المحققة: ${score} من 5)`);
        }
      });
    }

    const registeredTajweedCount = g.tajweed ? g.tajweed.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    if (g.tajweed && registeredTajweedCount > 0) {
      g.tajweed.slice(0, registeredTajweedCount).forEach((score: number, idx: number) => {
        if (score === 0 || score < 3.5) {
          issues.push(`تقييم متدني أو غير مسجل في التجويد بالحصة رقم ${idx + 1} (الدرجة المحققة: ${score} من 5)`);
        }
      });
    }

    const registeredHifzCount = g.hifz ? g.hifz.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    if (hasHifzRecord && g.hifz && registeredHifzCount > 0) {
      g.hifz.slice(0, registeredHifzCount).forEach((score: number, idx: number) => {
        if (score === 0 || score < 3.5) {
          issues.push(`مستوى اختبار الحفظ بالتقييم رقم ${idx + 1} متأخر (الدرجة: ${score} من 5)`);
        }
      });
    }

    // Exams Check
    if (g.task > 0 && g.task < 3) {
      issues.push(`الدرجة الأدائية أو المهام منخفضة (${g.task} من 5)`);
    }
    if (!state.hideOralExam) {
      const calculatedOral = calculateScores(studentId).oralScore;
      if (calculatedOral > 0 && calculatedOral < 10) {
        issues.push(`الاختبار الشفهي يحتاج تحسين (${calculatedOral} من 15)`);
      }
    }
    if (g.written > 0 && g.written < 27) {
      issues.push(`الاختبار التحريري أقل من النسبة المطلوبة (${g.written} من 45)`);
    }

    // 4. Attendance
    const absences = attList.filter(a => a.status === 'absent');
    if (absences.length > 0) {
      issues.push(`رُصد للطالب غياب من الحلقات (عدد المرات: ${absences.length} غياب)`);
    }

    const lates = attList.filter(a => a.status === 'late');
    if (lates.length > 0) {
      issues.push(`رُصد للطالب حالات تأخر عن موعد الحلقة (عدد المرات: ${lates.length} تأخير)`);
    }

    // 5. Memorization progress check
    if (hasHifzRecord && registeredHifzCount > 0 && hifz && hifz.progress < 30) {
      issues.push(`نسبة إنجاز الحفظ المطلوب منخفضة حالياً (${hifz.progress}٪) يرجى تنشيط الحفظ اليومي`);
    }

    return issues;
  };

  const getStudentRank = (studentId: string) => {
    const student = activeStudents.find(s => s.id === studentId);
    if (!student) return { rank: 0, isTied: false, rankText: '-' };

    const studentScoreInfo = calculateScores(studentId);
    // Student rank only appears after more than 15 marks have been recorded for the student
    if (studentScoreInfo.totalScore <= 15) {
      return { rank: 0, isTied: false, rankText: 'يظهر بعد رصد أكثر من 15 درجة' };
    }

    const studentClass = student.class;
    const classmates = activeStudents.filter(s => s.class === studentClass);

    // Only classmates with more than 15 marks participate in the rank hierarchy
    const classmatesWithScores = classmates
      .map(s => {
        const scoreInfo = calculateScores(s.id);
        return {
          studentId: s.id,
          totalScore: scoreInfo.totalScore
        };
      })
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
      
      ranksMap[classmatesWithScores[i].studentId] = {
        rank,
        isTied
      };
    }

    const currentRankInfo = ranksMap[studentId];
    if (!currentRankInfo) {
      return { rank: 0, isTied: false, rankText: 'يظهر بعد رصد أكثر من 15 درجة' };
    }

    const ordinals: { [key: number]: string } = {
      1: 'الأول',
      2: 'الثاني',
      3: 'الثالث',
      4: 'الرابع',
      5: 'الخامس',
      6: 'السادس',
      7: 'السابع',
      8: 'الثامن',
      9: 'التاسع',
      10: 'العاشر',
      11: 'الحادي عشر',
      12: 'الثاني عشر',
      13: 'الثالث عشر',
      14: 'الرابع عشر',
      15: 'الخامس عشر',
      16: 'السادس عشر',
      17: 'السابع عشر',
      18: 'الثامن عشر',
      19: 'التاسع عشر',
      20: 'العشرون'
    };

    const ordinalStr = ordinals[currentRankInfo.rank] || `الـ ${currentRankInfo.rank}`;
    const rankText = currentRankInfo.isTied ? `${ordinalStr} مكرر` : ordinalStr;

    return {
      rank: currentRankInfo.rank,
      isTied: currentRankInfo.isTied,
      rankText
    };
  };

  const studentScoreInfo = selectedStudent ? calculateScores(selectedStudent.id) : null;
  const studentRankInfo = selectedStudent ? getStudentRank(selectedStudent.id) : null;
  const shortcomingsList = selectedStudent ? extractShortcomings(selectedStudent.id) : [];
  const hasHifzRecord = selectedStudent ? checkHifzRecorded(selectedStudent.id) : false;
  const hasHomeworkRecord = selectedStudent ? checkHomeworkRecorded(selectedStudent.id) : false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans leading-relaxed pb-16 relative" dir="rtl">
      {/* Top Banner with twilight colors */}
      <div className="w-full bg-slate-900 border-b border-slate-800 text-white py-6 px-4 md:px-12 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-transparent bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="absolute top-0 left-0 w-[40%] h-full bg-indigo-500/5 pointer-events-none blur-3xl -translate-x-1/2" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10 text-center md:text-right">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl flex items-center justify-center border border-indigo-500 shadow-md shrink-0">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">مدارس القرآن الكريم والدراسات الإسلامية</span>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white mt-0.5">البوابة الطلابية الذكية</h1>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <button 
              onClick={handleCopyLink}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 border ${
                copied 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'تم نسخ الرابط المباشر !' : 'نسخ رابط البوابة المباشر'}</span>
            </button>

            {showBackToTeacher && (
              <button 
                onClick={onBackToTeacher}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/85 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft size={14} className="text-slate-300" />
                <span>العودة للبوابة الإدارية (المعلم)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-4 sm:mt-8">
        
        {/* Intro Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center max-w-2xl mx-auto mb-8 space-y-4">
          <Sparkles size={28} className="text-indigo-500 mx-auto" />
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-black text-slate-850">أهلاً بك</h2>
            
            {/* Ornate design for Islamic Studies */}
            <div className="mt-3.5 mb-1.5 inline-flex items-center gap-2.5 px-6 py-2 bg-gradient-to-l from-emerald-50 via-emerald-100/60 to-emerald-50 border-2 border-emerald-600/35 rounded-2xl shadow-sm relative overflow-hidden">
              <span className="text-emerald-600 text-sm font-extrabold">۞</span>
              <span className="text-sm sm:text-base font-black text-emerald-800 tracking-wide font-sans">
                مقرر مادة الدراسات الإسلامية
              </span>
              <span className="text-emerald-600 text-sm font-extrabold">۞</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60" />
            </div>

            <p className="text-sm text-slate-550 max-w-md mx-auto mt-2 leading-relaxed font-semibold">
              تتيح البوابة للطلاب وأولياء الأمور الاستعلام المباشر عن بطاقات التحصيل الدراسي، ومعدلات الحفظ، مع رصد دقيق لأية جوانب تقصير للمتابعة الفورية والتوجيه المنزلي.
            </p>
          </div>

          {/* Autocomplete Search input */}
          <div className="search-container relative max-w-md mx-auto pt-2">
            <div className="relative group">
              <Search className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="ابحث عن اسم الطالب ثلاثياً أو رباعياً..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchList(true);
                }}
                onFocus={() => setShowSearchList(true)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-250 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold transition-all shadow-inner text-right"
              />
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStudentId('');
                    setShowSearchList(false);
                  }}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-200/70 hover:bg-slate-200 px-2 py-0.5 rounded-md"
                >
                  مسح
                </button>
              )}
            </div>

            {/* List Dropdown */}
            {showSearchList && (
              <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto no-scrollbar py-2 text-right">
                {filteredSearch.length > 0 ? (
                  filteredSearch.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        handleSelectStudent(s.id, s.name);
                      }}
                      className="w-full px-4 py-2.5 hover:bg-indigo-50/50 text-right text-sm font-black transition-colors flex items-center justify-between border-b border-slate-50/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                          {s.name?.[0]}
                        </div>
                        <span className="text-slate-800">{s.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">{s.class}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-4 text-center text-sm text-slate-405 italic">لا يوجد نتائج تطابق البحث</div>
                )}
              </div>
            )}
          </div>

          {/* Quick suggestions box */}
          {activeStudents.length > 0 && !selectedStudentId && (
            <div className="flex flex-wrap gap-1.5 justify-center pt-2">
              <span className="text-xs font-bold text-slate-450 self-center ml-1">تلميح السريع:</span>
              {activeStudents.slice(0, 3).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleSelectStudent(s.id, s.name);
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Direct link information box to share */}
          <div className="pt-4 border-t border-slate-100 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-xs font-bold text-slate-500">رابط الطلاب المباشر والآمن مفعل الآن لسهولة تصفح أولياء الأمور والطلاب</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50/75 hover:bg-indigo-100/90 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط المستقل لإرساله للطلاب'}</span>
            </button>
          </div>
        </div>

        {/* Student Card Block */}
        <AnimatePresence mode="wait">
          {selectedStudent && studentScoreInfo ? (
            <motion.div
              key={selectedStudent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* Semester & Period Display for Student (Selected by the Teacher) */}
              <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50 border border-slate-205 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-xs font-extrabold text-slate-800">الفترة الدراسية النشطة حالياً:</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                    <span className="text-slate-450 font-bold">الفصل الدراسي:</span>
                    <span className="text-indigo-600 font-black">{portalSemester === '1' ? 'الأول' : 'الثاني'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                    <span className="text-slate-455 font-bold">الفترة:</span>
                    <span className="text-violet-600 font-black">{portalPeriod === '1' ? 'الأولى' : 'الثانية'}</span>
                  </div>
                </div>
              </div>

              {/* Profile Card Header */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 bg-indigo-600 h-1.5 right-0" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-slate-100 to-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-200 font-extrabold text-2xl shadow-inner">
                      {selectedStudent.name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{selectedStudent.name}</h3>
                      <p className="text-xs text-slate-450 font-bold mt-1 tracking-wide">
                        الصف الدراسي: <span className="text-indigo-600 font-extrabold">{selectedStudent.class}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مستوى التقدم الدراسي الكلي</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(studentScoreInfo.percentage)}`}>
                        {getStatusText(studentScoreInfo.percentage)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المجموع الكلي للدرجات</p>
                    <p className="text-xl font-black text-slate-850">
                      {studentScoreInfo.totalScore} <span className="text-xs text-slate-400 font-semibold">/ {studentScoreInfo.maxScore} نقطة</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المعدل المئوي المحقق</p>
                    <p className="text-xl font-black text-indigo-600">{studentScoreInfo.percentage}٪</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ترتيب الطالب على الصف</p>
                    <p className={`text-xl font-black ${studentScoreInfo.totalScore > 15 ? 'text-amber-600' : 'text-slate-400 text-sm'}`}>
                      {studentScoreInfo.totalScore > 15 ? (studentRankInfo?.rankText || '-') : (
                        <span className="text-xs font-bold text-slate-400 leading-tight block">يظهر بعد رصد &gt; 15 درجة</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">عدد أيام الغياب</p>
                    <p className="text-xl font-black text-rose-600">
                      {getStudentAttendance(selectedStudent.id).filter(a => a.status === 'absent').length} <span className="text-xs text-slate-400 font-semibold">أيام</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Grading Distribution Table / Card */}
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
                        {studentScoreInfo.hwScore} <span className="text-sm text-slate-400 font-semibold">/ ١٠ د</span>
                      </p>
                    </div>
                    <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(studentScoreInfo.hwScore / 10) * 100}%` }} />
                    </div>
                  </div>

                  {/* Participation */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div>
                      <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">المشاركة الصفية</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                        {studentScoreInfo.partScore} <span className="text-sm text-slate-400 font-semibold">/ ١٠ د</span>
                      </p>
                    </div>
                    <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${(studentScoreInfo.partScore / 10) * 100}%` }} />
                    </div>
                  </div>

                  {/* Quran Activity (continuous oral) */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div>
                      <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">القرآن الكريم</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                        {parseFloat((studentScoreInfo.recitationScore + studentScoreInfo.tajweedScore + studentScoreInfo.hifzTestsScore).toFixed(1))} <span className="text-sm text-slate-400 font-semibold">/ ١٥ د</span>
                      </p>
                    </div>
                    <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${((studentScoreInfo.recitationScore + studentScoreInfo.tajweedScore + studentScoreInfo.hifzTestsScore) / 15) * 100}%` }} />
                    </div>
                  </div>

                  {/* Task */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div>
                      <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">المهمة الأدائية والنشاط</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                        {studentScoreInfo.taskScore} <span className="text-sm text-slate-400 font-semibold">/ ٥ د</span>
                      </p>
                    </div>
                    <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${(studentScoreInfo.taskScore / 5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Oral Exam - hidden if hideOralExam */}
                  {!state.hideOralExam && (
                    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                      <div>
                        <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الاختبار الشفهي</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                          {studentScoreInfo.oralScore} <span className="text-sm text-slate-400 font-semibold">/ ١٥ د</span>
                        </p>
                      </div>
                      <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                        <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${(studentScoreInfo.oralScore / 15) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Written Exam */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div>
                      <p className="text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الاختبار التحريري</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                        {studentScoreInfo.writtenScore} <span className="text-sm text-slate-400 font-semibold">/ ٤٥ د</span>
                      </p>
                    </div>
                    <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${(studentScoreInfo.writtenScore / 45) * 100}%` }} />
                    </div>
                  </div>
                </div>


              </div>

              {/* Simplified Student Portal View exactly matching requested style */}
              <div className="max-w-4xl mx-auto space-y-8 mt-4">
                
                {/* 1. نواقص الطالب (Student Deficiencies) */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-[#115e3b] text-right font-sans">نواقص الطالب</h3>
                  
                  {(() => {
                    const g = getStudentGrades(selectedStudent.id);
                    const systemHws = state.homework || [];
                    const incompleteHws: string[] = [];
                    
                    // Filter down to incomplete assignments from real system homeworks (reverse chronological order)
                    const chronologicalHws = [...systemHws].reverse();
                    chronologicalHws.forEach((hw: any) => {
                      const originalIdx = systemHws.indexOf(hw);
                      const isCompleted = g.homework?.[originalIdx] === true;
                      if (!isCompleted) {
                        incompleteHws.push(hw.title || `الواجب ${originalIdx + 1}`);
                      }
                    });

                    // For Hifz (Memorization)
                    const systemHifzTasks = state.memorizationTasks || [];
                    const incompleteHifzs: string[] = [];
                    
                    // Sort tasks chronologically to map them to grade columns
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
                      const isCompleted = isCompletedByGrade || task.completedStudents?.includes(selectedStudent.id) || false;
                      if (!isCompleted) {
                        incompleteHifzs.push(task.title || `تسميع جزء الحفظ رقم ${idx + 1}`);
                      }
                    });

                    // Performance Tasks registered in Yearly Work (أعمال السنة)
                    const isTaskCompleted = (parseFloat(g.task) || 0) > 0;
                    const systemPerfTasks = state.performanceTasks || [];
                    const incompletePerfTasks: string[] = [];
                    if (systemPerfTasks.length > 0 && !isTaskCompleted) {
                      systemPerfTasks.forEach((t: any, idx: number) => {
                        incompletePerfTasks.push(t.title || `المهمة الأدائية ${idx + 1}`);
                      });
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Homework column */}
                        <div className="bg-[#f8fafc]/70 p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[220px]">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">الواجبات</h4>
                              {incompleteHws.length > 0 ? (
                                <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs">
                                  {incompleteHws.length}
                                </span>
                              ) : (
                                <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {incompleteHws.map((title, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-base"
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
                                <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs">
                                  {incompleteHifzs.length}
                                </span>
                              ) : (
                                <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {incompleteHifzs.map((title, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-base"
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
                              {incompletePerfTasks.length > 0 ? (
                                <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs">
                                  {incompletePerfTasks.length}
                                </span>
                              ) : (
                                <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {incompletePerfTasks.length > 0 ? (
                                incompletePerfTasks.map((title, idx) => (
                                  <div 
                                    key={idx} 
                                    className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-[15px]"
                                  >
                                    {title}
                                  </div>
                                ))
                              ) : (
                                <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-[#115e3b] text-base flex flex-col items-center justify-center gap-1 font-sans">
                                  <span className="text-[10px] bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full font-bold">مكتمل</span>
                                  <span>لا يوجد نقص</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

                {/* 2. تقويم الغياب هجري (Hijri Absence Calendar) - hidden if hideAbsenceCalendarInStudentPortal */}
                {!state.hideAbsenceCalendarInStudentPortal && attendance.some((a: any) => a.studentId === selectedStudent.id && a.status === 'absent') && (
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
                        const rawAtt = attendance.filter((a: any) => a.studentId === selectedStudent.id);
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
                          
                          const record = rawAtt.find((a: any) => a.date && a.date.startsWith(dateStr));
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
                          
                          {/* Weekly column 1 */}
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

                          {/* Weekly column 2 */}
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

                {/* 3. Toggle for traditional full grades sheet */}
                <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setShowDetailedGrades(!showDetailedGrades)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#115e3b] font-black rounded-2xl text-xs transition-all border border-slate-2550 shadow-xs cursor-pointer active:scale-95"
                  >
                    {showDetailedGrades ? 'إخفاء كشف الدرجات التفصيلي ▴' : 'عرض كشف درجات التحصيل الدراسي والبطاقات التفصيلية كاملة ▾'}
                  </button>
                </div>

                {showDetailedGrades && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-4 font-sans"
                  >
                    
                    {/* Detailed Scores Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
                        <div className="flex items-center gap-2">
                          <FileBadge className="text-indigo-600" size={18} />
                          <h4 className="font-extrabold text-base text-slate-800">بيان درجات التحصيل الدراسي والفترات</h4>
                        </div>
                      </div>

                      <div className="space-y-4 font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Item 1, 2, 3: القرآن الكريم */}
                          <div className="p-4 bg-emerald-50/20 border border-emerald-100/70 rounded-xl space-y-3 col-span-1 md:col-span-2">
                            <div className="flex justify-between items-center text-sm font-bold">
                              <span className="font-extrabold text-slate-800 flex items-center gap-1.5 font-sans text-sm">
                                <BookOpen size={16} className="text-emerald-600 animate-pulse" /> القرآن الكريم
                              </span>
                              <span className="font-black text-emerald-700 text-sm">
                                {parseFloat((studentScoreInfo.recitationScore + studentScoreInfo.tajweedScore + studentScoreInfo.hifzTestsScore).toFixed(1))} / 15
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 flex">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((studentScoreInfo.recitationScore + studentScoreInfo.tajweedScore + studentScoreInfo.hifzTestsScore) / 15) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 4: Homework */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                                <CheckCircle2 size={14} className="text-blue-500" /> إنجاز الواجبات
                              </span>
                              <span className="font-black text-blue-600 font-mono text-sm">{studentScoreInfo.hwScore} / 10</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(studentScoreInfo.hwScore / 10) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 5: Participation */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                                <TrendingUp size={14} className="text-teal-500" /> المشاركة الصفية
                              </span>
                              <span className="font-black text-teal-600 font-mono text-sm">{studentScoreInfo.partScore} / 10</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(studentScoreInfo.partScore / 10) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 6: task */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans text-sm">
                                <Award size={14} className="text-amber-500" /> المشاريع والأنشطة
                              </span>
                              <span className="font-black text-amber-600 font-mono text-sm">{studentScoreInfo.taskScore} / 5</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(studentScoreInfo.taskScore / 5) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 7: Oral Test - hidden if hideOralExam */}
                          {!state.hideOralExam && (
                            <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2 font-sans">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 flex items-center gap-1.5 text-sm">
                                  <BookOpen size={14} className="text-orange-500" /> الاختبار الشفهي
                                </span>
                                <span className="font-black text-orange-600 font-mono text-sm">{studentScoreInfo.oralScore} / 15</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(studentScoreInfo.oralScore / 15) * 100}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Item 8: Written Exam */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2 col-span-1 md:col-span-2 font-sans">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-sm">
                                <FileBadge size={14} className="text-rose-500" /> الاختبار التحريري النهائي
                              </span>
                              <span className="font-black text-rose-600 font-mono text-sm">{studentScoreInfo.writtenScore} / 45</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(studentScoreInfo.writtenScore / 45) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Total Score Banner */}
                        <div className="pt-4 border-t border-slate-100 font-sans">
                          <div className="p-5 bg-gradient-to-l from-slate-50 to-indigo-50/40 text-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-indigo-100/80 shadow-sm text-right">
                            <div>
                              <span className="text-xs font-black text-slate-500 block mb-1">المجموع النهائي المحقق للفترة</span>
                              <p className="text-2xl font-black text-indigo-600 font-mono leading-none">
                                {studentScoreInfo.totalScore} <span className="text-sm text-slate-500 font-bold font-sans">/ {studentScoreInfo.maxScore} درجة</span>
                              </p>
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-1.5">
                              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">تقدير الطالب العام</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-sm font-black uppercase tracking-wide border ${getStatusColor(studentScoreInfo.percentage)}`}>
                                  مستوى {getStatusText(studentScoreInfo.percentage)} ({studentScoreInfo.percentage}٪)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quran Progress Memorization Detail Card */}
                    {hasHifzRecord && (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 font-sans">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
                          <div className="flex items-center gap-2">
                            <BookOpen className="text-emerald-500" size={20} />
                            <div>
                              <h4 className="font-extrabold text-base text-slate-800">بطاقة متابعة الحفظ والتسميع اليومي</h4>
                              <p className="text-xs text-slate-450 mt-0.5 font-semibold">حالة رصد التقدم في الحفظ والمراجعة للمنهج الدراسي</p>
                            </div>
                          </div>
                          {(() => {
                            const mTasks = state.memorizationTasks || [];
                            const chronologicalTasks = [...mTasks].sort((a: any, b: any) => {
                              const isSeedA = a.id?.startsWith('hifz-seed');
                              const isSeedB = b.id?.startsWith('hifz-seed');
                              if (isSeedA && !isSeedB) return -1;
                              if (!isSeedA && isSeedB) return 1;
                              if (isSeedA && isSeedB) return (a.id || '').localeCompare(b.id || '');
                              const tsA = parseInt(a.id?.replace('hifz-', '') || '0') || 0;
                              const tsB = parseInt(b.id?.replace('hifz-', '') || '0') || 0;
                              return tsA - tsB;
                            });

                            const sGrades = getStudentGrades(selectedStudent.id);
                            const hifzGrades = sGrades.hifz || [];

                            const incompleteCount = mTasks.filter((t: any) => {
                              const chronoIndex = chronologicalTasks.findIndex((ct: any) => ct.id === t.id);
                              let isCompletedByGrade = false;
                              if (chronoIndex >= 0 && chronoIndex < 4) {
                                const hGrade = hifzGrades[chronoIndex];
                                if (hGrade !== undefined && hGrade !== null && String(hGrade).trim() !== '' && String(hGrade).trim() !== '-' && parseFloat(hGrade) > 0) {
                                  isCompletedByGrade = true;
                                }
                              }
                              const isCompleted = isCompletedByGrade || t.completedStudents?.includes(selectedStudent.id) || false;
                              return !isCompleted;
                            }).length;

                            return (
                              <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                                incompleteCount === 0 
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                  : 'text-amber-700 bg-amber-50 border-amber-100 font-sans'
                              }`}>
                                {incompleteCount === 0 ? 'جميع مهام الحفظ مكتملة ✨' : `المتبقي: ${incompleteCount} مهام معلقة`}
                              </span>
                            );
                          })()}
                        </div>

                        {(() => {
                          const mTasks = state.memorizationTasks || [];
                          if (mTasks.length === 0) {
                            return (
                              <div className="text-center py-8 text-sm text-slate-400 font-bold italic bg-slate-50 border border-dashed rounded-xl font-sans">
                                لا توجد مهام حفظ مضافة حالياً في المنهج الدراسي.
                              </div>
                            );
                          }

                          const chronologicalTasks = [...mTasks].sort((a: any, b: any) => {
                            const isSeedA = a.id?.startsWith('hifz-seed');
                            const isSeedB = b.id?.startsWith('hifz-seed');
                            if (isSeedA && !isSeedB) return -1;
                            if (!isSeedA && isSeedB) return 1;
                            if (isSeedA && isSeedB) return (a.id || '').localeCompare(b.id || '');
                            const tsA = parseInt(a.id?.replace('hifz-', '') || '0') || 0;
                            const tsB = parseInt(b.id?.replace('hifz-', '') || '0') || 0;
                            return tsA - tsB;
                          });

                          const sGrades = getStudentGrades(selectedStudent.id);
                          const hifzGrades = sGrades.hifz || [];

                          const tasksListWithStatus = chronologicalTasks.map((task, idx) => {
                            let hGrade = null;
                            let isCompletedByGrade = false;
                            if (idx >= 0 && idx < 4) {
                              const rawGrade = hifzGrades[idx];
                              if (rawGrade !== undefined && rawGrade !== null && String(rawGrade).trim() !== '' && String(rawGrade).trim() !== '-' && parseFloat(rawGrade) > 0) {
                                isCompletedByGrade = true;
                                hGrade = rawGrade;
                              }
                            }
                            const isCompleted = isCompletedByGrade || task.completedStudents?.includes(selectedStudent.id) || false;
                            return { task, isCompleted, hGrade, columnNum: idx + 1 };
                          });

                          return (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar-thin font-sans">
                              {tasksListWithStatus.map(({ task, isCompleted, hGrade, columnNum }, idx) => {
                                return (
                                  <div 
                                    key={task.id || idx} 
                                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                      isCompleted 
                                        ? 'bg-emerald-50/50 border-emerald-200 shadow-xs' 
                                        : 'bg-rose-50/50 border-rose-200 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-rose-400 animate-pulse'}`} />
                                        <span className="text-sm font-bold text-slate-700">
                                          {task.title || `مهمة حفظ ${idx + 1}`}
                                        </span>
                                      </div>
                                      {(task.requiredTask || task.description) && (
                                        <p className="text-xs text-slate-500 line-clamp-1 max-w-sm mr-3.5 pr-0.5 font-semibold">
                                          السورة: {task.surah || 'غير محدد'} | الآيات: {task.verses || 'كاملة'} ({task.requiredTask || task.description})
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 mr-3.5 text-[11px] text-slate-400 font-semibold font-sans">
                                        <Calendar size={11} className="text-slate-400 shrink-0" />
                                        <span>تاريخ النشر: {task.publishDate || 'غير محدد'}</span>
                                        {task.dueDate && <span className="text-slate-300 font-sans">|</span>}
                                        {task.dueDate && <span>تاريخ التسليم: {task.dueDate}</span>}
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center justify-start sm:justify-end gap-2 mt-2 sm:mt-0 font-sans">
                                      {isCompleted ? (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700 text-xs font-black">
                                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                          <span>تم التسميع ✓ {hGrade !== null && `(الدرجة: ${hGrade}/5)`}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 text-rose-700 text-xs font-black">
                                          <XCircle size={13} className="text-rose-500 shrink-0" />
                                          <span>غير منجز ⚠</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Homework Tracking Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 font-sans">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
                        <div className="flex items-center gap-2">
                          <BookMarked className="text-blue-500" size={20} />
                          <div>
                            <h4 className="font-extrabold text-base text-slate-800">بطاقة متابعة الواجبات المنزلية</h4>
                            <p className="text-xs text-slate-450 mt-0.5 font-semibold">تفاصيل وحالة تسليمات الواجبات المسجلة للوحدات الدراسية</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-blue-600 bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg font-sans">
                          تم تسليم {studentScoreInfo.hwScore} واجبات
                        </span>
                      </div>

                      {(() => {
                        const activeGrds = getStudentGrades(selectedStudent.id);
                        const homeworks = state.homework || [];

                        if (homeworks.length === 0) {
                          return (
                            <div className="text-center py-8 text-sm text-slate-400 font-bold italic bg-slate-50 border border-dashed rounded-xl font-sans">
                              لا توجد واجبات منزلية مضافة حالياً في المنهج الدراسي.
                            </div>
                          );
                        }

                        const chronologicalHws = [...homeworks].reverse();
                        const hwsListWithStatus = chronologicalHws.map((hw, idx) => {
                          const originalIdx = homeworks.indexOf(hw);
                          const isSubmitted = activeGrds.homework?.[originalIdx] || false;
                          return { hw, isSubmitted, columnNum: originalIdx + 1 };
                        });

                        return (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar-thin font-sans">
                            {hwsListWithStatus.map(({ hw, isSubmitted, columnNum }, idx) => {
                              return (
                                <div 
                                  key={hw.id || idx} 
                                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    isSubmitted 
                                      ? 'bg-emerald-50/50 border-emerald-200 shadow-xs' 
                                      : 'bg-rose-50/50 border-rose-200 hover:shadow-sm'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${isSubmitted ? 'bg-emerald-500' : 'bg-rose-400 animate-pulse'}`} />
                                      <span className="text-sm font-bold text-slate-700">
                                        {hw.title || `الواجب ${idx + 1}`}
                                      </span>
                                    </div>
                                    {hw.description && (
                                      <p className="text-xs text-slate-500 line-clamp-1 max-w-sm mr-3.5 pr-0.5 font-semibold font-sans">{hw.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 mr-3.5 text-[11px] text-slate-400 font-semibold font-sans">
                                      <Calendar size={11} className="text-slate-400 shrink-0" />
                                      <span>تاريخ النشر: {hw.publishDate || 'غير محدد'}</span>
                                      {hw.dueDate && <span className="text-slate-300 font-sans">|</span>}
                                      {hw.dueDate && <span className="text-amber-600">تاريخ التسليم المقرّر: {hw.dueDate}</span>}
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center justify-start sm:justify-end gap-2 mt-2 sm:mt-0 font-sans">
                                    {isSubmitted ? (
                                      <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700 text-xs font-black">
                                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                        <span>تم تسليم الواجب بنجاح ✓</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 text-rose-700 text-xs font-black">
                                        <XCircle size={13} className="text-rose-500 shrink-0" />
                                        <span>لم يتم التسليم ⚠</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Performance Tasks Tracking Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 font-sans">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="text-amber-500" size={20} />
                          <div>
                            <h4 className="font-extrabold text-base text-slate-800">بطاقة متابعة المهام والأنشطة الأدائية</h4>
                            <p className="text-xs text-slate-450 mt-0.5 font-semibold font-sans">رصد وتفاصيل المهمة الأدائية والنشاط للفصل الحالي</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg font-sans">
                            الدرجة المحققة: {studentScoreInfo.taskScore} / 5 درجات
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const tasksList = state.performanceTasks || [];
                        const isEvaluated = studentScoreInfo.taskScore > 0;

                        if (tasksList.length === 0) {
                          return (
                            <div className="p-4 bg-amber-50/20 border border-dashed rounded-xl border-amber-200 text-center space-y-2">
                              <FileText className="text-amber-400 mx-auto animate-pulse" size={28} />
                              <p className="text-sm font-extrabold text-amber-900">لا توجد مهام أدائية منشورة حالياً في البوابة</p>
                              <p className="text-xs text-amber-700 font-semibold max-w-md mx-auto leading-relaxed">
                                بانتظار نشر المهام الموكلة للفصل الدراسي من قبل معلم المادة.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4 col-span-full font-sans">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar-thin font-sans">
                              {tasksList.map((task, index) => {
                                return (
                                  <div 
                                    key={task.id || index} 
                                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                      isEvaluated 
                                        ? 'bg-emerald-50/50 border-emerald-200 shadow-xs' 
                                        : 'bg-rose-50/50 border-rose-200 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isEvaluated ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                        <span className="text-sm font-bold text-slate-700 font-sans">{task.title}</span>
                                      </div>
                                      {task.description && (
                                        <p className="text-xs text-slate-500 mr-3.5 pr-0.5 leading-relaxed font-semibold font-sans">{task.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 mr-3.5 text-[11px] text-slate-400 font-semibold font-sans">
                                        <Calendar size={11} className="text-slate-400 shrink-0" />
                                        <span>تاريخ النشر: {task.publishDate || 'غير محدد'}</span>
                                        {task.dueDate && <span className="text-slate-300 font-sans">|</span>}
                                        {task.dueDate && <span className="text-amber-600 font-sans">تاريخ التسليم المقرّر: {task.dueDate}</span>}
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center justify-start sm:justify-end gap-2 mt-2 sm:mt-0 font-sans">
                                      {isEvaluated ? (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700 text-xs font-black">
                                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                          <span>تم رصد التقييم: {studentScoreInfo.taskScore}/5 ✓</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold">
                                          <Timer size={13} className="text-slate-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                                          <span>بانتظار رصد التقييم</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Detail Gauge indicator */}
                            <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-2 font-sans">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-550">درجة إنجاز المهمة الأدائية التراكمي:</span>
                                <span className="text-amber-600 font-black text-sm">{studentScoreInfo.taskScore} من 5 درجات</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                                <div 
                                  className="bg-gradient-to-l from-amber-500 to-amber-600 h-full rounded-full transition-all duration-700" 
                                  style={{ width: `${(studentScoreInfo.taskScore / 5) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                <span>0 (لم تنجز بعد)</span>
                                <span>التقييم المستحق الكامل (5 من 5)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Attendance Log widget - hidden if hideAbsenceCalendarInStudentPortal */}
                    {!state.hideAbsenceCalendarInStudentPortal && (
                      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-indigo-600" size={18} />
                            <h4 className="font-extrabold text-sm text-slate-800">بيانات الحضور والغياب بالتقويم الهجري</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">الالتزام والانضباط</span>
                        </div>

                        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                          <HijriCalendar 
                            studentId={selectedStudent.id}
                            attendance={state.attendance || []}
                          />
                        </div>

                        <div className="text-[11px] font-black text-slate-500 pt-2 border-t border-dashed border-slate-100 mb-1">بيانات الرصد اليومي التفصيلية:</div>

                        {getStudentAttendance(selectedStudent.id).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getStudentAttendance(selectedStudent.id).map((record, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                                <span className="text-slate-500">
                                  {new Date(record.date).toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                                  record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  record.status === 'absent' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {record.status === 'present' && 'حاضر'}
                                  {record.status === 'absent' && 'غائب'}
                                  {record.status === 'late' && 'متأخر'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-400 italic">لا توجد حالات حضور/غياب مدونة للطالب حتى اللحظة.</div>
                        )}
                      </div>
                    )}

                  </motion.div>
                )}

              </div>
              
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-250 p-16 text-center max-w-xl mx-auto space-y-4 h-[350px] flex flex-col items-center justify-center shadow-inner"
            >
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 shadow-md">
                <BookMarked size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">بانتظار البحث عن الاسم</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
                  الرجاء كتابة اسم الطالب الرباعي أو اختيار أحد الاقتراحات السريعة لعرض تقريره كشف درجاته بالتفاصيل كاملة.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Soft footer */}
      <footer className="mt-20 border-t border-slate-200 text-center py-6 text-xs font-bold text-slate-450 tracking-wider">
        © نظام إدارة الدراسات الإسلامية والقرآن الكريم • جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
