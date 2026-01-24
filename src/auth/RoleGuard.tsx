import React from "react";
import type { Role } from "./types";
import { useAuth } from "./useAuth";

export const RoleGuard: React.FC<{ allow: Role[]; children: React.ReactNode }> = ({ allow, children }) => {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return null;
  return <>{children}</>;
};
