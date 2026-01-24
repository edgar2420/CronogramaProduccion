import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Mientras carga la sesión, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
