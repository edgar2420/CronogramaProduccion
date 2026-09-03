import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, Cloud, ChevronRight } from "lucide-react";

interface HeaderProps {
    onMenuClick?: () => void;
}

const ROUTE_META: { match: (path: string) => boolean; section: string }[] = [
    { match: (p) => p === "/", section: "Cronograma" },
    { match: (p) => p.startsWith("/admin/products"), section: "Productos" },
    { match: (p) => p.startsWith("/admin/staff"), section: "Personal" },
    { match: (p) => p.startsWith("/admin/areas"), section: "Áreas" },
    { match: (p) => p.startsWith("/admin/users"), section: "Usuarios" },
    { match: (p) => p.startsWith("/admin/capacitacion"), section: "Capacitación" },
];

function sectionFor(pathname: string) {
    return ROUTE_META.find((r) => r.match(pathname))?.section ?? "";
}

/**
 * Barra superior deliberadamente delgada: cada página ya renderiza su propio
 * `.page-title` grande, así que este breadcrumb no lo duplica — solo ubica
 * al usuario dentro del sistema.
 */
const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { pathname } = useLocation();
    const section = sectionFor(pathname);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden btn-icon shrink-0"
                        aria-label="Abrir menú"
                    >
                        <Menu size={22} />
                    </button>

                    <nav className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                        <span className="truncate">Cronograma Producción</span>
                        {section && (
                            <>
                                <ChevronRight size={14} className="shrink-0" />
                                <span className="font-semibold text-gray-800 truncate">{section}</span>
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"
                        title="Datos guardados en el servidor real"
                    >
                        <Cloud size={14} />
                        Servidor conectado
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
