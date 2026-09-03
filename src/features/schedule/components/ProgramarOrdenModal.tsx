import React, { useEffect, useRef, useState } from "react";
import type { Turno } from "@/features/schedule/types";
import type { ItemCatalogo } from "@/features/schedule/catalogoProductos";
import {
  X, Clock, TrendingUp,
  Sun, SunMedium, Moon, CheckCircle2, Sparkles,
  Pill, CalendarDays, Search, ChevronDown, FlaskConical, PackageOpen, Hash, FileText
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  fecha: string;
  turno: Turno;
  catalogo: ItemCatalogo[];
  onSave: (data: {
    fecha: string;
    turno: Turno;
    productoId: string;
    productoNombre: string;
    planificado: number;
    opCode?: string;
    numeroLote?: string;
  }) => void;
};

const TURNOS: Turno[] = ["mañana", "tarde", "noche"];

// Turno configuration
const TURNO_CONFIG: Record<Turno, { gradient: string; icon: React.ReactNode; label: string; color: string }> = {
  mañana: {
    gradient: "from-sky-400 via-sky-500 to-cyan-600",
    icon: <Sun size={16} />,
    label: "Mañana",
    color: "amber"
  },
  tarde: {
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    icon: <SunMedium size={16} />,
    label: "Tarde",
    color: "orange"
  },
  noche: {
    gradient: "from-blue-800 via-blue-900 to-slate-900",
    icon: <Moon size={16} />,
    label: "Noche",
    color: "purple"
  },
};

export default function ProgramarOrdenModal({ open, onClose, fecha, turno, catalogo, onSave }: Props) {

  const [selectedDate, setSelectedDate] = useState(fecha);
  const [selectedTurno, setSelectedTurno] = useState<Turno>(turno);
  const [productoId, setProductoId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [planificadoStr, setPlanificadoStr] = useState("");
  const [opCode, setOpCode] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const producto = catalogo?.find(p => p.id === productoId);
  const canSave = producto && Number(planificadoStr) > 0;

  // Filter products based on search query
  const filteredProducts = catalogo.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setSelectedDate(fecha);
      setSelectedTurno(turno);
      setProductoId("");
      setSearchQuery("");
      setShowDropdown(false);
      setPlanificadoStr("");
      setOpCode("");
      setNumeroLote("");
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (productoId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [productoId]);

  if (!open) return null;

  const guardar = () => {
    if (!canSave) return;
    onSave({
      fecha: selectedDate,
      turno: selectedTurno,
      productoId: producto!.id,
      productoNombre: producto!.nombre,
      planificado: Number(planificadoStr),
      opCode: opCode.trim() || undefined,
      numeroLote: numeroLote.trim() || undefined,
    });
    onClose();
  };

  const turnoConfig = TURNO_CONFIG[selectedTurno];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">

        {/* HEADER with gradient based on turno */}
        <div className={`px-6 py-5 bg-gradient-to-r ${turnoConfig.gradient} text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Pill size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nueva Orden de Producción</h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm opacity-90">Configure los detalles de la orden</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-lg text-xs font-semibold backdrop-blur-sm">
                    <CalendarDays size={12} />
                    {new Date(selectedDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">

          {/* Turno Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
              <Clock size={16} className="text-blue-600" />
              Seleccione el Turno
            </label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {TURNOS.map(t => {
                const config = TURNO_CONFIG[t];
                const isSelected = selectedTurno === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTurno(t)}
                    className={`px-4 py-4 rounded-xl font-medium text-sm transition-all flex flex-col items-center gap-2 ${isSelected
                      ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-105`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200"
                      }`}
                  >
                    {config.icon}
                    <span className="text-sm font-semibold">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Producto Section */}
          <div className="space-y-2" ref={dropdownRef}>
            <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
              <Pill size={16} className="text-blue-600" />
              Producto
            </label>

            {/* Searchable Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchRef}
                type="text"
                value={producto ? producto.nombre : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setProductoId("");
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar producto..."
                className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-10 py-3 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              />
              <ChevronDown
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                size={18}
              />

              {/* Dropdown List */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductoId(p.id);
                        setSearchQuery(p.nombre);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3 group"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Pill size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 group-hover:text-blue-700">{p.nombre}</p>
                        <div className="flex gap-2 mt-1">
                          {p.vol && <span className="text-xs text-gray-500">Vol: {p.vol}</span>}
                          {p.envase && <span className="text-xs text-gray-500">• Envase: {p.envase}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showDropdown && searchQuery && filteredProducts.length === 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 text-center">
                  <p className="text-gray-500 text-sm">No se encontraron productos</p>
                </div>
              )}
            </div>

            {/* Product Info Card */}
            {producto && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-3 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white">
                    <Pill size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-2">{producto.nombre}</h4>
                    <div className="flex gap-2 flex-wrap">
                      {producto.vol && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-700 text-xs font-semibold shadow-sm">
                          <FlaskConical size={12} />
                          Vol: {producto.vol}
                        </span>
                      )}
                      {producto.envase && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-700 text-xs font-semibold shadow-sm">
                          <PackageOpen size={12} />
                          Envase: {producto.envase}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registro de fabricación (opcional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                <FileText size={16} className="text-blue-600" />
                O.P. <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={opCode}
                onChange={e => setOpCode(e.target.value)}
                placeholder="Ej. 1005"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                <Hash size={16} className="text-blue-600" />
                Nº de Lote <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={numeroLote}
                onChange={e => setNumeroLote(e.target.value)}
                placeholder="Ej. 1020266"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Planificado Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
              <TrendingUp size={16} className="text-blue-600" />
              Cantidad Planificada (unidades)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={planificadoStr}
                onChange={e => setPlanificadoStr(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej. 15000"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-semibold"
              />
              {planificadoStr && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
            {planificadoStr && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <TrendingUp size={14} className="text-emerald-600" />
                {Number(planificadoStr).toLocaleString()} unidades programadas
              </p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t-2 bg-gradient-to-br from-gray-50 to-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {canSave ? "✓ Listo para guardar" : "Complete todos los campos"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all hover:shadow-md">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!canSave}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${canSave
                ? `bg-gradient-to-r ${turnoConfig.gradient} text-white hover:shadow-lg hover:scale-105 active:scale-95`
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}>
              <CheckCircle2 size={18} />
              Guardar Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
