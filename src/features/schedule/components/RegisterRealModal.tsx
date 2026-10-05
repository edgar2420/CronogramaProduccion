import React, { useState, useEffect } from "react";
import { X, Pill, Clock, Target, TrendingUp, CheckCircle2, Sun, SunMedium, Moon } from "lucide-react";
import type { Turno } from "@/features/schedule/types";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: number;
  producto: string;
  turno: Turno;
  onSave: (real: number, obs?: string) => void;
};

// Configuración de colores por turno
const TURNO_COLORS: Record<Turno, { gradient: string; textSecondary: string; icon: React.ReactNode; buttonBg: string; buttonHover: string; focusRing: string }> = {
  mañana: {
    gradient: "from-sky-400 via-sky-500 to-cyan-600",
    textSecondary: "text-sky-100",
    icon: <Sun size={20} className="text-white" />,
    buttonBg: "bg-sky-600",
    buttonHover: "hover:bg-sky-700",
    focusRing: "focus:ring-sky-100 focus:border-sky-500"
  },
  tarde: {
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    textSecondary: "text-blue-100",
    icon: <SunMedium size={20} className="text-white" />,
    buttonBg: "bg-blue-600",
    buttonHover: "hover:bg-blue-700",
    focusRing: "focus:ring-blue-100 focus:border-blue-500"
  },
  noche: {
    gradient: "from-blue-800 via-blue-900 to-slate-900",
    textSecondary: "text-blue-200",
    icon: <Moon size={20} className="text-white" />,
    buttonBg: "bg-blue-800",
    buttonHover: "hover:bg-blue-900",
    focusRing: "focus:ring-blue-100 focus:border-blue-800"
  },
};

const RegisterRealModal: React.FC<Props> = ({ open, onClose, plan, producto, turno, onSave }) => {
  const [real, setReal] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (open) {
      setReal("");
      setObs("");
    }
  }, [open]);

  if (!open) return null;

  const turnoConfig = TURNO_COLORS[turno] || TURNO_COLORS.mañana;
  const realNum = Number(real || 0);
  const eficacia = plan ? Math.round((realNum / plan) * 100) : 0;
  const isComplete = realNum >= plan;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(realNum) || realNum <= 0) return;
    onSave(realNum, obs.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in">
        {/* Header with turno-based color */}
        <div className={`px-6 py-4 bg-gradient-to-r ${turnoConfig.gradient} rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {turnoConfig.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Producción</h3>
                <p className={`${turnoConfig.textSecondary} text-sm`}>Turno {turno.charAt(0).toUpperCase() + turno.slice(1)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="text-white" size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-6">
          {/* Product Info Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl text-center">
              <Pill className="mx-auto text-blue-500 mb-1" size={20} />
              <p className="text-xs uppercase tracking-wider text-blue-600 font-bold">Producto</p>
              <p className="text-sm font-semibold text-gray-900 truncate" title={producto}>{producto}</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl text-center">
              <Clock className="mx-auto text-sky-500 mb-1" size={20} />
              <p className="text-xs uppercase tracking-wider text-sky-600 font-bold">Turno</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{turno}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center">
              <Target className="mx-auto text-amber-500 mb-1" size={20} />
              <p className="text-xs uppercase tracking-wider text-amber-600 font-bold">Meta</p>
              <p className="text-sm font-semibold text-gray-900">{plan.toLocaleString()}</p>
            </div>
          </div>

          {/* Real Input */}
          <div className="mb-4">
            <label htmlFor="real" className="block text-sm font-semibold text-gray-700 mb-2">
              Cantidad Producida
            </label>
            <input
              id="real"
              type="number"
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
              inputMode="numeric"
              value={real}
              onChange={(e) => setReal(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Efficiency Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Eficacia</span>
              <span className={`text-lg font-black ${eficacia >= 100 ? 'text-emerald-600' : eficacia >= 80 ? 'text-amber-600' : 'text-red-500'
                }`}>
                {eficacia}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${eficacia >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                  eficacia >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                style={{ width: `${Math.min(eficacia, 100)}%` }}
              />
            </div>
            {isComplete && (
              <div className="flex items-center gap-2 mt-2 text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="text-sm font-semibold">¡Meta alcanzada!</span>
              </div>
            )}
          </div>

          {/* Observation */}
          <div className="mb-6">
            <label htmlFor="obs" className="block text-sm font-semibold text-gray-700 mb-2">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="obs"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all resize-none"
              rows={2}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Notas sobre la producción..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!realNum || realNum <= 0}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterRealModal;
