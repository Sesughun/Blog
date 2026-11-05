import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import api, { tokenStore } from "../api/axios";
import type { Me } from "../types";

interface AuthState {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  register: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<Me>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return setUser(null);
    try {
      setUser((await api.get<Me>("/auth/me/")).data);
    } catch {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get<Me>("/auth/me/")
      .then((r) => setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(() => {
    const start = (data: { token: string; user: Me }) => {
      tokenStore.set(data.token);
      setUser(data.user);
      return data.user;
    };
    return {
      user,
      loading,
      refresh,
      login: async (email, password) => start((await api.post("/auth/login/", { email, password })).data),
      register: async (body) => start((await api.post("/auth/register/", body)).data),
      logout: async () => {
        try {
          await api.post("/auth/logout/");
        } finally {
          tokenStore.clear();
          setUser(null);
        }
      },
    };
  }, [user, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
