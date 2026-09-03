import type { Role } from "../../domain/user/User.entity.js";

/** Identidad del actor autenticado, extraída del JWT verificado — nunca del body de la request. */
export interface ActorContext {
  userId: string;
  username: string;
  role: Role;
  ipAddress?: string | null;
  requestId?: string | null;
}
