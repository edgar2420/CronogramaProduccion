import { createContext } from "react";
import type { User } from "./types";

export type AuthCtx = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // true mientras carga la sesión desde localStorage
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthCtx | null>(null);
