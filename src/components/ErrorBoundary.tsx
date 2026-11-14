import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 text-slate-800 dir-rtl font-sans" dir="rtl">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">
                حدث خطأ أثناء تحميل الصفحة
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                واجه النظام خطأً غير متوقع أثناء تشغيل واجهة المستخدم. يمكنك إعادة تحميل الصفحة أو مسح الذاكرة المؤقتة للبدء من جديد.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-700 text-left overflow-x-auto border border-slate-200 max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors border border-slate-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>مسح الذاكرة والبدء</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
