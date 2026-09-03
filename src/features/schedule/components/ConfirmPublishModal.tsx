import React from "react";
import { AlertTriangle, Send, X, CheckCircle2, Calendar } from "lucide-react";

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    ordenesBorrador: number;
    fechaRango: string;
    areaLabel: string;
};

const ConfirmPublishModal: React.FC<Props> = ({
    open,
    onClose,
    onConfirm,
    ordenesBorrador,
    fechaRango,
    areaLabel,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Send size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Publicar Cronograma</h2>
                                <p className="text-emerald-100 text-sm">{areaLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Warning message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-amber-800 mb-1">
                                    ¿Estás seguro que quieres publicar todo?
                                </p>
                                <p className="text-sm text-amber-700">
                                    Una vez publicado, las órdenes serán visibles para todos los usuarios del sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={16} />
                                <span className="text-sm font-medium">Semana</span>
                            </div>
                            <span className="font-bold text-gray-900">{fechaRango}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600">
                                <CheckCircle2 size={16} />
                                <span className="text-sm font-medium">Órdenes a publicar</span>
                            </div>
                            <span className="font-bold text-emerald-600">{ordenesBorrador} órdenes</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            Publicar Todo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPublishModal;
