import { LucideIcon, LayoutDashboard, Star, CalendarDays, ClipboardList, Settings, GraduationCap, Users, Menu, ChevronRight, FileText, LogOut, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'grading', label: 'الدرجات', icon: Star },
  { id: 'noor', label: 'رصد نور', icon: Award },
  { id: 'attendance', label: 'الحضور', icon: CalendarDays },
  { id: 'yearly_work', label: 'أعمال السنة', icon: ClipboardList },
  { id: 'classes', label: 'إدارة الفصول', icon: Users },
  { id: 'leaves', label: 'الاستئذان', icon: FileText },
  { id: 'reports', label: 'التقارير', icon: FileText },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onEnterStudentPortal?: () => void;
  onLogout?: () => void;
}

export function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse, isMobile, onEnterStudentPortal, onLogout }: SidebarProps) {
  return (
    <aside 
      className={`print:hidden fixed right-0 top-0 h-full flex flex-col py-6 z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out shadow-2xl ${
        isMobile 
          ? (isCollapsed ? 'translate-x-full' : 'translate-x-0 w-[280px] max-w-[85vw]')
          : (isCollapsed ? 'w-24' : 'w-72')
      }`}
      style={{
        backgroundColor: 'var(--theme-sidebar-bg, #0f1738)',
        borderLeft: '1px solid var(--theme-sidebar-border, #23336e)'
      }}
    >
      {/* Top Theme Color Accent Line */}
      <div 
        className="absolute top-0 right-0 left-0 h-1 transition-all pointer-events-none" 
        style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }} 
      />
      <div className={`${isCollapsed && !isMobile ? 'px-0 items-center' : 'px-6 items-start'} mb-8 flex flex-col relative`}>
        {/* Mobile close button */}
        {isMobile ? (
          <button 
            onClick={onToggleCollapse}
            className="absolute top-0 left-4 p-2 text-slate-400 hover:text-white rounded-xl transition-all"
            style={{ backgroundColor: 'var(--theme-sidebar-card, #111833)' }}
            title="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        ) : (
          <button 
            onClick={onToggleCollapse}
            className={`absolute ${isCollapsed ? 'top-[-10px]' : 'top-0 left-4'} p-2 text-slate-400 hover:text-white transition-all`}
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronRight size={24} className="rotate-180" />}
          </button>
        )}

        <div 
          className={`w-11 h-11 rounded-xl mb-3 flex items-center justify-center text-white border shadow-lg transition-all duration-300 ${isCollapsed && !isMobile ? 'scale-75 mb-2' : ''}`}
          style={{
            backgroundColor: 'var(--theme-primary, #4f46e5)',
            borderColor: 'var(--theme-primary-hover, #4338ca)'
          }}
        >
          <GraduationCap size={22} strokeWidth={1.5} />
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-1"
            >
              <p 
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--theme-sidebar-subtext, #818cf8)' }}
              >
                الدراسات الإسلامية
              </p>
              <h2 className="text-xl font-bold text-white tracking-tight leading-none">
                لوحة التحكم الدراسي
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1.5 px-3">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 py-3 transition-all rounded-xl relative group ${
                isCollapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isActive 
                  ? 'text-white font-medium shadow-sm border' 
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                isActive 
                  ? { 
                      backgroundColor: 'var(--theme-sidebar-active, #1c2856)', 
                      borderColor: 'var(--theme-sidebar-border, #1c264a)' 
                    } 
                  : undefined
              }
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute right-0 top-3 bottom-3 w-1 rounded-l-full"
                  style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
                />
              )}
              <div 
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
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
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <div 
        className={`mt-8 pt-6 ${isCollapsed ? 'px-0 items-center' : 'px-6 border-t'} space-y-3.5 flex flex-col`}
        style={{ borderColor: 'var(--theme-sidebar-border, #1c264a)' }}
      >
        {onEnterStudentPortal && (
          <button
            onClick={onEnterStudentPortal}
            className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all border group relative ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            style={{
              borderColor: 'var(--theme-sidebar-border, #1c264a)',
              backgroundColor: 'var(--theme-sidebar-card, #111833)',
              color: 'var(--theme-sidebar-subtext, #818cf8)'
            }}
            title="بوابة استعلام الطلاب وبطاقات التقدم"
          >
            <GraduationCap size={18} strokeWidth={2} className="animate-pulse" style={{ color: 'var(--theme-sidebar-subtext, #818cf8)' }} />
            {!isCollapsed && <span className="text-xs font-black">بوابة الطلاب الذكية 👤</span>}
          </button>
        )}

        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 py-2 px-4 rounded-xl transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${
            activeTab === 'settings' ? 'text-white shadow-sm border' : 'text-slate-450 hover:text-white'
          }`}
          style={
            activeTab === 'settings' 
              ? { 
                  backgroundColor: 'var(--theme-sidebar-active, #1c2856)', 
                  borderColor: 'var(--theme-sidebar-border, #1c264a)' 
                } 
              : undefined
          }
        >
          <Settings size={18} strokeWidth={1.5} style={activeTab === 'settings' ? { color: 'var(--theme-sidebar-subtext, #818cf8)' } : undefined} />
          {!isCollapsed && <span className="text-sm font-medium">الإعدادات</span>}
        </button>
        
        <div 
          className={`rounded-xl p-3 flex items-center gap-3 border transition-all ${isCollapsed ? 'p-1.5 rounded-full' : 'w-full'} relative`}
          style={{
            backgroundColor: 'var(--theme-sidebar-card, #111833)',
            borderColor: 'var(--theme-sidebar-border, #1c264a)'
          }}
        >
          <div 
            className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0 border ${isCollapsed ? 'w-8 h-8' : ''}`}
            style={{
              backgroundColor: 'var(--theme-primary, #4f46e5)',
              borderColor: 'var(--theme-primary-hover, #4338ca)',
              color: '#ffffff'
            }}
          >
            <span>م</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">المعلم</p>
                <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">معلم المادة</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-red-500 bg-red-500/15 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-150 flex items-center gap-1 text-xs font-bold"
                  title="تسجيل الخروج"
                >
                  <LogOut size={13} />
                  <span>خروج</span>
                </button>
              )}
            </div>
          )}
          {isCollapsed && onLogout && (
            <button
              onClick={onLogout}
              className="absolute -bottom-1 -left-1 p-1 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all border border-slate-800 z-10 scale-90"
              title="تسجيل الخروج"
            >
              <LogOut size={10} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

