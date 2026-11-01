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
// Now authorized under the verified app brand: "كشف الدرجات"
const loginProvider = new GoogleAuthProvider();
loginProvider.addScope('https://www.googleapis.com/auth/drive.file');
loginProvider.setCustomParameters({
  prompt: 'select_account'
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleAuthResult {
  user: User;
  accessToken: string | null;
  driveConnected: boolean;
}

/**
 * Sign in with Google and automatically connect Google Drive
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    isSigningIn = true;
    console.log('[Firebase Auth] Triggering Google Sign-In popup with Drive sync...');
    
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
    try {
      const userSummary = {
        uid: user.uid,
        displayName: user.displayName || 'المعلم',
        email: user.email || '',
        photoURL: user.photoURL || '',
        driveConnected
      };
      sessionStorage.setItem('authUser', JSON.stringify(userSummary));
      sessionStorage.setItem('isAppAuthenticated', 'true');
    } catch {
      // Ignore sessionStorage exceptions
    }

    console.log('[Firebase Auth] Google Sign-In successful for:', user.email);
    return { user, accessToken, driveConnected };
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
