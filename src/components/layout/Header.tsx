import React from "react";
import { Menu } from "lucide-react";

interface HeaderProps {
    title?: string;
    subtitle?: string;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    title = "Dashboard",
    subtitle,
    onMenuClick
}) => {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden btn-icon"
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Right side - can add notifications, search, etc. */}
                <div className="flex items-center gap-3">
                    {/* Placeholder for future features */}
                </div>
            </div>
        </header>
    );
};

export default Header;
