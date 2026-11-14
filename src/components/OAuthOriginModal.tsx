import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ExternalLink, Copy, Check, X, HardDrive, DownloadCloud, Sparkles } from 'lucide-react';

interface OAuthOriginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJson?: () => void;
}

export const OAuthOriginModal: React.FC<OAuthOriginModalProps> = ({ isOpen, onClose, onExportJson }) => {
  const [copied, setCopied] = useState(false);
  const detectedOrigin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' 
    ? window.location.origin 
    : 'https://farrajff.github.io';
  const targetOrigin = detectedOrigin.includes('github.io') ? detectedOrigin : 'https://farrajff.github.io';
  const currentOrigin = targetOrigin;
  const projectId = 'gen-lang-client-0270287581';
  const clientId = '422321380604-2h9tbrum76sc99mn3sja5t7eb16bodmc.apps.googleusercontent.com';
  const consoleUrl = `https://console.cloud.google.com/apis/credentials/oauthclient/${clientId}?project=${projectId}`;
  const consentScreenUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${projectId}`;
  const firebaseAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopy = () => {
    if (navigator.clipboard && currentOrigin) {
      navigator.clipboard.writeText(currentOrigin);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute left-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black">إعدادات مصادقة Google (أخطاء 400 و 403)</h3>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  السماح بحسابات الدخول وتفعيل النطاق: <span dir="ltr" className="font-mono font-bold">farrajff.github.io</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-slate-700 dark:text-slate-300 text-sm">
            {/* 403 Access Denied Fix Box */}
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl p-4 text-xs leading-relaxed">
              <span className="font-bold text-red-900 dark:text-red-300 text-sm block mb-1">
                حل خطأ (403: access_denied - لم يكمل التطبيق التحقق):
              </span>
              <p className="text-red-800 dark:text-red-200">
                هذا يعني أن التطبيق في وضع <strong>"قيد الاختبار" (Testing)</strong> ويقبل فقط الإيميلات المسجلة في قائمة <strong>"مستخدمو الاختبار" (Test Users)</strong>.
              </p>
              <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-800/60 space-y-1.5 font-medium">
                <div>• إما إضافة إيميلك (<strong dir="ltr">just4niceone@gmail.com</strong>) كـ <strong>Test User</strong>.</div>
                <div>• أو تسجيل الدخول بإيميل منشئ المشروع (<strong dir="ltr">gate1425@gmail.com</strong>).</div>
                <div>• أو الضغط على <strong>"نشر التطبيق" (Publish App)</strong> لجعل التطبيق متاحاً لأي حساب.</div>
              </div>
            </div>

            {/* Direct Link to Consent Screen */}
            <div className="space-y-2 pt-1">
              <a
                href={consentScreenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-lg shadow-red-600/25"
              >
                <ExternalLink size={15} />
                <span>فتح شاشة موافقة OAuth (لإضافة مستخدمي الاختبار أو النشر)</span>
              </a>

              <a
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors border border-indigo-200 dark:border-slate-700"
              >
                <ExternalLink size={14} />
                <span>إعدادات عميل الويب (Authorized JavaScript origins)</span>
              </a>
            </div>

            {/* Current Origin Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                رابط النطاق الحالي المصرّح به:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://farrajff.github.io"
                  dir="ltr"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://farrajff.github.io');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'تم!' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Alternative Backup Option */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive size={15} className="text-slate-400" />
                <span>كبديل فوري: حفظ واسترجاع البيانات بملف محلي</span>
              </div>
              {onExportJson && (
                <button
                  onClick={() => {
                    onExportJson();
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <DownloadCloud size={14} />
                  <span>تصدير JSON</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
