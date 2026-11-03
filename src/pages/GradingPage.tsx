import { useState, useEffect } from 'react';
import { 
  Search, 
  Save, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ChevronDown, 
  LayoutGrid, 
  Table as TableIcon,
  CheckCheck,
  Award,
  BookOpen,
  Sparkles,
  Check,
  X,
  UserCheck,
  UserX,
  Clock,
  LogOut,
  ShieldAlert,
  HelpCircle,
  FileText,
  FileBadge,
  Printer,
  User,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { getHijriDateDetails } from '../components/HijriCalendar';

function arToEn(str: string): string {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[،٫]/g, '.');
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

function getSundayOfWeek(d: Date): Date {
  const sunday = new Date(d);
  const day = d.getDay();
  sunday.setDate(d.getDate() - day);
  return sunday;
}

export function GradingPage() {
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

  const students = uniqueStudentsList.filter(s => s.status !== 'archived' && !s.class?.includes('أرشيف') && !s.class?.includes('ارشيف') && !s.class?.includes('الأرشيف'));
  const classesList = state.classes || [];
  const studentClasses = Array.from(new Set(students.map(s => s.class?.trim()).filter(Boolean) as string[]));
  const allKnownClasses = Array.from(new Set([...classesList, ...studentClasses]));
  const activeClassesList = allKnownClasses.filter(c => c && !c.includes('أرشيف') && !c.includes('ارشيف') && !c.includes('الأرشيف'));
  const attendance = state.attendance || [];
  const grades = state.grades || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [toast, setToast] = useState<{ hwTitle: string, studentName: string, state: boolean } | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({});
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState<any | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);
  const [showReportDetailedGrades, setShowReportDetailedGrades] = useState(false);

  // Close modals when pressing Escape
  useEffect(() => {
    if (!selectedStudentForAttendance && !selectedStudentForReport) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStudentForAttendance(null);
        setSelectedStudentForReport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudentForAttendance, selectedStudentForReport]);
  
  const selectedClass = state.selectedClass || 'الكل';

  const setSelectedClass = (newClass: string) => {
    updateState({ selectedClass: newClass });
  };

  const updateAttendanceStatus = (studentId: string, status: string) => {
    const newAttendance = [...attendance];
    const index = newAttendance.findIndex(a => a.studentId === studentId);
    if (index >= 0) {
      newAttendance[index] = { ...newAttendance[index], status, date: new Date().toISOString() };
    } else {
      newAttendance.push({ studentId, status, date: new Date().toISOString() });
    }
    updateState({ attendance: newAttendance });
  };

  const handleSave = async () => {
    const success = await syncData();
    if (success) {
      setSaveNotification('تم حفظ الدرجات ومزامنتها على Google Drive بنجاح! ✓');
    } else {
      setSaveNotification('تم حفظ الدرجات محلياً على جهازك.');
    }
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const setAllBooleans = (studentId: string, type: 'homework' | 'participation', value: boolean) => {
    const currentSemester = state.currentSemester || '1';
    const currentPeriod = state.currentPeriod || '1';
    const newGrades = [...grades];
    const studentGradeIndex = newGrades.findIndex((g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod);
    
    let studentGrade = studentGradeIndex >= 0 
      ? { ...newGrades[studentGradeIndex] } 
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

    studentGrade[type] = Array(10).fill(value);
    if (type === 'homework') {
      studentGrade.homeworkRecorded = true;
    }

    if (studentGradeIndex >= 0) {
      newGrades[studentGradeIndex] = studentGrade;
    } else {
      newGrades.push(studentGrade);
    }

    updateState({ grades: newGrades });
  };

  const filteredStudents = students.filter(s => {
    const sNameNormalized = normalizeArabic(s.name || '');
    const sIdNormalized = (s.id || '').trim().toLowerCase();
    const searchNormalized = normalizeArabic(searchTerm);

    const matchesSearch = !searchTerm || 
      sNameNormalized.includes(searchNormalized) || 
      sIdNormalized.includes(searchNormalized);

    const matchesClass = selectedClass === 'الكل' || 
      normalizeArabic(s.class || '') === normalizeArabic(selectedClass || '');
    return matchesSearch && matchesClass;
  });

  // Sort alphabetically by student name so they don't shift positions
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ar');
  });

  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find(a => a.studentId === studentId);
    return record?.status || 'none';
  };

  const getStudentGrades = (studentId: string) => {
    const currentSemester = state.currentSemester || '1';
    const currentPeriod = state.currentPeriod || '1';
    const g = grades.find((g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod) || {
      homework: Array(10).fill(false),
      participation: Array(10).fill(false),
      recitation: Array(4).fill(0),
      tajweed: Array(4).fill(0),
      hifz: Array(4).fill(0),
      task: 0,
      oral: 0,
      written: 0
    };

    const getAverage = (arr: number[]) => {
      if (!arr) return 0;
      const registeredCount = arr.reduce((max: number, score: number, idx: number) => parseFloat(score as any) > 0 ? idx + 1 : max, 0);
      return registeredCount > 0 
        ? Math.round(arr.slice(0, registeredCount).reduce((subA: number, subB: number) => subA + (parseFloat(subB as any) || 0), 0) / registeredCount)
        : 0;
    };

    const calcedOral = Math.round(getAverage(g.recitation) + getAverage(g.tajweed) + getAverage(g.hifz));
    return {
      ...g,
      oral: calcedOral
    };
  };

  const toggleGrade = (studentId: string, type: 'homework' | 'participation', index: number) => {
    const currentSemester = state.currentSemester || '1';
    const currentPeriod = state.currentPeriod || '1';
    const newGrades = [...grades];
    const studentGradeIndex = newGrades.findIndex((g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod);
    
    let studentGrade = studentGradeIndex >= 0 
      ? { ...newGrades[studentGradeIndex] } 
      : { 
          studentId, 
          semester: currentSemester,
          period: currentPeriod,
          homework: Array(10).fill(false), 
          participation: Array(10).fill(false),
          recitation: Array(4).fill(0),
          tajweed: Array(4).fill(0),
          hifz: Array(4).fill(0)
        };

    if (!studentGrade[type]) studentGrade[type] = Array(10).fill(false);
    
    studentGrade[type][index] = !studentGrade[type][index];

    if (type === 'homework') {
      studentGrade.homeworkRecorded = true;
      const sName = students.find((s: any) => s.id === studentId)?.name || 'طالب';
      const isNewState = studentGrade[type][index];
      const homeworksList = state.homework || [];
      const hwTitle = homeworksList[index]?.title || `الواجب ${index + 1}`;
      
      setToast({
        hwTitle,
        studentName: sName,
        state: isNewState
      });
      
      // Clear after 3 seconds
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.hwTitle === hwTitle && prev.studentName === sName && prev.state === isNewState) {
            return null;
          }
          return prev;
        });
      }, 3000);
    }

    if (studentGradeIndex >= 0) {
      newGrades[studentGradeIndex] = studentGrade;
    } else {
      newGrades.push(studentGrade);
    }

    updateState({ grades: newGrades });
  };

  const handleNumericChange = (studentId: string, field: string, value: string, index?: number) => {
    const currentSemester = state.currentSemester || '1';
    const currentPeriod = state.currentPeriod || '1';
    
    // Parse Arabic/Persian digits and keep integers only (no fractions)
    const cleanedValue = arToEn(value).replace(/[^0-9]/g, '');

    // Enforce max grade boundaries
    let finalValue = cleanedValue;
    const num = parseInt(finalValue, 10);
    if (!isNaN(num)) {
      let maxVal = 5;
      if (field === 'written') {
        maxVal = 45;
      } else if (field === 'task') {
        maxVal = 5;
      } else if (field === 'recitation' || field === 'tajweed' || field === 'hifz') {
        maxVal = 5;
      }
      if (num > maxVal) {
        finalValue = '';
        const errorKey = index !== undefined ? `${studentId}-${field}-${index}` : `${studentId}-${field}`;
        setErrorFields(prev => ({ ...prev, [errorKey]: true }));
        setTimeout(() => {
          setErrorFields(prev => ({ ...prev, [errorKey]: false }));
        }, 1500);
      }
    }

    const newGrades = [...grades];
    const itemIndex = newGrades.findIndex((g: any) => g.studentId === studentId && g.semester === currentSemester && g.period === currentPeriod);
    
    let studentGrade = itemIndex >= 0 
      ? { ...newGrades[itemIndex] } 
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

    if (index !== undefined) {
      if (!Array.isArray(studentGrade[field])) {
        studentGrade[field] = Array(4).fill(0);
      }
      const newArray = [...studentGrade[field]];
      newArray[index] = finalValue;
      studentGrade[field] = newArray;
    } else {
      studentGrade[field] = finalValue;
    }

    // Automatically recalculate Oral as a sum of Recitation, Tajweed, and Memorization averages without fractions
    const getAverage = (arr: any[]) => {
      if (!arr) return 0;
      const registeredCount = arr.reduce((max: number, score: any, idx: number) => {
        const val = parseFloat(score);
        return val > 0 ? idx + 1 : max;
      }, 0);
      return registeredCount > 0 
        ? Math.round(arr.slice(0, registeredCount).reduce((subA: number, subB: any) => subA + (parseFloat(subB) || 0), 0) / registeredCount)
        : 0;
    };
    studentGrade.oral = Math.round(getAverage(studentGrade.recitation) + getAverage(studentGrade.tajweed) + getAverage(studentGrade.hifz));

    if (itemIndex >= 0) {
      newGrades[itemIndex] = studentGrade;
    } else {
      newGrades.push(studentGrade);
    }

    updateState({ grades: newGrades });
  };

  const calculateTotal = (studentId: string) => {
    const g = getStudentGrades(studentId);
    
    // 1. Homework (out of 10) - each checked homework slot represents exactly 1 mark
    const hwScore = g.homework ? g.homework.filter(Boolean).length : 0;
    
    // 2. Participation (out of 10) - each checked participation slot represents exactly 1 mark
    const partScore = g.participation ? g.participation.filter(Boolean).length : 0;
    
    // 3. Oral Quran Assessments (Recitation, Tajweed, Hifz)
    const registeredRecitationCount = g.recitation ? g.recitation.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    const recitationScore = registeredRecitationCount > 0 
      ? Math.round(g.recitation.slice(0, registeredRecitationCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredRecitationCount)
      : 0;

    const registeredTajweedCount = g.tajweed ? g.tajweed.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    const tajweedScore = registeredTajweedCount > 0 
      ? Math.round(g.tajweed.slice(0, registeredTajweedCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredTajweedCount)
      : 0;

    const registeredHifzCount = g.hifz ? g.hifz.reduce((max: number, score: number, idx: number) => score > 0 ? idx + 1 : max, 0) : 0;
    const hifzTestsScore = registeredHifzCount > 0
      ? Math.round(g.hifz.slice(0, registeredHifzCount).reduce((a: number, b: number) => a + (parseFloat(b as any) || 0), 0) / registeredHifzCount)
      : 0;

    const taskScore = Math.round(parseFloat(g.task) || 0); // (out of 5)
    const oralScore = Math.round(parseFloat(g.oral) || 0); // (out of 15, always present in grading sheet)
    const writtenScore = Math.round(parseFloat(g.written) || 0); // (out of 45)

    const quranTotal = recitationScore + tajweedScore + hifzTestsScore; // (out of 15)
    
    // In Grading Page (كشف الرصد), total is always evaluated out of 100 with oral score included
    const maxScore = 100;
    const totalScore = Math.round(hwScore + partScore + quranTotal + taskScore + oralScore + writtenScore);

    return `${Math.min(maxScore, totalScore)} / ${maxScore}`;
  };

  const getStudentReportStats = (student: any) => {
    if (!student) return null;
    const g = getStudentGrades(student.id);

    // Score calculations exactly matching Student Portal
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

    // Attendance calculation deduplicated by YYYY-MM-DD
    const rawAtt = attendance.filter((a: any) => a.studentId === student.id);
    const seenDates = new Set<string>();
    const studentAttendance = rawAtt.filter((a: any) => {
      if (!a.date) return false;
      const dateStr = a.date.split('T')[0];
      if (seenDates.has(dateStr)) return false;
      seenDates.add(dateStr);
      return true;
    });

    const presentCount = studentAttendance.filter((a: any) => a.status === 'present').length;
    const absentCount = studentAttendance.filter((a: any) => a.status === 'absent').length;
    const lateCount = studentAttendance.filter((a: any) => a.status === 'late').length;
    const excuseCount = studentAttendance.filter((a: any) => ['excused', 'restroom', 'with_deputy', 'with_counselor'].includes(a.status)).length;

    // Status matching Student Portal
    const getStatusText = (pct: number) => {
      if (pct >= 90) return 'ممتاز';
      if (pct >= 80) return 'جيد جداً';
      if (pct >= 65) return 'جيد';
      if (pct >= 50) return 'مقبول';
      return 'ضعيف (غير مجتاز)';
    };

    const getStatusColor = (pct: number) => {
      if (pct >= 90) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      if (pct >= 80) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      if (pct >= 65) return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      if (pct >= 50) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
    };

    // Rank matching Student Portal
    const activeClassmates = (state.students || []).filter((s: any) => s.class === student.class && s.status !== 'archived');
    const calculateAnyScore = (sId: string) => {
      const sg = getStudentGrades(sId);
      const shw = sg.homework ? sg.homework.filter(Boolean).length : 0;
      const spart = sg.participation ? sg.participation.filter(Boolean).length : 0;
      const sr = getAverage(sg.recitation);
      const st = getAverage(sg.tajweed);
      const sh = getAverage(sg.hifz);
      const stask = parseFloat(sg.task) || 0;
      const squran = sr + st + sh;
      const soral = parseFloat(sg.oral) || parseFloat(squran.toFixed(1)) || 0;
      const swritten = parseFloat(sg.written) || 0;
      return shw + spart + squran + stask + (hideOralExam ? 0 : soral) + swritten;
    };

    let rankText = '-';
    let isTied = false;
    let rankNum = 0;
    if (totalScore <= 15) {
      rankText = 'يظهر بعد رصد أكثر من 15 درجة';
    } else {
      const classmatesWithScores = activeClassmates
        .map((s: any) => ({
          studentId: s.id,
          totalScore: calculateAnyScore(s.id)
        }))
        .filter((s: any) => s.totalScore > 15);

      classmatesWithScores.sort((a: any, b: any) => b.totalScore - a.totalScore);

      let currentRank = 1;
      const ranksMap: { [sId: string]: { rank: number; isTied: boolean } } = {};
      for (let i = 0; i < classmatesWithScores.length; i++) {
        if (i > 0 && classmatesWithScores[i].totalScore < classmatesWithScores[i - 1].totalScore) {
          currentRank = i + 1;
        }
        const currentScore = classmatesWithScores[i].totalScore;
        const tied = classmatesWithScores.filter((c: any) => c.totalScore === currentScore).length > 1;
        ranksMap[classmatesWithScores[i].studentId] = { rank: currentRank, isTied: tied };
      }

      const currentRankInfo = ranksMap[student.id];
      if (currentRankInfo) {
        rankNum = currentRankInfo.rank;
        isTied = currentRankInfo.isTied;
        const ordinals: { [key: number]: string } = {
          1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
          6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر',
          11: 'الحادي عشر', 12: 'الثاني عشر', 13: 'الثالث عشر', 14: 'الرابع عشر', 15: 'الخامس عشر',
          16: 'السادس عشر', 17: 'السابع عشر', 18: 'الثامن عشر', 19: 'التاسع عشر', 20: 'العشرون'
        };
        const ordinalStr = ordinals[rankNum] || `الـ ${rankNum}`;
        rankText = isTied ? `${ordinalStr} مكرر` : ordinalStr;
      } else {
        rankText = 'يظهر بعد رصد أكثر من 15 درجة';
      }
    }

    // ONLY the registered items in صفحة أعمال السنة that the student has NOT completed:
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

    // 3. Performance Task from state.performanceTasks (registered in Yearly Work)
    const isTaskCompleted = (parseFloat(g.task) || 0) > 0;
    const systemPerfTasks = state.performanceTasks || [];
    const incompletePerfTasks: string[] = [];
    if (systemPerfTasks.length > 0 && !isTaskCompleted) {
      systemPerfTasks.forEach((t: any, idx: number) => {
        incompletePerfTasks.push(t.title || `المهمة الأدائية ${idx + 1}`);
      });
    }

    let recommendation = 'ما شاء الله تبارك الله، أداء رائع ومتميز وتفوق مستمر في جميع بنود المادة، استمر على هذا العطاء والاجتهاد.';
    if (totalScore >= 90) {
      recommendation = 'ما شاء الله تبارك الله، أداء رائع ومتميز وتفوق مستمر في جميع بنود المادة، استمر على هذا العطاء والاجتهاد.';
    } else if (totalScore >= 80) {
      recommendation = 'مستوى متقدم وجهود طيبة ومباركة، مع مزيد من التركيز والمراجعة المستمرة ستصل إلى أعلى درجات الإتقان والتميز.';
    } else if (totalScore >= 65) {
      recommendation = 'مستوى جيد وأداء مرضي، يحتاج الطالب إلى مزيد من العناية بإنجاز الواجبات اليومية والمراجعة والمشاركة الصفية.';
    } else if (totalScore >= 50) {
      recommendation = 'يحتاج الطالب إلى خطة علاجية ومتابعة مكثفة في الواجبات والقرآن الكريم للارتقاء بمستواه التحصيلي.';
    } else {
      recommendation = 'تنبيه: الطالب بحاجة ماسة لمتابعة مستمرة بين البيت والمدرسة لتدارك الفاقد التعليمي وتحسين المشاركة والواجبات.';
    }

    return {
      student,
      grades: {
        homework: hwScore,
        participation: partScore,
        recitation: parseFloat(recitationScore.toFixed(1)),
        tajweed: parseFloat(tajweedScore.toFixed(1)),
        hifz: parseFloat(hifzTestsScore.toFixed(1)),
        quranTotal: parseFloat(quranTotal.toFixed(1)),
        task: taskScore,
        oral: parseFloat(oralScore.toFixed(1)),
        written: writtenScore,
        totalScore: parseFloat(Math.min(maxScore, totalScore).toFixed(1)),
        maxScore,
        percentage
      },
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excuseCount,
        totalRecorded: studentAttendance.length,
        rawList: studentAttendance
      },
      rank: rankNum,
      rankText,
      totalClassCount: activeClassmates.length,
      rating: getStatusText(percentage),
      ratingBadgeClass: getStatusColor(percentage),
      recommendation,
      incompleteHws,
      incompleteHifzs,
      incompletePerfTasks,
      isTaskCompleted
    };
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className="grid grid-cols-12 gap-4 sm:gap-6 items-end bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="col-span-12 lg:col-span-5 space-y-2">
          <label className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-500 mr-1">بحث عن طالب</label>
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="أدخل اسم الطالب أو الرقم التعريفي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-800 text-sm placeholder:opacity-60"
            />
          </div>
        </div>
        
        <div className="col-span-12 md:col-span-8 lg:col-span-5 space-y-2">
          <label className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-500 mr-1">الصف والشعبة</label>
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedClass('الكل')}
              className={`px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all border shrink-0 ${
                selectedClass === 'الكل'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              الكل
            </button>
            {activeClassesList.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedClass(c)}
                className={`px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all border shrink-0 ${
                  selectedClass === c
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 lg:col-span-2">
          <button 
            onClick={handleSave}
            disabled={syncInProgress}
            className="w-full py-3 sm:py-3.5 bg-indigo-600 text-white rounded-xl font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={16} strokeWidth={2} className={syncInProgress ? 'animate-spin' : ''} />
            <span>{syncInProgress ? 'جاري الحفظ...' : 'حفظ الدرجات'}</span>
          </button>
        </div>
      </section>

      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            {viewMode === 'cards' ? <LayoutGrid size={18} /> : <TableIcon size={18} />}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
              <span>{viewMode === 'cards' ? 'نظام بطاقات الطلاب' : 'نظام كشف الدرجات (جدول)'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                {sortedStudents.length} طالب
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {viewMode === 'cards' ? 'بطاقة مخصصة لكل طالب لسهولة وسرعة الرصد على شاشة الجوال' : 'عرض تفصيلي واسع مناسب للشاشات الكبيرة'}
            </div>
          </div>
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={14} />
            <span>نظام البطاقات (موصى للجوال)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon size={14} />
            <span>نظام الجدول</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Cards View (Optimal for mobile) */}
      {viewMode === 'cards' && (
        <section className="space-y-4">
          {sortedStudents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {sortedStudents.map((student, idx) => {
                const attStatus = getAttendanceStatus(student.id);
                const sGrades = getStudentGrades(student.id);
                const hwScore = sGrades.homework ? sGrades.homework.filter(Boolean).length : 0;
                const partScore = sGrades.participation ? sGrades.participation.filter(Boolean).length : 0;
                const totalString = calculateTotal(student.id);
                const numericTotal = parseFloat(totalString.split('/')[0]) || 0;

                return (
                  <div 
                    key={student.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4 hover:border-indigo-300 hover:shadow-md transition-all relative"
                  >
                    {/* Student Card Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForAttendance(student)}
                            className="text-right group/stname block w-full hover:text-indigo-600 transition-colors cursor-pointer"
                            title="انقر لتسجيل الحضور والاستئذان"
                          >
                            <h3 className="font-black text-sm sm:text-base text-slate-900 group-hover/stname:text-indigo-600 leading-snug break-words">
                              {student.name?.trim() || 'طالب غير مسمى'}
                            </h3>
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                              {student.class}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForAttendance(student)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                                attStatus === 'absent' ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' :
                                attStatus === 'late' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                attStatus === 'excused' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                                attStatus === 'with_deputy' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                                attStatus === 'with_counselor' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                attStatus === 'restroom' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="انقر لتعديل حالة الحضور أو تسجيل استئذان"
                            >
                              {attStatus === 'absent' ? 'غائب ❌' :
                               attStatus === 'late' ? 'متأخر ⏰' :
                               attStatus === 'excused' ? 'مستأذن 📄' :
                               attStatus === 'with_deputy' ? 'مع الوكيل ⚠️' :
                               attStatus === 'with_counselor' ? 'مع المرشد ℹ️' :
                               attStatus === 'restroom' ? 'دورة مياه 🚻' :
                               'حاضر ✓'}
                              <span className="text-[9px] text-slate-400 font-normal">| استئذان</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Total Score Badge & Report Button */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-left bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-xl">
                          <div className="text-[10px] font-bold text-slate-400">المجموع</div>
                          <div className="text-base sm:text-lg font-black font-mono text-indigo-700">
                            {totalString}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForReport(student)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black text-indigo-700 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                          title="عرض تقرير أداء الطالب"
                        >
                          <FileText size={12} className="text-indigo-500 group-hover:text-white transition-colors" />
                          <span>تقرير</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      {(() => {
                        const maxVal = 100;
                        const pct = (numericTotal / maxVal) * 100;
                        return (
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct >= 90 ? 'bg-emerald-500' :
                              pct >= 75 ? 'bg-indigo-600' :
                              pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        );
                      })()}
                    </div>

                    {/* Section 1: Homework (10 marks) - Strictly 5 boxes on top and 5 below */}
                    <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                          <BookOpen size={14} className="text-indigo-600" />
                          <span>الواجبات المنزلية (10 درجات)</span>
                          <span className="text-indigo-600 font-mono font-bold">({hwScore}/10)</span>
                        </div>
                        {hwScore < 10 ? (
                          <button
                            type="button"
                            onClick={() => setAllBooleans(student.id, 'homework', true)}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            منح 10
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAllBooleans(student.id, 'homework', false)}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            مسح
                          </button>
                        )}
                      </div>
                      {/* Exactly 5 on top and 5 on bottom */}
                      <div className="grid grid-cols-5 gap-2 max-w-[280px]">
                        {[...Array(10)].map((_, i) => {
                          const isDone = Boolean(sGrades.homework?.[i]);
                          return (
                            <motion.button
                              key={i}
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              onClick={() => toggleGrade(student.id, 'homework', i)}
                              className={`h-9 rounded-lg font-black text-xs transition-all flex items-center justify-center cursor-pointer border ${
                                isDone
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                  : 'bg-white text-slate-400 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                              }`}
                              title={`الواجب ${i + 1}`}
                            >
                              {isDone ? (
                                <Check size={14} strokeWidth={3} />
                              ) : (
                                <span className="font-mono text-[11px]">{i + 1}</span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Participation (10 marks) - Strictly 5 boxes on top and 5 below */}
                    <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                          <Sparkles size={14} className="text-amber-500" />
                          <span>المشاركة والتفاعل (10 درجات)</span>
                          <span className="text-emerald-700 font-mono font-bold">({partScore}/10)</span>
                        </div>
                        {partScore < 10 ? (
                          <button
                            type="button"
                            onClick={() => setAllBooleans(student.id, 'participation', true)}
                            className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            منح 10
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAllBooleans(student.id, 'participation', false)}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            مسح
                          </button>
                        )}
                      </div>
                      {/* Exactly 5 on top and 5 on bottom */}
                      <div className="grid grid-cols-5 gap-2 max-w-[280px]">
                        {[...Array(10)].map((_, i) => {
                          const isDone = Boolean(sGrades.participation?.[i]);
                          return (
                            <motion.button
                              key={i}
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              onClick={() => toggleGrade(student.id, 'participation', i)}
                              className={`h-9 rounded-full font-black text-xs transition-all flex items-center justify-center cursor-pointer border ${
                                isDone
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                                  : 'bg-white text-slate-400 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                              }`}
                              title={`المشاركة ${i + 1}`}
                            >
                              {isDone ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                              ) : (
                                <span className="font-mono text-[11px]">{i + 1}</span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 3: Quran Assessments (Recitation, Tajweed, Hifz - 15 marks) */}
                    <div className="space-y-2.5 bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-200/70">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>تقييمات القرآن الكريم (الشفهي المستمر)</span>
                        <span className="text-indigo-600 font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          الشفهي المحسوب: {sGrades.oral || 0} / 15
                        </span>
                      </div>

                      {/* 3 Categories: Recitation, Tajweed, Hifz */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                        {/* Recitation */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                          <span className="text-[11px] font-black text-slate-650 block">التلاوة (من 5)</span>
                          <div className="grid grid-cols-4 gap-1">
                            {[0, 1, 2, 3].map(i => {
                              const isError = errorFields[`${student.id}-recitation-${i}`];
                              return (
                                <input
                                  key={i}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="-"
                                  value={sGrades.recitation?.[i] || ''}
                                  onChange={(e) => handleNumericChange(student.id, 'recitation', e.target.value, i)}
                                  className={`w-full h-8.5 text-center text-xs font-mono font-bold rounded-md outline-none border transition-all ${
                                    isError
                                      ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                                      : 'bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 border-slate-200 text-slate-800'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Tajweed */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                          <span className="text-[11px] font-black text-slate-650 block">التجويد (من 5)</span>
                          <div className="grid grid-cols-4 gap-1">
                            {[0, 1, 2, 3].map(i => {
                              const isError = errorFields[`${student.id}-tajweed-${i}`];
                              return (
                                <input
                                  key={i}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="-"
                                  value={sGrades.tajweed?.[i] || ''}
                                  onChange={(e) => handleNumericChange(student.id, 'tajweed', e.target.value, i)}
                                  className={`w-full h-8.5 text-center text-xs font-mono font-bold rounded-md outline-none border transition-all ${
                                    isError
                                      ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                                      : 'bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 border-slate-200 text-slate-800'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Hifz */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                          <span className="text-[11px] font-black text-slate-650 block">الحفظ (من 5)</span>
                          <div className="grid grid-cols-4 gap-1">
                            {[0, 1, 2, 3].map(i => {
                              const isError = errorFields[`${student.id}-hifz-${i}`];
                              return (
                                <input
                                  key={i}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="-"
                                  value={sGrades.hifz?.[i] || ''}
                                  onChange={(e) => handleNumericChange(student.id, 'hifz', e.target.value, i)}
                                  className={`w-full h-8.5 text-center text-xs font-mono font-bold rounded-md outline-none border transition-all ${
                                    isError
                                      ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                                      : 'bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 border-slate-200 text-slate-800'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Tasks, Oral & Written Exam */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* Task Score (out of 5) */}
                      <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                        <label className="text-[11px] font-black text-slate-700 block mb-1">
                          الأدائية (5)
                        </label>
                        {(() => {
                          const isTaskError = errorFields[`${student.id}-task`];
                          return (
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={sGrades.task || ''}
                              onChange={(e) => handleNumericChange(student.id, 'task', e.target.value)}
                              className={`w-full h-9.5 text-center font-mono font-black text-sm rounded-lg outline-none border transition-all ${
                                isTaskError
                                  ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                                  : 'bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border-slate-200 text-slate-800'
                              }`}
                            />
                          );
                        })()}
                        {/* Quick Preset Buttons */}
                        <div className="flex justify-center gap-1 mt-1.5">
                          {[5, 4, 3].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleNumericChange(student.id, 'task', String(val))}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 transition-colors"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Oral Calculated Score (out of 15) - always visible in grading sheet */}
                      <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between text-center">
                        <div>
                          <label className="text-[11px] font-black text-indigo-900 block mb-1">
                            الشفهي (15)
                          </label>
                          <div className="w-full h-9.5 bg-white border border-indigo-150 rounded-lg flex items-center justify-center font-mono font-black text-sm text-indigo-700">
                            {sGrades.oral || 0}
                          </div>
                        </div>
                        <span className="text-[9px] text-indigo-400 font-bold mt-1.5">
                          تلقائي من القرآن
                        </span>
                      </div>

                      {/* Written Score (out of 45) */}
                      <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                        <label className="text-[11px] font-black text-slate-700 block mb-1">
                          التحريري (45)
                        </label>
                        {(() => {
                          const isWrittenError = errorFields[`${student.id}-written`];
                          return (
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={sGrades.written || ''}
                              onChange={(e) => handleNumericChange(student.id, 'written', e.target.value)}
                              className={`w-full h-9.5 text-center font-mono font-black text-sm rounded-lg outline-none border transition-all ${
                                isWrittenError
                                  ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                                  : 'bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border-slate-200 text-slate-800'
                              }`}
                            />
                          );
                        })()}
                        {/* Quick Preset Buttons */}
                        <div className="flex justify-center gap-1 mt-1.5">
                          {[45, 40, 35].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleNumericChange(student.id, 'written', String(val))}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 transition-colors"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center text-slate-400 font-semibold text-sm">
              لا يوجد طلاب مسجلين في هذا الفصل حالياً.
            </div>
          )}

          {/* Floating Save Button on Mobile */}
          <div className="fixed bottom-20 sm:bottom-6 left-6 z-40 lg:hidden">
            <button
              type="button"
              onClick={handleSave}
              disabled={syncInProgress}
              className="px-5 py-3.5 bg-indigo-600 text-white rounded-full font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer border border-indigo-500/20"
            >
              <Save size={18} className={syncInProgress ? 'animate-spin' : ''} />
              <span>{syncInProgress ? 'جاري الحفظ...' : 'حفظ الدرجات'}</span>
            </button>
          </div>
        </section>
      )}

      {/* Mode 2: Table View */}
      {viewMode === 'table' && (
        <>
          {/* Mobile Swipe Hint */}
          <div className="lg:hidden flex items-center justify-between gap-2 px-3.5 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
            <span>👈 اسحب الجدول أفقياً لتسجيل الاختبارات والدرجات 👉</span>
          </div>

          {/* Grading Table */}
          <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="max-h-[650px] overflow-y-auto overflow-x-auto no-scrollbar relative">
              <table className="w-full text-right border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-750">
                    <th className="px-3 sm:px-6 py-4 font-black text-xs sm:text-sm uppercase tracking-wider sticky top-0 right-0 bg-slate-50 z-30 border-b border-slate-200/80 w-[160px] min-w-[160px] sm:w-[220px] sm:min-w-[220px] md:w-[280px] md:min-w-[280px] text-right">اسم الطالب</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">التلاوة (5)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">التجويد (5)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">الحفظ (5)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">الواجبات (10)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">المشاركة (10)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">الأدائية (5)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">الشفهي (15)</th>
                    <th className="px-2 py-4 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 text-slate-650 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">التحريري (45)</th>
                    <th className="px-4 sm:px-6 py-4 text-indigo-600 font-black text-xs sm:text-sm uppercase tracking-wider text-center border-r border-slate-200/60 sticky top-0 bg-slate-50 z-20 border-b border-slate-200/80">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStudents.length > 0 ? sortedStudents.map((student, idx) => {
                    const attStatus = getAttendanceStatus(student.id);
                    const sGrades = getStudentGrades(student.id);
                    return (
                      <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                        {/* Name Column - Sticky */}
                        <td className={`px-3 sm:px-6 py-3 sm:py-4 sticky right-0 transition-colors z-10 border-l border-slate-200 shadow-sm w-[170px] min-w-[170px] sm:w-[240px] sm:min-w-[240px] md:w-[280px] md:min-w-[280px] ${
                          attStatus === 'absent' ? 'bg-rose-50/95 group-hover:bg-rose-100/70' : 
                          attStatus === 'with_deputy' ? 'bg-amber-50/95 group-hover:bg-amber-100/70' :
                          attStatus === 'with_counselor' ? 'bg-blue-50/95 group-hover:bg-blue-100/70' :
                          'bg-white group-hover:bg-slate-50'
                        }`}>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs sm:text-sm border border-indigo-100 shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForAttendance(student)}
                                className="text-right group/stname block w-full cursor-pointer"
                                title="انقر لتسجيل الحضور والاستئذان"
                              >
                                <div className="font-extrabold text-xs sm:text-sm md:text-base text-slate-800 group-hover/stname:text-indigo-600 transition-colors leading-snug break-words underline decoration-dotted decoration-indigo-300 underline-offset-4" title={student.name}>
                                  {student.name?.trim() || 'طالب غير مسمى'}
                                  {(attStatus === 'restroom' || attStatus === 'with_deputy' || attStatus === 'with_counselor') && (
                                    <span className="text-amber-500 text-xs sm:text-sm mr-1 animate-pulse" title="مستأذن">⭐</span>
                                  )}
                                </div>
                              </button>
                              <div className="text-[10px] sm:text-xs text-slate-450 font-bold mt-0.5">{student.class}</div>
                            </div>
                          </div>
                        </td>

                        {/* Numerical Grades (Split into 4 sub-cells each) */}
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          <div className="grid grid-cols-2 gap-1.5 w-max mx-auto">
                            {[0, 1, 2, 3].map(i => {
                              const isError = errorFields[`${student.id}-recitation-${i}`];
                              return (
                                <input 
                                  key={i} 
                                  type="text" 
                                  value={sGrades.recitation?.[i] || ''}
                                  onChange={(e) => handleNumericChange(student.id, 'recitation', e.target.value, i)}
                                  className={`w-9 h-9 text-center text-xs sm:text-sm font-black rounded-lg transition-all font-mono outline-none border ${
                                    isError 
                                      ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500 focus:border-rose-500 ring-2 ring-rose-400/20 animate-pulse' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-850 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-slate-200'
                                  }`}
                                  placeholder="-" 
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          <div className="grid grid-cols-2 gap-1.5 w-max mx-auto">
                            {[0, 1, 2, 3].map(i => {
                              const isError = errorFields[`${student.id}-tajweed-${i}`];
                              return (
                                <input 
                                  key={i} 
                                  type="text" 
                                  value={sGrades.tajweed?.[i] || ''}
                                  onChange={(e) => handleNumericChange(student.id, 'tajweed', e.target.value, i)}
                                  className={`w-9 h-9 text-center text-xs sm:text-sm font-black rounded-lg transition-all font-mono outline-none border ${
                                    isError 
                                      ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500 focus:border-rose-500 ring-2 ring-rose-400/20 animate-pulse' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-850 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-slate-200'
                                  }`}
                                  placeholder="-" 
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          <div className="grid grid-cols-2 gap-1.5 w-max mx-auto">
                            {[0, 1, 2, 3].map(i => {
                              const isError = errorFields[`${student.id}-hifz-${i}`];
                              return (
                                <input 
                                  key={i} 
                                  type="text" 
                                  value={sGrades.hifz?.[i] || ''}
                                  onChange={(e) => handleNumericChange(student.id, 'hifz', e.target.value, i)}
                                  className={`w-9 h-9 text-center text-xs sm:text-sm font-black rounded-lg transition-all font-mono outline-none border ${
                                    isError 
                                      ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500 focus:border-rose-500 ring-2 ring-rose-400/20 animate-pulse' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-850 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border-slate-200'
                                  }`}
                                  placeholder="-" 
                                />
                              );
                            })}
                          </div>
                        </td>

                        {/* Assignments (Interactive Cells) */}
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          <div className="grid grid-cols-5 gap-1.5 w-max mx-auto">
                            {[...Array(10)].map((_, i) => (
                              <motion.button 
                                key={i} 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleGrade(student.id, 'homework', i)}
                                className={`w-6.5 h-6.5 rounded-md border transition-all flex items-center justify-center relative ${
                                    sGrades.homework?.[i] 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow shadow-indigo-600/10' 
                                        : 'border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-350 text-slate-400'
                                }`}
                                title={`الواجب ${i + 1}`}
                              >
                                 {sGrades.homework?.[i] ? (
                                   <CheckCircle2 size={13} className="text-white mx-auto stroke-[2.5]" />
                                 ) : (
                                   <span className="text-[9px] font-black font-mono opacity-80">{i + 1}</span>
                                 )}
                              </motion.button>
                            ))}
                          </div>
                        </td>

                        {/* Participation (Interactive Buttons) */}
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          <div className="grid grid-cols-5 gap-1.5 w-max mx-auto">
                            {[...Array(10)].map((_, i) => (
                              <motion.button 
                                key={i} 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleGrade(student.id, 'participation', i)}
                                className={`w-6.5 h-6.5 rounded-full border transition-all flex items-center justify-center relative ${
                                    sGrades.participation?.[i] 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow' 
                                        : 'border-slate-300 bg-slate-50 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/10 text-slate-400'
                                }`}
                                title={`المشاركة ${i + 1}`}
                              >
                                 {sGrades.participation?.[i] ? (
                                   <span className="w-2 h-2 rounded-full bg-white block" />
                                 ) : (
                                   <span className="text-[9px] font-black font-mono opacity-80">{i + 1}</span>
                                 )}
                              </motion.button>
                            ))}
                          </div>
                        </td>

                        {/* Other Scores */}
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          {(() => {
                            const isTaskError = errorFields[`${student.id}-task`];
                            return (
                              <input 
                                type="text" 
                                inputMode="decimal"
                                value={sGrades.task || ''} 
                                onChange={(e) => handleNumericChange(student.id, 'task', e.target.value)}
                                className={`w-14 h-9 rounded-lg text-center font-bold text-xs sm:text-sm mx-auto block transition-all font-mono outline-none border ${
                                  isTaskError 
                                    ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500 focus:border-rose-500 ring-2 ring-rose-400/20 animate-pulse' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-805 border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                                placeholder="0" 
                              />
                            );
                          })()}
                        </td>
                        {/* Oral Score (out of 15) */}
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors">
                          <div className="w-14 h-9 bg-indigo-50 border border-indigo-150 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm text-indigo-750 mx-auto transition-all shadow-inner font-mono">
                            {sGrades.oral || 0}
                          </div>
                        </td>
                        {/* Written Score (larger) */}
                        <td className="px-2 py-4 text-center border-r border-slate-100 group-hover:bg-slate-50/10 transition-colors text-slate-700">
                          {(() => {
                            const isWrittenError = errorFields[`${student.id}-written`];
                            return (
                              <input 
                                type="text" 
                                inputMode="decimal"
                                value={sGrades.written || ''} 
                                onChange={(e) => handleNumericChange(student.id, 'written', e.target.value)}
                                className={`w-18 h-9 rounded-lg text-center font-black text-sm mx-auto block transition-all font-mono outline-none border ${
                                  isWrittenError 
                                    ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500 focus:border-rose-500 ring-2 ring-rose-400/20 animate-pulse' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-805 border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                                placeholder="0" 
                              />
                            );
                          })()}
                        </td>

                        {/* Total & Report Button */}
                        <td className="px-6 py-4 bg-indigo-50/30 border-r border-slate-100 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-base font-black text-indigo-600 tracking-tight font-mono">{calculateTotal(student.id)}</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">المجموع</span>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForReport(student)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-0.5 text-xs font-black text-indigo-700 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                              title="عرض تقرير أداء الطالب"
                            >
                              <FileText size={12} className="text-indigo-500 group-hover:text-white transition-colors" />
                              <span>تقرير</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={10} className="text-center py-20 text-xs font-semibold text-slate-400">
                        لا يوجد طلاب في هذا الفصل حالياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Quick Actions & Tips */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4 group hover:bg-indigo-50 transition-colors text-indigo-700">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp size={24} strokeWidth={2} />
          </div>
          <div>
            <h4 className="font-bold text-sm">تحليل المستوى</h4>
            <p className="text-xs opacity-75 mt-0.5">تحديث تلقائي للمجموع عند النقر على الخانات</p>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Users size={20} />
            </div>
            <span className="text-xs text-slate-500 leading-relaxed">
              تلميح: كشف رصد الدرجات هنا مرتبط بشكل كامل وتلقائي بـ "كشف المتابعة والتقصير"؛ عند اكتمال الواجبات والمشاركة الممتازة يتم تبرئة ساحة الطالب من الإهمال في التقارير تلقائياً.
            </span>
          </div>
          <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-black active:scale-[0.98] transition-all flex items-center gap-2 shrink-0">
            <CheckCircle2 size={14} />
            اعتماد الكل
          </button>
        </div>
      </section>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[100] max-w-sm bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-4 font-bold flex items-center gap-3 text-right"
            dir="rtl"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.state ? 'bg-emerald-55 bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-450 border border-slate-205 border-slate-200'
            }`}>
              <CheckCircle2 size={14} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold pb-0.5">تحديث حالة الواجب الدراسي</p>
              <h5 className="text-xs text-slate-800 font-black mb-0.5">
                {toast.state ? 'تم رصد إنجاز:' : 'تم إلغاء رصد:'} <span className="text-indigo-600 font-black">{toast.hwTitle}</span>
              </h5>
              <p className="text-[10px] text-slate-500 font-semibold">للطالب: <span className="font-extrabold text-slate-600">{toast.studentName}</span></p>
            </div>
          </motion.div>
        )}

        {saveNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm bg-slate-900/95 text-white backdrop-blur border border-slate-700 rounded-2xl shadow-2xl p-4 font-black flex items-center gap-3 text-right"
            dir="rtl"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-xs font-black">{saveNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance & Leave Quick Modal */}
      <AnimatePresence>
        {selectedStudentForAttendance && (
          <div 
            onClick={() => setSelectedStudentForAttendance(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden cursor-default"
              dir="rtl"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                    {selectedStudentForAttendance.name?.[0] || 'ط'}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-850">
                      {selectedStudentForAttendance.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                      {selectedStudentForAttendance.class} • خيارات الحضور والاستئذان
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAttendance(null)}
                  className="w-8 h-8 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div className="text-xs font-black text-slate-500 mb-2">
                  الحالة الحالية للطالب:{' '}
                  <span className="text-indigo-600 font-extrabold">
                    {(() => {
                      const st = getAttendanceStatus(selectedStudentForAttendance.id);
                      if (st === 'present') return 'حاضر ✅';
                      if (st === 'absent') return 'غائب ❌';
                      if (st === 'late') return 'متأخر ⏰';
                      if (st === 'excused') return 'مستأذن 📄';
                      if (st === 'restroom') return 'دورة مياه 🚻';
                      if (st === 'with_deputy') return 'مع الوكيل ⚠️';
                      if (st === 'with_counselor') return 'مع المرشد الطلابي ℹ️';
                      return 'غير مسجل';
                    })()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {[
                    { id: 'present', label: 'حاضر في الفصل', icon: UserCheck, color: 'hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 bg-emerald-50/40 border-emerald-200' },
                    { id: 'absent', label: 'غائب عن الحصة', icon: UserX, color: 'hover:bg-rose-50 hover:border-rose-300 text-rose-700 bg-rose-50/40 border-rose-200' },
                    { id: 'late', label: 'متأخر عن الحصة', icon: Clock, color: 'hover:bg-amber-50 hover:border-amber-300 text-amber-700 bg-amber-50/40 border-amber-200' },
                    { id: 'excused', label: 'مستأذن رسمي', icon: LogOut, color: 'hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 bg-indigo-50/40 border-indigo-200' },
                    { id: 'restroom', label: 'دورة مياه (مؤقت)', icon: HelpCircle, color: 'hover:bg-purple-50 hover:border-purple-300 text-purple-700 bg-purple-50/40 border-purple-200' },
                    { id: 'with_deputy', label: 'مستأذن مع الوكيل', icon: ShieldAlert, color: 'hover:bg-orange-50 hover:border-orange-300 text-orange-700 bg-orange-50/40 border-orange-200' },
                    { id: 'with_counselor', label: 'مع المرشد الطلابي', icon: Users, color: 'hover:bg-sky-50 hover:border-sky-300 text-sky-700 bg-sky-50/40 border-sky-200' },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const isCurrent = getAttendanceStatus(selectedStudentForAttendance.id) === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          updateAttendanceStatus(selectedStudentForAttendance.id, opt.id);
                          setSelectedStudentForAttendance(null);
                        }}
                        className={`p-3 rounded-xl border text-right flex items-center gap-2.5 transition-all cursor-pointer font-black text-xs sm:text-sm ${opt.color} ${
                          isCurrent ? 'ring-2 ring-indigo-600 border-indigo-600 bg-white shadow-sm' : ''
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{opt.label}</span>
                        {isCurrent && <Check size={14} className="mr-auto text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAttendance(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Report Popup Card Modal */}
      <AnimatePresence>
        {selectedStudentForReport && (() => {
          const stats = getStudentReportStats(selectedStudentForReport);
          if (!stats) return null;
          const hijri = getHijriDateDetails(new Date());

          return (
            <div 
              onClick={() => setSelectedStudentForReport(null)}
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
                {/* Modal Header */}
                <div className="bg-white border-b border-slate-200/80 p-4 sm:p-5 relative shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 sm:h-7 bg-indigo-600 rounded-full shrink-0" />
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          تقرير الطالب
                        </h2>
                        <span className="text-xs font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full">
                          {stats.student.class}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-bold flex-wrap pt-0.5">
                        <span className="text-slate-800 font-extrabold flex items-center gap-1">
                          <User size={14} className="text-indigo-600" />
                          <span>اسم الطالب:</span>
                          <span className="text-indigo-900 font-black text-sm sm:text-base">{stats.student.name}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium">
                          الفصل {state.currentSemester === '1' ? 'الأول' : 'الثاني'} (الفترة {state.currentPeriod || '1'})
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
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                        title="طباعة التقرير"
                      >
                        <Printer size={15} />
                        <span className="hidden sm:inline">طباعة التقرير</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForReport(null)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                        title="إغلاق"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Body - Scrollable matching Student Portal layout */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-slate-50/50 print:bg-white print:overflow-visible print:p-0">
                  {/* Official Print Header (Only visible on print) */}
                  <div className="hidden print:flex flex-col gap-1 border-b-2 border-slate-800 pb-3 mb-3 text-right">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-black text-slate-900">المملكة العربية السعودية • وزارة التعليم</div>
                        <div className="text-xs font-extrabold text-indigo-700 mt-0.5">تقرير أداء ومتابعة الطالب الفصلي الشامل</div>
                      </div>
                      <div className="text-left text-xs font-bold text-slate-700">
                        <div>الصف: <strong className="text-slate-900">{stats.student.class}</strong></div>
                        <div>الفصل: <strong>{state.currentSemester === '1' ? 'الأول' : 'الثاني'}</strong> • الفترة: <strong>{state.currentPeriod || '1'}</strong></div>
                        <div>التاريخ: <strong>{hijri.day} {hijri.monthName} {hijri.year}هـ</strong></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-700 pt-1.5 border-t border-slate-200 mt-1">
                      <span>اسم الطالب: <strong className="text-slate-900 font-black text-sm">{stats.student.name}</strong></span>
                      <span>المجموع الكلي: <strong className="text-indigo-700 font-mono font-black text-sm">{stats.grades.totalScore} / {stats.grades.maxScore}</strong> (نسبة {stats.grades.percentage}%)</span>
                    </div>
                  </div>

                  {/* 1. Semester & Period Display (matches Student Portal) */}
                  <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      <span className="text-xs font-extrabold text-slate-800">الفترة الدراسية النشطة حالياً:</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-xs">
                        <span className="text-slate-400 font-bold">الفصل الدراسي:</span>
                        <span className="text-indigo-600 font-black">{state.currentSemester === '1' ? 'الأول' : 'الثاني'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-xs">
                        <span className="text-slate-400 font-bold">الفترة:</span>
                        <span className="text-violet-600 font-black">{state.currentPeriod === '1' ? 'الأولى' : 'الثانية'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Profile Card Header (matches Student Portal) */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 bg-indigo-600 h-1.5 right-0" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-slate-100 to-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-200 font-extrabold text-2xl shadow-inner shrink-0">
                          {stats.student.name?.[0]}
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900">{stats.student.name}</h3>
                          <p className="text-xs text-slate-500 font-bold mt-1 tracking-wide">
                            الصف الدراسي: <span className="text-indigo-600 font-extrabold">{stats.student.class}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مستوى التقدم الدراسي الكلي</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${stats.ratingBadgeClass}`}>
                            {stats.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
                      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-150">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المجموع الكلي للدرجات</p>
                        <p className="text-lg sm:text-xl font-black text-slate-850">
                          {stats.grades.totalScore} <span className="text-xs text-slate-400 font-semibold">/ {stats.grades.maxScore} نقطة</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-150">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المعدل المئوي المحقق</p>
                        <p className="text-lg sm:text-xl font-black text-indigo-600">{stats.grades.percentage}٪</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-150">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ترتيب الطالب على الصف</p>
                        <p className={`text-lg sm:text-xl font-black ${stats.grades.totalScore > 15 ? 'text-amber-600' : 'text-slate-400 text-sm'}`}>
                          {stats.grades.totalScore > 15 ? (stats.rankText || `#${stats.rank}`) : (
                            <span className="text-xs font-bold text-slate-400 leading-tight block">يظهر بعد رصد &gt; 15 درجة</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-150">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">عدد أيام الغياب</p>
                        <p className="text-lg sm:text-xl font-black text-rose-600">
                          {stats.attendance.absent} <span className="text-xs text-slate-400 font-semibold">أيام</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Grading Distribution (matches Student Portal) */}
                  <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xs p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-indigo-600 animate-pulse" size={22} />
                        <div>
                          <h4 className="font-black text-xl sm:text-2xl text-slate-950 font-sans">توزيع الدرجات</h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-bold font-sans">
                            {state.hideOralExam ? 'توزيع الـ 85 درجة للتقويم والدرجة المستحقة للطالب' : 'توزيع الـ 100 درجة للتقويم والدرجة المستحقة للطالب'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${state.hideOralExam ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-3 sm:gap-4 pt-1`}>
                      {/* Homework */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                        <div>
                          <p className="text-sm sm:text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الواجبات المنزلية</p>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                            {stats.grades.homework} <span className="text-sm text-slate-400 font-semibold">/ ١٠ د</span>
                          </p>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(stats.grades.homework / 10) * 100}%` }} />
                        </div>
                      </div>

                      {/* Participation */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                        <div>
                          <p className="text-sm sm:text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">المشاركة الصفية</p>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                            {stats.grades.participation} <span className="text-sm text-slate-400 font-semibold">/ ١٠ د</span>
                          </p>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${(stats.grades.participation / 10) * 100}%` }} />
                        </div>
                      </div>

                      {/* Quran Activity */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                        <div>
                          <p className="text-sm sm:text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">القرآن الكريم</p>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                            {stats.grades.quranTotal} <span className="text-sm text-slate-400 font-semibold">/ ١٥ د</span>
                          </p>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(stats.grades.quranTotal / 15) * 100}%` }} />
                        </div>
                      </div>

                      {/* Task */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                        <div>
                          <p className="text-sm sm:text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">المهمة الأدائية والنشاط</p>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                            {stats.grades.task} <span className="text-sm text-slate-400 font-semibold">/ ٥ د</span>
                          </p>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${(stats.grades.task / 5) * 100}%` }} />
                        </div>
                      </div>

                      {/* Oral Exam - if not hidden */}
                      {!state.hideOralExam && (
                        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                          <div>
                            <p className="text-sm sm:text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الاختبار الشفهي</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                              {stats.grades.oral} <span className="text-sm text-slate-400 font-semibold">/ ١٥ د</span>
                            </p>
                          </div>
                          <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                            <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${(stats.grades.oral / 15) * 100}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Written Exam */}
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                        <div>
                          <p className="text-sm sm:text-[15px] font-black text-slate-600 mb-1 leading-tight font-sans">الاختبار التحريري</p>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                            {stats.grades.written} <span className="text-sm text-slate-400 font-semibold">/ ٤٥ د</span>
                          </p>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${(stats.grades.written / 45) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. نواقص الطالب (Student Deficiencies - strictly registered in Yearly Work and not completed) */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-[#115e3b] text-right font-sans">نواقص الطالب</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                      {/* 1. Homework column */}
                      <div className="bg-[#f8fafc]/70 p-5 rounded-[28px] sm:rounded-[32px] border border-slate-100 shadow-xs flex flex-col justify-between min-h-[220px]">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">الواجبات</h4>
                            {stats.incompleteHws.length > 0 ? (
                              <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs">
                                {stats.incompleteHws.length}
                              </span>
                            ) : (
                              <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            {stats.incompleteHws.map((title: string, idx: number) => (
                              <div 
                                key={idx} 
                                className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-base"
                              >
                                {title}
                              </div>
                            ))}
                            {stats.incompleteHws.length === 0 && (
                              <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-[#115e3b] text-base flex flex-col items-center justify-center gap-1 font-sans">
                                <span className="text-[10px] bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full font-bold">مكتمل</span>
                                <span>لا يوجد نقص</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Memorization column */}
                      <div className="bg-[#f8fafc]/70 p-5 rounded-[28px] sm:rounded-[32px] border border-slate-100 shadow-xs flex flex-col justify-between min-h-[220px]">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">الحفظ</h4>
                            {stats.incompleteHifzs.length > 0 ? (
                              <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs">
                                {stats.incompleteHifzs.length}
                              </span>
                            ) : (
                              <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            {stats.incompleteHifzs.map((title: string, idx: number) => (
                              <div 
                                key={idx} 
                                className="bg-white rounded-2xl shadow-xs py-3.5 px-4 text-center border border-slate-100 font-extrabold text-[#991b1b] text-base"
                              >
                                {title}
                              </div>
                            ))}
                            {stats.incompleteHifzs.length === 0 && (
                              <div className="bg-white rounded-2xl shadow-xs py-5 px-4 text-center border border-slate-100 font-bold text-[#115e3b] text-base flex flex-col items-center justify-center gap-1 font-sans">
                                <span className="text-[10px] bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full font-bold">مكتمل</span>
                                <span>لا يوجد نقص</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3. Performance Task column */}
                      <div className="bg-[#f8fafc]/70 p-5 rounded-[28px] sm:rounded-[32px] border border-slate-100 shadow-xs flex flex-col justify-between min-h-[220px]">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-extrabold text-[#115e3b] font-sans">المهمة الأدائية</h4>
                            {stats.incompletePerfTasks.length > 0 ? (
                              <span className="w-8 h-8 rounded-full bg-[#ffebeb] text-[#991b1b] flex items-center justify-center font-black text-xs shadow-xs">
                                {stats.incompletePerfTasks.length}
                              </span>
                            ) : (
                              <span className="bg-[#e8f7f2] text-[#115e3b] px-3 py-1 rounded-full text-xs font-bold font-sans">مكتمل</span>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            {stats.incompletePerfTasks.length > 0 ? (
                              stats.incompletePerfTasks.map((title: string, idx: number) => (
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
                  </div>

                  {/* 5. Hijri Absence Calendar (matches Student Portal) */}
                  {!state.hideAbsenceCalendarInStudentPortal && stats.attendance.absent > 0 && (
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
                        const absentDates = new Set(
                          stats.attendance.rawList
                            .filter((a: any) => a.status === 'absent' && a.date)
                            .map((a: any) => a.date.split('T')[0])
                        );
                        const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
                        const currentSunday = getSundayOfWeek(today);

                        return (
                          <div className="w-full flex justify-center overflow-x-auto pb-2">
                            <div className="flex gap-2 min-w-max border border-[#e2e8f0] p-2 rounded-2xl bg-white shadow-2xs">
                              {[0, 1].map((weekOffset) => {
                                const weekStart = new Date(currentSunday);
                                weekStart.setDate(weekStart.getDate() - (weekOffset * 7));
                                
                                return (
                                  <div key={weekOffset} className="flex gap-1.5 border-l last:border-l-0 pl-2 last:pl-0 border-slate-100">
                                    {daysOfWeek.map((dayName, dayIndex) => {
                                      const d = new Date(weekStart);
                                      d.setDate(d.getDate() + dayIndex);
                                      const dStr = formatToYYYYMMDD(d);
                                      const isAbsent = absentDates.has(dStr);
                                      const hDetails = getHijriDateDetails(d);

                                      return (
                                        <div 
                                          key={dayIndex}
                                          className={`flex flex-col items-center justify-between w-11 h-14 p-1 rounded-xl border text-[11px] transition-all ${
                                            isAbsent 
                                              ? 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold shadow-2xs' 
                                              : 'bg-slate-50/60 border-slate-100 text-slate-500 font-medium'
                                          }`}
                                        >
                                          <span className="text-[9px] font-bold opacity-80">{dayName.slice(0, 3)}</span>
                                          <span className="text-xs font-black">{hDetails.day}</span>
                                          <span className={`text-[8px] font-bold ${isAbsent ? 'text-rose-600' : 'text-slate-400'}`}>
                                            {isAbsent ? 'غائب' : hDetails.monthName.slice(0, 4)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Teacher Recommendation & Guidance */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50/60 via-slate-50 to-emerald-50/40 rounded-2xl border border-indigo-100/70 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                      <TrendingUp size={15} className="text-indigo-600" />
                      <span>ملاحظات وتوجيهات معلم المادة</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      {stats.recommendation}
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>طباعة التقرير</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForReport(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

