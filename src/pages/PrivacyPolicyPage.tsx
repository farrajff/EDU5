import { ShieldCheck, ArrowRight, Copy, Check, FileText, Lock, Database, Cloud, UserCheck, Mail, Globe } from 'lucide-react';
import { useState } from 'react';
import { getPublicLegalUrl } from '../lib/publicRoutes';

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onOpenTerms: () => void;
}

export function PrivacyPolicyPage({ onBack, onOpenTerms }: PrivacyPolicyPageProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl = getPublicLegalUrl('privacy');

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const sections = [
    {
      icon: Database,
      title: '1. المعلومات والبيانات التي نقوم بجمعها',
      items: [
        'البيانات التعليمية والأكاديمية التي يدخلها المعلم: أسماء الطلاب، الفصول الدراسية، الأرقام الأكاديمية، درجات أعمال السنة والاختبارات، سجلات الحضور والغياب، حالات الاستئذان، وسجل متابعة حفظ القرآن الكريم.',
        'بيانات حساب Google الأساسية (الاسم، البريد الإلكتروني، وصورة الملف الشخصي) فقط في حال اختار المعلم طوعاً تسجيل الدخول وربط حسابه لغرض النسخ الاحتياطي عبر Google Drive.',
        'تفضيلات واجهة الاستخدام (مثل السمة اللونية، الوضع الليلي، ونمط شريط التنقل) لحفظ تجربة المستخدم.'
      ]
    },
    {
      icon: Cloud,
      title: '2. استخدام خدمات Google API و Google Drive',
      items: [
        'يستخدم النظام نطاق الصلاحية المحدود (https://www.googleapis.com/auth/drive.file) فقط لإنشاء وتحديث وقراءة ملف النسخة الاحتياطية الخاص بالتطبيق داخل حساب Google Drive للمعلم.',
        'لا يقوم النظام بالوصول إلى أي ملفات أو مجلدات أخرى في Google Drive لا علاقة لها بالتطبيق، ولا يطلع على أي محتوى شخصي آخر.',
        'يلتزم استخدام التطبيق للبيانات المستلمة من واجهات Google API بسياسة بيانات مستخدمي خدمات Google API (Google API Services User Data Policy)، بما في ذلك متطلبات الاستخدام المحدود (Limited Use).'
      ]
    },
    {
      icon: Lock,
      title: '3. كيفية تخزين البيانات وحمايتها',
      items: [
        'تُخزَّن البيانات محلياً في متصفح المستخدم وفي قاعدة البيانات السحابية المحمية الخاصة بالتطبيق لضمان استمرارية العمل ومزامنة بوابة الطلاب.',
        'لوحة تحكم المعلم محمية برمز دخول خاص لمنع الوصول غير المصرح به إلى تعديل الدرجات أو سجلات الطلاب.',
        'بوابة الطلاب تعرض التقارير الأكاديمية للطالب المحدد فقط دون إتاحة صلاحية التعديل أو الوصول لبيانات بقية المستخدمين الإدارية.'
      ]
    },
    {
      icon: UserCheck,
      title: '4. مشاركة البيانات وحقوق المستخدم والحذف',
      items: [
        'لا نبيع أو نؤجر أو نشارك بيانات المعلمين أو الطلاب مع أي جهات تسويقية أو أطراف ثالثة لأي أغراض تجارية أو إعلانية.',
        'يحتفظ المعلم بالتحكم الكامل في بياناته؛ ويمكنه في أي وقت تصدير نسخة كاملة (JSON)، أو فصل ربط حساب Google Drive، أو حذف الطلاب وسجلاتهم وأرشيفاتهم نهائياً من داخل النظام.',
        'عند حذف طالب أو أرشيف من إدارة الفصول، يتم مسح الطالب وكافة سجلاته المرتبطة من درجات وحضور واستئذان ومتابعة بشكل كامل.'
      ]
    },
    {
      icon: Mail,
      title: '5. التحديثات والتواصل',
      items: [
        'قد نقوم بتحديث سياسة الخصوصية هذه عند إضافة ميزات جديدة أو لتعزيز الامتثال للمعايير التنظيمية، وسيتم عرض تاريخ آخر تحديث أعلى الصفحة.',
        'للاستفسارات المتعلقة بالخصوصية أو طلبات حذف البيانات، يمكن التواصل عبر البريد الإلكتروني: gate1425@gmail.com.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 font-sans" dir="rtl">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-black transition-colors cursor-pointer"
            >
              <ArrowRight size={16} />
              <span>العودة</span>
            </button>

            <button
              type="button"
              onClick={onOpenTerms}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-xs sm:text-sm font-black transition-colors cursor-pointer"
            >
              <FileText size={15} />
              <span>شروط الخدمة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-black transition-colors cursor-pointer"
            title="نسخ الرابط العام لصفحة سياسة الخصوصية"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'تم نسخ الرابط العام' : 'نسخ الرابط العام'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Card */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-56 h-56 bg-indigo-50 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black">
                  <Globe size={12} />
                  <span>وثيقة عامة متاحة للجميع</span>
                </span>
                <span className="text-xs font-bold text-slate-400">
                  آخر تحديث: 2026
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                سياسة الخصوصية — نظام إدارة الدراسات الإسلامية
              </h1>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                نلتزم في منصة <strong>الدراسات الإسلامية</strong> بحماية خصوصية بيانات المعلمين والطلاب وأولياء الأمور. توضح هذه الصفحة العامة كيفية جمع البيانات واستخدامها وحمايتها وحقوقك المتعلقة بها.
              </p>
            </div>
          </div>
        </section>

        {/* Policy Sections */}
        <div className="space-y-4">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <section
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                    <Icon size={18} />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">{sec.title}</h2>
                </div>
                <ul className="space-y-2.5 pr-4 list-disc text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
                  {sec.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>© {new Date().getFullYear()} نظام إدارة الدراسات الإسلامية — جميع الحقوق محفوظة</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              شروط الخدمة العامة
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
            >
              العودة للنظام
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
