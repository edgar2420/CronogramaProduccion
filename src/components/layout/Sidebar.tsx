import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import {
    LayoutDashboard,
    Users,
    UserCog,
    LogOut,
    X,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Layers,
    GraduationCap,
    Heart,
    Package,
} from "lucide-react";

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
    /** Solo en pantallas < lg: el menú es un panel que se abre encima del contenido. */
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed: collapsedDesktop = false, onToggle, mobileOpen = false, onCloseMobile }) => {
    // Colapsar es una preferencia de escritorio; abierto en tablet/celular
    // siempre se muestra completo, con los nombres de cada sección.
    const collapsed = collapsedDesktop && !mobileOpen;
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/",
            roles: ["superadmin", "admin", "usuario"],
        },
        {
            label: "Usuarios",
            icon: Users,
            path: "/admin/users",
            roles: ["superadmin"], // Solo superadmin puede gestionar usuarios
        },
        {
            label: "Personal",
            icon: UserCog,
            path: "/admin/staff",
            roles: ["superadmin", "admin"],
        },
        {
            label: "Productos",
            icon: Package,
            path: "/admin/products",
            roles: ["superadmin", "admin"],
        },
        {
            label: "Áreas",
            icon: Layers,
            path: "/admin/areas",
            roles: ["superadmin"], // Solo superadmin puede gestionar áreas
        },
        {
            label: "Capacitación",
            icon: GraduationCap,
            path: "/admin/capacitacion",
            roles: ["superadmin", "admin"],
        },
    ];

    const filteredNavItems = navItems.filter((item) =>
        item.roles.includes(user?.role || "")
    );

    return (
        <aside
            className={`
        fixed left-0 top-0 h-full
        bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]
        transition-all duration-300 ease-in-out
        flex flex-col
        shadow-2xl z-50
        w-[var(--sidebar-width)] max-w-[85vw]
        ${collapsed ? "lg:w-[var(--sidebar-collapsed-width)]" : ""}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
            aria-label="Menú principal"
        >
            {/* Header */}
            <div className="p-6 pr-16 lg:pr-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                                <Calendar className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg">Cronograma Producción</h1>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg mx-auto">
                            <Calendar className="text-white" size={24} />
                        </div>
                    )}
                </div>
            </div>

            {/* Cerrar (solo tablet/celular) */}
            <button
                onClick={onCloseMobile}
                className="lg:hidden absolute right-3 top-5 w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar menú"
            >
                <X size={22} />
            </button>

            {/* Toggle Button (escritorio) */}
            <button
                onClick={onToggle}
                className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-primary-600 rounded-full items-center justify-center text-white shadow-lg hover:bg-primary-700 transition-colors"
                aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* User Info */}
            {!collapsed && (
                <div className="px-4 py-4 border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">
                                {user?.username || "Usuario"}
                            </p>
                            <p className="text-xs text-gray-400 capitalize truncate">
                                {user?.role || "role"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {collapsed && (
                <div className="px-4 py-4 border-b border-gray-700/50 flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? "sidebar-item-active" : "sidebar-item"
                            }
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700/50 space-y-2">
                <button
                    onClick={handleLogout}
                    className="sidebar-item w-full"
                    title={collapsed ? "Cerrar Sesión" : undefined}
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
                </button>
                {!collapsed && (
                    <div className="pt-3 border-t border-gray-700/30">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>v1.0.0</span>
                            <span className="flex items-center gap-1">
                                <Heart size={10} className="text-primary-400" fill="currentColor" />
                                <span className="font-medium">Edgar Rojas</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
