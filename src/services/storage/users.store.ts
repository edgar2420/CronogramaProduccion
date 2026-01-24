// services/storage/users.store.ts
import type { User } from "@/auth/types";

const LS_USERS = "app_users";

// -------------------- helpers --------------------
const makeId = () =>
(globalThis.crypto?.randomUUID?.() ??
  `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`);

function read(): User[] {
  try {
    const raw = localStorage.getItem(LS_USERS);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function write(list: User[]) {
  localStorage.setItem(LS_USERS, JSON.stringify(list));
}

function findIndexById(list: User[], id: string) {
  return list.findIndex((u) => u.id === id);
}

function usernameExists(list: User[], username: string, exceptId?: string) {
  const t = username.trim().toLowerCase();
  return list.some(
    (u) => u.username.toLowerCase() === t && (!exceptId || u.id !== exceptId)
  );
}

// -------------------- API pública --------------------
export function loadUsers(): User[] {
  return read();
}

export function saveUsers(list: User[]) {
  write(list);
}

/** Solo crea usuarios demo si aún no hay ninguno */
export function seedUsersIfNeeded() {
  if (read().length > 0) {
    // Si ya hay usuarios, asegurar que exista superadmin
    ensureSuperadminExists();
    return;
  }
  write([
    {
      id: makeId(),
      username: "superadmin",
      name: "Super Administrador",
      role: "superadmin",
      password: "super123",
      active: true,
    },
    {
      id: makeId(),
      username: "admin",
      name: "Administrador",
      role: "admin",
      password: "admin123",
      active: true,
    },
    {
      id: makeId(),
      username: "usuario",
      name: "Usuario Demo",
      role: "usuario",
      password: "user123",
      active: true,
    },
  ]);
}

/** Asegura que el usuario superadmin exista */
export function ensureSuperadminExists() {
  const list = read();
  const exists = list.some(u => u.username.toLowerCase() === "superadmin");
  if (!exists) {
    list.push({
      id: makeId(),
      username: "superadmin",
      name: "Super Administrador",
      role: "superadmin" as any,
      password: "super123",
      active: true,
    });
    write(list);
  }
}

export function findByUsername(username: string) {
  const t = username.trim().toLowerCase();
  return read().find((u) => u.username.toLowerCase() === t);
}

/** Crea usuario validando duplicados de username (case-insensitive) */
export function createUser(data: Omit<User, "id">): User {
  const list = read();
  if (usernameExists(list, data.username)) {
    throw new Error("El usuario ya existe");
  }
  const user: User = { id: makeId(), ...data };
  list.push(user);
  write(list);
  return user;
}

/** Actualiza usuario y valida duplicado de username si se cambia */
export function updateUser(id: string, patch: Partial<Omit<User, "id">>) {
  const list = read();
  const i = findIndexById(list, id);
  if (i < 0) throw new Error("Usuario no encontrado");

  const nextUsername = (patch.username ?? list[i].username) as string;
  if (usernameExists(list, nextUsername, id)) {
    throw new Error("El usuario ya existe");
  }

  list[i] = { ...list[i], ...patch };
  write(list);
}

export function removeUser(id: string) {
  const list = read().filter((u) => u.id !== id);
  write(list);
}
