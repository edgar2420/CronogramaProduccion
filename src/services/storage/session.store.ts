import type { Session, User } from "@/auth/types";
import { findByUsername } from "./users.store";

const LS_SESSION = "app_session";

function token() { return `t_${Math.random().toString(36).slice(2)}.${Date.now().toString(36)}`; }

export function getSession(): Session | null {
  const raw = localStorage.getItem(LS_SESSION);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}
export function setSession(s: Session | null) {
  if (!s) localStorage.removeItem(LS_SESSION);
  else localStorage.setItem(LS_SESSION, JSON.stringify(s));
}

export function login(username: string, password: string): { ok: true; user: User } | { ok: false; msg: string } {
  const user = findByUsername(username);
  if (!user || !user.active) return { ok: false, msg: "Usuario o contraseña inválidos." };
  if (user.password !== password)  return { ok: false, msg: "Usuario o contraseña inválidos." };
  const s: Session = { token: token(), userId: user.id, createdAt: new Date().toISOString() };
  setSession(s);
  return { ok: true, user };
}

export function logout() { setSession(null); }
