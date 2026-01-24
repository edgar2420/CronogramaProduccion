import React, { useState } from "react";
import { Send, X, Bell, CheckCircle, RefreshCw } from "lucide-react";
import type { EstadoSemana } from "@/features/schedule/types";

type Props = {
    ordenesBorrador: number;
    weekStatus: EstadoSemana;
    fechaRango: string;
    areaLabel: string;
    onPublish: () => void;
};

const FloatingPublishButton: React.FC<Props> = ({
    ordenesBorrador,
    weekStatus,
    fechaRango,
    areaLabel,
    onPublish,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const hasBorrador = ordenesBorrador > 0;
    const isPublished = weekStatus === "publicado" || weekStatus === "cerrado";

    // Don't show if no orders to publish
    if (!hasBorrador) return null;

    const handleConfirm = () => {
        onPublish();
        setShowConfirm(false);
        setIsExpanded(false);
    };

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-24 right-6 z-40">
                {/* Expanded Card */}
                {isExpanded && !showConfirm && (
                    <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell size={18} />
                                    <span className="font-bold">Órdenes Pendientes</span>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-600 text-sm">{areaLabel}</span>
                                <span className="text-xs text-gray-500">{fechaRango}</span>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {ordenesBorrador}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-800 text-sm">
                                            {ordenesBorrador === 1 ? "1 orden" : `${ordenesBorrador} órdenes`} en borrador
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Los usuarios no pueden ver estas órdenes aún
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowConfirm(true)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                {isPublished ? (
                                    <>
                                        <RefreshCw size={18} />
                                        Actualizar Publicación
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Publicar Todo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirmation Dialog */}
                {showConfirm && (
                    <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                            <div className="flex items-center gap-2">
                                <Send size={18} />
                                <span className="font-bold">Confirmar Publicación</span>
                            </div>
                        </div>

                        <div className="p-4">
                            <p className="text-gray-700 mb-4 text-sm">
                                ¿Estás seguro que quieres publicar <strong>{ordenesBorrador} órdenes</strong>?
                                Serán visibles para todos los usuarios.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
                                >
                                    <CheckCircle size={16} />
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Floating Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
            relative flex items-center gap-3 px-5 py-3.5 rounded-full shadow-2xl
            transition-all duration-300 hover:scale-105 active:scale-95
            ${isExpanded
                            ? 'bg-gray-800 text-white'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                        }
          `}
                >
                    {/* Ping animation */}
                    {!isExpanded && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold items-center justify-center">
                                {ordenesBorrador}
                            </span>
                        </span>
                    )}

                    <Send size={20} className={isExpanded ? 'rotate-45' : ''} />
                    <span className="font-semibold text-sm">
                        {isExpanded ? 'Cerrar' : 'Publicar Semana'}
                    </span>
                </button>
            </div>
        </>
    );
};

export default FloatingPublishButton;
