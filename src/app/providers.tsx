import React from "react";
import { AuthProvider } from "@/auth/AuthProvider";

export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
