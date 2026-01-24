import { useRoutes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RoleGuard } from "@/auth/RoleGuard";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import DashboardPage from "@/features/schedule/pages/DashboardPage";
import AdminUsersPage from "@/features/users/pages/AdminUsersPage";
import AdminStaffPage from "@/features/staff/pages/AdminStaffPage";
import AreasPage from "@/features/areas/pages/AreasPage";
import CapacitacionPage from "@/features/capacitacion/pages/CapacitacionPage";

export function AppRoutes() {
  return useRoutes([
    {
      element: <AuthLayout />,
      children: [{ path: "/login", element: <LoginPage /> }],
    },
    {
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        {
          path: "admin/users",
          element: (
            <RoleGuard allow={["superadmin"]}>
              <AdminUsersPage />
            </RoleGuard>
          )
        },
        { path: "admin/staff", element: <AdminStaffPage /> },
        { path: "admin/areas", element: <AreasPage /> },
        { path: "admin/capacitacion", element: <CapacitacionPage /> },
      ],
    },
    { path: "/", element: <Navigate to="/" /> },
    { path: "*", element: <NotFoundPage /> },
  ]);
}

