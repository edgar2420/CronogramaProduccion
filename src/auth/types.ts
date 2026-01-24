export type Role = "superadmin" | "admin" | "usuario";

export interface User {
  id: string;
  username: string;   // para login
  name: string;       // nombre a mostrar
  role: Role;         // "admin" | "user"
  password: string;   // DEMO: en real debe ser hash
  active: boolean;    // habilitado/inactivo
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;  // ISO
}
