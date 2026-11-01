/**
 * Academic Atelier - Google Drive Storage Service
 */
import { googleSignIn, logoutGoogle } from './firebaseAuth';

export interface AppState {
  students: any[];
  classes: any[];
  homework: any[];
  performanceTasks?: any[];
  attendance: any[];
  permits: any[];
  grades: any[];
  currentSemester?: string;
  currentPeriod?: string;
  selectedClass?: string;
  lastLeavesResetTime?: string;
  searchedStudentIds?: string[];
  hideAbsenceCalendarInStudentPortal?: boolean;
  hideOralExam?: boolean;
  themeColor?: string;
  customThemeHex?: string;
  darkMode?: boolean;
  navigationLayout?: 'sidebar' | 'bottom';
  negligenceHeaders?: {
    mainTitle?: string;
    col1?: string;
    col2?: string;
    col3?: string;
  };
  [key: string]: any;
}

export const storageService = {
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/storage/check');
      const data = await response.json();
      return !!data.connected;
    } catch (error) {
      console.error('Storage check failed:', error);
      return false;
    }
  },

  async syncToDrive(state: AppState): Promise<boolean> {
    try {
      const response = await fetch('/api/storage/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      return response.ok;
    } catch (error) {
      console.error('Sync to Drive failed:', error);
      return false;
    }
  },

  async saveToLocalCache(state: AppState): Promise<boolean> {
    try {
      const response = await fetch('/api/storage/local-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      return response.ok;
    } catch (error) {
      console.error('Save to local cache failed:', error);
      return false;
    }
  },

  async loadFromLocalCache(): Promise<AppState | null> {
    try {
      const response = await fetch('/api/storage/local-cache');
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Load from local cache failed:', error);
      return null;
    }
  },

  async loadFromDrive(): Promise<AppState | null> {
    try {
      const response = await fetch('/api/storage/load');
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Load from Drive failed:', error);
      return null;
    }
  },

  async connect(): Promise<void> {
    try {
      // 1. Trigger the Firebase popup sign-in
      const token = await googleSignIn();
      if (!token) {
        throw new Error('Could not retrieve access token');
      }

      // 2. Post the token to our server to register/save in cookie
      const response = await fetch('/api/storage/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      if (!response.ok) {
        throw new Error('Server registration of Google access token failed');
      }

      console.log('[Storage Service] Connection completed successfully.');
    } catch (error) {
      console.error('[Storage Service] Connect error:', error);
      throw error;
    }
  },

  async disconnect(): Promise<void> {
    try {
      await logoutGoogle();
      await fetch('/api/storage/disconnect', { method: 'POST' });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }
};
