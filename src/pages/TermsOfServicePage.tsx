import { Scale, ArrowRight, Copy, Check, ShieldCheck, BookOpen, Cloud, AlertCircle, RefreshCw, Globe } from 'lucide-react';
import { useState } from 'react';

interface TermsOfServicePageProps {
  onBack: () => void;
  onOpenPrivacy: () => void;
}

export function TermsOfServicePage({ onBack, onOpenPrivacy }: TermsOfServicePageProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?page=terms`
      : '';

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
      icon: BookOpen,
      title: '1. القبول بالشروط ونطاق الخدمة',
      items: [
        'باستخدامك لمنصة نظام إدارة الدراسات الإسلامية أو بوابة الطلاب الذكية، فإنك تقر بموافقتك على شروط الخدمة العامة الموضحة في هذه الصفحة.',
        'النظام مخصص حصراً للأغراض التعليمية والأكاديمية مثل إدارة الفصول، رصد الدرجات، متابعة الحضور والغياب، أعمال السنة، متابعة حفظ القرآن الكريم، وعرض التقارير للطلاب وأولياء الأمور.'
      ]
    },
    {
      icon: ShieldCheck,
      title: '2. مسؤوليات المستخدمين وأمن الوصول',
      items: [
        'يتحمل المعلم أو المشرف مسؤولية الحفاظ على سرية رمز الدخول الخاص بلوحة التحكم وعدم مشاركته مع غير المخولين.',
        'يتحمل المعلم مسؤولية مراجعة ودقة البيانات والدرجات المدخلة والملفات المستوردة أو المؤرشفة.',
        'يلتزم الطلاب وأولياء الأمور باستخدام بوابة الاستعلام للأغراض الشخصية التعليمية المشروعة فقط، ويُمنع أي محاولة لاستغلال النظام أو الوصول لبيانات الغير.'
      ]
    },
    {
      icon: Cloud,
      title: '3. المزامنة السحابية وخدمات الطرف الثالث',
      items: [
        'يوفر النظام ميزة اختيارية للنسخ الاحتياطي والمزامنة مع حساب Google Drive الخاص بالمعلم بناءً على موافقته الصريحة.',
        'يمكن للمعلم فصل الارتباط بحساب Google وإلغاء صلاحية الوصول في أي وقت من خلال قائمة الحفظ السحابي أو إعدادات حساب Google.',
        'تُعد خدمات التخزين السحابي خاضعة أيضاً لشروط وسياسات مزود الخدمة الخارجي (Google).'
      ]
    },
    {
      icon: AlertCircle,
      title: '4. النسخ الاحتياطي وحدود المسؤولية',
      items: [
        'تُقدَّم المنصة كما هي ("As Is") لدعم العملية التعليمية، ومع حرصنا على استمرارية العمل وتأمين البيانات عبر الحفظ المحلي والسحابي، يُنصح المعلم بتنزيل نسخة احتياطية دورية (JSON) للاحتفاظ بنسخة شخصية.',
        'عمليات الحذف النهائي (مثل حذف طالب محدد أو حذف أرشيف بالكامل) هي عمليات غير قابلة للاسترجاع بعد تأكيدها، ويتحمل المستخدم مسؤولية التحقق قبل تأكيد الحذف.'
      ]
    },
    {
      icon: RefreshCw,
      title: '5. التعديلات على الشروط والتواصل',
      items: [
        'يجوز تحديث شروط الخدمة العامة من وقت لآخر لتتوافق مع تطورات المنصة أو المتطلبات التنظيمية، ويُعد استمرار الاستخدام موافقة على الشروط المحدثة.',
        'للاستفسار أو الدعم الفني بخصوص شروط الخدمة، يرجى التواصل عبر البريد الإلكتروني: gate1425@gmail.com.'
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
              onClick={onOpenPrivacy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-xs sm:text-sm font-black transition-colors cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>سياسة الخصوصية</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-black transition-colors cursor-pointer"
            title="نسخ الرابط العام لصفحة شروط الخدمة"
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
          <div className="absolute top-0 left-0 w-56 h-56 bg-violet-50 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
              <Scale size={28} />
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
                شروط الخدمة — نظام إدارة الدراسات الإسلامية
              </h1>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                توضح شروط الخدمة العامة هذه الضوابط والأحكام المنظمة لاستخدام منصة <strong>الدراسات الإسلامية</strong> وبوابة الطلاب الذكية وخدمات المزامنة المرتبطة بها.
              </p>
            </div>
          </div>
        </section>

        {/* Terms Sections */}
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
              onClick={onOpenPrivacy}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              سياسة الخصوصية العامة
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
