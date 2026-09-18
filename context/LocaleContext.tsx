import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SupportedLocale } from '../types';

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

const LOCALE_STORAGE_KEY = 'foodera_locale_v2';
const LEGACY_STORAGE_KEYS = ['foodmax_locale_v1', 'foodera_locale_v1'];

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const resolveInitialLocale = (): SupportedLocale => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    LEGACY_STORAGE_KEYS.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Ignore storage cleanup issues
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      return stored;
    }

    const browserLanguage = window.navigator.language?.toLowerCase() || '';
    if (browserLanguage.startsWith('zh')) {
      return 'zh';
    }
  } catch {
    // Ignore access errors
  }

  return 'en';
};

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(resolveInitialLocale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // Ignore storage errors
      }
    }
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.setAttribute('data-locale', locale);
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
