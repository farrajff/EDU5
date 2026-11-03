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
  const consoleUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;
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
                <h3 className="text-lg font-black">حل مشكلة (خطأ 400: origin_mismatch)</h3>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  تفعيل النطاق: <span dir="ltr" className="font-mono font-bold">https://farrajff.github.io</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-slate-700 dark:text-slate-300 text-sm">
            {/* Explanation */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-xs leading-relaxed">
              <span className="font-bold text-amber-900 dark:text-amber-300">السبب الدقيق للخطأ:</span>
              <p className="mt-1 text-amber-800 dark:text-amber-200">
                موقعك منشور على الرابط: <strong dir="ltr">https://farrajff.github.io</strong>. تطلب Google إضافة هذا الرابط تحديداً في خانة 
                <span className="font-bold"> "مصادر JavaScript المصرّح بها" (Authorized JavaScript origins) </span> 
                لحماية التطبيق والموافقة على تدفق المصادقة (GeneralOAuthFlow).
              </p>
            </div>

            {/* Current Origin Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                الرابط المطلوب إضافته بالضبط:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://farrajff.github.io"
                  dir="ltr"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://farrajff.github.io');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>خطوات التفعيل في Google Cloud (دقيقة واحدة):</span>
              </h4>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside pr-1">
                <li>
                  اضغط على زر <span className="font-bold text-indigo-600 dark:text-indigo-400">"نسخ الرابط"</span> أعلاه (أو انسخ <span dir="ltr" className="font-mono font-bold">https://farrajff.github.io</span>).
                </li>
                <li>
                  اضغط على زر <span className="font-bold text-indigo-600">"فتح Google Cloud Console"</span> بالأسفل.
                </li>
                <li>
                  في جدول <span className="font-bold">OAuth 2.0 Client IDs</span>، اضغط على اسم العميل.
                </li>
                <li>
                  انزل إلى قسم <span className="font-bold text-amber-700 dark:text-amber-400">"مصادر JavaScript المصرّح بها" (Authorized JavaScript origins)</span> واضغط <span className="font-bold">إضافة URI (ADD URI)</span> ثم ألصق الرابط.
                </li>
                <li>
                  اضغط زر <span className="font-bold text-emerald-600">"حفظ" (Save)</span> أسفل الصفحة.
                </li>
              </ol>
            </div>

            {/* Cloud Console Link Button */}
            <div className="space-y-2 pt-1">
              <a
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-600/25"
              >
                <ExternalLink size={15} />
                <span>1. فتح Google Cloud Console (إضافة مصدر JavaScript)</span>
              </a>

              <a
                href={firebaseAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
              >
                <ExternalLink size={14} />
                <span>2. فتح Firebase Console (إضافة farrajff.github.io للنطاقات المصرّح بها)</span>
              </a>
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
