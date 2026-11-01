import React, { useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Star, 
  Award, 
  CalendarDays, 
  ClipboardList, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  GraduationCap, 
  Menu,
  PanelRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onOpenSidebar?: () => void;
  onEnterStudentPortal?: () => void;
  onToggleNavigationLayout?: () => void;
  isBottomLayout?: boolean;
}

export function BottomNav({ 
  activeTab, 
  onTabChange, 
  onOpenSidebar, 
  onEnterStudentPortal,
  onToggleNavigationLayout,
  isBottomLayout = false
}: BottomNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeBtn = scrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const mainNavItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'grading', label: 'الدرجات', icon: Star },
    { id: 'noor', label: 'رصد نور', icon: Award },
    { id: 'attendance', label: 'الحضور', icon: CalendarDays },
    { id: 'yearly_work', label: 'أعمال السنة', icon: ClipboardList },
    { id: 'classes', label: 'الفصول', icon: Users },
    { id: 'leaves', label: 'الاستئذان', icon: FileText },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav 
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 inset-x-0 w-full z-50 print:hidden pointer-events-auto select-none"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1">
        <div 
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.65)] rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 flex items-center justify-between gap-1 sm:gap-2 relative overflow-hidden"
          style={{
            borderColor: 'var(--theme-sidebar-border, rgba(226, 232, 240, 0.8))'
          }}
        >
          {/* Subtle Top Gradient Accent Line */}
          <div 
            className="absolute top-0 inset-x-0 h-1 opacity-80"
            style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
          />

          {/* Scrollable Items Container */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 flex items-center justify-start md:justify-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth touch-pan-x"
          >
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 shrink-0 cursor-pointer select-none group touch-manipulation ${
                    isActive
                      ? 'text-white font-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 font-bold'
                  }`}
                  style={
                    isActive 
                      ? { 
                          backgroundColor: 'var(--theme-primary, #4f46e5)',
                          color: '#ffffff'
                        } 
                      : undefined
                  }
                >
                  <Icon 
                    size={17} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`shrink-0 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} 
                  />
                  <span className="text-xs tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>

                  {/* Subtle active indicator dot */}
                  {isActive && (
                    <motion.span 
                      layoutId="bottomNavDot"
                      className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" 
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Shortcuts Separator & Portal Shortcuts */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1 border-r border-slate-200 dark:border-slate-800 pr-1 sm:pr-1.5">
            {/* Student Portal Direct Access Button */}
            {onEnterStudentPortal && (
              <button
                type="button"
                onClick={onEnterStudentPortal}
                className="flex items-center gap-1 py-1.5 px-2 sm:px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition-all font-black text-xs shrink-0 cursor-pointer shadow-2xs group touch-manipulation"
                title="الدخول إلى بوابة الطلاب الذكية"
              >
                <GraduationCap size={16} strokeWidth={2.2} className="animate-pulse text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">بوابة الطلاب</span>
              </button>
            )}

            {/* Toggle back to Sidebar or open drawer if available */}
            {onToggleNavigationLayout ? (
              <button
                type="button"
                onClick={onToggleNavigationLayout}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0 touch-manipulation"
                title="التبديل إلى نمط القائمة الجانبية"
              >
                <PanelRight size={17} strokeWidth={2} />
              </button>
            ) : onOpenSidebar ? (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0 touch-manipulation"
                title="فتح القائمة الجانبية"
              >
                <Menu size={17} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
