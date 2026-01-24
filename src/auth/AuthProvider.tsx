import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "./types";
import { AuthContext } from "./AuthContext";
import {
  seedUsersIfNeeded,
  loadUsers,
  findByUsername,
} from "@/services/storage/users.store";
import {
  getSession,
  setSession,
  logout as clearSession,
} from "@/services/storage/session.store";
import { useNavigate } from "react-router-dom";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  //  Inicializa usuarios y sesión desde localStorage
  useEffect(() => {
    seedUsersIfNeeded();
    const s = getSession();
    if (s) {
      const all = loadUsers();
      const u = all.find((x) => x.id === s.userId) || null;
      if (u) {
        setUser(u);
      }
    }
    setLoading(false); // Terminó de cargar
  }, []);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    const u = findByUsername(username);
    await new Promise((r) => setTimeout(r, 300));

    if (!u || u.password !== password) {
      throw new Error("Usuario o contraseña inválidos");
    }

    const session: Session = {
      userId: u.id,
      token: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };
    setSession(session);
    setUser(u);
    navigate("/", { replace: true });
  }, [navigate]);


  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading, // Incluir loading en el contexto
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
