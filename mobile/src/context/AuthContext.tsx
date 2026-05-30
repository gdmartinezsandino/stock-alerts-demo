import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as api from "../api/client";
import { User } from "../types";
import { registerForPushNotifications } from "../services/notifications";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore a persisted session on launch.
  useEffect(() => {
    (async () => {
      const stored = await api.loadToken();
      if (stored) setTokenState(stored);
      setLoading(false);
    })();
  }, []);

  // Once authenticated, register this device for push notifications.
  const afterAuth = useCallback(async (newToken: string, newUser: User) => {
    await api.setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    // Fire-and-forget; push setup must never block login.
    registerForPushNotifications().catch(() => undefined);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: t, user: u } = await api.login(email, password);
      await afterAuth(t, u);
    },
    [afterAuth]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const { token: t, user: u } = await api.register(email, password);
      await afterAuth(t, u);
    },
    [afterAuth]
  );

  const logout = useCallback(async () => {
    await api.setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
