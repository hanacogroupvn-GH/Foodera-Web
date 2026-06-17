import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SupportedLocale } from '../types';

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

const LOCALE_STORAGE_KEY = 'foodmax_locale_v1';

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const resolveInitialLocale = (): SupportedLocale => {
  if (typeof window === 'undefined') {
    return 'vi';
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh' || stored === 'vi') {
    return stored;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith('vi')) return 'vi';
  if (browserLanguage.startsWith('zh')) return 'zh';
  return 'vi';
};

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(resolveInitialLocale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale === 'vi' ? 'vi-VN' : 'en';
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};
