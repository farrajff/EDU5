import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService, AppState } from '../lib/storageService';
import { applyTheme } from '../lib/themeService';

interface AppContextType {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  syncData: () => Promise<boolean>;
  syncInProgress: boolean;
  isConnected: boolean;
  reconnectAndLoad: () => Promise<void>;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
}

const defaultState: AppState = {
  students: [
    { id: '#ST101', name: 'عبدالرحمن محمد الفارس', class: 'العاشر - أ', status: 'active' },
    { id: '#ST102', name: 'سلطان عبدالله العتيبي', class: 'العاشر - أ', status: 'active' },
    { id: '#ST103', name: 'خالد بن فهد القحطاني', class: 'العاشر - ب', status: 'active' },
    { id: '#ST104', name: 'ريان منصور الحربي', class: 'التاسع - ج', status: 'active' },
  ],
  classes: [
    'العاشر - أ',
    'العاشر - ب',
    'التاسع - ج',
    'أرشيف 2023',
    'أرشيف 2024'
  ],
  homework: [],
  performanceTasks: [],
  attendance: [],
  permits: [],
  grades: [],
  currentSemester: '1',
  currentPeriod: '1',
  selectedClass: 'الكل',
  themeColor: 'indigo',
  customThemeHex: '#4F46E5',
  darkMode: false,
  navigationLayout: 'sidebar',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const deduplicateStudents = (studentsList: any[]) => {
  const uniqueMap = new Map();
  (studentsList || []).forEach(s => {
    if (s && s.id) {
      const idStr = String(s.id).trim();
      if (!uniqueMap.has(idStr)) {
        uniqueMap.set(idStr, s);
      }
    }
  });
  return Array.from(uniqueMap.values());
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const local = localStorage.getItem('atelier_state');
    const parsed = local ? JSON.parse(local) : defaultState;
    const mergedAndCleaned = {
      ...defaultState,
      ...parsed,
      currentSemester: parsed.currentSemester || '1',
      currentPeriod: parsed.currentPeriod || '1',
      selectedClass: parsed.selectedClass || 'الكل',
      themeColor: parsed.themeColor || 'indigo',
      customThemeHex: parsed.customThemeHex || '#4F46E5',
      darkMode: !!parsed.darkMode,
      navigationLayout: (parsed.navigationLayout === 'bottom' ? 'bottom' : 'sidebar') as 'sidebar' | 'bottom',
      hideAbsenceCalendarInStudentPortal: !!parsed.hideAbsenceCalendarInStudentPortal,
      hideOralExam: !!parsed.hideOralExam,
    };
    mergedAndCleaned.students = deduplicateStudents(mergedAndCleaned.students);
    return mergedAndCleaned;
  });
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Apply theme and dark mode dynamically to root
  useEffect(() => {
    applyTheme(state.themeColor || 'indigo', state.customThemeHex, !!state.darkMode);
  }, [state.themeColor, state.customThemeHex, state.darkMode]);

  useEffect(() => {
    const init = async () => {
      await checkConnection();
      await loadFromCloud();
    };
    init();
  }, []);

  // Thursday leaves/permits reset logic
  useEffect(() => {
    if (!state) return;

    // Calculate last Thursday 12:00 PM
    const getLastThursday12PM = (): Date => {
      const now = new Date();
      const resultDate = new Date(now);
      const currentDay = resultDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 4 is Thursday
      
      let diffDays = currentDay - 4;
      if (diffDays < 0) {
        diffDays += 7;
      }
      
      resultDate.setDate(resultDate.getDate() - diffDays);
      resultDate.setHours(12, 0, 0, 0);
      
      // If today is Thursday but before 12 PM, then the last Thursday 12 PM was 7 days ago
      if (currentDay === 4 && now.getTime() < resultDate.getTime()) {
        resultDate.setDate(resultDate.getDate() - 7);
      }
      return resultDate;
    };

    const lastThursday = getLastThursday12PM();
    const lastReset = state.lastLeavesResetTime ? new Date(state.lastLeavesResetTime) : new Date(0);

    if (lastReset.getTime() < lastThursday.getTime()) {
      // Need to reset leave statuses to 'present' in the attendance records
      const updatedAttendance = (state.attendance || []).map(a => {
        if (['restroom', 'with_deputy', 'with_counselor'].includes(a.status)) {
          return { ...a, status: 'present' };
        }
        return a;
      });

      // Update state
      updateState({
        attendance: updatedAttendance,
        lastLeavesResetTime: new Date().toISOString()
      });
      console.log('Automated reset of permission/leave records executed successfully.');
    }
  }, [state.attendance, state.lastLeavesResetTime]);

  // Auto-sync effect with debounce
  useEffect(() => {
    if (!state) return;

    const timeoutId = setTimeout(async () => {
      // Always write state changes to local file cache automatically for student portal fallback
      try {
        await storageService.saveToLocalCache(state);
      } catch (error) {
        console.error('Local cache sync failed:', error);
      }

      // Also sync to Google Drive in background if configured and connected
      if (isConnected) {
        setSyncInProgress(true);
        try {
          await storageService.syncToDrive(state);
        } catch (error) {
          console.error('Auto-sync failed:', error);
        } finally {
          setSyncInProgress(false);
        }
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [state, isConnected]);

  const checkConnection = async () => {
    const connected = await storageService.checkConnection();
    setIsConnected(connected);
  };

  const loadFromCloud = async () => {
    // 1. Always attempt loading from local disk cache which has public visibility (student portal fallback)
    try {
      const localCache = await storageService.loadFromLocalCache();
      if (localCache) {
        setState(prev => {
          const merged = { ...prev, ...localCache };
          merged.students = deduplicateStudents(merged.students);
          localStorage.setItem('atelier_state', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.warn('Local cache loading bypassed/uninitialized:', e);
    }

    // 2. Load from Google Drive if authorized
    try {
      if (isConnected) {
        const cloudState = await storageService.loadFromDrive();
        if (cloudState) {
          setState(prev => {
            const merged = { ...prev, ...cloudState };
            merged.students = deduplicateStudents(merged.students);
            localStorage.setItem('atelier_state', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (e) {
      console.error('Google authentication or drive loading failed:', e);
    }
  };

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      if (newState.students) {
        updated.students = deduplicateStudents(newState.students);
      }
      localStorage.setItem('atelier_state', JSON.stringify(updated));
      return updated;
    });
  };

  const reconnectAndLoad = async () => {
    const connected = await storageService.checkConnection();
    setIsConnected(connected);
    if (connected) {
      const cloudState = await storageService.loadFromDrive();
      if (cloudState) {
        setState(prev => {
          const merged = { ...prev, ...cloudState };
          merged.students = deduplicateStudents(merged.students);
          localStorage.setItem('atelier_state', JSON.stringify(merged));
          return merged;
        });
      }
    }
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      await storageService.connect();
      await reconnectAndLoad();
      return true;
    } catch (e) {
      console.error('Connection failed:', e);
      return false;
    }
  };

  const disconnectGoogle = async () => {
    await storageService.disconnect();
    setIsConnected(false);
  };

  const syncData = async (): Promise<boolean> => {
    setSyncInProgress(true);
    try {
      // 1. Always save locally immediately
      await storageService.saveToLocalCache(state);

      // 2. Check Google connection
      let connected = await storageService.checkConnection();
      if (!connected) {
        // If user manually initiated sync, offer to connect
        try {
          await storageService.connect();
          connected = await storageService.checkConnection();
          setIsConnected(connected);
        } catch (connErr) {
          console.warn('Google connect prompt was dismissed or failed:', connErr);
          return false;
        }
      }

      if (connected) {
        const success = await storageService.syncToDrive(state);
        setIsConnected(await storageService.checkConnection());
        return success;
      }
      return false;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      updateState, 
      syncData, 
      syncInProgress, 
      isConnected, 
      reconnectAndLoad,
      connectGoogle,
      disconnectGoogle
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
