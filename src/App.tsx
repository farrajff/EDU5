/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { GradingPage } from './pages/GradingPage';
import { AttendancePage } from './pages/AttendancePage';
import { YearlyWorkPage } from './pages/YearlyWorkPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClassManagementPage } from './pages/ClassManagementPage';
import { HomePage } from './pages/HomePage';
import { LeavesPage } from './pages/LeavesPage';
import { ReportsPage } from './pages/ReportsPage';
import { NoorPage } from './pages/NoorPage';
import { StudentPortalPage } from './pages/StudentPortalPage';
import { LoginGate } from './pages/LoginGate';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { BottomNav } from './components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { getBasePathname, getPublicLegalPageFromUrl, PublicLegalPage } from './lib/publicRoutes';

interface AppContentProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

function AppContent({ onOpenPrivacy, onOpenTerms }: AppContentProps) {
  const { state, updateState } = useApp();
  const isBottomBarActive = state.navigationLayout === 'bottom';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const showBottomBar = isMobile || isBottomBarActive;
  const showSidebar = !isMobile && !isBottomBarActive;
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [isTeacherSession, setIsTeacherSession] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const isStudentQuery = params.get('portal') === 'student' || 
                           params.get('role') === 'student' || 
                           window.location.hash === '#student';
    
    // If they initially visited the administrator path, remember they are a teacher
    if (!isStudentQuery) {
      sessionStorage.setItem('isTeacherSession', 'true');
      return true;
    }
    
    // Or check if they have an active teacher session
    return sessionStorage.getItem('isTeacherSession') === 'true';
  });

  useEffect(() => {
    // Check if URL search parameters specify student portal access
    const checkUserRoleQuery = () => {
      const params = new URLSearchParams(window.location.search);
      const isStudentQuery = params.get('portal') === 'student' || 
                             params.get('role') === 'student' || 
                             window.location.hash === '#student';
      if (isStudentQuery) {
        setIsStudentMode(true);
      } else {
        // If they navigate out, preserve teacher mode
        setIsTeacherSession(true);
        sessionStorage.setItem('isTeacherSession', 'true');
      }
    };

    checkUserRoleQuery();

    // Sync state if user navigates with browser history
    const handleUrlChange = () => {
      checkUserRoleQuery();
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const enterStudentMode = () => {
    setIsTeacherSession(true);
    sessionStorage.setItem('isTeacherSession', 'true');
    setIsStudentMode(true);
    const url = new URL(window.location.href);
    url.searchParams.set('portal', 'student');
    window.history.pushState({}, '', url.toString());
  };

  const exitStudentMode = () => {
    setIsStudentMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('portal');
    url.searchParams.delete('role');
    if (url.hash === '#student') {
      url.hash = '';
    }
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const handleResize = () => {
      // Screens <= 1024px cover mobile phones and tablets in portrait and landscape
      const mobileOrTablet = window.innerWidth <= 1024;
      setIsMobile(mobileOrTablet);
      if (mobileOrTablet) setIsCollapsed(true);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isStudentMode) {
    return (
      <div className="fixed inset-0 w-full h-full h-[100dvh] overflow-y-auto bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key="student-portal-fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            <StudentPortalPage
              onBackToTeacher={exitStudentMode}
              showBackToTeacher={isTeacherSession}
              onOpenPrivacy={onOpenPrivacy}
              onOpenTerms={onOpenTerms}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'الرئيسية والمؤشرات';
      case 'grading': return 'إدارة درجات الطلاب';
      case 'noor': return 'رصد نظام نور المتكامل';
      case 'attendance': return 'سجل الحضور والغياب';
      case 'yearly_work': return 'أعمال السنة';
      case 'classes': return 'إدارة الفصول والطلاب';
      case 'leaves': return 'نظام الاستئذان والتواجد';
      case 'reports': return 'مركز التقارير الأكاديمية';
      case 'settings': return 'إدارة النظام والبيانات';
      default: return 'الدراسات الإسلامية';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <HomePage />;
      case 'grading': return <GradingPage />;
      case 'noor': return <NoorPage />;
      case 'attendance': return <AttendancePage />;
      case 'yearly_work': return <YearlyWorkPage />;
      case 'leaves': return <LeavesPage />;
      case 'reports': return <ReportsPage />;
      case 'classes': return <ClassManagementPage />;
      case 'settings': return <SettingsPage onOpenPrivacy={onOpenPrivacy} onOpenTerms={onOpenTerms} />;
      default: return null;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAppAuthenticated');
    sessionStorage.removeItem('authUser');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Upper area containing Sidebar (if desktop sidebar mode) + Main scrollable view */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* Desktop Sidebar (Only when NOT in Bottom Bar mode and NOT on mobile/tablet) */}
        {showSidebar && (
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab)} 
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            isMobile={false}
            onEnterStudentPortal={enterStudentMode}
            onOpenPrivacy={onOpenPrivacy}
            onOpenTerms={onOpenTerms}
            onLogout={handleLogout}
          />
        )}

        {/* Mobile Slide-Out Drawer (Only when user taps menu on mobile/tablet) */}
        {isMobile && isMobileDrawerOpen && (
          <>
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
                setIsMobileDrawerOpen(false);
              }} 
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileDrawerOpen(false)}
              isMobile={true}
              onEnterStudentPortal={enterStudentMode}
              onOpenPrivacy={onOpenPrivacy}
              onOpenTerms={onOpenTerms}
              onLogout={handleLogout}
            />
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
          </>
        )}

        {/* Central Content Column */}
        <div className={`flex-1 flex flex-col min-h-0 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          showSidebar ? (isCollapsed ? 'mr-24' : 'mr-72') : 'mr-0'
        } print:mr-0`}>
          {/* TopBar (Fixed at the top of the content column) */}
          <header className="shrink-0 z-30">
            <TopBar 
              title={getPageTitle()} 
              onToggleSidebar={() => setIsMobileDrawerOpen(prev => !prev)}
              onProfileClick={() => setActiveTab('settings')}
              isBottomLayout={showBottomBar}
            />
          </header>

          {/* Dedicated internal scrollable container */}
          <main 
            id="main-app-scroll"
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8 lg:p-10 transition-all select-text print:overflow-visible print:h-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingBottom: showBottomBar ? 'calc(5.5rem + env(safe-area-inset-bottom, 16px))' : '2.5rem'
            }}
          >
            <div className="max-w-screen-2xl w-full mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>

              {/* Public Legal Links Footer (Always accessible in Sidebar & Bottom Bar layouts) */}
              <footer className="mt-10 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-400 print:hidden">
                <span>© {new Date().getFullYear()} نظام إدارة الدراسات الإسلامية</span>
                <div className="flex items-center gap-3">
                  <a
                    href="?page=privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenPrivacy();
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    سياسة الخصوصية العامة
                  </a>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <a
                    href="?page=terms"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenTerms();
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    شروط الخدمة العامة
                  </a>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Navigation Dock - Permanently fixed and docked to viewport bottom */}
      {showBottomBar && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileDrawerOpen(false);
          }}
          onOpenSidebar={() => setIsMobileDrawerOpen(true)}
          onEnterStudentPortal={enterStudentMode}
          onToggleNavigationLayout={() => {
            const next = state.navigationLayout === 'bottom' ? 'sidebar' : 'bottom';
            updateState({ navigationLayout: next });
          }}
          isBottomLayout={isBottomBarActive}
        />
      )}
      
      {/* Aesthetic Overlay Background */}
      <div className="fixed top-0 right-0 w-[50%] h-full bg-primary/5 pointer-events-none -z-10 blur-[120px]" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-blue-100/30 pointer-events-none -z-10 blur-[100px]" />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAppAuthenticated') === 'true';
  });

  const [isStudentUrl, setIsStudentUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('portal') === 'student' || 
           params.get('role') === 'student' || 
           window.location.hash === '#student';
  });

  const [publicLegalPage, setPublicLegalPage] = useState<PublicLegalPage>(() => getPublicLegalPageFromUrl());

  const openPublicLegalPage = (page: 'privacy' | 'terms') => {
    setPublicLegalPage(page);
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    if (url.hash === '#privacy' || url.hash === '#terms') {
      url.hash = '';
    }
    window.history.pushState({}, '', url.toString());
  };

  const closePublicLegalPage = () => {
    setPublicLegalPage(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    url.searchParams.delete('privacy');
    url.searchParams.delete('terms');
    if (url.hash === '#privacy' || url.hash === '#terms') {
      url.hash = '';
    }
    url.pathname = getBasePathname(url.pathname);
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const isStudent = params.get('portal') === 'student' || 
                        params.get('role') === 'student' || 
                        window.location.hash === '#student';
      setIsStudentUrl(isStudent);
      setPublicLegalPage(getPublicLegalPageFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  return (
    <AppProvider>
      <div className="fixed inset-0 w-full h-full h-[100dvh] overflow-hidden bg-background">
        {publicLegalPage === 'privacy' ? (
          <div className="h-full w-full overflow-y-auto">
            <PrivacyPolicyPage
              onBack={closePublicLegalPage}
              onOpenTerms={() => openPublicLegalPage('terms')}
            />
          </div>
        ) : publicLegalPage === 'terms' ? (
          <div className="h-full w-full overflow-y-auto">
            <TermsOfServicePage
              onBack={closePublicLegalPage}
              onOpenPrivacy={() => openPublicLegalPage('privacy')}
            />
          </div>
        ) : isAuthenticated || isStudentUrl ? (
          <AppContent
            onOpenPrivacy={() => openPublicLegalPage('privacy')}
            onOpenTerms={() => openPublicLegalPage('terms')}
          />
        ) : (
          <div className="h-full w-full overflow-y-auto">
            <LoginGate
              onSuccess={() => setIsAuthenticated(true)}
              onOpenPrivacy={() => openPublicLegalPage('privacy')}
              onOpenTerms={() => openPublicLegalPage('terms')}
            />
          </div>
        )}
      </div>
    </AppProvider>
  );
}
