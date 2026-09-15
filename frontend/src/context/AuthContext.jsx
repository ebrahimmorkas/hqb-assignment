import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authApi';
import { onSessionExpired } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true: we don't know yet whether the httpOnly cookies represent a
  // valid session until /auth/me resolves.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onSessionExpired(() => setUser(null));
  }, []);

  const login = useCallback(async (its, password) => {
    const data = await authApi.login(its, password);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Re-pulls /auth/me - used after a self-edit so the displayed profile
  // (and anywhere else `user` is read from this context) reflects the save
  // without a full page reload.
  const refreshUser = useCallback(async () => {
    const data = await authApi.getMe();
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
