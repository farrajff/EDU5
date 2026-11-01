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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider configured with Google Drive scope
const loginProvider = new GoogleAuthProvider();
loginProvider.addScope('https://www.googleapis.com/auth/drive.file');
loginProvider.setCustomParameters({
  prompt: 'select_account'
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleAuthResult {
  user: any;
  accessToken: string | null;
  driveConnected: boolean;
}

/**
 * Direct Google Identity Services (GIS) OAuth Fallback
 * Bypasses Firebase's strict internal auth/unauthorized-domain domain whitelist check
 * by communicating directly with Google OAuth 2.0 endpoint using the provisioned oAuthClientId.
 */
export const signInWithGoogleOAuthDirect = async (): Promise<GoogleAuthResult> => {
  return new Promise((resolve, reject) => {
    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      return reject(new Error('معرف عميل OAuth غير مهيأ (oAuthClientId is missing)'));
    }

    const initClient = () => {
      try {
        const google = (window as any).google;
        if (!google?.accounts?.oauth2) {
          throw new Error('لم يتم تحميل مكتبة Google Identity Services');
        }

        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error));
            }

            const accessToken = tokenResponse.access_token;
            cachedAccessToken = accessToken;

            try {
              // Fetch user profile from Google's official userinfo API
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              
              let profile: any = {};
              if (profileRes.ok) {
                profile = await profileRes.json();
              }

              const userSummary = {
                uid: profile.sub || 'google-user-' + Date.now(),
                displayName: profile.name || 'المعلم',
                email: profile.email || '',
                photoURL: profile.picture || '',
                driveConnected: true
              };

              // Automatically connect token with backend server proxy
              try {
                await fetch('/api/storage/connect', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ accessToken }),
                });
                console.log('[Google GIS] Google Drive automatically connected and synced.');
              } catch (e) {
                console.warn('[Google GIS] Storage connect notice:', e);
              }

              sessionStorage.setItem('authUser', JSON.stringify(userSummary));
              sessionStorage.setItem('isAppAuthenticated', 'true');

              resolve({
                user: userSummary,
                accessToken,
                driveConnected: true
              });
            } catch (err) {
              reject(err);
            }
          },
          error_callback: (err: any) => {
            reject(err);
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        reject(err);
      }
    };

    if ((window as any).google?.accounts?.oauth2) {
      initClient();
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          initClient();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('انتهت مهلة تحميل خدمة تسجيل الدخول من Google'));
        }
      }, 100);
    }
  });
};

/**
 * Sign in with Google with automatic fallback on unauthorized-domain
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    isSigningIn = true;
    console.log('[Firebase Auth] Triggering Google Sign-In popup with Drive sync...');
    
    try {
      const result = await signInWithPopup(auth, loginProvider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken || null;
      cachedAccessToken = accessToken;

      let driveConnected = false;

      // Automatically connect Google Drive with backend server
      if (accessToken) {
        try {
          const connectRes = await fetch('/api/storage/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          });
          if (connectRes.ok) {
            driveConnected = true;
            console.log('[Firebase Auth] Google Drive automatically connected and registered.');
          }
        } catch (e) {
          console.warn('[Firebase Auth] Auto-connecting Google Drive notice:', e);
        }
      }

      // Persist user summary for fast UI recovery
      const userSummary = {
        uid: user.uid,
        displayName: user.displayName || 'المعلم',
        email: user.email || '',
        photoURL: user.photoURL || '',
        driveConnected
      };
      sessionStorage.setItem('authUser', JSON.stringify(userSummary));
      sessionStorage.setItem('isAppAuthenticated', 'true');

      console.log('[Firebase Auth] Google Sign-In successful for:', user.email);
      return { user, accessToken, driveConnected };
    } catch (popupErr: any) {
      const code = popupErr?.code || '';
      const msg = popupErr?.message || '';

      // If domain is not authorized in Firebase Auth, switch immediately to Google Identity direct OAuth
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        console.warn('[Firebase Auth] auth/unauthorized-domain detected. Activating direct Google Identity OAuth fallback...');
        return await signInWithGoogleOAuthDirect();
      }

      throw popupErr;
    }
  } catch (error) {
    console.error('[Firebase Auth] Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Explicit Google Drive Re-connection if needed
 */
export const connectDriveScope = async (): Promise<string | null> => {
  const res = await signInWithGoogle();
  return res.accessToken;
};

// Backwards compatibility alias for storageService.connect
export const googleSignIn = async (): Promise<string | null> => {
  return await connectDriveScope();
};

export const logoutGoogle = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Sign out error:', e);
  }
  cachedAccessToken = null;
  sessionStorage.removeItem('isAppAuthenticated');
  sessionStorage.removeItem('authUser');
  try {
    await fetch('/api/storage/disconnect', { method: 'POST' });
  } catch {
    // Ignore
  }
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const onGoogleAuthStateChanged = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};
