import React, { useState, useRef, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginGateProps {
  onSuccess: () => void;
}

export function LoginGate({ onSuccess }: LoginGateProps) {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const CORRECT_PIN = '654565';

  const toEnglishDigits = (str: string): string => {
    return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handlePinCheck = (currentPin: string[]) => {
    const fullPin = toEnglishDigits(currentPin.join(''));
    if (fullPin.length === 6) {
      if (fullPin === CORRECT_PIN) {
        setError('');
        sessionStorage.setItem('isAppAuthenticated', 'true');
        onSuccess();
      } else {
        setIsShaking(true);
        setError('رمز الدخول غير صحيح! يرجى التحقق وإعادة المحاولة.');
        setAttempts((prev) => prev + 1);
        setTimeout(() => setIsShaking(false), 500);
        // Clear pin and focus first field
        setPin(Array(6).fill(''));
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    }
  };

  const handleChange = (index: number, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    if (!cleanValue) return;

    const newPin = [...pin];
    // Take the last character typed if multiple
    newPin[index] = cleanValue[cleanValue.length - 1];
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // If filled all, check PIN
    if (newPin.every((char) => char !== '')) {
      handlePinCheck(newPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '') {
        // Move back to previous input and clear it
        if (index > 0 && inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
          const newPin = [...pin];
          newPin[index - 1] = '';
          setPin(newPin);
        }
      } else {
        // Clear current value
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
      setError('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = toEnglishDigits(e.clipboardData.getData('text')).replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedText.length > 0) {
      const newPin = Array(6).fill('');
      for (let i = 0; i < pastedText.length; i++) {
        newPin[i] = pastedText[i];
      }
      setPin(newPin);
      if (pastedText.length === 6) {
        handlePinCheck(newPin);
      } else {
        const nextIndex = Math.min(5, pastedText.length);
        if (inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex].focus();
        }
      }
    }
  };

  const handleKeypadPress = (digit: string) => {
    const firstEmptyIndex = pin.indexOf('');
    if (firstEmptyIndex !== -1) {
      const newPin = [...pin];
      newPin[firstEmptyIndex] = digit;
      setPin(newPin);
      setError('');

      const nextIndex = Math.min(5, firstEmptyIndex + 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }

      if (newPin.every((char) => char !== '')) {
        handlePinCheck(newPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    let lastFilledIndex = -1;
    for (let i = 5; i >= 0; i--) {
      if (pin[i] !== '') {
        lastFilledIndex = i;
        break;
      }
    }

    if (lastFilledIndex !== -1) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = '';
      setPin(newPin);
      setError('');
      if (inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex].focus();
      }
    }
  };

  const handleKeypadClear = () => {
    setPin(Array(6).fill(''));
    setError('');
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/50 flex flex-col items-center justify-center relative overflow-hidden px-4 md:px-0">
      
      {/* Decorative Traditional Islamic Art SVG / Circular Geometry */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.06] pointer-events-none select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-600 fill-none stroke-current" strokeWidth="0.12">
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
        
        {/* Brand/Hero Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="mb-8 flex flex-col items-center gap-3 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white border border-indigo-400/20 shadow-xl shadow-indigo-500/20 relative group">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity" />
            <Lock className="w-7.5 h-7.5 text-white relative z-10" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">نظام إدارة الدراسات الإسلامية</h1>
            <p className="text-sm font-bold text-slate-500 mt-1.5 uppercase tracking-wide">بوابة تسجيل الدخول الآمنة</p>
          </div>
        </motion.div>

        {/* Lock Card Wrapper */}
        <motion.div
          animate={isShaking ? { x: [-10, 10, -8, 8, -5, 5, 0] } : { y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          initial={{ y: 20, opacity: 0 }}
          className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-6.5 shadow-xl shadow-slate-200/60 relative"
        >
          {/* Internal Geometric border */}
          <div className="absolute inset-2.5 border border-slate-100 rounded-2xl pointer-events-none" />

          <div className="relative z-10 text-center space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">يرجى كتابة رمز الدخول</h2>
            </div>

            {/* PIN Inputs Container */}
            <div className="dir-ltr flex justify-center gap-1.5 sm:gap-2.5 py-2">
              {pin.map((char, index) => (
                <input
                  key={index}
                  ref={(el) => { if (el) inputRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-9.5 h-12 sm:w-11.5 sm:h-13.5 text-center text-lg sm:text-xl font-extrabold rounded-xl border ${
                    char 
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50' 
                      : error 
                      ? 'border-red-300 text-red-600 bg-red-50/50' 
                      : 'border-slate-200 text-slate-800 bg-slate-50 hover:bg-white hover:border-slate-300'
                  } transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500`}
                />
              ))}
            </div>

            {/* Error Message with alert */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2.5 text-red-600 text-right"
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
                <p className="text-sm font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Toggle Keypad Button */}
            <div className="pt-1 select-none">
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {showKeypad ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>إخفاء لوحة الأرقام</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>إظهار لوحة الأرقام</span>
                  </>
                )}
              </button>
            </div>

            {/* Interactive Custom Numeric Dialer */}
            <AnimatePresence>
              {showKeypad && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-slate-100 max-w-[280px] mx-auto overflow-hidden"
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="w-full h-12 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 hover:border-indigo-200 active:scale-95 transition-all text-base font-extrabold text-slate-700 hover:text-indigo-600 cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="w-full h-12 rounded-xl bg-red-50/50 hover:bg-red-50 border border-red-100/60 hover:border-red-200 text-slate-500 hover:text-red-600 active:scale-95 transition-all text-sm font-bold cursor-pointer"
                  >
                    مسح
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="w-full h-12 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 hover:border-indigo-200 active:scale-95 transition-all text-base font-extrabold text-slate-700 hover:text-indigo-600 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="w-full h-12 rounded-xl bg-slate-100/40 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 text-slate-600 hover:text-slate-800 active:scale-95 transition-all text-sm font-bold flex items-center justify-center cursor-pointer"
                  >
                    حذف
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direct Student Portal Link */}
            <div className="pt-2 border-t border-slate-100">
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

        {/* Footer Brand watermark */}
        <p className="text-slate-400 text-xs font-bold mt-8 tracking-wider uppercase text-center flex items-center gap-1.5 opacity-80">
          <KeyRound className="w-3.5 h-3.5 text-indigo-500" strokeWidth={2.5} />
          بوابة الوصول محميّة برمز أمان المعلم
        </p>

      </div>
    </div>
  );
}
