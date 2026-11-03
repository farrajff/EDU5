/**
 * Academic Atelier - Google Drive Storage Service
 * Provides client-side direct Google Drive synchronization (working on GitHub Pages and static sites)
 * as well as server-side proxy synchronization when running with the full-stack server.
 */
import { 
  googleSignIn, 
  logoutGoogle, 
  getStoredGoogleToken, 
  getStoredGoogleUser,
  clearStoredGoogleAuth,
  refreshGoogleTokenSilently,
  GoogleUserInfo
} from './firebaseAuth';

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

const FILE_NAME = 'AcademicAtelierData.json';

export const storageService = {
  /**
   * Check whether Google Drive is connected and authenticated
   */
  async checkConnection(): Promise<boolean> {
    // 1. Check local client-side token first
    let clientToken = getStoredGoogleToken();
    if (!clientToken) {
      clientToken = await refreshGoogleTokenSilently();
    }
    if (clientToken) {
      return true;
    }

    // 2. Check server proxy cookie if available
    try {
      const response = await fetch('/api/storage/check');
      if (response.ok) {
        const data = await response.json();
        return !!data.connected;
      }
    } catch {
      // Backend not running (e.g. GitHub Pages)
    }

    return false;
  },

  /**
   * Get current Google User profile
   */
  getGoogleUser(): GoogleUserInfo | null {
    return getStoredGoogleUser();
  },

  /**
   * Upload state directly to Google Drive via v3 REST API
   */
  async directDriveUpload(token: string, state: AppState): Promise<boolean> {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name = '${FILE_NAME}' and trashed = false`
    )}&fields=${encodeURIComponent('files(id, name, modifiedTime)')}`;

    let searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.status === 401) {
      // Try silent refresh once
      const refreshed = await refreshGoogleTokenSilently();
      if (refreshed) {
        token = refreshed;
        searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    }

    if (searchRes.status === 401) {
      clearStoredGoogleAuth();
      throw new Error('Google access token expired');
    }

    if (!searchRes.ok) {
      throw new Error(`Google Drive search failed: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    const existingFileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;
    const jsonContent = JSON.stringify(state, null, 2);

    if (existingFileId) {
      // Update existing file content
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: jsonContent,
        }
      );

      if (updateRes.ok) {
        return true;
      }

      if (updateRes.status === 401) {
        clearStoredGoogleAuth();
        throw new Error('Google access token expired');
      }

      console.warn(`Drive PATCH failed with status ${updateRes.status}, falling back to create...`);
    }

    // Create new file
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
      description: 'بيانات وكشوف درجات مدرسة الدراسات الإسلامية - حفظ تلقائي',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      closeDelim;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (createRes.status === 401) {
      clearStoredGoogleAuth();
      throw new Error('Google access token expired');
    }

    if (!createRes.ok) {
      throw new Error(`Google Drive file creation failed: ${createRes.status}`);
    }
    return true;
  },

  /**
   * Synchronize application state to Google Drive
   */
  async syncToDrive(state: AppState): Promise<boolean> {
    // 1. Always update local storage first as safe fallback
    try {
      localStorage.setItem('atelier_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Local storage write warning:', e);
    }

    // 2. Always persist to local cache endpoint (and Firestore)
    this.saveToLocalCache(state).catch(() => {});

    let synced = false;
    let token = getStoredGoogleToken();
    if (!token) {
      token = await refreshGoogleTokenSilently();
    }

    // 3. Direct client-side Google Drive sync
    if (token) {
      try {
        synced = await this.directDriveUpload(token, state);
        if (synced) {
          localStorage.setItem('gdrive_last_synced', new Date().toISOString());
          console.log('[Storage Service] Direct client-side Google Drive sync succeeded.');
          return true;
        }
      } catch (err: any) {
        console.warn('[Storage Service] Direct Drive upload encountered error:', err?.message || err);
        if (err?.message?.includes('expired') || err?.message?.includes('401')) {
          clearStoredGoogleAuth();
          return false;
        }
      }
    }

    // 4. Server proxy sync (only attempt if token is available)
    if (token) {
      try {
        const response = await fetch('/api/storage/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(state),
        });

        if (response.status === 401) {
          clearStoredGoogleAuth();
          return false;
        }

        if (response.ok) {
          synced = true;
          localStorage.setItem('gdrive_last_synced', new Date().toISOString());
        }
      } catch {
        // Backend not running (expected on GitHub Pages)
      }
    }

    return synced;
  },

  /**
   * Save to local cache file / browser storage
   */
  async saveToLocalCache(state: AppState): Promise<boolean> {
    try {
      localStorage.setItem('atelier_state', JSON.stringify(state));
    } catch (e) {
      console.warn('localStorage error:', e);
    }

    try {
      const response = await fetch('/api/storage/local-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      return response.ok;
    } catch {
      return true; // Local storage already saved
    }
  },

  /**
   * Load state from local disk cache or localStorage
   */
  async loadFromLocalCache(): Promise<AppState | null> {
    // 1. Try local server cache endpoint first if running
    try {
      const response = await fetch('/api/storage/local-cache');
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Ignore
    }

    // 2. Fallback to localStorage
    try {
      const raw = localStorage.getItem('atelier_state');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse state from localStorage:', e);
    }

    return null;
  },

  /**
   * Load state directly from Google Drive
   */
  async loadFromDrive(): Promise<AppState | null> {
    let token = getStoredGoogleToken();
    if (!token) {
      token = await refreshGoogleTokenSilently();
    }

    // 1. Direct client-side fetch from Google Drive REST API
    if (token) {
      try {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          `name = '${FILE_NAME}' and trashed = false`
        )}&fields=${encodeURIComponent('files(id, name, modifiedTime)')}`;

        const searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.files && searchData.files.length > 0) {
            const fileId = searchData.files[0].id;
            const loadRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            if (loadRes.status === 401) {
              clearStoredGoogleAuth();
              return null;
            }
            if (loadRes.ok) {
              const cloudState = await loadRes.json();
              console.log('[Storage Service] Successfully loaded state from Google Drive file:', fileId);
              return cloudState;
            }
          }
        } else if (searchRes.status === 401) {
          clearStoredGoogleAuth();
          return null;
        }
      } catch (err) {
        console.warn('[Storage Service] Direct Google Drive load error:', err);
      }
    }

    // 2. Server proxy load only if token is available
    if (token) {
      try {
        const response = await fetch('/api/storage/load', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 401) {
          clearStoredGoogleAuth();
          return null;
        }
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Backend not running
      }
    }

    return null;
  },

  /**
   * Trigger Google Drive connection flow
   */
  async connect(): Promise<void> {
    try {
      const token = await googleSignIn();
      if (!token) {
        throw new Error('لم يتم استلام رمز الوصول من Google');
      }

      console.log('[Storage Service] Google Drive connection established successfully.');
    } catch (error) {
      console.error('[Storage Service] Connect error:', error);
      throw error;
    }
  },

  /**
   * Disconnect from Google Drive
   */
  async disconnect(): Promise<void> {
    try {
      await logoutGoogle();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }
};
