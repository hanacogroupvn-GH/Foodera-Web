import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, AdminSessionUser } from '../lib/apiClient';

interface AuthContextType {
  user: AdminSessionUser | null;
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
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

  const refreshAdmin = async () => {
    try {
      const session = await api.getSession();
      setUser(session.user);
      setIsAdmin(Boolean(session.isAuthenticated && session.isAdmin && session.user));
      setAdminCheckError(null);
    } catch (error) {
      setUser(null);
      setIsAdmin(false);
      setAdminCheckError(error instanceof Error ? error.message : 'Failed to verify admin session.');
    }
  };

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const session = await api.getSession();
        if (!active) {
          return;
        }

        setUser(session.user);
        setIsAdmin(Boolean(session.isAuthenticated && session.isAdmin && session.user));
        setAdminCheckError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setUser(null);
        setIsAdmin(false);
        setAdminCheckError(error instanceof Error ? error.message : 'Failed to load admin session.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await api.login(email.trim(), password);
      setUser(result.user);
      setIsAdmin(true);
      setAdminCheckError(null);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : 'Login failed.';
      setUser(null);
      setIsAdmin(false);
      setAdminCheckError(message);
      return { ok: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setIsAdmin(false);
      setAdminCheckError(null);
      setIsLoading(false);
    }
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
