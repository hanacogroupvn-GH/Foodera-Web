import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;

type FetchAdminOptions = {
  force?: boolean;
  clearError?: boolean;
};

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
  const currentUserIdRef = useRef<string | null>(null);
  const hasResolvedInitialSessionRef = useRef(false);
  const adminCacheRef = useRef<{
    uid: string | null;
    isAdmin: boolean;
    checkedAt: number;
  }>({
    uid: null,
    isAdmin: false,
    checkedAt: 0
  });

  const cacheAdminCheck = (uid: string | null, nextIsAdmin: boolean) => {
    adminCacheRef.current = {
      uid,
      isAdmin: nextIsAdmin,
      checkedAt: Date.now()
    };
  };

  const clearAdminCache = () => {
    adminCacheRef.current = {
      uid: null,
      isAdmin: false,
      checkedAt: 0
    };
  };

  const hasFreshAdminCache = (uid: string | undefined | null) => {
    if (!uid) return false;

    const cached = adminCacheRef.current;
    return cached.uid === uid && Date.now() - cached.checkedAt < ADMIN_CACHE_TTL_MS;
  };

  const fetchIsAdmin = async (
    uid: string | undefined | null,
    options: FetchAdminOptions = {}
  ): Promise<boolean> => {
    const { force = false, clearError = true } = options;

    if (clearError) {
      setAdminCheckError(null);
    }

    if (!hasSupabaseEnv) {
      setAdminCheckError('Supabase environment variables are missing.');
      clearAdminCache();
      return false;
    }

    if (!uid) {
      clearAdminCache();
      return false;
    }

    if (!force && hasFreshAdminCache(uid)) {
      return adminCacheRef.current.isAdmin;
    }

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

      const nextIsAdmin = Boolean(data);
      cacheAdminCheck(uid, nextIsAdmin);
      return nextIsAdmin;
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
        currentUserIdRef.current = sessionUser?.id ?? null;
        setUser(sessionUser);

        const admin = await fetchIsAdmin(sessionUser?.id ?? null, { force: true });
        if (!mounted) return;

        setIsAdmin(admin);
      } finally {
        if (mounted) {
          hasResolvedInitialSessionRef.current = true;
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

      const nextUserId = nextUser?.id ?? null;
      const previousUserId = currentUserIdRef.current;
      const userChanged = previousUserId !== nextUserId;

      currentUserIdRef.current = nextUserId;
      setUser(nextUser);

      if (!nextUserId) {
        clearAdminCache();
        setIsAdmin(false);
        setAdminCheckError(null);
        setIsLoading(false);
        return;
      }

      if (!userChanged && hasFreshAdminCache(nextUserId)) {
        setIsAdmin(adminCacheRef.current.isAdmin);
        setIsLoading(false);
        return;
      }

      const shouldBlockUi = userChanged || !hasResolvedInitialSessionRef.current;
      if (shouldBlockUi) {
        setIsLoading(true);
      }

      setTimeout(() => {
        if (!mounted) return;
        void fetchIsAdmin(nextUserId, { force: userChanged, clearError: shouldBlockUi }).then((admin) => {
          if (!mounted) return;
          if (currentUserIdRef.current !== nextUserId) return;

          setIsAdmin(admin);
          hasResolvedInitialSessionRef.current = true;
          if (shouldBlockUi) {
            setIsLoading(false);
          }
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

      currentUserIdRef.current = uid;
      setIsLoading(true);
      const admin = await fetchIsAdmin(uid, { force: true });
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
      hasResolvedInitialSessionRef.current = true;
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
      currentUserIdRef.current = null;
      hasResolvedInitialSessionRef.current = true;
      clearAdminCache();
      setUser(null);
      setIsAdmin(false);
      setAdminCheckError(null);
      setIsLoading(false);
    }
  };

  const refreshAdmin = async () => {
    const nextUserId = currentUserIdRef.current;
    const admin = await fetchIsAdmin(nextUserId, { force: true });
    if (currentUserIdRef.current !== nextUserId) return;
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
