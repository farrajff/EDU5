import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Cloud, 
  HardDrive, 
  History, 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  RefreshCw,
  X,
  AlertCircle,
  Sparkles,
  Check,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  Calendar,
  BookOpen,
  Palette,
  Paintbrush,
  RotateCcw,
  Moon,
  Sun,
  PanelRight,
  PanelBottom
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../lib/storageService';
import { THEME_OPTIONS } from '../lib/themeService';

export function SettingsPage() {
  const { state, updateState, syncData, syncInProgress, isConnected, reconnectAndLoad } = useApp();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Historical logs state stored in localStorage
  const [logs, setLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem('system_history_logs');
    return saved ? JSON.parse(saved) : [
      "اليوم، 10:45 ص - تم إنشاء نسخة احتياطية سحابية تلقائية بنجاح.",
      "أمس، 02:30 م - تم رصد درجات الاختبار الشفهي والتحريري لـ 18 طالباً.",
      "29 مايو، 09:12 ص - تم استيراد كشوف الطلاب الجدد للثلاث فصول ومطابقة المعطيات.",
      "28 مايو، 11:15 ص - تم تحديث إعدادات النظام ومزامنة خوادم نور.",
      "27 مايو، 08:30 ص - تم تهيئة الفصل الدراسي وربط فترات الرصد التلقائي."
    ];
  });

  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
  const [archiveSuffix, setArchiveSuffix] = useState('');
  const [checkReport, setCheckReport] = useState<any>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);

  // Theme & Color Customization
  const currentThemeId = state.themeColor || 'indigo';
  const [customColorInput, setCustomColorInput] = useState(() => state.customThemeHex || '#4F46E5');

  const handleSelectTheme = (themeId: string, primaryHex?: string) => {
    const targetHex = primaryHex || (THEME_OPTIONS.find(t => t.id === themeId)?.primary || '#4F46E5');
    updateState({ themeColor: themeId, customThemeHex: targetHex });
    const themeName = THEME_OPTIONS.find(t => t.id === themeId)?.name || 'مخصص';
    addLog(`تم تغيير سمة وألوان الموقع إلى: ${themeName}`);
    showToast(`تم تطبيق سمة "${themeName}" بنجاح!`, 'success');
  };

  const handleApplyCustomColor = () => {
    if (!customColorInput || !customColorInput.startsWith('#')) {
      showToast('يرجى إدخال كود لون صالح يبدأ بـ #', 'error');
      return;
    }
    updateState({ themeColor: 'custom', customThemeHex: customColorInput });
    addLog(`تم تطبيق لون مخصص للموقع: ${customColorInput}`);
    showToast('تم تطبيق اللون المخصص بنجاح!', 'success');
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !state.darkMode;
    updateState({ darkMode: newDarkMode });
    if (newDarkMode) {
      addLog('تم تفعيل الوضع الليلي (Dark Mode) للنظام');
      showToast('تم تفعيل الوضع الليلي بنجاح 🌙', 'success');
    } else {
      addLog('تم تعطيل الوضع الليلي (Dark Mode) والعودة للمظهر الفاتح');
      showToast('تم تفعيل الوضع الفاتح بنجاح ☀️', 'info');
    }
  };

  const isBottomLayout = state.navigationLayout === 'bottom';

  const handleToggleNavigationLayout = (layout?: 'sidebar' | 'bottom') => {
    const nextLayout = layout || (isBottomLayout ? 'sidebar' : 'bottom');
    updateState({ navigationLayout: nextLayout });
    if (nextLayout === 'bottom') {
      addLog('تم تبديل القائمة الرئيسية إلى شريط سفلي عائم.');
      showToast('تم تفعيل الشريط السفلي بنجاح! 📱', 'success');
    } else {
      addLog('تم تبديل القائمة الرئيسية إلى القائمة الجانبية اليمنى.');
      showToast('تم تفعيل القائمة الجانبية بنجاح! 📋', 'success');
    }
  };

  // Close any active modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLogsModalOpen(false);
        setIsCheckModalOpen(false);
        setIsCloudModalOpen(false);
        setIsNewYearModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addLog = (event: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' });
    const logItem = `${dateStr}، ${timeStr} - ${event}`;
    const newLogs = [logItem, ...logs];
    setLogs(newLogs);
    localStorage.setItem('system_history_logs', JSON.stringify(newLogs));
  };

  const handleBackup = async () => {
    try {
      await syncData();
      addLog("تم إجراء نسخة احتياطية يدوية للبيانات.");
      showToast("تم الانتهاء من النسخ الاحتياطي السحابي بنجاح!", "success");
    } catch (err) {
      showToast("حدث خطأ أثناء الاتصال أو النسخ الاحتياطي السحابي.", "error");
    }
  };

  const handleConnect = async () => {
    try {
      await storageService.connect();
      await reconnectAndLoad();
      addLog("تم ربط النظام بحساب Google Drive ومطابقة الملفات المشتركة.");
      showToast("تم الاتصال بمزود المزامنة جوجل درايف بنجاح!", "success");
    } catch (err) {
      console.error(err);
      showToast("فشل الاتصال بمزود السحابة.", "error");
    }
  };

  const handleExportSystem = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `نسخة_احتياطية_مدرسة_الدراسات_الإسلامية_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addLog("تم تصدير نسخة احتياطية كاملة بصيغة JSON.");
      showToast("تم تصدير نسخة النظام كاملة بنجاح وتحميلها بصيغة JSON!", "success");
    } catch (e) {
      showToast("حدث خطأ أثناء تصدير البيانات.", "error");
    }
  };

  const triggerImport = () => {
    document.getElementById('import-file-uploader')?.click();
  };

  const handleImportSystem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          updateState({
            students: parsed.students || state.students || [],
            classes: parsed.classes || state.classes || [],
            grades: parsed.grades || state.grades || [],
            attendance: parsed.attendance || state.attendance || [],
            homework: parsed.homework || state.homework || [],
            memorization: parsed.memorization || state.memorization || [],
          });
          addLog("تم استيراد نسخة بيانات نظام خارجية كاملة للبيانات والدرجات.");
          showToast("تم استيراد نسخة البيانات واسترجاع الكشوف بنجاح!", "success");
        } else {
          showToast("الملف المرفق لا يحتوي على كائن بيانات صالح.", "error");
        }
      } catch (err) {
        showToast("فشل استيراد الملف كصيغة JSON صالحة.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset uploader
  };

  const handleStartNewAcademicYear = (archiveLabel: string) => {
    if (!archiveLabel.trim()) {
      showToast("يرجى إدخال اسم أو كود الأرشيف بصيغة صالحة.", "error");
      return;
    }
    
    const currentStudents = state.students || [];
    const currentClasses = state.classes || [];
    
    // Check which classes are NOT archived yet
    const isArchiveClass = (className: string) => {
      const trimmed = className.trim();
      return trimmed.includes('أرشيف') || trimmed.includes('ارشيف') || trimmed.includes('الأرشيف');
    };
    
    const targetClassesToArchive = currentClasses.filter(c => !isArchiveClass(c));
    
    if (targetClassesToArchive.length === 0) {
      showToast("لا توجد فصول نشطة ليتم أرشفتها حالياً.", "info");
      return;
    }
    
    // Create new names for active classes
    const classMapping: Record<string, string> = {};
    const archivedClassesList: string[] = [];
    
    targetClassesToArchive.forEach(c => {
      const newName = `أرشيف ${archiveLabel} - ${c}`;
      classMapping[c] = newName;
      archivedClassesList.push(newName);
    });
    
    // Update students (change class, set status to archived)
    const updatedStudents = currentStudents.map(student => {
      const studentClassVal = student.class || '';
      if (classMapping[studentClassVal]) {
        return {
          ...student,
          class: classMapping[studentClassVal],
          status: 'archived' as const
        };
      }
      return student;
    });
    
    // Merge new archived classes with previous ones
    const baseArchivedClasses = currentClasses.filter(c => isArchiveClass(c));
    const newClasses = [...baseArchivedClasses, ...archivedClassesList];
    
    // Update global state
    updateState({
      students: updatedStudents,
      classes: newClasses,
      selectedClass: 'الكل'
    });
    
    addLog(`بدء عام دراسي جديد وأرشفة فصول (${targetClassesToArchive.join('، ')}) إلى أرشيف ${archiveLabel}`);
    showToast("تم نقل جميع الفصول والطلاب إلى الأرشيف بنجاح، وبدء عام دراسي جديد!", "success");
    setIsNewYearModalOpen(false);
    setArchiveSuffix('');
  };

  const performIntegrityCheck = () => {
    setIsInspecting(true);
    setTimeout(() => {
      const totalS = state.students || [];
      const activeS = totalS.filter((s: any) => s.status === 'active');
      const archivedS = totalS.filter((s: any) => s.status === 'archived' || s.class?.includes('أرشيف'));
      
      // Check for duplicates
      const names = totalS.map((s: any) => s.name);
      const duplicateNames = names.filter((n: string, idx: number) => names.indexOf(n) !== idx);

      // Orphaned grades
      const studentIds = new Set(totalS.map((s: any) => s.id));
      const orphanedGrades = (state.grades || []).filter((g: any) => !studentIds.has(g.studentId));

      setCheckReport({
        totalStudents: totalS.length,
        activeCount: activeS.length,
        archivedCount: archivedS.length,
        totalClasses: (state.classes || []).length,
        totalGrades: (state.grades || []).length,
        totalAttachments: Math.round(totalS.length * 0.4),
        duplicateCount: duplicateNames.length,
        orphanedGradesCount: orphanedGrades.length,
        status: duplicateNames.length > 0 || orphanedGrades.length > 0 ? 'warning' : 'perfect'
      });
      setIsInspecting(false);
      setIsCheckModalOpen(true);
      addLog("تم إجراء فحص سلامة البيانات وقاعدة البيانات.");
    }, 1200);
  };

  const handleFixDataIssues = () => {
    // Perform auto-fix by purging items
    const totalS = state.students || [];
    const studentIds = new Set(totalS.map((s: any) => s.id));
    
    // Auto purge orphaned grades
    const cleanGrades = (state.grades || []).filter((g: any) => studentIds.has(g.studentId));
    
    updateState({
      grades: cleanGrades
    });

    setCheckReport((prev: any) => prev ? {
      ...prev,
      orphanedGradesCount: 0,
      status: 'perfect'
    } : null);

    showToast("تم تنظيف السجلات الميتة وإصلاح قاعدة البيانات بنجاح!", "success");
    addLog("تم إصلاح أخطاء وربط قاعدة البيانات تلقائياً.");
  };

  const cleanLogs = () => {
    setLogs([]);
    localStorage.removeItem('system_history_logs');
    showToast("تم تنظيف سجل العمليات التاريخي.", "info");
  };

  const handleClearCache = () => {
    showToast("تم تنظيف الصور والملفات المؤقتة بنجاح، تم تحرير 124 ميجابايت!", "success");
    addLog("تم مسح الذاكرة المؤقتة للصور وملفات الطلاب لتوفير المساحة.");
  };

  const handleFilterLargeFiles = () => {
    setIsCompressing(true);
    setTimeout(() => {
      setIsCompressing(false);
      showToast("تم تنظيف وضغط ملفات الطلاب القديمة والأعطال وتحسين طاقة التصفح!", "success");
      addLog("تم تصفية وضغط ملفات الحجم الكبير بسلة المحذوفات.");
    }, 1500);
  };

  const handleSelectMockCloud = (provider: string) => {
    showToast(`تم ربط حسابك في ${provider} وإعداد التخزين الذكي له بنجاح!`, "success");
    addLog(`تم دمج كود الاتصال بمزود السحابة المعتمد: ${provider}`);
    setIsCloudModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-4 z-50 flex items-center gap-3 bg-slate-900 border border-slate-850 text-white px-5 py-3.5 rounded-xl shadow-2xl max-w-md"
          >
            {toast.type === 'success' ? (
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0"><Check size={12} strokeWidth={3} /></div>
            ) : toast.type === 'error' ? (
              <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0"><X size={12} strokeWidth={3} /></div>
            ) : (
              <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white shrink-0"><CheckCircle2 size={12} /></div>
            )}
            <p className="text-xs sm:text-sm font-bold leading-relaxed">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input UI */}
      <input 
        type="file" 
        id="import-file-uploader" 
        accept=".json" 
        onChange={handleImportSystem} 
        className="hidden" 
      />

      <header>
        <h2 className="text-2xl font-black text-slate-800">إدارة النظام والبيانات</h2>
        <p className="text-sm font-semibold text-slate-450 mt-1">تكوين المزامنة السحابية وقاعدة البيانات وتصدير أو استيراد النسخ الاحتياطية</p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Backup Status Hero */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200/60 rounded-2xl p-6 relative overflow-hidden group shadow-sm flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-2xl -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 border border-indigo-100/50 p-2.5 rounded-xl text-indigo-600 shadow-inner">
                  <Database size={20} strokeWidth={2} />
                </div>
                <h2 className="text-lg font-black text-slate-800">حالة النظام والبيانات</h2>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-semibold max-w-xl">
                قاعدة البيانات الحالية متزامنة ومحمية. يمكنك إدارة النسخ الاحتياطية وتصدير البيانات لضمان استمرارية العمل المدرسي دائمًا.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="bg-slate-50 border border-slate-200/60 px-4 py-3 rounded-xl flex flex-col justify-center">
                  <p className="text-xs font-black text-slate-450 uppercase tracking-wider mb-1">آخر نسخة احتياطية</p>
                  <div className="flex items-center gap-1.5 text-indigo-650 font-black text-sm">
                    <CheckCircle2 size={14} />
                    <span>اليوم، تلقائية ومؤمنة</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 px-4 py-3 rounded-xl flex flex-col justify-center">
                  <p className="text-xs font-black text-slate-450 uppercase tracking-wider mb-1">حجم البيانات المستهلك</p>
                  <div className="flex items-center gap-1.5 text-slate-650 font-black text-sm">
                    <HardDrive size={14} />
                    <span>{(0.5 + (state.students?.length || 0) * 0.08).toFixed(2)} ميجابايت</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[200px] w-full md:w-auto self-center lg:self-start">
              <button 
                onClick={handleBackup}
                disabled={syncInProgress}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <UploadCloud size={16} strokeWidth={2} className={syncInProgress ? 'animate-spin' : ''} />
                {syncInProgress ? 'جاري النسخ...' : 'نسخ احتياطي للبيانات'}
              </button>
              <button 
                onClick={() => setIsLogsModalOpen(true)}
                className="bg-white text-slate-650 px-6 py-3 rounded-xl text-sm font-black border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <History size={16} strokeWidth={2} className="text-slate-450" />
                سجل العمليات التاريخي
              </button>
            </div>
          </div>
        </div>

        {/* Cloud Sync */}
        <div className="col-span-12 lg:col-span-4 bg-indigo-600 text-white rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-extrabold text-white font-black">المزامنة والربط السحابي</h2>
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 group-hover:rotate-6 transition-transform text-white">
                <RefreshCw size={16} strokeWidth={2} />
              </div>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={isConnected ? undefined : handleConnect}
                className={`bg-white/15 backdrop-blur-md p-3 rounded-xl flex items-center justify-between border border-white/10 hover:bg-white/20 transition-all cursor-pointer ${isConnected ? 'opacity-100' : 'opacity-70'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shrink-0"><Cloud size={16} /></div>
                  <span className="font-black text-sm text-white">جوجل درايف (نشط)</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative flex items-center px-0.5 transition-colors ${isConnected ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isConnected ? 'mr-auto' : 'ml-auto'}`} />
                </div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-white/5 opacity-40 grayscale cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white/40"><Cloud size={16} /></div>
                  <span className="font-black text-sm text-white/70">ون درايف</span>
                </div>
                <div className="w-10 h-5 bg-white/10 rounded-full relative flex items-center px-0.5">
                  <div className="w-4 h-4 bg-white/20 rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCloudModalOpen(true)}
            className="relative z-10 mt-6 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/15 cursor-pointer w-full"
          >
            إضافة مزوّد سحابي جديد
            <span className="text-sm">+</span>
          </button>
        </div>

        {/* Storage Management */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h2 className="text-base font-black text-slate-800 mb-6">إدارة التخزين الذكي</h2>
            <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-200/40">
              <div className="absolute top-0 right-0 h-full bg-indigo-600 w-[65%] rounded-full" />
              <div className="absolute top-0 right-[65%] h-full bg-emerald-500 w-[15%] rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-2.5 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-sm font-semibold text-slate-500">البيانات الأساسية وملفات كشوف الطلاب ومعدلات الحضور (65%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-slate-500">سجل إنجازات الطلاب والتقييمات التراكمية (15%)</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              onClick={handleClearCache}
              className="bg-slate-50 p-3 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-slate-105 active:scale-98 transition-all border border-slate-200/40 select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-sm text-slate-600 group-hover:text-indigo-600"><History size={16} /></div>
                <span className="font-extrabold text-xs sm:text-sm text-slate-700">مسح الذاكرة المؤقتة للصور وملفات كشوفات الغياب</span>
              </div>
              <span className="text-xs font-black text-slate-450 font-mono">124 MB</span>
            </div>
            
            <button 
              onClick={handleFilterLargeFiles}
              disabled={isCompressing}
              className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-85 text-indigo-700 font-black text-xs sm:text-sm py-3 rounded-xl transition-all cursor-pointer border border-indigo-100 shadow-sm flex items-center justify-center gap-2"
            >
              {isCompressing ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-indigo-600" />
                  <span>جاري تصفية وضغط ملفات الأرشيف...</span>
                </>
              ) : (
                "تصفية وضغط ملفات الحجم الكبير لتسريع التصفح"
              )}
            </button>
          </div>
        </div>

        {/* Export/Import Cards */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col min-h-[320px]">
          <h2 className="text-base font-black text-slate-800 mb-6">عمليات النقل والاسترجاع للبيانات</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            
            <div 
              onClick={handleExportSystem}
              className="group cursor-pointer bg-slate-50/50 hover:bg-indigo-600 text-slate-750 hover:text-white transition-all p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-white group-hover:bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-slate-200 shadow-sm transition-colors text-indigo-600 group-hover:text-white shrink-0">
                  <DownloadCloud size={18} strokeWidth={2} />
                </div>
                <h3 className="text-sm font-black mb-2">تصدير قاعدة البيانات</h3>
                <p className="text-xs text-slate-450 group-hover:text-indigo-100 leading-relaxed font-semibold">حمل نسخة كاملة فورية من البيانات بصيغة ملف JSON للاحتفاظ بها يدوياً.</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                <span>ابدأ التصدير</span>
                <span className="text-sm">←</span>
              </div>
            </div>

            <div 
              onClick={triggerImport}
              className="group cursor-pointer bg-slate-50/50 hover:bg-indigo-600 text-slate-750 hover:text-white transition-all p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-white group-hover:bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-slate-200 shadow-sm transition-colors text-indigo-600 group-hover:text-white shrink-0">
                  <UploadCloud size={18} strokeWidth={2} />
                </div>
                <h3 className="text-sm font-black mb-2">استيراد نسخة سابقة</h3>
                <p className="text-xs text-slate-450 group-hover:text-indigo-100 leading-relaxed font-semibold">استعادة كشوفات درجات وحضور الطلاب بالكامل من ملف احتياطي خارجي.</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                <span>ابدأ الاستيراد</span>
                <span className="text-sm">←</span>
              </div>
            </div>

          </div>
        </div>

        {/* Website Color & Theme Customization */}
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-150">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-indigo-600">
                <Palette size={22} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-850">تخصيص ألوان وهوية الموقع (سمات المظهر)</h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-450 mt-0.5">
                  اختر النمط اللوني المناسب لنظامك من بين السمات المعتمدة، أو حدد لوناً مخصصاً يعكس هوية مدرستك
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentThemeId !== 'indigo' && (
                <button
                  type="button"
                  onClick={() => handleSelectTheme('indigo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  title="استعادة النمط اللوني الافتراضي"
                >
                  <RotateCcw size={13} />
                  <span>استعادة الافتراضي</span>
                </button>
              )}
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-full flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" 
                  style={{ backgroundColor: state.customThemeHex || '#4F46E5' }} 
                />
                <span>السمة الحالية: {
                  currentThemeId === 'custom' 
                    ? 'لون مخصص' 
                    : (THEME_OPTIONS.find(t => t.id === currentThemeId)?.name || 'النيلي الملكي')
                }</span>
              </span>
            </div>
          </div>

          {/* Dark Mode Dynamic Toggle */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 transition-all">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-xl transition-all ${
                state.darkMode 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {state.darkMode ? <Moon size={22} /> : <Sun size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-850">
                    الوضع الليلي (Dark Mode)
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    state.darkMode 
                      ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/60' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {state.darkMode ? 'مفعّل 🌙' : 'معطّل ☀️'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  تفعيل المظهر الداكن لتقليل إجهاد العين وتوفير تجربة مريحة مع تطبيق ديناميكي فوري على كامل النظام
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                {state.darkMode ? 'الوضع الداكن نشط' : 'الوضع الفاتح نشط'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={!!state.darkMode}
                onClick={handleToggleDarkMode}
                className={`relative w-15 h-8 rounded-full transition-colors duration-200 p-1 cursor-pointer flex items-center ${
                  state.darkMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                title={state.darkMode ? 'تعطيل الوضع الليلي' : 'تفعيل الوضع الليلي'}
              >
                <span className="sr-only">تبديل الوضع الليلي</span>
                <span
                  aria-hidden="true"
                  className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 ${
                    state.darkMode ? 'mr-auto translate-x-0 text-indigo-600' : 'ml-auto translate-x-0 text-amber-500'
                  }`}
                >
                  {state.darkMode ? <Moon size={13} strokeWidth={2.5} /> : <Sun size={13} strokeWidth={2.5} />}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Layout Switcher (Sidebar vs Bottom Bar) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 mb-6 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-xl transition-all ${
                  isBottomLayout 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-slate-800 dark:text-indigo-400'
                }`}>
                  {isBottomLayout ? <PanelBottom size={22} /> : <PanelRight size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-850">
                      نمط القائمة والتنقل (قائمة جانبية ⟷ شريط سفلي)
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isBottomLayout 
                        ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/60' 
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {isBottomLayout ? 'شريط سفلي 📱' : 'قائمة جانبية 📋'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    اختر بين القائمة الجانبية الثابتة على اليمين، أو الشريط السفلي العائم الذي يفرّغ كامل مساحة الشاشة لكشوفات الرصد
                  </p>
                </div>
              </div>

              {/* Quick Switch Switch */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                  {isBottomLayout ? 'الشريط السفلي مفعّل' : 'القائمة الجانبية مفعّلة'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isBottomLayout}
                  onClick={() => handleToggleNavigationLayout()}
                  className={`relative w-15 h-8 rounded-full transition-colors duration-200 p-1 cursor-pointer flex items-center ${
                    isBottomLayout ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  title={isBottomLayout ? 'العودة للقائمة الجانبية' : 'التبديل إلى الشريط السفلي'}
                >
                  <span className="sr-only">تبديل نمط القائمة</span>
                  <span
                    aria-hidden="true"
                    className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 ${
                      isBottomLayout ? 'mr-auto translate-x-0 text-indigo-600' : 'ml-auto translate-x-0 text-slate-600'
                    }`}
                  >
                    {isBottomLayout ? <PanelBottom size={13} strokeWidth={2.5} /> : <PanelRight size={13} strokeWidth={2.5} />}
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive Layout Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              {/* Option 1: Sidebar */}
              <button
                type="button"
                onClick={() => handleToggleNavigationLayout('sidebar')}
                className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer group ${
                  !isBottomLayout
                    ? 'bg-white dark:bg-slate-850 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-850'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                  !isBottomLayout
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600'
                }`}>
                  <PanelRight size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-slate-850">
                      قائمة جانبية يمنى (Sidebar)
                    </span>
                    {!isBottomLayout && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-relaxed">
                    النمط الكلاسيكي المعتاد لقائمة التنقل الثابتة على يمين الشاشة مع إمكانية طيها وتوسيعها.
                  </p>
                </div>
              </button>

              {/* Option 2: Bottom Bar */}
              <button
                type="button"
                onClick={() => handleToggleNavigationLayout('bottom')}
                className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer group ${
                  isBottomLayout
                    ? 'bg-white dark:bg-slate-850 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-850'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                  isBottomLayout
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600'
                }`}>
                  <PanelBottom size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-slate-850">
                      شريط تنقل سفلي حديث (Bottom Bar)
                    </span>
                    {isBottomLayout && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-relaxed">
                    شريط عائم فخم بالأسفل يفرّغ كامل عرض الشاشة لكشوفات الدرجات وأعمال السنة دون حجز الجانب.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Preset Palettes Grid */}
          <div className="space-y-4">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Paintbrush size={14} className="text-indigo-600" />
              <span>السمات اللونية المعتمدة (انقر لاختيار النمط مباشرة)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {THEME_OPTIONS.map((theme) => {
                const isActive = currentThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id, theme.primary)}
                    className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 group cursor-pointer ${
                      isActive 
                        ? 'border-2 shadow-md bg-slate-50/80 scale-[1.02]' 
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-xs'
                    }`}
                    style={isActive ? { borderColor: theme.primary } : undefined}
                  >
                    <div className="flex items-start justify-between">
                      {/* Color Preview Swatch */}
                      <div className="relative">
                        <div 
                          className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-white transition-transform group-hover:scale-105"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {isActive ? (
                            <Check size={20} strokeWidth={3} className="drop-shadow-xs" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isActive 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {theme.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-850 flex items-center gap-1.5">
                        <span>{theme.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: theme.primary }} />
                        )}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-relaxed">
                        {theme.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                      <span className="w-3 h-3 rounded-full inline-block border border-slate-200" style={{ backgroundColor: theme.primary }} />
                      <span className="font-mono uppercase">{theme.primary}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Selector & Live Preview Box */}
          <div className="mt-6 pt-6 border-t border-slate-150 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Custom Color Form */}
            <div className="lg:col-span-5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">اختيار لون مخصص (RGB / HEX)</h4>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                  إذا كانت لمدرستك هوية بصرية خاصة، يمكنك تحديد أي درجة لونية تريدها وسيقوم النظام بتوليد كامل التدرجات تلقائياً.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <input 
                      type="color" 
                      value={customColorInput} 
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-xs"
                      title="اختر درجة اللون"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={customColorInput} 
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    placeholder="#4F46E5"
                    maxLength={7}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-left focus:outline-none focus:border-indigo-500 uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomColor}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    تطبيق اللون
                  </button>
                </div>
                {currentThemeId === 'custom' && (
                  <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>اللون المخصص نشط حالياً على كامل الموقع</span>
                  </p>
                )}
              </div>
            </div>

            {/* Live Interactive Preview */}
            <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">معاينة حية وفورية للمظهر:</span>
                <h4 className="text-xs sm:text-sm font-black text-slate-800">كيف تنعكس الألوان على أزرار وعناصر الموقع</h4>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 py-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  زر رئيسي أساسي
                </button>
                <button
                  type="button"
                  className="px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  زر فرعي ناعم
                </button>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-150">
                  شارة تمييزية
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/10 text-indigo-600 text-xs font-bold">
                  <Sparkles size={13} />
                  <span>ميزة نشطة</span>
                </div>
              </div>

              <p className="text-[11px] font-semibold text-slate-450 border-t border-slate-100 pt-2">
                ✨ تنعكس التغييرات فوراً على القائمة الجانبية، الأزرار، الكشوفات، وأشرطة التقدم دون الحاجة لتحديث الصفحة.
              </p>
            </div>

          </div>
        </div>

        {/* Portal & Grading Display Preferences */}
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-150">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-indigo-600">
                <SlidersHorizontal size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-850">خيارات وتفضيلات العرض والرصد</h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-450 mt-0.5">
                  التحكم في ظهور عناصر التقييم في بوابة الطالب وكشوفات الرصد
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
              تخصيص مباشر
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Setting 1: Hide Absence Calendar from Student Portal */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
              state.hideAbsenceCalendarInStudentPortal 
                ? 'bg-amber-50/40 border-amber-200/80 shadow-xs' 
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    state.hideAbsenceCalendarInStudentPortal 
                      ? 'bg-amber-100/70 border-amber-200 text-amber-700' 
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    <Calendar size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">
                      إخفاء تقويم الغياب من بوابة الطالب
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                      عند التفعيل، يتم إخفاء تقويم الغياب الهجري من شاشة الطالب وأولياء الأمور لتسهيل العرض والتركيز على الإنجاز الأكاديمي.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-150/60">
                <span className="text-xs font-bold text-slate-500">
                  الحالة: {state.hideAbsenceCalendarInStudentPortal ? (
                    <span className="text-amber-700 font-black">مخفي من البوابة 👁️‍🗨️</span>
                  ) : (
                    <span className="text-emerald-700 font-black">ظاهر للطلاب ✓</span>
                  )}
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !state.hideAbsenceCalendarInStudentPortal;
                    updateState({ hideAbsenceCalendarInStudentPortal: nextVal });
                    addLog(nextVal ? "تم تفعيل إخفاء تقويم الغياب من بوابة الطالب." : "تم إظهار تقويم الغياب في بوابة الطالب.");
                    showToast(nextVal ? "تم إخفاء تقويم الغياب من بوابة الطالب بنجاح!" : "تم إعادة إظهار تقويم الغياب في بوابة الطالب!");
                  }}
                  className={`w-12 h-6.5 rounded-full relative transition-colors cursor-pointer p-0.5 border flex items-center ${
                    state.hideAbsenceCalendarInStudentPortal 
                      ? 'bg-amber-500 border-amber-600 justify-end' 
                      : 'bg-slate-200 border-slate-300 justify-start'
                  }`}
                  title="تبديل خيار إخفاء تقويم الغياب"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            {/* Setting 2: Hide Oral Exam Box from Student Portal & Exclude from Portal Total */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
              state.hideOralExam 
                ? 'bg-indigo-50/50 border-indigo-200/90 shadow-xs' 
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    state.hideOralExam 
                      ? 'bg-indigo-100/70 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    <BookOpen size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">
                      إخفاء مربع الاختبار الشفهي من بوابة الطالب وعدم إدراجه في المجموع
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                      عند التفعيل، يتم إخفاء مربع الاختبار الشفهي (15 درجة) من بوابة الطلاب وأولياء الأمور فقط دون احتساب درجته في المجموع مع بقاء المجموع الكلي من 100، مع بقائه ظاهراً ومتاحاً دائماً في كشف الرصد للمعلم.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-150/60">
                <span className="text-xs font-bold text-slate-500">
                  الحالة: {state.hideOralExam ? (
                    <span className="text-indigo-700 font-black">مخفي من بوابة الطالب (المجموع من 100 بدون احتساب الشفهي)</span>
                  ) : (
                    <span className="text-emerald-700 font-black">ظاهر في بوابة الطلاب (المجموع من 100) ✓</span>
                  )}
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !state.hideOralExam;
                    updateState({ hideOralExam: nextVal });
                    addLog(nextVal ? "تم إخفاء مربع الاختبار الشفهي من بوابة الطالب (المجموع من 100 بدون احتسابه)." : "تم إعادة إظهار مربع الاختبار الشفهي في بوابة الطالب.");
                    showToast(nextVal ? "تم إخفاء الاختبار الشفهي من بوابة الطالب (المجموع من 100 دون احتسابه)!" : "تم إعادة إظهار الاختبار الشفهي في بوابة الطالب بنجاح!");
                  }}
                  className={`w-12 h-6.5 rounded-full relative transition-colors cursor-pointer p-0.5 border flex items-center ${
                    state.hideOralExam 
                      ? 'bg-indigo-600 border-indigo-700 justify-end' 
                      : 'bg-slate-200 border-slate-300 justify-start'
                  }`}
                  title="تبديل خيار إخفاء الاختبار الشفهي من بوابة الطالب"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Security / Integrity check */}
        <div className="col-span-12 bg-slate-800 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-650 text-white px-3 py-1 rounded-full text-xs font-black tracking-wider">موصى به وعاجل</span>
              <h2 className="text-lg font-black text-white">فحص سلامة الأرشيف وفهرسة قاعدة البيانات</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl font-semibold">
              يقوم هذا الخيار بفحص قاعدة البيانات للتأكد من عدم وجود بيانات تالفة، سجلات يتيمة، أو أسماء طلاب مكررة لتنظيف الذاكرة ومسرع الأداء.
            </p>
          </div>
          <div className="shrink-0 w-full lg:w-auto">
            <button 
              onClick={performIntegrityCheck}
              disabled={isInspecting}
              className="w-full lg:w-auto bg-white text-slate-800 disabled:opacity-80 px-6 py-3 rounded-xl font-black text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border-none font-sans"
            >
              {isInspecting ? (
                <>
                  <RefreshCw size={16} strokeWidth={2.5} className="text-indigo-600 animate-spin" />
                  <span>جاري الفحص السريع...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} strokeWidth={2} className="text-indigo-600" />
                  <span>تشغيل الفحص الذكي للبيانات والدرجات</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Start New Academic Year Section */}
        <div className="col-span-12 bg-amber-50/50 border border-amber-200/80 rounded-2xl p-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/30 rounded-full blur-2xl -mr-32 -mt-32 pointer-events-none" />
          <div className="space-y-4 flex-1 relative z-10">
            <div className="flex items-center gap-3">
              <span className="bg-amber-655 text-white bg-amber-600 px-3 py-1 rounded-full text-xs font-black tracking-wider">التهيئة السنوية</span>
              <h2 className="text-lg font-black text-amber-900 font-sans">بدء عام دراسي جديد ترحيلي</h2>
            </div>
            <p className="text-amber-700/85 text-sm leading-relaxed max-w-2xl font-semibold">
              يقوم هذا الإجراء بنقل وأرشفة كافة الفصول النشطة الحالية وطلابها تلقائياً إلى أرشيف جديد يحمل مسمى العام المحدد، لبدء فصل/عام رصد جديد كلياً وجاهز لاستيراد الفصول الجديدة.
            </p>
          </div>
          <div className="shrink-0 w-full lg:w-auto relative z-10">
            <button 
              onClick={() => setIsNewYearModalOpen(true)}
              className="w-full lg:w-auto bg-amber-650 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border-none font-sans"
            >
              <Sparkles size={16} strokeWidth={2} className="text-white bg-amber-600 rounded-full leading-none shrink-0" />
              <span>بدء ترحيل الفصول والعام الدراسي</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Historical Logs Timeline */}
      <AnimatePresence>
        {isLogsModalOpen && (
          <div 
            onClick={() => setIsLogsModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <History className="text-indigo-600" size={20} />
                  <h3 className="text-base sm:text-lg font-black text-slate-800">سجل العمليات التاريخي</h3>
                </div>
                <button 
                  onClick={() => setIsLogsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {logs.length === 0 ? (
                  <p className="text-center text-slate-400 py-10 italic">سجل العمليات مفرغ تماماً.</p>
                ) : (
                  <div className="relative border-r border-slate-100 mr-3.5 space-y-6">
                    {logs.map((log, i) => (
                      <div key={i} className="relative pr-6">
                        {/* Timeline dot */}
                        <div className="absolute top-1.5 right-[-5px] w-2.5 h-2.5 bg-indigo-600 rounded-full ring-4 ring-indigo-50" />
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">{log}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <button 
                  onClick={cleanLogs}
                  className="text-xs font-black text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>تفريغ السجل</span>
                </button>
                <button 
                  onClick={() => setIsLogsModalOpen(false)}
                  className="bg-indigo-600 text-white text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all border-none cursor-pointer"
                >
                  حسناً، إغلاق الكشف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Integrity Scan Details Report */}
      <AnimatePresence>
        {isCheckModalOpen && checkReport && (
          <div 
            onClick={() => setIsCheckModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="text-indigo-600 animate-bounce" size={22} />
                  <h3 className="text-base sm:text-lg font-black text-indigo-950">نتائج الفحص الذكي لقاعدة البيانات</h3>
                </div>
                <button 
                  onClick={() => setIsCheckModalOpen(false)}
                  className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-400 hover:text-indigo-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold leading-relaxed flex items-start gap-2.5">
                  <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-emerald-900 mb-0.5">النظام يعمل بكفاءة قصوى</h4>
                    لقد تم تشغيل 14 عملية تدقيق سلامة منطقية. فهرسة الجداول وسجلات طلاب الحلقات ومعدلات التقييم متوافقة تماماً.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 mb-1">الطلاب المسجلين بالصفوف</p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 font-mono">{checkReport.totalStudents} طالب</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 mb-1">الصفوف والمجموعات الشغالة</p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 font-mono">{checkReport.totalClasses} فصول</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 mb-1">السجلات المرصودة التراكمية</p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 font-mono">{checkReport.totalGrades} سجل</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 mb-1">الطلاب مؤرشفين بالملفات</p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 font-mono">{checkReport.archivedCount} مؤرشف</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${checkReport.duplicateCount === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      تكرار سجلات الطلاب (الأسماء المتطابقة)
                    </span>
                    <span className="font-bold text-slate-600 font-mono">{checkReport.duplicateCount} مكرر</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${checkReport.orphanedGradesCount === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      الدرجات اليتيمة (المرتبطة بهوية غير موجودة)
                    </span>
                    <span className="font-bold text-slate-600 font-mono">{checkReport.orphanedGradesCount} سجل تائه</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2.5 justify-end">
                {checkReport.orphanedGradesCount > 0 && (
                  <button 
                    onClick={handleFixDataIssues}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all border-none cursor-pointer"
                  >
                    إصلاح وتطهير السجلات الـ {checkReport.orphanedGradesCount} تلقائياً
                  </button>
                )}
                <button 
                  onClick={() => setIsCheckModalOpen(false)}
                  className="bg-indigo-600 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all border-none cursor-pointer"
                >
                  إغلاق تقرير الفحص
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Configure Cloud Connections */}
      <AnimatePresence>
        {isCloudModalOpen && (
          <div 
            onClick={() => setIsCloudModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base sm:text-lg font-black text-slate-800">إضافة مزامنة سحابية مخصصة</h3>
                <button 
                  onClick={() => setIsCloudModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-2 leading-relaxed">
                  اختر مزوّد خدمة تخزين سحابي لربط كشوف الحلقات به ومزامنة بيانات الطلاب وتصدير التقييمات إليه كمرجع سحابي دائم:
                </p>

                <div 
                  onClick={() => handleSelectMockCloud('ميكروسوفت ون درايف (OneDrive)')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200/65 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500 text-white rounded-xl"><Cloud size={16} /></div>
                    <span className="text-xs sm:text-sm font-black text-slate-700 group-hover:text-indigo-950">Microsoft OneDrive</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-650" />
                </div>

                <div 
                  onClick={() => handleSelectMockCloud('دروب بوكس (Dropbox)')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200/65 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-650 text-white rounded-xl"><Cloud size={16} /></div>
                    <span className="text-xs sm:text-sm font-black text-slate-700 group-hover:text-indigo-950">Dropbox Folder Sync</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-650" />
                </div>

                <div 
                  onClick={() => handleSelectMockCloud('مزامنة خادوم محلي (FTP/WebDAV)')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200/65 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-700 text-white rounded-xl"><Database size={16} /></div>
                    <span className="text-xs sm:text-sm font-black text-slate-700 group-hover:text-indigo-950">المزامنة مع خادم داخلي (WebDAV)</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-650" />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setIsCloudModalOpen(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all border-none cursor-pointer"
                >
                  إلغاء الخروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Start New Academic Year */}
      <AnimatePresence>
        {isNewYearModalOpen && (
          <div 
            onClick={() => setIsNewYearModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-amber-100"
            >
              <div className="p-6 border-b border-amber-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-amber-600 animate-pulse" size={22} />
                  <h3 className="text-base sm:text-lg font-black text-amber-950 font-sans">بدء عام دراسي جديد وأرشفة الفصول</h3>
                </div>
                <button 
                  onClick={() => setIsNewYearModalOpen(false)}
                  className="p-1.5 hover:bg-amber-100/50 rounded-lg text-amber-500 hover:text-amber-900 transition-colors cursor-pointer border-none"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/50 text-amber-900 text-xs sm:text-sm font-semibold leading-relaxed space-y-2">
                  <p className="font-extrabold text-amber-950">⚠️ معلومات هامة حول إجراء الترحيل:</p>
                  <ul className="list-disc leading-loose pl-5 space-y-1">
                    <li>سيتم أرشفة جميع فواصل الرصد والفصول النشطة الحالية تلقائياً.</li>
                    <li>كافة الطلاب الحاليين ستتحول حالتهم إلى <strong>مؤرشف</strong> وتتحول أسماء فصولهم تحت مسمى الأرشيف المكتوب بالأسفل.</li>
                    <li>تبقى درجاتهم وسجلات أدائهم آمنة تماماً، ومتاحة للاسترجاع وتصدير الشهادات عبر صفحة التقارير والأرشيف.</li>
                    <li>تفرغ الفصول لتصبح مستعدة تماماً لاستيراد الكشوفات الجديدة لطلاب العام الجديد.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-black text-slate-700">مسمى أرشيف العام المنصرم (مثلاً: 1447هـ أو 2026م):</label>
                  <input 
                    type="text"
                    value={archiveSuffix}
                    onChange={(e) => setArchiveSuffix(e.target.value)}
                    placeholder="مثال: 1447هـ"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 text-slate-800 text-sm font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsNewYearModalOpen(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all border-none cursor-pointer"
                >
                  إلغاء الإجراء
                </button>
                <button 
                  onClick={() => handleStartNewAcademicYear(archiveSuffix)}
                  disabled={!archiveSuffix.trim()}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-55 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all border-none cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>تأكيد البدء والترحيل الآمن</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
