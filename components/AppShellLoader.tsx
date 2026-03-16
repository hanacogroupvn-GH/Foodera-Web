import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

interface AppShellLoaderProps {
  label?: string;
  compact?: boolean;
}

const AppShellLoader: React.FC<AppShellLoaderProps> = ({
  label,
  compact = false
}) => {
  const { locale } = useLocale();
  const copy =
    locale === 'zh'
      ? {
          defaultLabel: '正在加载页面体验...',
          brand: 'Foodmax 全球出口',
          headline: '正在准备界面'
        }
      : {
          defaultLabel: 'Loading experience...',
          brand: 'Foodmax Global Export',
          headline: 'Preparing the interface'
        };
  const displayLabel = label || copy.defaultLabel;

  if (compact) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-white px-6 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foodmax-forest text-white shadow-xl shadow-foodmax-forest/20">
            <Loader2 size={24} className="animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-foodmax-forest">
              Foodmax
            </p>
            <p className="text-sm font-medium text-gray-500">{displayLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="relative max-w-md rounded-[2rem] border border-gray-100 bg-gray-50 px-10 py-12 text-center shadow-2xl">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/3 translate-x-1/3 rounded-full bg-foodmax-lime/15 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-foodmax-forest text-white shadow-xl shadow-foodmax-forest/20">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-foodmax-forest">
              {copy.brand}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              {copy.headline}
            </h2>
            <p className="text-sm font-medium leading-relaxed text-gray-500">{displayLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShellLoader;
