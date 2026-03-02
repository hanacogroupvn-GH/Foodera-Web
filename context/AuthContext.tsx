import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  adminCheckError: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

  const fetchIsAdmin = async (_uid: string | undefined | null): Promise<boolean> => {
    setAdminCheckError(null);
    if (!_uid) return false;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', _uid)
        .maybeSingle();

      if (error) {
        setAdminCheckError(error.message);
        return false;
      }

      return !!data;
    } catch (e: any) {
      setAdminCheckError(e?.message || 'Failed to verify admin access');
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // ✅ STEP 1: dọn local storage khi thoát/reload
    const handleBeforeUnload = () => {
      try {
        supabase.removeAllChannels();
        supabase.auth.signOut({ scope: 'local' });
      } catch {}

      // dọn storage Supabase
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
      sessionStorage.clear();
    };


    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);

        const admin = await fetchIsAdmin(sessionUser?.id ?? null);
        if (!mounted) return;

        setIsAdmin(admin);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      const admin = await fetchIsAdmin(nextUser?.id ?? null);
      setIsAdmin(admin);

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.debug('[auth] signInWithPassword start');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.debug('[auth] signInWithPassword done');
      if (error) return { ok: false, message: error.message };

      const uid = data.user?.id ?? null;
      if (!uid) return { ok: false, message: 'Login failed' };

      console.debug('[auth] fetchIsAdmin start', uid);
      const admin = await fetchIsAdmin(uid);
      console.debug('[auth] fetchIsAdmin done', admin);

      if (!admin) {
        await supabase.removeAllChannels();
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setIsAdmin(false);
        return { ok: false, message: 'This account is not an admin.' };
      }

      setUser(data.user);
      setIsAdmin(true);
      setIsLoading(false);

      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.removeAllChannels();
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
      sessionStorage.clear();

      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const refreshAdmin = async () => {
    const admin = await fetchIsAdmin(user?.id ?? null);
    setIsAdmin(admin);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin,
      isLoading,
      adminCheckError,
      login,
      logout,
      refreshAdmin,
    }),
    [user, isAdmin, isLoading, adminCheckError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
