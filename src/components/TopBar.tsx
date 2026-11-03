import { Bell, Menu, User, Cloud, CloudOff, AlertCircle, AlertTriangle, CheckCircle2, Clock, Info, Moon, Sun, PanelRight, PanelBottom } from 'lucide-react';
import { useState } from 'react';
import { storageService } from '../lib/storageService';
import { useApp } from '../context/AppContext';

interface TopBarProps {
  title: string;
  onToggleSidebar?: () => void;
  onProfileClick?: () => void;
  isBottomLayout?: boolean;
}

export function TopBar({ title, onToggleSidebar, onProfileClick, isBottomLayout }: TopBarProps) {
  const { state, updateState, isConnected, reconnectAndLoad } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const currentSemester = state.currentSemester || '1';
  const currentPeriod = state.currentPeriod || '1';

  const handleConnect = async () => {
    try {
      await storageService.connect();
      await reconnectAndLoad();
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Notifications calculation
  const notifications: { id: string; title: string; description: string; type: 'info' | 'warning' | 'success' | 'alert'; time: string }[] = [];

  // 1. Google Drive connection status
  if (isConnected) {
    notifications.push({
      id: 'gdrive-ok',
      title: 'مزامنة السحاب متصلة',
      description: 'يتم النسخ الاحتياطي التلقائي لبيانات الطلاب والدرجات بنجاح.',
      type: 'success',
      time: 'الآن'
    });
  } else {
    notifications.push({
      id: 'gdrive-warn',
      title: 'النسخ الاحتياطي غير مفعل',
      description: 'يرجى ربط حساب Google لضمان عدم فقدان كشوف الدرجات والتحضير.',
      type: 'warning',
      time: 'تنبيه هام'
    });
  }

  // 2. High Absence Alert (>= 2 absences)
  const studentAbsenceCount: { [id: string]: number } = {};
  const studentLateCount: { [id: string]: number } = {};
  
  (state.attendance || []).forEach(record => {
    if (record.status === 'absent') {
      studentAbsenceCount[record.studentId] = (studentAbsenceCount[record.studentId] || 0) + 1;
    } else if (record.status === 'late') {
      studentLateCount[record.studentId] = (studentLateCount[record.studentId] || 0) + 1;
    }
  });

  const studentsWithManyAbsences = Object.entries(studentAbsenceCount)
    .filter(([_, count]) => count >= 2)
    .map(([studentId, count]) => {
      const s = state.students.find(st => st.id === studentId);
      return { name: s ? s.name : studentId, count };
    });

  const studentsWithManyLates = Object.entries(studentLateCount)
    .filter(([_, count]) => count >= 3)
    .map(([studentId, count]) => {
      const s = state.students.find(st => st.id === studentId);
      return { name: s ? s.name : studentId, count };
    });

  studentsWithManyAbsences.forEach((item, index) => {
    notifications.push({
      id: `abs-${index}`,
      title: `تنبيه غياب متكرر: ${item.name}`,
      description: `تجاوز الطالب الحد المسموح به بغيابه ${item.count} من المرات.`,
      type: 'alert',
      time: 'تلقائي'
    });
  });

  studentsWithManyLates.forEach((item, index) => {
    notifications.push({
      id: `late-${index}`,
      title: `تنبيه تأخر متكرر: ${item.name}`,
      description: `سجل الطالب تأخيراً متكرراً لـ ${item.count} مرات هذا الفصل.`,
      type: 'info',
      time: 'تلقائي'
    });
  });

  // 3. Permits Alert (Current permissions restroom etc.)
  const activePermits = (state.attendance || []).filter(a => ['restroom', 'with_deputy', 'with_counselor'].includes(a.status));
  activePermits.forEach((permit, index) => {
    const s = state.students.find(st => st.id === permit.studentId);
    let reason = 'مستأذن';
    if (permit.status === 'restroom') reason = 'دورة المياه 🚽';
    if (permit.status === 'with_deputy') reason = 'الوكيل 💼';
    if (permit.status === 'with_counselor') reason = 'المرشد الطلابي 🤝';
    
    notifications.push({
      id: `permit-${index}`,
      title: `حالة استئذان نشطة: ${s ? s.name : 'طالب'}`,
      description: `الطالب خارج الفصل حالياً متواجد في: ${reason}`,
      type: 'alert',
      time: 'نشط الآن'
    });
  });

  // 4. Homework Alerts
  if (state.homework && state.homework.length > 0) {
    const activeHw = state.homework[state.homework.length - 1]; // Get newest homework
    notifications.push({
      id: 'hw-newest',
      title: `واجب جديد مضاف: ${activeHw.title || activeHw.name || 'واجب مدرسي'}`,
      description: `تم نشر واجب للطلاب في درس "${activeHw.lesson || 'الدرس المحدد'}".`,
      type: 'info',
      time: 'مؤخراً'
    });
  }

  // Count alerts/warnings to show in badge
  const alertCount = notifications.filter(n => n.type === 'alert' || n.type === 'warning').length;

  return (
    <header className="print:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md px-3 sm:px-6 md:px-8 py-3 md:py-5 flex flex-wrap gap-2.5 sm:gap-4 justify-between items-center border-b border-slate-100 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {!isBottomLayout && onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            aria-label="فتح القائمة الرئيسية"
            className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-650 lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold tracking-wider text-indigo-500 uppercase">الدراسات الإسلامية</p>
          <h1 className="text-base sm:text-lg md:text-2xl font-black tracking-tight text-slate-800 truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Global Semester & Period Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-slate-50 border border-slate-200/60 px-2 sm:px-3 py-1 md:px-4 md:py-2 rounded-xl sm:rounded-2xl shrink-0">
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-650 font-bold border-l border-slate-200/80 pl-2 lg:pl-3">
          <span className="text-slate-500 font-medium">الفصل:</span>
          <select 
            value={currentSemester} 
            onChange={(e) => updateState({ currentSemester: e.target.value })}
            className="bg-transparent font-black text-indigo-600 focus:outline-none cursor-pointer text-[11px] sm:text-xs p-0 border-none select-none"
          >
            <option value="1">الأول</option>
            <option value="2">الثاني</option>
          </select>
        </div>

        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-650 font-bold">
          <span className="text-slate-500 font-medium">الفترة:</span>
          <select 
            value={currentPeriod} 
            onChange={(e) => updateState({ currentPeriod: e.target.value })}
            className="bg-transparent font-black text-violet-600 focus:outline-none cursor-pointer text-[11px] sm:text-xs p-0 border-none select-none"
          >
            <option value="1">الأولى</option>
            <option value="2">الثانية</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        <div className="flex flex-col items-end">
          <button 
            onClick={isConnected ? undefined : handleConnect}
            className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all text-xs font-semibold ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs' 
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            title={isConnected ? 'متصل بجوجل درايف' : 'ربط جوجل درايف'}
          >
            {isConnected ? <Cloud size={16} className="text-emerald-500" /> : <CloudOff size={16} className="text-slate-400" />}
            <span className="hidden sm:inline">{isConnected ? 'متصل بجوجل درايف' : 'ربط درايف'}</span>
          </button>
        </div>
        
        {/* Dark Mode Quick Toggle */}
        <button
          onClick={() => updateState({ darkMode: !state.darkMode })}
          className={`p-2 sm:p-2.5 rounded-xl transition-all border min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer ${
            state.darkMode 
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' 
              : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-150'
          }`}
          title={state.darkMode ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
        >
          {state.darkMode ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} />}
        </button>

        {/* Navigation Layout Quick Switch */}
        <button
          onClick={() => updateState({ navigationLayout: state.navigationLayout === 'bottom' ? 'sidebar' : 'bottom' })}
          className={`p-2 sm:p-2.5 rounded-xl transition-all border min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer ${
            state.navigationLayout === 'bottom'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs dark:bg-indigo-950/70 dark:border-indigo-800'
              : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-150 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
          }`}
          title={state.navigationLayout === 'bottom' ? 'التبديل إلى القائمة الجانبية (Sidebar)' : 'التبديل إلى الشريط السفلي (Bottom Bar)'}
        >
          {state.navigationLayout === 'bottom' ? <PanelBottom size={18} /> : <PanelRight size={18} />}
        </button>

        {/* Bell Button & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 sm:p-2.5 rounded-xl transition-all border min-w-[38px] min-h-[38px] flex items-center justify-center ${
              showNotifications 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100'
            }`}
            title="تنبيهات النظام الذكية"
          >
            <Bell size={18} className={alertCount > 0 ? 'animate-bounce' : ''} />
            {notifications.length > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${alertCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`}></span>
            )}
          </button>

          {/* Clickaway backdrop logic */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent cursor-default" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-0 sm:right-auto mt-2 z-50 sm:w-[350px] max-w-sm mx-auto sm:mx-0 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans text-right animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">التنبيهات الذكية</span>
                  <span className="text-xs bg-slate-200/70 border border-slate-300/40 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {notifications.length} إجمالي
                  </span>
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center text-slate-400 text-sm">
                      <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                      لا توجد تنبيهات جديدة حالياً
                    </div>
                  ) : (
                    notifications.map((n) => {
                      let icon = <Info size={14} className="text-blue-500" />;
                      let bg = 'bg-blue-50/40';
                      
                      if (n.type === 'success') {
                        icon = <CheckCircle2 size={14} className="text-emerald-500" />;
                        bg = 'bg-emerald-50/40';
                      } else if (n.type === 'warning') {
                        icon = <AlertTriangle size={14} className="text-amber-500" />;
                        bg = 'bg-amber-50/40';
                      } else if (n.type === 'alert') {
                        icon = <AlertCircle size={14} className="text-rose-500 animate-pulse" />;
                        bg = 'bg-rose-50/40';
                      }

                      return (
                        <div key={n.id} className={`p-3 hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${bg}`}>
                          <div className="mt-0.5 shrink-0 p-1 bg-white rounded-lg border border-slate-200/50 shadow-sm">
                            {icon}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex justify-between items-center gap-2">
                              <h5 className="text-xs sm:text-[13px] font-black text-slate-800 leading-tight">
                                {n.title}
                              </h5>
                              <span className="text-[10px] text-slate-400 font-bold bg-white/70 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                              {n.description}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 text-center text-xs text-slate-500 border-t border-slate-100 flex items-center justify-center gap-1">
                  <Clock size={12} />
                  <span>تحديث البيانات يتم تلقائياً بانتظام</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div 
          onClick={onProfileClick}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 border border-slate-200 transition-transform hover:scale-105 cursor-pointer"
        >
          <User size={20} strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}

