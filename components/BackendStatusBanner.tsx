import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { useData } from '../context/DataContext';
import { useLocale } from '../context/LocaleContext';

const BackendStatusBanner: React.FC = () => {
  const { backendMode, backendError, isLoading } = useData();
  const { locale } = useLocale();

  if (isLoading || backendMode === 'turso' || backendMode === 'local') {
    return null;
  }

  const copy =
    locale === 'zh'
      ? {
          title: 'Turso \u540e\u7aef\u672a\u8fde\u63a5\uff0c\u5f53\u524d\u663e\u793a\u5185\u7f6e\u6f14\u793a\u6570\u636e\u3002',
          detailPrefix: '\u540e\u7aef\u9519\u8bef\uff1a',
          healthHint: '\u8bf7\u68c0\u67e5 /api/health \u4e0e Netlify Functions \u90e8\u7f72\u3002',
          healthLink: '\u6253\u5f00 /api/health'
        }
      : {
          title: 'Live Turso backend is unavailable. The site is showing bundled fallback data.',
          detailPrefix: 'Backend error:',
          healthHint: 'Check /api/health and the Netlify Functions deployment.',
          healthLink: 'Open /api/health'
        };

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm text-amber-900 sm:px-6 lg:px-8">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <p className="font-semibold">{copy.title}</p>
          <p className="mt-1 break-words text-xs text-amber-800">
            {copy.healthHint}
            {backendError ? ` ${copy.detailPrefix} ${backendError}` : ''}
          </p>
          <a
            href="/api/health"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-xs font-semibold text-amber-900 underline decoration-amber-500 underline-offset-2 hover:text-amber-700"
          >
            {copy.healthLink}
          </a>
        </div>
      </div>
    </div>
  );
};

export default BackendStatusBanner;
