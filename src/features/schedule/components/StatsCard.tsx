import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: "primary" | "accent" | "success" | "warning" | "error" | "gray";
    trend?: {
        value: number;
        label: string;
        isPositive?: boolean;
    };
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    color = "primary",
    trend,
}) => {
    const colorClasses = {
        primary: "bg-primary-100 text-primary-600",
        accent: "bg-accent-100 text-accent-600",
        success: "bg-green-100 text-green-600",
        warning: "bg-yellow-100 text-yellow-600",
        error: "bg-red-100 text-red-600",
        gray: "bg-gray-100 text-gray-600",
    };

    const iconBgClass = colorClasses[color];

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>

                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={`text-xs font-semibold ${trend.isPositive ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {trend.isPositive ? "+" : ""}{trend.value}%
                            </span>
                            <span className="text-xs text-gray-500">{trend.label}</span>
                        </div>
                    )}
                </div>

                <div className={`p-3 rounded-xl ${iconBgClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
