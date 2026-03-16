import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { hasSupabaseEnv, supabase } from '../lib/supabaseClient';

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

const clearLocalAuthArtifacts = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
  sessionStorage.clear();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

  const fetchIsAdmin = async (uid: string | undefined | null): Promise<boolean> => {
    setAdminCheckError(null);

    if (!hasSupabaseEnv) {
      setAdminCheckError('Supabase environment variables are missing.');
      return false;
    }

    if (!uid) return false;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) {
        setAdminCheckError(error.message);
        return false;
      }

      return Boolean(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify admin access';
      setAdminCheckError(message);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!hasSupabaseEnv) {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setAdminCheckError('Supabase environment variables are missing.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);

        const admin = await fetchIsAdmin(sessionUser?.id ?? null);
        if (!mounted) return;

        setIsAdmin(admin);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void init();

    if (!hasSupabaseEnv) {
      return () => {
        mounted = false;
      };
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (!mounted) return;

      setIsLoading(true);
      setUser(nextUser);

      if (!nextUser?.id) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        if (!mounted) return;
        void fetchIsAdmin(nextUser.id).then((admin) => {
          if (!mounted) return;
          setIsAdmin(admin);
          setIsLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!hasSupabaseEnv) {
      return {
        ok: false,
        message: 'Admin login is unavailable because Supabase environment variables are missing.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, message: error.message };

      const uid = data.user?.id ?? null;
      if (!uid) return { ok: false, message: 'Login failed' };

      const admin = await fetchIsAdmin(uid);
      if (!admin) {
        await supabase.removeAllChannels();
        await supabase.auth.signOut({ scope: 'local' });
        clearLocalAuthArtifacts();
        setUser(null);
        setIsAdmin(false);
        return { ok: false, message: 'This account is not an admin.' };
      }

      setUser(data.user);
      setIsAdmin(true);
      setIsLoading(false);
      return { ok: true };
    } catch (error: unknown) {
      return { ok: false, message: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      if (hasSupabaseEnv) {
        await supabase.removeAllChannels();
        await supabase.auth.signOut({ scope: 'local' });
      }
    } finally {
      clearLocalAuthArtifacts();
      setUser(null);
      setIsAdmin(false);
      setAdminCheckError(null);
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
      isAuthenticated: Boolean(user),
      isAdmin,
      isLoading,
      adminCheckError,
      login,
      logout,
      refreshAdmin
    }),
    [user, isAdmin, isLoading, adminCheckError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
