import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "./types";
import { AuthContext } from "./AuthContext";
import * as authApi from "@/services/api/auth.api";
import { useNavigate } from "react-router-dom";

const TOKEN_KEY = "auth_token";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restaura la sesión contra el backend real (/auth/me) usando el access
  // token en sessionStorage. Sin backend no hay sesión — no hay fallback local.
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: remoteUser }) => setUser({ ...remoteUser, password: "" }))
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    sessionStorage.setItem(TOKEN_KEY, result.accessToken);

    setUser({ ...result.user, password: "" });
    navigate("/", { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {
    });
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
