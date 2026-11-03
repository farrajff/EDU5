import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
let authInstance: any = null;

try {
  if (firebaseConfig && (firebaseConfig as any).apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  }
} catch (err) {
  console.warn('[Firebase Auth] Initialization skipped or failed:', err);
}

export const auth = authInstance;

// Storage keys for persisting Google Drive authentication locally
const TOKEN_KEY = 'gdrive_access_token';
const EXPIRES_AT_KEY = 'gdrive_token_expires_at';
const USER_KEY = 'gdrive_user';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleUserInfo {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface GoogleAuthResult {
  user: GoogleUserInfo;
  accessToken: string | null;
  driveConnected: boolean;
}

/**
 * Dynamically ensure Google Identity Services script is loaded in DOM
 */
export const ensureGoogleScriptLoaded = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    if (typeof document !== 'undefined') {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
          console.warn('[GSI] Script loading failed, falling back to polling.');
          resolve();
        };
        document.head.appendChild(script);
      } else {
        existing.addEventListener('load', () => resolve());
      }
    }

    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      if ((window as any).google?.accounts?.oauth2 || checks > 40) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
};

/**
 * Get locally stored active Google OAuth token if not expired
 */
export const getStoredGoogleToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
    if (!token) return null;

    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() > expiresAt) {
        // Expired
        clearStoredGoogleAuth();
        return null;
      }
    }
    cachedAccessToken = token;
    return token;
  } catch {
    return null;
  }
};

/**
 * Get locally stored Google user info
 */
export const getStoredGoogleUser = (): GoogleUserInfo | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Clear stored Google authentication tokens
 */
export const clearStoredGoogleAuth = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('gdrive_connected');
    sessionStorage.removeItem('authUser');
  } catch {
    // Ignore
  }
};

/**
 * Direct Google Identity Services (GIS) OAuth flow.
 * Works seamlessly across all client domains (GitHub Pages, localhost, Cloud Run preview)
 * without triggering Firebase auth/unauthorized-domain restrictions.
 */
export const signInWithGoogleOAuthDirect = async (): Promise<GoogleAuthResult> => {
  await ensureGoogleScriptLoaded();

  return new Promise((resolve, reject) => {
    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      return reject(new Error('معرف عميل OAuth غير مهيأ (oAuthClientId is missing)'));
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return reject(new Error('تعذر تحميل مكتبة Google Identity Services. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.'));
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('[Google GIS] Token error:', tokenResponse);
            return reject(new Error(tokenResponse.error_description || tokenResponse.error || 'فشل الحصول على تصريح الوصول من Google'));
          }

          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            return reject(new Error('لم يتم استلام رمز الوصول من Google'));
          }

          cachedAccessToken = accessToken;
          const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600;
          const expiresAt = Date.now() + (expiresIn - 60) * 1000;

          // Save token to localStorage for persistent sessions
          try {
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
            localStorage.setItem('gdrive_connected', 'true');
          } catch (e) {
            console.warn('Failed to save token to localStorage:', e);
          }

          let profile: any = {};
          try {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (profileRes.ok) {
              profile = await profileRes.json();
            }
          } catch (e) {
            console.warn('[Google GIS] Could not fetch user profile:', e);
          }

          const userSummary: GoogleUserInfo = {
            uid: profile.sub || 'google-user-' + Date.now(),
            displayName: profile.name || 'حساب Google',
            email: profile.email || '',
            photoURL: profile.picture || ''
          };

          try {
            localStorage.setItem(USER_KEY, JSON.stringify(userSummary));
            sessionStorage.setItem('authUser', JSON.stringify(userSummary));
          } catch {
            // Ignore
          }

          // Register with server proxy if available (best-effort, non-blocking)
          try {
            fetch('/api/storage/connect', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
              },
              body: JSON.stringify({ accessToken }),
            }).catch(() => {});
          } catch {
            // Ignore server proxy errors on static hosts
          }

          console.log('[Google GIS] Sign-in successful for:', userSummary.email);
          resolve({
            user: userSummary,
            accessToken,
            driveConnected: true
          });
        },
        error_callback: (err: any) => {
          console.error('[Google GIS] Client error:', err);
          reject(new Error(err?.message || 'تم إغلاق نافذة المصادقة'));
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Sign in with Google with Drive scope
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  if (isSigningIn) {
    throw new Error('عملية تسجيل الدخول قيد التنفيذ بالفعل');
  }

  isSigningIn = true;
  try {
    // Primary path: Direct Google Identity Services (GIS)
    // Ensures flawless authentication on GitHub Pages and custom preview hosts
    const result = await signInWithGoogleOAuthDirect();
    return result;
  } catch (error: any) {
    console.warn('[Google Auth] GIS primary flow encountered an issue, trying fallback:', error);

    // Fallback: Try Firebase Popup if available and not blocked
    if (auth) {
      try {
        const loginProvider = new GoogleAuthProvider();
        loginProvider.addScope('https://www.googleapis.com/auth/drive.file');
        const popupResult = await signInWithPopup(auth, loginProvider);
        const user = popupResult.user;
        const credential = GoogleAuthProvider.credentialFromResult(popupResult);
        const accessToken = credential?.accessToken || null;

        if (accessToken) {
          cachedAccessToken = accessToken;
          const expiresAt = Date.now() + 3500 * 1000;
          localStorage.setItem(TOKEN_KEY, accessToken);
          localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
          localStorage.setItem('gdrive_connected', 'true');
        }

        const userSummary: GoogleUserInfo = {
          uid: user.uid,
          displayName: user.displayName || 'المعلم',
          email: user.email || '',
          photoURL: user.photoURL || ''
        };

        localStorage.setItem(USER_KEY, JSON.stringify(userSummary));
        return {
          user: userSummary,
          accessToken,
          driveConnected: !!accessToken
        };
      } catch (popupErr: any) {
        console.error('[Google Auth] Fallback popup error:', popupErr);
      }
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Explicit Google Drive connection trigger
 */
export const connectDriveScope = async (): Promise<string | null> => {
  const res = await signInWithGoogle();
  return res.accessToken;
};

export const googleSignIn = async (): Promise<string | null> => {
  return await connectDriveScope();
};

export const logoutGoogle = async (): Promise<void> => {
  clearStoredGoogleAuth();

  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
  }

  try {
    fetch('/api/storage/disconnect', { method: 'POST' }).catch(() => {});
  } catch {
    // Ignore
  }
};

export const getCurrentGoogleUser = (): User | null => {
  return auth?.currentUser || null;
};

export const onGoogleAuthStateChanged = (
  callback: (user: User | null) => void
) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
