import { useState } from 'react';
import { 
  BarChart3, 
  User, 
  AlertTriangle, 
  Download, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Search,
  ChevronRight,
  Printer,
  Award,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  CheckSquare,
  Layers,
  CheckCircle2,
  Eye,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import HijriCalendar, { getHijriDateDetails } from '../components/HijriCalendar';

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

function toArabicNumerals(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (w) => arabicDigits[parseInt(w, 10)]);
}

type ReportType = 'class' | 'student' | 'weak' | 'compare' | 'negligence' | 'detailed_stats';

export function ReportsPage() {
  const { state, updateState } = useApp();
  const studentsList = (state.students || [])
    .filter(s => s.status !== 'archived' && !s.class?.includes('أرشيف') && !s.class?.includes('ارشيف'))
    .sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, 'ar');
    });
  const classesList = state.classes || [];
  const activeClassesList = classesList.filter(c => !c.includes('أرشيف') && !c.includes('ارشيف') && !c.includes('الأرشيف'));
  const grades = state.grades || [];
  const attendance = state.attendance || [];
  
  const currentSemester = state.currentSemester || '1';
  const currentPeriod = state.currentPeriod || '1';

  const [activeReport, setActiveReport] = useState<ReportType>('class');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Negligence Report States
  const [headerTitle, setHeaderTitle] = useState(() => state.negligenceHeaders?.mainTitle || 'سورة الممتحنة');
  const [headerCol1, setHeaderCol1] = useState(() => state.negligenceHeaders?.col1 || '1-3');
  const [headerCol2, setHeaderCol2] = useState(() => state.negligenceHeaders?.col2 || '3-7');
  const [headerCol3, setHeaderCol3] = useState(() => state.negligenceHeaders?.col3 || 'الخانة 3');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Hidden rows (students) and columns in Negligence Report
  const [hiddenStudentIds, setHiddenStudentIds] = useState<string[]>([]);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);

  const hideStudentRow = (studentId: string) => {
    setHiddenStudentIds(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
  };

  const hideColumn = (colKey: string) => {
    setHiddenColumnKeys(prev => prev.includes(colKey) ? prev : [...prev, colKey]);
  };

  const resetHiddenRowsAndCols = () => {
    setHiddenStudentIds([]);
    setHiddenColumnKeys([]);
  };
  
  const selectedClass = (state.selectedClass && state.selectedClass !== 'الكل') 
    ? state.selectedClass 
    : (activeClassesList[0] || '');

  const setSelectedClass = (newClass: string) => {
    updateState({ selectedClass: newClass });
  };

  const selectedStudent = studentsList.find(s => s.id === selectedStudentId);

  // Helper code to calculate student subgrades for any given semester and period
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

    // 1. Homework (out of 10) - each checked homework slot represents exactly 1 mark
    const hwScore = g.homework ? g.homework.filter(Boolean).length : 0;
    
    // 2. Participation (out of 10) - each checked participation slot represents exactly 1 mark
    const partScore = g.participation ? g.participation.filter(Boolean).length : 0;
    
    // 3. Oral Quran Assessments (Recitation, Tajweed, Hifz)
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

    const taskScore = parseFloat(g.task) || 0;     // (out of 5)
    const oralScore = parseFloat(g.oral) || 0;     // (out of 15)
    const writtenScore = parseFloat(g.written) || 0; // (out of 45)

    const quranTotal = recitationScore + tajweedScore + hifzTestsScore; // (out of 15)
    
    // In ReportsPage, standard 100-point system
    const maxScore = 100;
    const totalScore = hwScore + partScore + quranTotal + taskScore + oralScore + writtenScore;

    return {
      homework: hwScore,
      participation: partScore,
      recitation: recitationScore,
      tajweed: tajweedScore,
      hifz: hifzTestsScore,
      task: taskScore,
      oral: oralScore,
      written: writtenScore,
      totalScore: parseFloat(Math.min(maxScore, totalScore).toFixed(1)),
      maxScore,
      percentage: parseFloat(Math.min(100, (totalScore / maxScore) * 100).toFixed(1))
    };
  };

  // Filter students based on current search and class parameters
  const getActiveSemesterStudents = () => {
    if (selectedClass === 'الكل') {
      return studentsList;
    }
    return studentsList.filter(s => s.class?.trim() === selectedClass?.trim());
  };

  const getFilteredStudentsForSearch = () => {
    return studentsList.filter(s => {
      const sNameNormalized = normalizeArabic(s.name || '');
      const sIdNormalized = (s.id || '').trim().toLowerCase();
      const searchNormalized = normalizeArabic(searchTerm);
      return !searchTerm || sNameNormalized.includes(searchNormalized) || sIdNormalized.includes(searchNormalized);
    });
  };

  // Compile statistics for Class Report
  const getClassStats = () => {
    const classStudents = getActiveSemesterStudents();
    if (classStudents.length === 0) return { avg: 0, successRate: 0, highest: 0, lowest: 0, successfulCount: 0, topStudents: [] };

    let totalPercentageSum = 0;
    let successfulCount = 0;
    let highestScore = 0;
    let lowestScore = 100;
    const scoredStudents: { name: string; id: string; percentage: number; class?: string }[] = [];

    classStudents.forEach(student => {
      const gradesInfo = getSubgrades(student.id, currentSemester, currentPeriod);
      totalPercentageSum += gradesInfo.percentage;
      if (gradesInfo.percentage >= 60) {
        successfulCount++;
      }
      if (gradesInfo.percentage > highestScore) {
        highestScore = gradesInfo.percentage;
      }
      if (gradesInfo.percentage < lowestScore) {
        lowestScore = gradesInfo.percentage;
      }
      scoredStudents.push({
        name: student.name,
        id: student.id,
        percentage: gradesInfo.percentage,
        class: student.class
      });
    });

    const avg = Math.round(totalPercentageSum / classStudents.length);
    const successRate = parseFloat(((successfulCount / classStudents.length) * 100).toFixed(1));
    const topStudents = scoredStudents
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .filter(s => s.percentage > 0);

    return { 
      avg, 
      successRate, 
      highest: highestScore, 
      lowest: lowestScore === 100 ? 0 : lowestScore, 
      successfulCount,
      topStudents 
    };
  };

  const classStats = getClassStats();

  // Selected Student Statistics
  const getSelectedStudentStats = () => {
    if (!selectedStudent) return null;
    const gradesP = getSubgrades(selectedStudent.id, currentSemester, currentPeriod);
    
    // Absences and lates
    const studentAttendance = attendance.filter((a: any) => a.studentId === selectedStudent.id);
    const absences = studentAttendance.filter((a: any) => a.status === 'absent').length;
    
    // Sort students by percentage to get rank
    const classStudents = studentsList.filter(s => s.class === selectedStudent.class);
    const ranks = classStudents.map(student => ({
      id: student.id,
      percentage: getSubgrades(student.id, currentSemester, currentPeriod).percentage
    })).sort((a, b) => b.percentage - a.percentage);
    
    const rankIndex = ranks.findIndex(r => r.id === selectedStudent.id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : '--';

    const g = grades.find((gr: any) => gr.studentId === selectedStudent.id && gr.semester === currentSemester && gr.period === currentPeriod) || {};

    // 1. Only homework registered in Yearly Work (أعمال السنة)
    const missingHomeworkList: string[] = [];
    const systemHws = state.homework || [];
    systemHws.forEach((hw: any, idx: number) => {
      const isDone = g.homework?.[idx] === true;
      if (!isDone) {
        missingHomeworkList.push(hw.title || `واجب (${idx + 1})`);
      }
    });

    // 2. Only memorization registered in Yearly Work (أعمال السنة)
    const missingHifzList: string[] = [];
    const systemHifzTasks = state.memorizationTasks || [];
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
        missingHifzList.push(task.title || `تسميع جزء الحفظ رقم ${idx + 1}`);
      }
    });

    // 3. Only performance tasks registered in Yearly Work (أعمال السنة)
    const missingTasksList: string[] = [];
    const isTaskCompleted = (parseFloat(g.task) || 0) > 0;
    const systemPerfTasks = state.performanceTasks || [];
    if (systemPerfTasks.length > 0 && !isTaskCompleted) {
      systemPerfTasks.forEach((t: any, idx: number) => {
        missingTasksList.push(t.title || `المهمة الأدائية ${idx + 1}`);
      });
    }

    const missingParticipationList: string[] = [];
    if (gradesP.participation < 10) {
      missingParticipationList.push(`متبقي ${10 - gradesP.participation} نقاط تفاعل`);
    }

    const missingTestsList: string[] = [];
    if (gradesP.oral < 15) {
      missingTestsList.push(`الاختبار الشفهي (${gradesP.oral}/15)`);
    }
    if (gradesP.written < 45) {
      missingTestsList.push(`الاختبار التحريري (${gradesP.written}/45)`);
    }

    const totalLostScore = Math.max(0, 100 - Math.round(gradesP.totalScore));

    return {
      grades: gradesP,
      absences,
      rank,
      totalCountInClass: classStudents.length,
      missingHomeworkList,
      missingHifzList,
      missingTasksList,
      missingParticipationList,
      missingTestsList,
      totalLostScore
    };
  };

  const studentStats = getSelectedStudentStats();

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 65) return 'جيد';
    if (percentage >= 50) return 'مقبول';
    return 'ضعيف';
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (percentage >= 80) return 'text-indigo-700 bg-indigo-50 border-indigo-100';
    if (percentage >= 65) return 'text-amber-700 bg-amber-50 border-amber-100';
    return 'text-rose-700 bg-rose-50 border-rose-100';
  };

  // Negligence/Deficiency Matrix Helper Functions
  const toggleCell = (studentId: string, customColKey: string) => {
    let newGrades = [...(state.grades || [])];
    const gIndex = newGrades.findIndex((gr: any) => gr.studentId === studentId && gr.semester === currentSemester && gr.period === currentPeriod);
    
    let studentGrade = gIndex >= 0 
      ? { ...newGrades[gIndex] } 
      : { 
          studentId, 
          semester: currentSemester,
          period: currentPeriod,
          homework: Array(10).fill(false), 
          participation: Array(10).fill(false),
          recitation: Array(4).fill(0),
          tajweed: Array(4).fill(0),
          hifz: Array(4).fill(0),
          task: 0,
          oral: 0,
          written: 0
        };

    const currentHifz = studentGrade.hifz || Array(4).fill(0);
    const currentRecitation = studentGrade.recitation || Array(4).fill(0);
    const hwCount = studentGrade.homework ? studentGrade.homework.filter(Boolean).length : 0;
    const partCount = studentGrade.participation ? studentGrade.participation.filter(Boolean).length : 0;
    const taskScore = parseFloat(studentGrade.task) || 0;

    if (customColKey === 'custom1') {
      const isCurrentlyEmpty = currentHifz[0] > 0;
      studentGrade.hifz = [...currentHifz];
      studentGrade.hifz[0] = isCurrentlyEmpty ? 0 : 5;
    } else if (customColKey === 'custom2') {
      const isCurrentlyEmpty = currentHifz[1] > 0;
      studentGrade.hifz = [...currentHifz];
      studentGrade.hifz[1] = isCurrentlyEmpty ? 0 : 5;
    } else if (customColKey === 'custom3') {
      const isCurrentlyEmpty = currentHifz[2] > 0;
      studentGrade.hifz = [...currentHifz];
      studentGrade.hifz[2] = isCurrentlyEmpty ? 0 : 5;
    } else if (customColKey === 'recitation') {
      const isCurrentlyEmpty = currentRecitation[0] > 0;
      studentGrade.recitation = [...currentRecitation];
      studentGrade.recitation[0] = isCurrentlyEmpty ? 0 : 5;
    } else if (customColKey === 'homework') {
      const isCurrentlyEmpty = hwCount >= 4;
      studentGrade.homework = isCurrentlyEmpty ? Array(10).fill(false) : Array(10).fill(true, 0, 4);
      studentGrade.homeworkRecorded = true;
    } else if (customColKey === 'participation') {
      const isCurrentlyEmpty = partCount >= 4;
      studentGrade.participation = isCurrentlyEmpty ? Array(10).fill(false) : Array(10).fill(true, 0, 4);
    } else if (customColKey === 'task') {
      const isCurrentlyEmpty = taskScore > 0;
      studentGrade.task = isCurrentlyEmpty ? 0 : 5;
    }

    // Recalculate average Oral exam grade after recitation or memorization changes
    const getAverage = (arr: number[]) => {
      if (!arr) return 0;
      const registeredCount = arr.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0);
      return registeredCount > 0 
        ? (arr.slice(0, registeredCount).reduce((subA: number, subB: number) => subA + (parseFloat(subB as any) || 0), 0) / registeredCount)
        : 0;
    };
    studentGrade.oral = parseFloat((getAverage(studentGrade.recitation) + getAverage(studentGrade.tajweed) + getAverage(studentGrade.hifz)).toFixed(1));

    if (gIndex >= 0) {
      newGrades[gIndex] = studentGrade;
    } else {
      newGrades.push(studentGrade);
    }

    // Direct synchronization into current global/firebase state
    updateState({
      grades: newGrades
    });
  };

  const handleSaveHeaders = () => {
    updateState({
      negligenceHeaders: {
        mainTitle: headerTitle,
        col1: headerCol1,
        col2: headerCol2,
        col3: headerCol3
      }
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let filename = `تقرير_${activeReport}_${selectedClass || 'عام'}.csv`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeReport === 'class') {
      const classStudents = getActiveSemesterStudents();
      filename = `تقرير_الصف_والتحصيل_الشهري_${selectedClass || 'عام'}.csv`;
      headers = [
        "اسم الطالب",
        "الواجبات (من 10)",
        "المشاركة (من 10)",
        "درجات القرآن (من 15)",
        "البحوث والمهام (من 5)",
        "الاختبار الشفهي (من 15)",
        "الاختبار التحريري (من 45)",
        "المجموع الكلي (من 100)"
      ];
      rows = classStudents.map(student => {
        const info = getSubgrades(student.id, currentSemester, currentPeriod);
        const quranTotal = (info.recitation ?? 0) + (info.tajweed ?? 0) + (info.hifz ?? 0);
        return [
          student.name || "",
          (info.homework ?? 0).toString(),
          (info.participation ?? 0).toString(),
          quranTotal ? quranTotal.toFixed(1) : "0",
          (info.task ?? 0).toString(),
          (info.oral ?? 0).toString(),
          (info.written ?? 0).toString(),
          (info.totalScore ?? 0).toString()
        ];
      });
    } else if (activeReport === 'student') {
      filename = `التقرير_التحليلي_للطالب_${selectedStudent?.name || 'عام'}.csv`;
      headers = ["المكون والتقييم كشفي", "الدرجة المستحقة", "الدرجة الكلية", "الحالة والنسبة %"];
      if (selectedStudent) {
        const info = getSubgrades(selectedStudent.id, currentSemester, currentPeriod);
        rows = [
          ["الواجبات اليومية والمشاريع", info.homework.toString(), "10", `${Math.round(info.homework * 10)}%`],
          ["المشاركة والتفاعل بالحلقة", info.participation.toString(), "10", `${Math.round(info.participation * 10)}%`],
          ["درجات القرآن التراكمية", (info.recitation + info.tajweed + info.hifz).toFixed(1), "15", `${Math.round((info.recitation + info.tajweed + info.hifz) / 15 * 100)}%`],
          ["الفرض والنشاطات الصفية", info.task.toString(), "5", `${Math.round(info.task / 5 * 100)}%`],
          ["الاختبار الشفهي التقييمي", info.oral.toString(), "15", `${Math.round(info.oral / 15 * 100)}%`],
          ["الاختبار التحريري الفصلي", info.written.toString(), "45", `${Math.round(info.written / 45 * 100)}%`],
          ["المجموع الأكاديمي الكلي للفترة", info.totalScore.toString(), "100", `${info.totalScore}%`]
        ];
      } else {
        rows = [["لا يوجد طالب محدد حالياً", "0", "100", "0%"]];
      }
    } else if (activeReport === 'compare') {
      const classStudents = getActiveSemesterStudents();
      filename = `مقارنة_درجات_الفترتين_الفصل_${selectedClass || 'عام'}.csv`;
      headers = ["اسم الطالب", "النسبة الفترة الأولى %", "النسبة الفترة الثانية %", "الفارق الأكاديمي"];
      rows = classStudents.map(student => {
        const p1 = getSubgrades(student.id, currentSemester, '1');
        const p2 = getSubgrades(student.id, currentSemester, '2');
        const diff = p2.totalScore - p1.totalScore;
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        return [
          student.name,
          `${p1.totalScore}%`,
          `${p2.totalScore}%`,
          diffStr
        ];
      });
    } else if (activeReport === 'weak') {
      const classStudents = getActiveSemesterStudents();
      filename = `كشف_دعم_الأداء_الضعيف_${selectedClass || 'عام'}.csv`;
      headers = ["اسم الطالب", "نسبة التحصيل الإجمالية %", "تصنيف حالة الدعم الموصى بها", "نقاط الضعف الملحوظة عاجل"];
      
      const weakStudents = classStudents.map(student => {
        const info = getSubgrades(student.id, currentSemester, currentPeriod);
        return { student, info };
      }).filter(item => item.info.totalScore < 70);

      rows = weakStudents.map(item => {
        const score = item.info.totalScore;
        const level = score < 50 ? "أداء حرج جداً" : (score < 60 ? "ضعيف جداً" : "يحتاج تقوية");
        const weaks: string[] = [];
        if (item.info.homework < 7) weaks.push("واجبات مفقودة");
        if (item.info.participation < 7) weaks.push("خمول التفاعل");
        if (score < 60 && item.info.written < 27) weaks.push("ضعف التحريري");
        if (weaks.length === 0) weaks.push("الاستيعاب والتركيز الكلي");

        return [
          item.student.name,
          `${score}%`,
          level,
          weaks.join(" - ")
        ];
      });
      if (rows.length === 0) {
        rows = [["لا يوجد طلاب ضعاف تحت عتبة 70% في هذا الفصل", "-", "-", "-"]];
      }
    } else if (activeReport === 'negligence') {
      const classStudents = getActiveSemesterStudents();
      filename = `كشف_التقصير_والإهمال_${selectedClass || 'عام'}.csv`;
      headers = ["اسم الطالب", "الواجبات غير المكتملة", "الموازنة والتفاعل", "المجموع الكلي %"];
      rows = classStudents.map(student => {
        const info = getSubgrades(student.id, currentSemester, currentPeriod);
        const homeworkMissing = Math.max(0, 10 - Math.round(info.homework));
        const status = info.totalScore >= 85 ? "منضبط وممتاز" : (info.totalScore >= 70 ? "متوسط الانضباط" : "مقصر ويحتاج إنذار");
        return [
          student.name,
          `${homeworkMissing} واجب ناقص`,
          status,
          `${info.totalScore}%`
        ];
      });
    } else if (activeReport === 'detailed_stats') {
      filename = `الإحصائيات_التفصيلية_ونطاقات_الدرجات_${selectedClass || 'عام'}.csv`;
      headers = ["المستوى والنتيجة للتقرير", "النطاق المعياري من 40 درجة", "عدد الطلاب", "النسبة المئوية %"];
      
      const classStudents = getActiveSemesterStudents();
      let ممتازCount = 0;
      let جيدجداCount = 0;
      let جيدCount = 0;
      let مقبولCount = 0;
      let ضعيفCount = 0;

      classStudents.forEach(st => {
        const info = getSubgrades(st.id, currentSemester, currentPeriod);
        const score40 = (info.percentage / 100) * 40;
        if (score40 >= 36) ممتازCount++;
        else if (score40 >= 32) جيدجداCount++;
        else if (score40 >= 28) جيدCount++;
        else if (score40 >= 20) مقبولCount++;
        else ضعيفCount++;
      });
      const total = classStudents.length || 1;

      rows = [
        ["ممتاز", "36 - 40", ممتازCount.toString(), `${Math.round(ممتازCount / total * 100)}%`],
        ["جيد جداً", "32 - 35.99", جيدجداCount.toString(), `${Math.round(جيدجداCount / total * 100)}%`],
        ["جيد", "28 - 31.99", جيدCount.toString(), `${Math.round(جيدCount / total * 100)}%`],
        ["مقبول", "20 - 27.99", مقبولCount.toString(), `${Math.round(مقبولCount / total * 100)}%`],
        ["ضعيف", "اقل من 20", ضعيفCount.toString(), `${Math.round(ضعيفCount / total * 100)}%`],
      ];
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end gap-4 print:hidden px-4 md:px-0">
        <div>
          <h2 className="text-2xl font-extrabold text-[#115e3b] font-sans">مركز التقارير الأكاديمية</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 font-sans">عرض وتحليل تقارير تقدم الطلاب والتحصيل العلمي الكلي والكشف المقارن بين الفترات الدراسية</p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handlePrint}
            title="طباعة التقرير"
            className="p-2 bg-white border border-slate-200 rounded-xl text-[#115e3b] hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <Printer size={16} />
          </button>
          <button 
            type="button"
            onClick={handleDownload}
            title="تنزيل البيانات Excel"
            className="p-2 bg-white border border-slate-200 rounded-xl text-[#115e3b] hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <Download size={16} />
          </button>
        </div>
      </header>

      {/* Report Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-slate-100 rounded-xl w-full border border-slate-200/50 print:hidden text-slate-800">
        <button 
          onClick={() => { setActiveReport('class'); setSelectedStudentId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeReport === 'class' ? 'bg-[#115e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={14} />
          تقرير الصف والتحصيل
        </button>
        <button 
          onClick={() => { setActiveReport('student'); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeReport === 'student' ? 'bg-[#115e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User size={14} />
          تقرير الطالب التحليلي
        </button>
        <button 
          onClick={() => { setActiveReport('compare'); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeReport === 'compare' ? 'bg-[#115e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} />
          مقارنة درجات الفترتين 📊
        </button>
        <button 
          onClick={() => { setActiveReport('weak'); setSelectedStudentId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeReport === 'weak' ? 'bg-[#115e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={14} />
          دعم الأداء الضعيف
        </button>
        <button 
          onClick={() => { setActiveReport('negligence'); setSelectedStudentId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeReport === 'negligence' ? 'bg-[#115e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={14} className="text-[#115e3b]" />
          كشف التقصير والإهمال ⚠️
        </button>
        <button 
          onClick={() => { setActiveReport('detailed_stats'); setSelectedStudentId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            activeReport === 'detailed_stats' ? 'bg-[#115e3b] text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award size={14} className="text-[#115e3b]" />
          الإحصائيات التفصيلية 📊
        </button>
      </div>

      <main className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* 1. Class Report Tab */}
          {activeReport === 'class' && (
            <motion.div 
              key="class-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Class Selector */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-black text-slate-600 shrink-0">الصف المستهدف للتحليل:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeClassesList.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedClass(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          selectedClass === c
                            ? 'bg-[#115e3b] text-white border-[#115e3b] shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100/80'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  الفصل الدراسي الحالي: <span className="text-[#115e3b] font-bold">الفصل الدراسي {currentSemester === '1' ? 'الأول' : 'الثاني'}</span> • الفترة: <span className="text-[#115e3b] font-bold">{currentPeriod === '1' ? 'الأولى' : 'الثانية'}</span>
                </div>
              </div>

              {/* Class Header Pills matching the screenshot */}
              {(() => {
                const today = new Date();
                const hj = getHijriDateDetails(today);
                const hjDayArabic = toArabicNumerals(hj.day);
                const hjYearArabic = toArabicNumerals(hj.year);
                const hijriDateString = `${hjDayArabic} ${hj.monthName} ${hjYearArabic}`;

                const sortedClassStudents = getActiveSemesterStudents()
                  .map(st => {
                    const gradesInfo = getSubgrades(st.id, currentSemester, currentPeriod);
                    return {
                      ...st,
                      gradesInfo,
                      percentage: gradesInfo.percentage
                    };
                  })
                  .sort((a, b) => b.percentage - a.percentage);

                return (
                  <>
                    {/* Header Info Badges exactly like the screenshot */}
                    <div className="flex justify-between items-center w-full gap-4 mb-4 select-none">
                      {/* Left: Selected Class Badge */}
                      <div className="bg-white py-2.5 px-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center min-w-[140px] text-center">
                        <span className="text-[10px] font-bold text-slate-400">الفصل المحدد</span>
                        <span className="text-lg font-black text-[#115e3b] mt-0.5">
                          {selectedClass}
                        </span>
                      </div>

                      {/* Right: Hijri Date */}
                      <div className="bg-white py-2.5 px-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center min-w-[200px] text-center">
                        <span className="text-[10px] font-bold text-slate-400">التاريخ الهجري</span>
                        <span className="text-lg font-black text-[#115e3b] mt-0.5">
                          {hijriDateString} هـ
                        </span>
                      </div>
                    </div>

                    {/* Main Class Report Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-100/40 flex flex-col gap-6 w-full max-w-4xl mx-auto">
                      {/* Title block */}
                      <div className="text-center">
                        <h2 className="text-4xl font-extrabold text-[#115e3b] tracking-tight">تقرير الفصل</h2>
                        <p className="text-sm font-bold text-slate-500 mt-2">
                          {selectedClass} - {currentPeriod === '1' ? 'الفترة الأولى' : 'الفترة الثانية'} - {hijriDateString} هـ
                        </p>
                      </div>

                      {/* Five Stats Cards block */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4 my-2">
                        {/* 1. إجمالي الطلاب */}
                        <div className="bg-[#e8f7f2] p-4 rounded-3xl flex flex-col justify-center items-center text-center shadow-xs">
                          <span className="text-[11px] font-semibold text-[#115e3b]/85 mb-1">إجمالي الطلاب</span>
                          <span className="text-4xl font-black text-[#115e3b] tracking-tight">
                            {getActiveSemesterStudents().length}
                          </span>
                        </div>

                        {/* 2. متوسط الدرجات */}
                        <div className="bg-[#e8f7f2] p-4 rounded-3xl flex flex-col justify-center items-center text-center shadow-xs">
                          <span className="text-[11px] font-semibold text-[#115e3b]/85 mb-1">متوسط الدرجات</span>
                          <span className="text-4xl font-black text-[#115e3b] tracking-tight">
                            {classStats.avg}
                          </span>
                        </div>

                        {/* 3. عدد الناجحين */}
                        <div className="bg-[#e8f7f2] p-4 rounded-3xl flex flex-col justify-center items-center text-center shadow-xs">
                          <span className="text-[11px] font-semibold text-[#115e3b]/85 mb-1">عدد الناجحين</span>
                          <span className="text-4xl font-black text-[#115e3b] tracking-tight">
                            {classStats.successfulCount}
                          </span>
                        </div>

                        {/* 4. أعلى درجة */}
                        <div className="bg-[#e8f7f2] p-4 rounded-3xl flex flex-col justify-center items-center text-center shadow-xs">
                          <span className="text-[11px] font-semibold text-[#115e3b]/85 mb-1">أعلى درجة</span>
                          <span className="text-4xl font-black text-[#115e3b] tracking-tight">
                            {classStats.highest}
                          </span>
                        </div>

                        {/* 5. أقل درجة */}
                        <div className="bg-[#e8f7f2] p-4 rounded-3xl flex flex-col justify-center items-center text-center shadow-xs">
                          <span className="text-[11px] font-semibold text-[#115e3b]/85 mb-1">أقل درجة</span>
                          <span className="text-4xl font-black text-[#115e3b] tracking-tight">
                            {classStats.lowest}
                          </span>
                        </div>
                      </div>

                      {/* List of Student Progress score bars */}
                      <div className="space-y-4 mt-4" dir="rtl">
                        {sortedClassStudents.map((st, idx) => (
                          <div 
                            key={st.id} 
                            className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 gap-6"
                          >
                            {/* Right side: Green badge with Eastern Arabic index */}
                            <div className="w-12 h-12 rounded-full bg-[#115e3b] text-white flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                              {toArabicNumerals(idx + 1)}
                            </div>

                            {/* Middle: Student name */}
                            <span className="text-lg font-black text-slate-800 text-right flex-1 truncate">
                              {st.name}
                            </span>

                            {/* Left side: visual progress score bar */}
                            <div className="w-full max-w-[320px] bg-slate-100 rounded-full h-10 relative overflow-hidden flex-shrink-0 flex items-center shadow-inner">
                              <div 
                                className="absolute right-0 top-0 bottom-0 bg-[#115e3b] rounded-full flex items-center justify-center transition-all duration-500"
                                style={{ width: `${st.percentage}%` }}
                              >
                                <span className="text-white text-sm font-extrabold px-4">
                                  {toArabicNumerals(st.percentage)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {sortedClassStudents.length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic">
                            لا يوجد طلاب مسجلون في هذا صف وبوابة لعرض تقريرهم
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* 2. Student Report Tab */}
          {activeReport === 'student' && (
            <motion.div 
              key="student-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Left Column: Student Selector */}
              <div className="col-span-12 lg:col-span-4 space-y-4 print:hidden">
                <div className="relative group">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-650 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="ابحث عن طالب بالاسم أو الكود..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold transition-all shadow-sm"
                  />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 max-h-[500px] overflow-y-auto no-scrollbar space-y-2">
                  {getFilteredStudentsForSearch().length > 0 ? getFilteredStudentsForSearch().map((s, idx) => (
                    <button 
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                        selectedStudentId === s.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-right min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${selectedStudentId === s.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{s.name}</p>
                          <p className={`text-[9px] font-semibold opacity-70 ${selectedStudentId === s.id ? 'text-indigo-100' : 'text-slate-400'}`}>{s.class}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className={selectedStudentId === s.id ? '' : 'text-slate-400'} />
                    </button>
                  )) : (
                    <div className="text-center py-8 text-xs text-slate-400 italic">لا توجد نتائج مطابقة لبحثك</div>
                  )}
                </div>
              </div>

              {/* Right Column: Main Analysis Panel */}
              <div className="col-span-12 lg:col-span-8 print:col-span-12">
                <AnimatePresence mode="wait">
                  {selectedStudent && studentStats ? (
                    <motion.div 
                      key={selectedStudent.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-6"
                    >
                      {/* Top Header matching reference screenshot: Vertical blue bar, 'تقرير الطالب', student details */}
                      <div className="flex justify-between items-start flex-wrap gap-4 pb-3 border-b border-slate-100">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-6 sm:h-7 bg-blue-600 rounded-full shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                              تقرير الطالب
                            </h2>
                            <span className="text-xs font-black bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full">
                              {selectedStudent.class}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-600 font-bold flex-wrap pt-0.5">
                            <span className="text-slate-800 font-extrabold flex items-center gap-1">
                              <User size={14} className="text-blue-600" />
                              <span>اسم الطالب:</span>
                              <span className="text-blue-900 font-black text-sm sm:text-base">{selectedStudent.name}</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-medium">
                              الفصل {currentSemester === '1' ? 'الأول' : 'الثاني'} (الفترة {currentPeriod === '1' ? 'الأولى' : 'الثانية'})
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getStatusColor(studentStats.grades.percentage)}`}>
                              مستوى {getStatusLabel(studentStats.grades.percentage)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 print:hidden">
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                            title="طباعة التقرير"
                          >
                            <Printer size={15} />
                            <span>طباعة التقرير</span>
                          </button>
                        </div>
                      </div>

                      {/* Micro Quick Indicators Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500">المجموع النهائي</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-blue-700">{studentStats.grades.totalScore}</span>
                            <span className="text-xs font-bold text-slate-400">/ 100</span>
                          </div>
                          <span className="text-[10px] font-black text-blue-600 mt-0.5">نسبة {studentStats.grades.percentage}%</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500">التقدير العام</span>
                          <div className="mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black border ${getStatusColor(studentStats.grades.percentage)}`}>
                              {getStatusLabel(studentStats.grades.percentage)}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">مستوى التحصيل</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500">الترتيب في الصف</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-slate-800">#{studentStats.rank}</span>
                            <span className="text-[10px] font-bold text-slate-400">من {studentStats.totalCountInClass}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">بين طلاب الصف</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500">أيام الغياب</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-2xl font-black font-mono ${studentStats.absences > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {studentStats.absences}
                            </span>
                            <span className="text-xs font-bold text-slate-400">أيام</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">سجل المواظبة</span>
                        </div>
                      </div>

                      {/* Core Section: Categorized Deficiencies & Follow-up Columns (Matches reference screenshot) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                            <h3 className="text-xs sm:text-sm font-black text-slate-900">
                              سجل متابعة المهام والنواقص المقررة
                            </h3>
                          </div>
                          <span className="text-[11px] font-black text-slate-500">
                            {studentStats.totalLostScore > 0 
                              ? `الفاقد الكلي: -${studentStats.totalLostScore} درجة` 
                              : 'كافة المتطلبات منجزة بنجاح 🌟'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* 1. الواجبات (Homework) */}
                          <div className="bg-[#f0f4f9] border border-blue-100/90 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-blue-200/50">
                              <div className="flex items-center gap-2">
                                <BookOpen size={16} className="text-blue-700" />
                                <span className="font-black text-xs sm:text-sm text-slate-800">الواجبات</span>
                              </div>
                              {studentStats.missingHomeworkList.length > 0 ? (
                                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  {studentStats.missingHomeworkList.length}
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  ✓
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 min-h-[44px] items-center">
                              {studentStats.missingHomeworkList.length > 0 ? (
                                studentStats.missingHomeworkList.map((hw: string, i: number) => (
                                  <span 
                                    key={i} 
                                    className="bg-white text-red-600 border border-red-200/90 rounded-full px-3 py-1 font-black text-[11px] shadow-2xs inline-flex items-center gap-1"
                                  >
                                    • {hw}
                                  </span>
                                ))
                              ) : (
                                <span className="bg-white text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-black text-[11px] shadow-2xs">
                                  أنجز كافة الواجبات (10/10) ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold flex justify-between pt-1 border-t border-blue-200/40">
                              <span>الدرجة المحققة:</span>
                              <span className="font-black text-blue-900 font-mono">{studentStats.grades.homework} / 10</span>
                            </div>
                          </div>

                          {/* 2. الحفظ (Memorization / Quran) */}
                          <div className="bg-[#f0f4f9] border border-blue-100/90 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-blue-200/50">
                              <div className="flex items-center gap-2">
                                <Award size={16} className="text-emerald-700" />
                                <span className="font-black text-xs sm:text-sm text-slate-800">الحفظ</span>
                              </div>
                              {studentStats.missingHifzList.length > 0 ? (
                                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  {studentStats.missingHifzList.length}
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  ✓
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 min-h-[44px] items-center">
                              {studentStats.missingHifzList.length > 0 ? (
                                studentStats.missingHifzList.map((surah: string, i: number) => (
                                  <span 
                                    key={i} 
                                    className="bg-white text-red-600 border border-red-200/90 rounded-full px-3 py-1 font-black text-[11px] shadow-2xs inline-flex items-center gap-1"
                                  >
                                    • {surah}
                                  </span>
                                ))
                              ) : (
                                <span className="bg-white text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-black text-[11px] shadow-2xs">
                                  أتقن حفظ المقاطع المقررة كاملة ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold flex justify-between pt-1 border-t border-blue-200/40">
                              <span>شواهد الحفظ:</span>
                              <span className="font-black text-emerald-900 font-mono">{studentStats.grades.hifz} / 5</span>
                            </div>
                          </div>

                          {/* 3. المهمة الأدائية (Performance Task) */}
                          <div className="bg-[#f0f4f9] border border-blue-100/90 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-blue-200/50">
                              <div className="flex items-center gap-2">
                                <CheckSquare size={16} className="text-amber-700" />
                                <span className="font-black text-xs sm:text-sm text-slate-800">المهمة الأدائية</span>
                              </div>
                              {studentStats.missingTasksList.length > 0 ? (
                                <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  {studentStats.missingTasksList.length}
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  ✓
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 min-h-[44px] items-center">
                              {studentStats.missingTasksList.length > 0 ? (
                                studentStats.missingTasksList.map((task: string, i: number) => (
                                  <span 
                                    key={i} 
                                    className="bg-white text-red-600 border border-red-200/90 rounded-full px-3 py-1 font-black text-[11px] shadow-2xs inline-flex items-center gap-1"
                                  >
                                    • {task}
                                  </span>
                                ))
                              ) : (
                                <span className="bg-white text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-black text-[11px] shadow-2xs">
                                  تم تسليم المهمة والمشروع كاملاً ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold flex justify-between pt-1 border-t border-blue-200/40">
                              <span>درجة المهمة:</span>
                              <span className="font-black text-amber-900 font-mono">{studentStats.grades.task} / 5</span>
                            </div>
                          </div>
                        </div>

                        {/* Secondary Deficiency Row: Participation & Tests if needed */}
                        {(studentStats.missingParticipationList.length > 0 || studentStats.missingTestsList.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {studentStats.missingParticipationList.length > 0 && (
                              <div className="bg-[#f0f4f9] border border-blue-100/90 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <User size={15} className="text-teal-700" />
                                  <span className="text-xs font-black text-slate-800">المشاركة والتفاعل:</span>
                                </div>
                                <span className="bg-white text-red-600 border border-red-200/90 rounded-full px-3 py-0.5 font-black text-[11px] shadow-2xs">
                                  {studentStats.missingParticipationList[0]} ({studentStats.grades.participation}/10)
                                </span>
                              </div>
                            )}
                            {studentStats.missingTestsList.length > 0 && (
                              <div className="bg-[#f0f4f9] border border-blue-100/90 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText size={15} className="text-blue-700" />
                                  <span className="text-xs font-black text-slate-800">رصد الاختبارات:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {studentStats.missingTestsList.map((t: string, i: number) => (
                                    <span key={i} className="bg-white text-red-600 border border-red-200/90 rounded-full px-2.5 py-0.5 font-black text-[10px] shadow-2xs">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Breakdown analysis */}
                      <div className="space-y-4 pt-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-3">
                           تحليل بنود التقييم بالتفصيل
                           <div className="flex-1 h-px bg-slate-100" />
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Item 1, 2, 3: القرآن الكريم (التلاوة والتجويد والحفظ) */}
                          <div className="p-4 bg-emerald-50/20 border border-emerald-100/70 rounded-xl space-y-3 col-span-1 md:col-span-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                <BookOpen size={16} className="text-emerald-600" /> القرآن الكريم (التلاوة، التجويد، الحفظ)
                              </span>
                              <span className="font-black text-emerald-700">
                                {parseFloat((studentStats.grades.recitation + studentStats.grades.tajweed + studentStats.grades.hifz).toFixed(1))} / 15
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((studentStats.grades.recitation + studentStats.grades.tajweed + studentStats.grades.hifz) / 15) * 100}%` }} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-emerald-200/40 text-[10px] font-bold text-slate-650 text-right">
                              <div className="bg-slate-50/85 p-2 rounded-lg border border-slate-150/50 text-center">
                                <span className="text-slate-400 block mb-0.5">التلاوة</span>
                                <span className="text-indigo-600 font-extrabold">{studentStats.grades.recitation} / 5</span>
                              </div>
                              <div className="bg-slate-50/85 p-2 rounded-lg border border-slate-150/50 text-center">
                                <span className="text-slate-400 block mb-0.5">التجويد</span>
                                <span className="text-violet-600 font-extrabold">{studentStats.grades.tajweed} / 5</span>
                              </div>
                              <div className="bg-slate-50/85 p-2 rounded-lg border border-slate-150/50 text-center">
                                <span className="text-slate-400 block mb-0.5">شواهد الحفظ</span>
                                <span className="text-emerald-600 font-extrabold">{studentStats.grades.hifz} / 5</span>
                              </div>
                            </div>
                          </div>

                          {/* Item 4: Homework */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-blue-500" /> إنجاز الواجبات
                              </span>
                              <span className="font-black text-blue-600">{studentStats.grades.homework} / 10</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(studentStats.grades.homework / 10) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 5: Participation */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <User size={14} className="text-teal-555 text-teal-500" /> المشاركة الصيفية
                              </span>
                              <span className="font-black text-teal-600">{studentStats.grades.participation} / 10</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(studentStats.grades.participation / 10) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 6: task */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <CheckSquare size={14} className="text-amber-500" /> المشاريع والأنشطة
                              </span>
                              <span className="font-black text-amber-600">{studentStats.grades.task} / 5</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(studentStats.grades.task / 5) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 7: Oral Test */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <BookOpen size={14} className="text-orange-500" /> الاختبار الشفهي
                              </span>
                              <span className="font-black text-orange-600">{studentStats.grades.oral} / 15</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(studentStats.grades.oral / 15) * 100}%` }} />
                            </div>
                          </div>

                          {/* Item 8: Written Exam */}
                          <div className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2 col-span-1 md:col-span-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <FileText size={14} className="text-rose-500" /> الاختبار التحريري النهائي
                              </span>
                              <span className="font-black text-rose-600">{studentStats.grades.written} / 45</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(studentStats.grades.written / 45) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Hijri Calendar Card */}
                        <div className="pt-4 border-t border-slate-105">
                          <HijriCalendar 
                            studentId={selectedStudent.id}
                            attendance={state.attendance || []}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-350 shadow-inner mb-4">
                          <User size={24} strokeWidth={1.5} />
                       </div>
                       <h3 className="text-sm font-bold text-slate-800">اختر طالباً من كشف الأسماء</h3>
                       <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">يرجى تحديد طالب من القائمة الجانبية اليمنى لعرض تقريره التحصيلي والتقدير والغياب المحدث للفترة الحالية.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* 3. NEW Period 1 vs. Period 2 Comparison Tab */}
          {activeReport === 'compare' && (
            <motion.div 
              key="comparison-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Top Banner & Control */}
              <div className="bg-gradient-to-l from-indigo-900 to-indigo-850 text-white p-6 rounded-2xl border border-indigo-805 shadow-md relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-[9px] font-black tracking-wider uppercase">الفصل الدراسي {currentSemester === '1' ? 'الأول' : 'الثاني'}</span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" />
                  </div>
                  <h3 className="text-base font-extrabold">مقارنة أداء الطلاب والتقدم بين الفترتين الأولى والثانية</h3>
                  <p className="text-indigo-200 text-[10px] max-w-xl">كشف تحليلي يقارن تحصيل الطلاب في الفترة الأولى من الفصل مع نتائجهم في الفترة الثانية لقياس دقة الأداء ومعدل التحسن الأكاديمي.</p>
                </div>
                
                <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
                  <span className="text-xs font-semibold text-indigo-100">تحليل الصف:</span>
                  <div className="flex flex-wrap gap-1.5 bg-indigo-950/40 p-1 rounded-xl border border-indigo-700/60">
                    {activeClassesList.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedClass(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                          selectedClass === c
                            ? 'bg-white text-indigo-900 shadow-sm'
                            : 'text-indigo-100 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selector and comparison table */}
              <div className="grid grid-cols-12 gap-6">
                {/* Right side: student search / list with Delta */}
                <div className="col-span-12 lg:col-span-6 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">قائمة تقرير الفترتين للفصل {selectedClass}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">انقر على أي طالب لعرض مقارنة مفصلة بجميع البنود</p>
                      </div>
                      <div className="relative w-48 group print:hidden">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={12} />
                        <input 
                          type="text" 
                          placeholder="بحث..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pr-8 pl-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400">
                            <th className="pb-2 font-black pr-1">الطالب</th>
                            <th className="pb-2 text-center font-black">الفترة 1</th>
                            <th className="pb-2 text-center font-black">الفترة 2</th>
                            <th className="pb-2 text-center font-black pl-1">مقدار التغير</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {getActiveSemesterStudents().filter(s => {
                            const sNameNormalized = normalizeArabic(s.name || '');
                            const searchNormalized = normalizeArabic(searchTerm);
                            return !searchTerm || sNameNormalized.includes(searchNormalized);
                          }).map((st, idx) => {
                            const p1Grades = getSubgrades(st.id, currentSemester, '1');
                            const p2Grades = getSubgrades(st.id, currentSemester, '2');
                            const delta = parseFloat((p2Grades.percentage - p1Grades.percentage).toFixed(1));
                            const isSelected = selectedStudentId === st.id;

                            return (
                              <tr 
                                key={st.id} 
                                onClick={() => setSelectedStudentId(st.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50 font-bold' : 'hover:bg-slate-50/70'
                                }`}
                              >
                                <td className="py-3 pr-1 text-slate-800">
                                  <p className="font-bold text-xs">{idx + 1}. {st.name}</p>
                                  <p className="text-[9px] text-slate-400">{st.class}</p>
                                </td>
                                <td className="py-3 text-center text-slate-600">{p1Grades.percentage}%</td>
                                <td className="py-3 text-center text-indigo-650 text-indigo-600 font-extrabold">{p2Grades.percentage}%</td>
                                <td className="py-3 text-center pl-1 font-black">
                                  {delta > 0 ? (
                                    <span className="text-emerald-600 flex items-center justify-center gap-0.5">
                                      <ArrowUpRight size={12} /> +{delta}%
                                    </span>
                                  ) : delta < 0 ? (
                                    <span className="text-rose-600 flex items-center justify-center gap-0.5">
                                      <TrendingDown size={12} /> {delta}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 flex items-center justify-center">0.0%</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {getActiveSemesterStudents().length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-xs text-slate-400 italic">لا يوجد طلاب مسجلون في هذا الصف والمجموعة</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Left side: Detailed side-by-side student breakdown */}
                <div className="col-span-12 lg:col-span-6">
                  <AnimatePresence mode="wait">
                    {selectedStudent ? (
                      <motion.div
                        key={`comp-detail-${selectedStudent.id}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6"
                      >
                        <div className="pb-4 border-b border-slate-100 flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">المقارنة الفردية المباشرة</span>
                            <h4 className="text-xs font-black text-slate-850 mt-1">{selectedStudent.name}</h4>
                            <p className="text-[9px] text-slate-400">الصف: {selectedStudent.class}</p>
                          </div>
                          
                          {/* Comparative visual bubble */}
                          {(() => {
                            const p1 = getSubgrades(selectedStudent.id, currentSemester, '1');
                            const p2 = getSubgrades(selectedStudent.id, currentSemester, '2');
                            const diff = parseFloat((p2.percentage - p1.percentage).toFixed(1));
                            return (
                              <div className="text-left font-black">
                                <span className="text-[8px] text-slate-400 block mb-0.5">معدل التغيير</span>
                                <div className={`text-sm px-3 py-1 rounded-xl flex items-center gap-1 shrink-0 ${
                                  diff > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : diff < 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                }`}>
                                  {diff > 0 ? <ArrowUpRight size={14} /> : diff < 0 ? <TrendingDown size={14} /> : null}
                                  <span>{diff > 0 ? '+' : ''}{diff}%</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Side by side stats widgets */}
                        {(() => {
                          const p1 = getSubgrades(selectedStudent.id, currentSemester, '1');
                          const p2 = getSubgrades(selectedStudent.id, currentSemester, '2');
                          return (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-105 text-center relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-2 h-full bg-slate-300" />
                                  <p className="text-[9px] font-black text-slate-400 mb-1">نسبة التحصيل (الفترة الأولى)</p>
                                  <span className="text-3xl font-black text-slate-700">{p1.percentage}%</span>
                                  <span className="text-[8px] text-slate-400 block mt-1">{p1.totalScore} / {p1.maxScore} درجة</span>
                                </div>
                                <div className="p-4 bg-indigo-50/20 rounded-2xl border border-indigo-103 text-center relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
                                  <p className="text-[9px] font-black text-indigo-500 mb-1">نسبة التحصيل (الفترة الثانية)</p>
                                  <span className="text-3xl font-black text-indigo-605 text-indigo-600">{p2.percentage}%</span>
                                  <span className="text-[8px] text-indigo-400 block mt-1">{p2.totalScore} / {p2.maxScore} درجة</span>
                                </div>
                              </div>

                              {/* Comparative items list */}
                              <div className="space-y-3.5 pt-2">
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  مقارنة المعايير الثمانية
                                  <div className="flex-1 h-px bg-slate-105" />
                                </h5>

                                {[
                                  { label: 'التلاوة (5 درجات)', val1: p1.recitation, val2: p2.recitation, max: 5 },
                                  { label: 'التجويد (5 درجات)', val1: p1.tajweed, val2: p2.tajweed, max: 5 },
                                  { label: 'اختبارات الحفظ (5 درجات)', val1: p1.hifz, val2: p2.hifz, max: 5 },
                                  { label: 'إنجاز الواجبات (10 درجات)', val1: p1.homework, val2: p2.homework, max: 10 },
                                  { label: 'المشاركة الصيفية (10 درجات)', val1: p1.participation, val2: p2.participation, max: 10 },
                                  { label: 'المشاريع والأنشطة (5 درجات)', val1: p1.task, val2: p2.task, max: 5 },
                                  { label: 'الاختبار الشفهي (15 درجة)', val1: p1.oral, val2: p2.oral, max: 15 },
                                  { label: 'الاختبار التحريري (45 درجة)', val1: p1.written, val2: p2.written, max: 45 }
                                ].map((item, idx) => {
                                  const diffPercent = parseFloat(((item.val2 - item.val1) / item.max * 100).toFixed(1));
                                  return (
                                    <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col gap-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700">{item.label}</span>
                                        <div className="flex items-center gap-2 text-[10px] font-black">
                                          <span className="text-slate-400">فترة 1: {item.val1}</span>
                                          <span className="text-slate-300">|</span>
                                          <span className="text-indigo-600">فترة 2: {item.val2}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Side-by-side miniature comparison bar */}
                                      <div className="space-y-1">
                                        <div className="h-1.5 bg-slate-150 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                                          <div className="h-full bg-slate-350 bg-slate-400" style={{ width: `${(item.val1 / item.max) * 50}%` }} />
                                          <div className="h-full bg-indigo-500" style={{ width: `${(item.val2 / item.max) * 50}%` }} />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px]">
                                          {diffPercent > 0 ? (
                                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                              <ArrowUpRight size={10} /> تحسن (+{diffPercent}%)
                                            </span>
                                          ) : diffPercent < 0 ? (
                                            <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                              <TrendingDown size={10} /> انخفاض ({diffPercent}%)
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 font-medium">أداء مستقر وعادل</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    ) : (
                      <div className="h-full min-h-[480px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mb-4 border border-slate-250 shadow-inner">
                            <Layers size={24} strokeWidth={1.5} className="text-indigo-400" />
                         </div>
                         <h3 className="text-sm font-bold text-slate-800">اختر طالباً للمقارنة التحليلية</h3>
                         <p className="text-xs text-slate-450 mt-1 max-w-sm leading-relaxed">يرجى تحديد طالب من جدول رصد ومتابعة الفترتين الأيمن لعرض کشف درجاته بالتفصيل والمقارنة البصرية بين مستواه في الفترة الأولى والثانية.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. Support Weak Performance Tab */}
          {activeReport === 'weak' && (
            <motion.div 
              key="weak-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 p-5 bg-rose-50/40 rounded-2xl border border-rose-100">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-700">تنبيه المتابعة الأكاديمية الاستباقية</h4>
                  <p className="text-rose-700/60 text-xs mt-1 leading-relaxed">تلقائياً، يتم رصد الطلاب ذوي الأداء المنخفض (معدل أقل من 60%) في الفترة الحالية لتقديم الدعم والتعزيز السريع والمتابعة الاستثنائية.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentsList.length > 0 ? (() => {
                  const weakStudents = studentsList.filter(s => {
                    const info = getSubgrades(s.id, currentSemester, currentPeriod);
                    return info.percentage < 60 && info.percentage > 0;
                  });

                  if (weakStudents.length === 0) {
                    return (
                      <div className="col-span-2 text-center py-16 text-xs text-slate-400 italic bg-white rounded-2xl border border-slate-200/50">
                         ممتاز! لا يوجد أي دواعٍ استثنائية لمتابعة حالات الضعف الأكاديمي حالياً بهذا الصف. جميع الطلاب المسجلين بالدرجات تجاوزوا نسبة 60%.
                      </div>
                    );
                  }

                  return weakStudents.map(st => {
                    const info = getSubgrades(st.id, currentSemester, currentPeriod);
                    return (
                      <div key={st.id} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{st.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">المنتسب إلى: {st.class}</p>
                          <div className="mt-3 flex gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700">معدل مئوي: {info.percentage}%</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600">الفترة {currentPeriod === '1' ? 'الأولى' : 'الثانية'}</span>
                          </div>
                        </div>
                        <div className="text-left font-black">
                          <span className="text-[9px] text-zinc-400 block mb-0.5">الحالة فنية</span>
                          <span className="text-xs px-2.5 py-1 bg-rose-100 border border-rose-200 text-rose-600 rounded-lg">بحاجة لتدعيم</span>
                        </div>
                      </div>
                    );
                  });
                })() : (
                  <div className="col-span-2 text-center py-16 text-xs text-slate-400 italic bg-white rounded-2xl border border-slate-200/50">يرجى إضافة طلاب وتدوين درجات في الكشوف لعرض التحليلات الاستباقية للضعف.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* 5. Negligence & Deficiencies Tab */}
          {activeReport === 'negligence' && (
            <motion.div 
              key="negligence-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
              dir="rtl"
            >
              {/* Controls and Title Inputs (Matches uploaded image) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">تخصيص عناوين كشف المتابعة والتقصير</h3>
                    <p className="text-xs text-slate-400 mt-1 font-bold">تتيح لك هذه الخانات التحكم الكامل بعناوين كشف الإهمال والتقصير أدناه.</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-extrabold text-slate-500 shrink-0">تصفية الصف:</span>
                    <div className="flex flex-wrap gap-1">
                      {['الكل', ...activeClassesList].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedClass(c)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            selectedClass === c
                              ? 'bg-red-650 bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subheading edits alignment matching user screenshot exactly */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block pb-1">العنوان الرئيسي (السورة/الموضوع)</label>
                    <input 
                      type="text" 
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="سورة الممتحنة"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 outline-none text-xs font-bold text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block pb-1">العنوان الفرعي 1</label>
                    <input 
                      type="text" 
                      value={headerCol1}
                      onChange={(e) => setHeaderCol1(e.target.value)}
                      placeholder="1-3"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 outline-none text-xs font-semibold text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block pb-1">العنوان الفرعي 2</label>
                    <input 
                      type="text" 
                      value={headerCol2}
                      onChange={(e) => setHeaderCol2(e.target.value)}
                      placeholder="3-7"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 outline-none text-xs font-semibold text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block pb-1">العنوان الفرعي 3</label>
                    <input 
                      type="text" 
                      value={headerCol3}
                      onChange={(e) => setHeaderCol3(e.target.value)}
                      placeholder="الخانة 3"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 outline-none text-xs font-semibold text-right"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveHeaders}
                      className="w-full py-1.5 px-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 h-9"
                    >
                      <span>حفظ العناوين</span>
                    </button>
                  </div>
                </div>

                {showSavedToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center"
                  >
                     تم حفظ وتحديث العناوين بنجاح ومزامنتها سحابياً! ✓
                  </motion.div>
                )}
              </div>

              {/* Main Deficiency Board / Interactive Matrix */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 overflow-hidden print:p-0 print:border-none print:shadow-none print:overflow-visible print:w-full print:space-y-2">
                {/* Official Print Header (Only visible on print) */}
                <div className="hidden print:flex flex-col gap-1 border-b-2 border-slate-800 pb-2 mb-2 text-right">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-slate-900">المملكة العربية السعودية • وزارة التعليم</div>
                      <div className="text-xs font-extrabold text-[#115e3b] mt-0.5">كشف التقصير والإهمال والمتابعة الصفية اليومية</div>
                    </div>
                    <div className="text-left text-xs font-bold text-slate-700">
                      <div>الصف: <span className="font-black text-slate-900">{selectedClass}</span></div>
                      <div>الفصل الدراسي: <span className="font-black">{currentSemester === '1' ? 'الأول' : 'الثاني'}</span> • الفترة: <span className="font-black">{currentPeriod === '1' ? 'الأولى' : 'الثانية'}</span></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-200 mt-1">
                    <span>موضوع المتابعة الحالي: <strong className="text-slate-900 font-extrabold">{headerTitle} ({headerCol1} - {headerCol2} - {headerCol3})</strong></span>
                    <span>إجمالي عدد الطلاب: <strong className="text-slate-900 font-extrabold">
                      {(selectedClass === 'الكل' ? studentsList : studentsList.filter(s => s.class === selectedClass)).filter(st => !hiddenStudentIds.includes(st.id)).length}
                    </strong> طالب</span>
                  </div>
                </div>

                {/* Screen Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2 print:hidden">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">کشف الحضور والتقصير - كشف المتابعة الصفي اليومي</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[11px] text-[#dc2626] font-bold">هذا الكشف تلقائي بالكامل ومرتبط بصفحة الدرجات لإظهار علامة التقصير (X) لعدم توفر متطلبات الإنجاز.</p>
                      <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold">
                        💡 انقر على اسم الطالب لإخفاء صفه • انقر على أي عنوان عامود لإخفائه
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-extrabold flex-wrap">
                    {(hiddenStudentIds.length > 0 || hiddenColumnKeys.length > 0) && (
                      <button
                        type="button"
                        onClick={resetHiddenRowsAndCols}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                        title="استعادة كافة الصفوف والأعمدة المخفية"
                      >
                        <RotateCcw size={13} />
                        <span>استعادة المخفي ({hiddenStudentIds.length + hiddenColumnKeys.length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#115e3b] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#0d4a2f] transition-all cursor-pointer"
                      title="طباعة كشف التقصير"
                    >
                      <Printer size={13} />
                      <span>طباعة الكشف</span>
                    </button>
                    {(() => {
                      const totalBase = (selectedClass === 'الكل' ? studentsList : studentsList.filter(s => s.class === selectedClass)).length;
                      const visibleCount = (selectedClass === 'الكل' ? studentsList : studentsList.filter(s => s.class === selectedClass)).filter(st => !hiddenStudentIds.includes(st.id)).length;
                      return (
                        <span className="px-2.5 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                          العدد المعروض: {visibleCount} من {totalBase} طلاب
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl print:overflow-visible print:w-full">
                  <table className="w-full text-right border-collapse min-w-[900px] print:min-w-0 print:w-full print:table-fixed">
                    <thead>
                      <tr className="text-white text-xs font-extrabold select-none print:text-[10px]">
                        {!hiddenColumnKeys.includes('serial') && (
                          <th 
                            onClick={() => hideColumn('serial')}
                            className="py-3 px-3 bg-[#2d608d] text-center rounded-r-xl w-12 print:w-[5%] print:py-1.5 print:px-0.5 print:rounded-none cursor-pointer hover:bg-[#23537e] transition-colors" 
                            style={{ borderLeft: '1px solid #1e4569' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            م
                          </th>
                        )}
                        {!hiddenColumnKeys.includes('name') && (
                          <th 
                            onClick={() => hideColumn('name')}
                            className="py-3 px-4 bg-[#2d608d] text-right text-center print:w-[27%] print:py-1.5 print:px-1.5 print:text-right cursor-pointer hover:bg-[#23537e] transition-colors" 
                            style={{ borderLeft: '1px solid #1e4569' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            الاسم
                          </th>
                        )}
                        
                        {/* Custom Columns bound to Hifz/Surah */}
                        {!hiddenColumnKeys.includes('custom1') && (
                          <th 
                            onClick={() => hideColumn('custom1')}
                            className="py-3 px-2 bg-[#5ecdec] text-slate-900 text-center text-[11px] print:w-[9.5%] print:py-1.5 print:px-0.5 print:text-[9.5px] print:bg-[#5ecdec] cursor-pointer hover:bg-[#4abddc] transition-colors" 
                            style={{ borderLeft: '1px solid #3ca5c0' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            <div className="truncate print:whitespace-normal print:leading-tight">{headerTitle} {headerCol1}</div>
                          </th>
                        )}
                        {!hiddenColumnKeys.includes('custom2') && (
                          <th 
                            onClick={() => hideColumn('custom2')}
                            className="py-3 px-2 bg-[#5ecdec] text-slate-900 text-center text-[11px] print:w-[9.5%] print:py-1.5 print:px-0.5 print:text-[9.5px] print:bg-[#5ecdec] cursor-pointer hover:bg-[#4abddc] transition-colors" 
                            style={{ borderLeft: '1px solid #3ca5c0' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            <div className="truncate print:whitespace-normal print:leading-tight">{headerTitle} {headerCol2}</div>
                          </th>
                        )}
                        {!hiddenColumnKeys.includes('custom3') && (
                          <th 
                            onClick={() => hideColumn('custom3')}
                            className="py-3 px-2 bg-[#5ecdec] text-slate-900 text-center text-[11px] print:w-[9.5%] print:py-1.5 print:px-0.5 print:text-[9.5px] print:bg-[#5ecdec] cursor-pointer hover:bg-[#4abddc] transition-colors" 
                            style={{ borderLeft: '1px solid #3ca5c0' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            <div className="truncate print:whitespace-normal print:leading-tight">{headerTitle} {headerCol3}</div>
                          </th>
                        )}

                        {/* Standard Academic components */}
                        {!hiddenColumnKeys.includes('recitation') && (
                          <th 
                            onClick={() => hideColumn('recitation')}
                            className="py-3 px-2 bg-[#2d608d] text-center print:w-[9.5%] print:py-1.5 print:px-0.5 print:text-[10px] cursor-pointer hover:bg-[#23537e] transition-colors" 
                            style={{ borderLeft: '1px solid #1e4569' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            التلاوة
                          </th>
                        )}
                        {!hiddenColumnKeys.includes('homework') && (
                          <th 
                            onClick={() => hideColumn('homework')}
                            className="py-3 px-2 bg-[#2d608d] text-center print:w-[10%] print:py-1.5 print:px-0.5 print:text-[10px] cursor-pointer hover:bg-[#23537e] transition-colors" 
                            style={{ borderLeft: '1px solid #1e4569' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            الواجبات
                          </th>
                        )}
                        {!hiddenColumnKeys.includes('participation') && (
                          <th 
                            onClick={() => hideColumn('participation')}
                            className="py-3 px-2 bg-[#2d608d] text-center print:w-[10%] print:py-1.5 print:px-0.5 print:text-[10px] cursor-pointer hover:bg-[#23537e] transition-colors" 
                            style={{ borderLeft: '1px solid #1e4569' }}
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            المشاركة
                          </th>
                        )}
                        {!hiddenColumnKeys.includes('task') && (
                          <th 
                            onClick={() => hideColumn('task')}
                            className="py-3 px-2 bg-[#214a6e] text-center rounded-l-xl print:w-[9.5%] print:py-1.5 print:px-0.5 print:text-[10px] print:rounded-none cursor-pointer hover:bg-[#1a3d5b] transition-colors"
                            title="انقر على عنوان العامود لإخفائه"
                          >
                            المهمة
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                      {(() => {
                        const baseStudents = (selectedClass === 'الكل'
                          ? studentsList
                          : studentsList.filter(s => s.class === selectedClass)
                        );
                        const visibleStudents = baseStudents.filter(st => !hiddenStudentIds.includes(st.id));

                        if (visibleStudents.length === 0) {
                          return (
                            <tr>
                              <td colSpan={Math.max(1, 9 - hiddenColumnKeys.length)} className="text-center py-12 text-slate-500 italic bg-slate-50/50">
                                {hiddenStudentIds.length > 0 
                                  ? 'تم إخفاء جميع الطلاب في هذا الكشف. انقر على "استعادة المخفي" لإعادتهم.'
                                  : 'لا يوجد طلاب متطابقين مع تصفية الصف الحالي.'
                                }
                              </td>
                            </tr>
                          );
                        }

                        return visibleStudents.map((st, i) => {
                          const g = grades.find((gr: any) => gr.studentId === st.id && gr.semester === currentSemester && gr.period === currentPeriod) || {
                            homework: Array(10).fill(false),
                            participation: Array(10).fill(false),
                            recitation: Array(4).fill(0),
                            hifz: Array(4).fill(0),
                            task: 0
                          };

                          // recitation average Check
                          const firstRecRecord = g.recitation?.[0] || 0;

                          // homework completed Count Check
                          const hwCompleted = g.homework ? g.homework.filter(Boolean).length : 0;

                          // participation completed Count Check
                          const partCompleted = g.participation ? g.participation.filter(Boolean).length : 0;

                          // task score Check
                          const taskScore = parseFloat(g.task) || 0;

                          // Exact Bound Criteria:
                          // 1. Memorization slots check if there is a grade in the corresponding slot of grades page, otherwise show 'X'
                          const hasHifzSub1 = g.hifz?.[0] > 0;
                          const hasHifzSub2 = g.hifz?.[1] > 0;
                          const hasHifzSub3 = g.hifz?.[2] > 0;

                          // 2. Recitation checks if first slot has a grade, otherwise show 'X'
                          const hasRecitation = firstRecRecord > 0;

                          // 3. Homeworks is empty if 4 or more, else has 'X'
                          const isHomeworkValid = hwCompleted >= 4;

                          // 4. Participation is empty if 4 or more, else has 'X'
                          const isParticipationValid = partCompleted >= 4;

                          // 5. Performance task is empty if it has a grade, else has 'X'
                          const hasTaskScore = taskScore > 0;

                          const studentEntry = {
                            custom1: !hasHifzSub1,
                            custom2: !hasHifzSub2,
                            custom3: !hasHifzSub3,
                            recitation: !hasRecitation,
                            homework: !isHomeworkValid,
                            participation: !isParticipationValid,
                            task: !hasTaskScore,
                          };

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/50 transition-colors print:border-b print:border-slate-200">
                              {/* Serial Number Bubble */}
                              {!hiddenColumnKeys.includes('serial') && (
                                <td className="py-2.5 px-3 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 font-bold select-none">
                                  <div className="w-8 h-8 print:w-5 print:h-5 rounded-lg bg-[#23537e] text-white flex items-center justify-center mx-auto text-xs print:text-[9px] font-bold leading-none">
                                    {i + 1}
                                  </div>
                                </td>
                              )}

                              {/* Name aligned beautifully to the right with custom margins - Clicking hides student row */}
                              {!hiddenColumnKeys.includes('name') && (
                                <td 
                                  onClick={() => hideStudentRow(st.id)}
                                  className="py-2.5 px-4 print:py-1 print:px-1.5 font-bold border-l border-slate-100 print:border-slate-200 text-right pr-6 print:pr-1 cursor-pointer group"
                                  title="انقر على اسم الطالب لإخفاء هذا الصف"
                                >
                                  <div className="bg-[#0fda9e] text-[#113a2f] border border-[#09c28a] font-black rounded-lg py-1.5 px-3.5 inline-block text-right shadow-sm max-w-[280px] truncate group-hover:scale-[0.98] group-hover:opacity-80 transition-all cursor-pointer print:max-w-none print:w-full print:bg-emerald-50 print:border-emerald-300 print:text-emerald-950 print:py-0.5 print:px-1.5 print:text-[10.5px] print:rounded print:shadow-none">
                                    {i + 1}. {st.name}
                                  </div>
                                </td>
                              )}

                              {/* Column 1 (Custom Hifz 1) */}
                              {!hiddenColumnKeys.includes('custom1') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 transition-colors select-none align-middle"
                                >
                                  {studentEntry.custom1 ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}

                              {/* Column 2 (Custom Hifz 2) */}
                              {!hiddenColumnKeys.includes('custom2') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 transition-colors select-none align-middle"
                                >
                                  {studentEntry.custom2 ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}

                              {/* Column 3 (Custom Hifz 3) */}
                              {!hiddenColumnKeys.includes('custom3') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 transition-colors select-none align-middle"
                                >
                                  {studentEntry.custom3 ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}

                              {/* Recitation */}
                              {!hiddenColumnKeys.includes('recitation') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 transition-colors select-none align-middle"
                                >
                                  {studentEntry.recitation ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}

                              {/* Homeworks */}
                              {!hiddenColumnKeys.includes('homework') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 transition-colors select-none align-middle"
                                >
                                  {studentEntry.homework ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}

                              {/* Participation */}
                              {!hiddenColumnKeys.includes('participation') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center border-l border-slate-100 print:border-slate-200 transition-colors select-none align-middle"
                                >
                                  {studentEntry.participation ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}

                              {/* Task */}
                              {!hiddenColumnKeys.includes('task') && (
                                <td 
                                  className="py-2 px-2 print:py-1 print:px-0.5 text-center transition-colors select-none align-middle"
                                >
                                  {studentEntry.task ? (
                                    <div className="bg-rose-50 text-red-650 h-8 max-w-[90px] mx-auto rounded-lg flex items-center justify-center border border-rose-100 shadow-sm print:h-5 print:max-w-none print:w-full print:rounded print:border-rose-300 print:shadow-none">
                                      <span className="text-base print:text-[11px] font-black text-rose-600 font-mono leading-none">X</span>
                                    </div>
                                  ) : (
                                    <div className="h-8 max-w-[90px] mx-auto rounded-lg bg-slate-50/50 border border-dashed border-slate-100 print:h-5 print:max-w-none print:w-full print:border-slate-200 print:rounded" />
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Foot Indicators and Statistics Summary Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs print:mt-2 print:p-2.5 print:border-slate-300 print:text-[10px]">
                  <div className="text-right print:flex-1">
                    <p className="font-bold text-slate-700">⚡ ارتباط تلقائي مباشر بكشف رصد الدرجات:</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium print:hidden">هذا الكشف متصل بالكامل بكشف رصد الدرجات الفعلي للفصل الحالي. رصد تقصير "X" لأي طالب يتفاعل مباشرة مع درجاته المقابلة بالتعديل والتصفير، كما تظهر علامات التقصير تلقائياً عند غياب الإنجاز في الواجبات أو تراجع معدلات المشاركة والتلاوة.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">إجمالي مرصود التقصير بالمعروض</span>
                      <span className="text-lg print:text-base font-black text-red-600 font-mono">
                        {(() => {
                          let sum = 0;
                          const baseStudents = (selectedClass === 'الكل' ? studentsList : studentsList.filter(s => s.class === selectedClass));
                          const visibleStudents = baseStudents.filter(st => !hiddenStudentIds.includes(st.id));

                          visibleStudents.forEach(st => {
                            const studentGrade = grades.find((gr: any) => gr.studentId === st.id && gr.semester === currentSemester && gr.period === currentPeriod) || {
                              homework: Array(10).fill(false),
                              participation: Array(10).fill(false),
                              recitation: Array(4).fill(0),
                              hifz: Array(4).fill(0),
                              task: 0
                            };
                            
                            const hwCompleted = studentGrade.homework ? studentGrade.homework.filter(Boolean).length : 0;
                            const partCompleted = studentGrade.participation ? studentGrade.participation.filter(Boolean).length : 0;
                            const taskScore = parseFloat(studentGrade.task) || 0;

                            if (!hiddenColumnKeys.includes('custom1') && !(studentGrade.hifz?.[0] > 0)) sum++;
                            if (!hiddenColumnKeys.includes('custom2') && !(studentGrade.hifz?.[1] > 0)) sum++;
                            if (!hiddenColumnKeys.includes('custom3') && !(studentGrade.hifz?.[2] > 0)) sum++;
                            if (!hiddenColumnKeys.includes('recitation') && !(studentGrade.recitation?.[0] > 0)) sum++;
                            if (!hiddenColumnKeys.includes('homework') && hwCompleted < 4) sum++;
                            if (!hiddenColumnKeys.includes('participation') && partCompleted < 4) sum++;
                            if (!hiddenColumnKeys.includes('task') && !(taskScore > 0)) sum++;
                          });
                          return sum;
                        })()} ×
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. Detailed Statistics Report Tab (IMAGE STYLE) */}
          {activeReport === 'detailed_stats' && (
            <motion.div 
              key="detailed-stats-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Ministry Banner style replicating image top */}
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden gap-6">
                {/* Ornate border on top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
                
                {/* Right side Info: Stage/Class, Year, Subject */}
                <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start w-full md:w-auto text-right md:order-last">
                  
                  {/* Class selector mimicking image */}
                  <div className="flex flex-col items-end px-4 py-1.5 bg-emerald-50/40 border-2 border-emerald-600/35 rounded-2xl min-w-[200px] shadow-sm">
                    <span className="text-[9px] font-bold text-emerald-700">المرحلة الدراسية / الصف:</span>
                    <select 
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="text-xs font-black text-emerald-900 bg-transparent outline-none cursor-pointer border-none p-0 mt-1 text-right font-sans focus:ring-0 w-full"
                    >
                      {activeClassesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Semester */}
                  <div className="flex flex-col items-end px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl min-w-[180px] shadow-sm">
                    <span className="text-[9px] font-bold text-slate-450">السنة / الفصل الدراسي:</span>
                    <span className="text-xs font-black text-slate-800 mt-1">
                      {currentSemester === '1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'} / ١٤٤٧هـ
                    </span>
                  </div>

                  {/* Subject Name with Ornate Decors */}
                  <div className="flex flex-col items-end px-4 py-2 bg-[#e6fbf4] border border-[#aae8d4] rounded-2xl min-w-[180px] shadow-sm">
                    <span className="text-[9px] font-bold text-emerald-700">المقرر والمادة:</span>
                    <span className="text-xs font-black text-emerald-950 text-emerald-900 mt-1">۞ مادة الدراسات الإسلامية ۞</span>
                  </div>

                </div>

                {/* Left side: Logo details */}
                <div className="flex items-center gap-4 text-center md:text-right md:order-first">
                  <div className="flex flex-col items-center md:items-start">
                    <div className="grid grid-cols-5 gap-0.5 w-12 mb-1 justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-[#09c28a] rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                    </div>
                    <span className="text-emerald-700 text-sm font-black tracking-widest font-sans">وزارة التعليم</span>
                    <span className="text-[8px] text-slate-400 font-bold leading-none uppercase font-sans">Ministry of Education</span>
                  </div>
                </div>
              </div>

              {/* Title decoration */}
              <div className="w-full bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent h-px my-4" />

              {/* Core calculation logic block */}
              {(() => {
                const classStudents = getActiveSemesterStudents();
                let classStudentsScores: number[] = [];
                let totalSum = 0;
                let successCount = 0;

                let ممتازCount = 0;
                let جيدجداCount = 0;
                let جيدCount = 0;
                let مقبولCount = 0;
                let ضعيفCount = 0;

                classStudents.forEach(st => {
                  const info = getSubgrades(st.id, currentSemester, currentPeriod);
                  // Map student percentage (0-100) to points out of 40 like the image ranges
                  const score40 = parseFloat(((info.percentage / 100) * 40).toFixed(2));
                  classStudentsScores.push(score40);
                  totalSum += score40;
                  if (info.percentage >= 60) {
                    successCount++;
                  }
                  
                  if (score40 >= 36) ممتازCount++;
                  else if (score40 >= 32) جيدجداCount++;
                  else if (score40 >= 28) جيدCount++;
                  else if (score40 >= 20) مقبولCount++;
                  else ضعيفCount++;
                });

                const totalStudents = classStudents.length || 1;
                const highestGrade = classStudentsScores.length > 0 ? parseFloat(Math.max(...classStudentsScores).toFixed(1)) : 0;
                const lowestGrade = classStudentsScores.length > 0 ? parseFloat(Math.min(...classStudentsScores).toFixed(1)) : 0;
                const averageGrade = classStudentsScores.length > 0 ? parseFloat((totalSum / totalStudents).toFixed(1)) : 0;
                const successRate = classStudentsScores.length > 0 ? parseFloat(((successCount / totalStudents) * 100).toFixed(1)) : 0;
                const sumGrades = parseFloat(totalSum.toFixed(1));

                const excelPct = Math.round((ممتازCount / totalStudents) * 100);
                const veryGoodPct = Math.round((جيدجداCount / totalStudents) * 100);
                const goodPct = Math.round((جيدCount / totalStudents) * 100);
                const normalPct = Math.round((مقبولCount / totalStudents) * 100);
                const weakPct = Math.round((ضعيفCount / totalStudents) * 100);

                return (
                  <div className="space-y-6">
                    {/* Grid mimicking the image's two core panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      
                      {/* Panel A: Detailed Stats Input List (Right in image) */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="text-right border-b border-slate-100 pb-3">
                          <span className="text-xs font-black text-emerald-600">الإحصائيات التحصيلية الشاملة</span>
                          <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">البطاقات المعيارية للصف</h3>
                        </div>

                        <div className="space-y-3 font-sans">
                          {/* Item 1: Student Count */}
                          <div className="flex items-center gap-3 justify-between">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-2 px-6 text-center font-mono font-black text-slate-800 min-w-[120px] shadow-sm text-sm">
                              {classStudents.length}
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-650/20 text-emerald-800 font-extrabold text-xs rounded-xl px-4 py-2 text-center flex-1 font-sans shadow-sm min-h-[38px] flex items-center justify-center">
                              عدد الطلاب الإجمالي للفصل
                            </div>
                          </div>

                          {/* Item 2: Highest Grade */}
                          <div className="flex items-center gap-3 justify-between">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-2 px-6 text-center font-mono font-black text-emerald-600 min-w-[120px] shadow-sm text-sm">
                              {highestGrade} / 40
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-650/20 text-emerald-800 font-extrabold text-xs rounded-xl px-4 py-2 text-center flex-1 font-sans shadow-sm min-h-[38px] flex items-center justify-center">
                              أعلى درجة محققة بالفصل
                            </div>
                          </div>

                          {/* Item 3: Lowest Grade */}
                          <div className="flex items-center gap-3 justify-between">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-2 px-6 text-center font-mono font-black text-rose-500 min-w-[120px] shadow-sm text-sm">
                              {lowestGrade} / 40
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-650/20 text-emerald-800 font-extrabold text-xs rounded-xl px-4 py-2 text-center flex-1 font-sans shadow-sm min-h-[38px] flex items-center justify-center">
                              أقل درجة محققة بالفصل
                            </div>
                          </div>

                          {/* Item 4: Average Marks */}
                          <div className="flex items-center gap-3 justify-between">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-2 px-6 text-center font-mono font-black text-indigo-650 min-w-[120px] shadow-sm text-sm">
                              {averageGrade} / 40
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-650/20 text-emerald-800 font-extrabold text-xs rounded-xl px-4 py-2 text-center flex-1 font-sans shadow-sm min-h-[38px] flex items-center justify-center">
                              متوسط درجات الطلاب الكلي
                            </div>
                          </div>

                          {/* Item 5: Achievement Percentage */}
                          <div className="flex items-center gap-3 justify-between">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-2 px-6 text-center font-mono font-black text-amber-600 min-w-[120px] shadow-sm text-sm">
                              {successRate}%
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-650/20 text-emerald-800 font-extrabold text-xs rounded-xl px-4 py-2 text-center flex-1 font-sans shadow-sm min-h-[38px] flex items-center justify-center">
                              نسبة التحصيل والتمكن (أعلى من 60%)
                            </div>
                          </div>

                          {/* Item 6: Total Marks Sum */}
                          <div className="flex items-center gap-3 justify-between">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-2 px-6 text-center font-mono font-black text-purple-600 min-w-[120px] shadow-sm text-sm">
                              {sumGrades}
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-650/20 text-emerald-800 font-extrabold text-xs rounded-xl px-4 py-2 text-center flex-1 font-sans shadow-sm min-h-[38px] flex items-center justify-center">
                              مجموع الدرجات لجميع الطلاب
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Panel B: Table Grade range stats (Left in image) */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-right">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">تقييم النطاق والتحصيل</span>
                          <h3 className="text-sm font-extrabold text-slate-800 font-sans">بيان مستويات الدرجات بالتفصيل</h3>
                        </div>

                        {/* Table headers */}
                        <div className="grid grid-cols-3 gap-3 mb-2 text-center font-sans font-black text-emerald-700 text-xs bg-emerald-50/30 py-2 rounded-xl border border-emerald-100/40">
                          <div>عدد الطلاب</div>
                          <div>النطاق (من 40)</div>
                          <div>المستوى</div>
                        </div>

                        <div className="space-y-3 font-sans">
                          {/* Level 1: ممتاز */}
                          <div className="grid grid-cols-3 gap-3 text-center items-center">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              {ممتازCount}
                            </div>
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              36 - 40
                            </div>
                            <div className="bg-emerald-500 border border-emerald-600/10 text-white font-black text-xs rounded-xl py-2 shadow-sm">
                              ممتاز
                            </div>
                          </div>

                          {/* Level 2: جيد جداً */}
                          <div className="grid grid-cols-3 gap-3 text-center items-center">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              {جيدجداCount}
                            </div>
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              32 - 35.99
                            </div>
                            <div className="bg-cyan-500 border border-cyan-600/10 text-white font-black text-xs rounded-xl py-2 shadow-sm">
                              جيد جداً
                            </div>
                          </div>

                          {/* Level 3: جيد */}
                          <div className="grid grid-cols-3 gap-3 text-center items-center">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              {جيدCount}
                            </div>
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              28 - 31.99
                            </div>
                            <div className="bg-indigo-650 bg-indigo-500 border border-indigo-600/10 text-white font-black text-xs rounded-xl py-2 shadow-sm">
                              جيد
                            </div>
                          </div>

                          {/* Level 4: مقبول */}
                          <div className="grid grid-cols-3 gap-3 text-center items-center">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              {مقبولCount}
                            </div>
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              20 - 27.99
                            </div>
                            <div className="bg-amber-500 border border-amber-600/10 text-white font-black text-xs rounded-xl py-2 shadow-sm">
                              مقبول
                            </div>
                          </div>

                          {/* Level 5: ضعيف */}
                          <div className="grid grid-cols-3 gap-3 text-center items-center">
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              {ضعيفCount}
                            </div>
                            <div className="border border-slate-200/80 bg-slate-50 rounded-xl py-1.5 font-mono font-extrabold text-slate-800 text-xs">
                              0 - 19.99
                            </div>
                            <div className="bg-rose-500 border border-rose-600/10 text-white font-black text-xs rounded-xl py-2 shadow-sm">
                              ضعيف
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* SECTION: Pie progress dials */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="text-center font-sans">
                        <span className="text-emerald-600 text-[10px] font-black uppercase">التوزيع النسبي للمستويات</span>
                        <h3 className="text-xs font-bold text-slate-400 mt-1">رسم بياني (نسب الطلاب لكل تقدير)</h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center font-sans tracking-wide pt-4">
                        {/* ممتاز dial */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-emerald-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={`${excelPct}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-slate-800 font-mono leading-none">{excelPct}%</span>
                              <span className="text-[8px] text-slate-400 font-extrabold mt-0.5">ممتاز</span>
                            </div>
                          </div>
                        </div>

                        {/* جيد جداً dial */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-cyan-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={`${veryGoodPct}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-slate-800 font-mono leading-none">{veryGoodPct}%</span>
                              <span className="text-[8px] text-slate-400 font-extrabold mt-0.5">جيد جداً</span>
                            </div>
                          </div>
                        </div>

                        {/* جيد dial */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-indigo-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={`${goodPct}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-slate-800 font-mono leading-none">{goodPct}%</span>
                              <span className="text-[8px] text-slate-400 font-extrabold mt-0.5">جيد</span>
                            </div>
                          </div>
                        </div>

                        {/* مقبول dial */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-amber-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={`${normalPct}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-slate-800 font-mono leading-none">{normalPct}%</span>
                              <span className="text-[8px] text-slate-400 font-extrabold mt-0.5">مقبول</span>
                            </div>
                          </div>
                        </div>

                        {/* ضعيف dial */}
                        <div className="flex flex-col items-center space-y-2 col-span-2 md:col-span-1">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-rose-500 transition-all duration-1000" strokeWidth="4" strokeDasharray={`${weakPct}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-slate-800 font-mono leading-none">{weakPct}%</span>
                              <span className="text-[8px] text-slate-400 font-extrabold mt-0.5">ضعيف</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: Bar Charts (Mimicking bottom bar visual of the uploaded image) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="text-center font-sans">
                        <span className="text-indigo-650 text-indigo-600 text-[10px] font-black uppercase font-sans">التمثيل البياني لتعداد الفئات</span>
                        <h3 className="text-xs font-bold text-slate-400 mt-1">رسم بياني (عدد الطلاب لكل تقدير)</h3>
                      </div>

                      {/* Animated bar columns */}
                      <div className="flex items-end justify-between max-w-xl mx-auto h-48 pt-8 border-b border-slate-200">
                        
                        {/* ضعيف bar */}
                        <div className="flex flex-col items-center flex-1 group">
                          <span className="text-xs font-black text-rose-600 mb-2 font-mono">{ضعيفCount}</span>
                          <div className="w-12 bg-rose-50 rounded-t-lg relative h-36 flex items-end">
                            <div 
                              className="w-full bg-rose-500 rounded-t-lg transition-all duration-1000" 
                              style={{ height: `${(ضعيفCount / (Math.max(1, ممتازCount, جيدجداCount, جيدCount, مقبولCount, ضعيفCount))) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 mt-2">ضعيف</span>
                        </div>

                        {/* مقبول bar */}
                        <div className="flex flex-col items-center flex-1 group">
                          <span className="text-xs font-black text-amber-600 mb-2 font-mono">{مقبولCount}</span>
                          <div className="w-12 bg-amber-50 rounded-t-lg relative h-36 flex items-end">
                            <div 
                              className="w-full bg-amber-500 rounded-t-lg transition-all duration-1000" 
                              style={{ height: `${(مقبولCount / (Math.max(1, ممتازCount, جيدجداCount, جيدCount, مقبولCount, ضعيفCount))) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 mt-2">مقبول</span>
                        </div>

                        {/* جيد bar */}
                        <div className="flex flex-col items-center flex-1 group">
                          <span className="text-xs font-black text-indigo-600 mb-2 font-mono">{جيدCount}</span>
                          <div className="w-12 bg-indigo-50 rounded-t-lg relative h-36 flex items-end">
                            <div 
                              className="w-full bg-indigo-505 bg-indigo-500 rounded-t-lg transition-all duration-1000" 
                              style={{ height: `${(جيدCount / (Math.max(1, ممتازCount, جيدجداCount, جيدCount, مقبولCount, ضعيفCount))) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 mt-2">جيد</span>
                        </div>

                        {/* جيد جداً bar */}
                        <div className="flex flex-col items-center flex-1 group">
                          <span className="text-xs font-black text-cyan-600 mb-2 font-mono">{جيدجداCount}</span>
                          <div className="w-12 bg-cyan-50 rounded-t-lg relative h-36 flex items-end">
                            <div 
                              className="w-full bg-cyan-500 rounded-t-lg transition-all duration-1000" 
                              style={{ height: `${(جيدجداCount / (Math.max(1, ممتازCount, جيدجداCount, جيدCount, مقبولCount, ضعيفCount))) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 mt-2">جيد جداً</span>
                        </div>

                        {/* ممتاز bar */}
                        <div className="flex flex-col items-center flex-1 group">
                          <span className="text-xs font-black text-emerald-600 mb-2 font-mono">{ممتازCount}</span>
                          <div className="w-12 bg-emerald-50 rounded-t-lg relative h-36 flex items-end">
                            <div 
                              className="w-full bg-emerald-500 rounded-t-lg transition-all duration-1000" 
                              style={{ height: `${(ممتازCount / (Math.max(1, ممتازCount, جيدجداCount, جيدCount, مقبولCount, ضعيفCount))) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 mt-2">ممتاز</span>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
