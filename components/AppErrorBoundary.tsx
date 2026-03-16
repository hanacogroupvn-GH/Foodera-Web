import React from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { SupportedLocale } from '../types';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  locale?: SupportedLocale;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare props: Readonly<AppErrorBoundaryProps>;

  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const copy =
      this.props.locale === 'zh'
        ? {
            eyebrow: '恢复模式',
            title: '页面遇到了一个异常问题',
            description: '错误已被隔离，页面不会继续白屏。您可以重新加载应用，或返回首页继续浏览。',
            reload: '重新加载应用',
            home: '返回首页'
          }
        : {
            eyebrow: 'Recovery Mode',
            title: 'The interface hit an unexpected problem',
            description: 'The error has been isolated so the page does not stay blank. Reload the app or return to the homepage.',
            reload: 'Reload App',
            home: 'Go Home'
          };

    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
        <div className="relative max-w-xl overflow-hidden rounded-[2.5rem] border border-gray-100 bg-gray-50 p-10 shadow-2xl">
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/3 -translate-y-1/3 rounded-full bg-foodmax-forest/10 blur-3xl" />
          <div className="relative">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm">
              <AlertTriangle size={30} />
            </div>
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.35em] text-foodmax-forest">
              {copy.eyebrow}
            </p>
            <h1 className="mb-4 text-3xl font-black tracking-tight text-gray-900">
              {copy.title}
            </h1>
            <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500">
              {copy.description}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foodmax-forest px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-foodmax-lime hover:text-foodmax-forest"
              >
                <RefreshCcw size={16} />
                {copy.reload}
              </button>
              <button
                onClick={this.handleHome}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-700 transition-all hover:border-foodmax-forest hover:text-foodmax-forest"
              >
                <Home size={16} />
                {copy.home}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
