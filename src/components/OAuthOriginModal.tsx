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
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const projectId = 'gen-lang-client-0270287581';
  const consoleUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;

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
              className="absolute left-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
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
                  تفعيل النطاق الحالي في Google Cloud Console لتمكين تسجيل الدخول
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-slate-700 dark:text-slate-300 text-sm">
            {/* Explanation */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-xs leading-relaxed">
              <span className="font-bold text-amber-900 dark:text-amber-300">لماذا يظهر هذا الخطأ؟</span>
              <p className="mt-1 text-amber-800 dark:text-amber-200">
                عند نشر تطبيقك على <strong>GitHub Pages</strong> أو نطاق جديد، تتطلب سياسة أمان Google إضافة عنوان الموقع إلى قائمة 
                <span className="font-bold"> "مصادر JavaScript المصرّح بها" (Authorized JavaScript origins) </span> 
                لحماية حسابك ومنع أي موقع غير مصرح به من الوصول لبياناتك.
              </p>
            </div>

            {/* Current Origin Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                الرابط المطلوب إضافته (عنوان موقعك الحالي):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentOrigin}
                  dir="ltr"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all focus:outline-hidden"
                />
                <button
                  onClick={handleCopy}
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
                <span>خطوات التفعيل السريع (تستغرق دقيقة واحدة):</span>
              </h4>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside pr-1">
                <li>
                  انسخ الرابط أعلاه بالضغط على زر <span className="font-bold text-indigo-600 dark:text-indigo-400">"نسخ الرابط"</span>.
                </li>
                <li>
                  افتح لوحة تحكم Google Cloud بالضغط على الزر الأزرق أدناه.
                </li>
                <li>
                  في قسم <span className="font-bold">OAuth 2.0 Client IDs</span>، اضغط على اسم العميل الرئيسي.
                </li>
                <li>
                  انزل إلى قسم <span className="font-bold text-amber-700 dark:text-amber-400">"مصادر JavaScript المصرّح بها" (Authorized JavaScript origins)</span> واضغط <span className="font-bold">إضافة URI (ADD URI)</span> ثم ألصق الرابط المنسوخ.
                </li>
                <li>
                  اضغط على زر <span className="font-bold text-emerald-600">"حفظ" (Save)</span> في أسفل الصفحة. (قد يستغرق انتشار التحديث من دقيقة إلى 5 دقائق).
                </li>
              </ol>
            </div>

            {/* Cloud Console Link Button */}
            <div className="pt-1">
              <a
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-600/25"
              >
                <ExternalLink size={15} />
                <span>فتح Google Cloud Console (بيانات الاعتماد)</span>
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
