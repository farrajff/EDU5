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
let cachedTokenExpiresAt: number = 0;
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
  if (cachedAccessToken && cachedTokenExpiresAt && Date.now() < cachedTokenExpiresAt) {
    return cachedAccessToken;
  }

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
    if (!token) {
      cachedAccessToken = null;
      return null;
    }

    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() > expiresAt) {
        // Expired
        clearStoredGoogleAuth();
        return null;
      }
      cachedTokenExpiresAt = expiresAt;
    }
    cachedAccessToken = token;
    return token;
  } catch {
    return null;
  }
};

/**
 * Attempt silent token refresh via GIS if user previously signed in
 */
export const refreshGoogleTokenSilently = async (): Promise<string | null> => {
  const existing = getStoredGoogleToken();
  if (existing) return existing;

  const user = getStoredGoogleUser();
  if (!user?.email) return null;

  try {
    await ensureGoogleScriptLoaded();
    const clientId = firebaseConfig.oAuthClientId;
    const google = (window as any).google;
    if (!clientId || !google?.accounts?.oauth2) return null;

    return await new Promise<string | null>((resolve) => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          hint: user.email,
          prompt: '',
          callback: (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              const token = tokenResponse.access_token;
              const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600;
              const expiresAt = Date.now() + (expiresIn - 60) * 1000;

              cachedAccessToken = token;
              cachedTokenExpiresAt = expiresAt;

              localStorage.setItem(TOKEN_KEY, token);
              localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
              localStorage.setItem('gdrive_connected', 'true');

              // Sync with server proxy
              try {
                fetch('/api/storage/connect', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ accessToken: token, expiresIn }),
                }).catch(() => {});
              } catch {}

              resolve(token);
            } else {
              resolve(null);
            }
          },
          error_callback: () => resolve(null)
        });
        client.requestAccessToken({ prompt: '' });
      } catch {
        resolve(null);
      }
    });
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
  cachedTokenExpiresAt = 0;
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
    // 1. Primary path: Firebase Auth Popup
    // Since the user added farrajff.github.io to Firebase Console Authorized Domains,
    // Firebase Auth popup uses gen-lang-client-0270287581.firebaseapp.com and completely avoids
    // Google Cloud Console origin_mismatch 400 errors!
    if (auth) {
      try {
        console.log('[Google Auth] Initiating Firebase Auth Google popup with Drive scope...');
        const loginProvider = new GoogleAuthProvider();
        loginProvider.addScope('https://www.googleapis.com/auth/drive.file');
        loginProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
        loginProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        loginProvider.setCustomParameters({ prompt: 'select_account' });

        const popupResult = await signInWithPopup(auth, loginProvider);
        const user = popupResult.user;
        const credential = GoogleAuthProvider.credentialFromResult(popupResult);
        const accessToken = credential?.accessToken || null;

        if (accessToken) {
          cachedAccessToken = accessToken;
          const expiresAt = Date.now() + 3500 * 1000;
          cachedTokenExpiresAt = expiresAt;
          localStorage.setItem(TOKEN_KEY, accessToken);
          localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
          localStorage.setItem('gdrive_connected', 'true');
        }

        const userSummary: GoogleUserInfo = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'المعلم',
          email: user.email || '',
          photoURL: user.photoURL || ''
        };

        try {
          localStorage.setItem(USER_KEY, JSON.stringify(userSummary));
          sessionStorage.setItem('authUser', JSON.stringify(userSummary));
        } catch {}

        // Best effort: register with server proxy if available
        if (accessToken) {
          try {
            fetch('/api/storage/connect', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
              },
              body: JSON.stringify({ accessToken }),
            }).catch(() => {});
          } catch {}
        }

        console.log('[Google Auth] Firebase Auth sign-in successful for:', userSummary.email);
        return {
          user: userSummary,
          accessToken,
          driveConnected: !!accessToken
        };
      } catch (popupErr: any) {
        console.warn('[Google Auth] Firebase popup encountered an issue, checking fallback:', popupErr);
        if (popupErr?.code === 'auth/popup-closed-by-user') {
          throw new Error('تم إغلاق نافذة تسجيل الدخول من قبل المستخدم');
        }
        // If Firebase Auth threw an error other than user closing the popup, continue to GIS
      }
    }

    // 2. Secondary path: Direct Google Identity Services (GIS)
    const result = await signInWithGoogleOAuthDirect();
    return result;
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
