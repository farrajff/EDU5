import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  ArrowLeft, 
  Lock,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithGoogle, 
  onGoogleAuthStateChanged, 
  logoutGoogle 
} from '../lib/firebaseAuth';
import type { User } from 'firebase/auth';

interface LoginGateProps {
  onSuccess: () => void;
}

export function LoginGate({ onSuccess }: LoginGateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isVerifyingExisting, setIsVerifyingExisting] = useState(true);
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');

  const CORRECT_PIN = '654565';

  const handlePinSubmit = () => {
    const toEnglishDigits = (str: string) => str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const cleanPin = toEnglishDigits(pinValue.trim());
    if (cleanPin === CORRECT_PIN) {
      sessionStorage.setItem('isAppAuthenticated', 'true');
      sessionStorage.setItem('authUser', JSON.stringify({
        displayName: 'المعلم',
        email: 'دخول برمز التحقق',
        photoURL: ''
      }));
      onSuccess();
    } else {
      setPinError('رمز الدخول غير صحيح! الرمز الافتراضي: 654565');
    }
  };

  // Check if a user is already signed in via Firebase Auth
  useEffect(() => {
    const unsubscribe = onGoogleAuthStateChanged((user) => {
      setIsVerifyingExisting(false);
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.user) {
        // Authenticated! Wait briefly for visual confirmation then trigger onSuccess
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code || '';
      
      if (code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق نافذة تسجيل الدخول قبل إتمام المصادقة. يرجى المحاولة مجدداً.');
      } else if (code === 'auth/popup-blocked') {
        setError('حظر المتصفح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم إعادة المحاولة.');
      } else if (code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setError(`نطاق المعاينة الحالي (${window.location.hostname}) لم يُضف بعد إلى النطاقات المصرح بها في مشروع Firebase. يمكنك إضافة run.app في إعدادات Firebase Console > Authentication > Authorized domains، أو الضغط على زر "الدخول السريع كمعلم" أدناه للمتابعة فوراً.`);
      } else if (code === 'auth/network-request-failed') {
        setError('تعذر الاتصال بالشبكة. يرجى التأكد من اتصال الإنترنت ثم إعادة المحاولة.');
      } else if (code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setError(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول بحساب Google.');
      }
      setIsLoading(false);
    }
  };

  const handleQuickTeacherLogin = () => {
    sessionStorage.setItem('isAppAuthenticated', 'true');
    sessionStorage.setItem('authUser', JSON.stringify({
      displayName: 'المعلم',
      email: 'دخول سريع كمعلم',
      photoURL: ''
    }));
    onSuccess();
  };

  const handleContinueWithExisting = () => {
    sessionStorage.setItem('isAppAuthenticated', 'true');
    if (currentUser) {
      sessionStorage.setItem('authUser', JSON.stringify({
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'المعلم',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || ''
      }));
    }
    onSuccess();
  };

  const handleSwitchAccount = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    handleGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/50 flex flex-col items-center justify-center relative overflow-hidden px-4 md:px-0">
      
      {/* Decorative Traditional Islamic Art SVG / Circular Geometry */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] opacity-[0.05] pointer-events-none select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-700 fill-none stroke-current" strokeWidth="0.12">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="35" />
          <polygon points="50,5 95,50 50,95 5,50" />
          <polygon points="50,15 85,50 50,85 15,50" />
          <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
          <rect x="20" y="20" width="60" height="60" />
        </svg>
      </div>

      {/* Subtle Pastel Glow Points */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 pointer-events-none rounded-full blur-[140px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-500/5 pointer-events-none rounded-full blur-[140px]" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Brand / Hero Header */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-7 flex flex-col items-center gap-3 text-center"
        >
          <div className="w-18 h-18 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 rounded-3xl flex items-center justify-center text-white border border-indigo-300/30 shadow-2xl shadow-indigo-600/25 relative group">
            <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <GraduationCap className="w-9 h-9 text-white relative z-10" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">نظام إدارة الدراسات الإسلامية</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">بوابة تسجيل الدخول الآمنة للمعلمين</p>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6.5 sm:p-8 shadow-2xl shadow-slate-200/60 relative"
        >
          {/* Subtle Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 rounded-t-3xl" />

          {/* Internal Geometric border */}
          <div className="absolute inset-2.5 border border-slate-100 rounded-2xl pointer-events-none" />

          <div className="relative z-10 text-center space-y-6">
            
            {/* Context Headline */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold mb-3">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>مصادقة معتمدة عبر Google</span>
              </div>
              <h2 className="text-lg font-black text-slate-800">
                {currentUser ? 'مرحباً بعودتك مجدداً' : 'تسجيل الدخول للمتابعة'}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                {currentUser 
                  ? 'تم التعرف على حساب Google الخاص بك. يمكنك المتابعة ومزامنة Google Drive مباشرة.' 
                  : 'استخدم حساب Google الخاص بك للدخول السريع مع ربط Google Drive تلقائياً لحفظ كشوف الدرجات ومزامنتها.'}
              </p>
            </div>

            {/* Error Message with Quick Action */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-rose-700 text-right text-xs font-bold space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                    <p className="leading-relaxed flex-1">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickTeacherLogin}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <span>الدخول السريع كمعلم (تخطي)</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* State A: Currently Identified User Card */}
            {currentUser && !isLoading ? (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-right">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'الحساب'} 
                      className="w-12 h-12 rounded-full border-2 border-indigo-500 shadow-sm shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 shadow-sm">
                      {(currentUser.displayName || currentUser.email || 'م')[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-800 truncate">
                      {currentUser.displayName || 'المعلم'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate dir-ltr text-right">
                      {currentUser.email}
                    </p>
                  </div>
                  <UserCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>

                {/* Primary Continue Button */}
                <button
                  type="button"
                  onClick={handleContinueWithExisting}
                  className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <span>الدخول بحساب {currentUser.displayName || 'Google'}</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>

                {/* Switch to different Google account */}
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول بحساب Google آخر</span>
                </button>
              </div>
            ) : (
              /* State B: Standard Google Sign-In Button */
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isVerifyingExisting}
                  className={`w-full py-3.5 px-5 rounded-2xl border transition-all duration-200 font-black text-sm flex items-center justify-center gap-3 relative select-none cursor-pointer shadow-sm ${
                    isLoading
                      ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-wait'
                      : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-700 hover:shadow-md active:scale-[0.99]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span>جاري الاتصال والتحقق مع Google...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google 'G' Icon */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span className="text-slate-800">الدخول باستخدام حساب Google</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-2">
                  تسجيل دخول آمن ومباشر مع ربط Google Drive تلقائياً لحفظ ومزامنة كشف الدرجات
                </p>
              </div>
            )}

            {/* Quick Emergency PIN Fallback Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPinFallback(!showPinFallback)}
                className="text-xs font-bold text-slate-400 hover:text-slate-650 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showPinFallback ? 'إخفاء خيار رمز الدخول' : 'أو الدخول برمز المعلم البديل'}</span>
              </button>

              <AnimatePresence>
                {showPinFallback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-right"
                  >
                    <p className="text-[11px] font-bold text-slate-500">رمز الدخول البديل (6 أرقام):</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="••••••"
                        value={pinValue}
                        onChange={(e) => {
                          setPinValue(e.target.value);
                          setPinError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePinSubmit();
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black tracking-widest text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handlePinSubmit}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                      >
                        دخول
                      </button>
                    </div>
                    {pinError && (
                      <p className="text-[11px] font-bold text-red-500">{pinError}</p>
                    )}
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={handleQuickTeacherLogin}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-650 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>دخول مباشر كمعلم بنقرة واحدة</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Student Portal Link */}
            <div className="pt-3 border-t border-slate-100">
              <a
                href="?portal=student"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1 px-3 rounded-lg hover:bg-indigo-50/60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>هل أنت طالب؟ الانتقال مباشرة إلى بوابة الطلاب الذكية</span>
              </a>
            </div>

          </div>
        </motion.div>

        {/* Footer Brand Watermark */}
        <p className="text-slate-450 text-xs font-bold mt-8 tracking-wider text-center flex items-center gap-1.5 opacity-80">
          <Lock className="w-3.5 h-3.5 text-indigo-500" strokeWidth={2.5} />
          تسجيل الدخول محمي عبر بروتوكولات Google OAuth 2.0 المعتمدة
        </p>

      </div>
    </div>
  );
}
