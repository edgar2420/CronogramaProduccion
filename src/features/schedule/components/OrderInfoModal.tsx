import React, { useEffect, useState, useMemo, useRef } from "react";
import type { Orden, EstadoOrden, Turno } from "@/features/schedule/types";
import type { ItemCatalogo } from "@/features/schedule/catalogoProductos";
import {
  X, Calendar, Clock, MapPin, Pill, Search,
  BarChart3, Users, CheckCircle2, FileEdit,
  PlayCircle, TrendingUp, Sun, SunMedium, Moon, ChevronDown,
  Hash, FileText, CalendarClock, XCircle, AlertTriangle
} from "lucide-react";

type Editable = Pick<Orden, "productoNombre" | "planificado" | "estado">;

type Props = {
  open: boolean;
  order: Orden | null;
  catalogo?: ItemCatalogo[];
  canEdit?: boolean;
  /** Staff.id -> nombre. Un id sin entrada se muestra tal cual, no se oculta. */
  staffNames?: Map<string, string>;
  onClose: () => void;
  onSave: (patch: Editable) => void;
  /** Cancela el lote (motivo obligatorio, trazado en el audit_log). */
  onCancel?: (motivo: string) => void;
};

// El estado "cancelada" no forma parte del selector genérico: cancelar exige
// un motivo y pasa por su propio flujo (ver bloque "Cancelar orden" abajo).
const ESTADOS: { value: EstadoOrden; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "borrador", label: "Borrador", color: "bg-amber-500", icon: <FileEdit size={14} /> },
  { value: "en_proceso", label: "En Proceso", color: "bg-blue-500", icon: <PlayCircle size={14} /> },
  { value: "terminada", label: "Terminada", color: "bg-green-600", icon: <CheckCircle2 size={14} /> },
];

const ESTADO_CANCELADA = { label: "Cancelada", color: "bg-rose-600", icon: <XCircle size={14} /> };

// Configuración de colores por turno
const TURNO_COLORS: Record<Turno, { gradient: string; textSecondary: string; icon: React.ReactNode }> = {
  mañana: {
    gradient: "from-sky-400 via-sky-500 to-cyan-600",
    textSecondary: "text-sky-100",
    icon: <Sun size={20} />
  },
  tarde: {
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    textSecondary: "text-blue-100",
    icon: <SunMedium size={20} />
  },
  noche: {
    gradient: "from-blue-800 via-blue-900 to-slate-900",
    textSecondary: "text-blue-200",
    icon: <Moon size={20} />
  },
};

export default function OrderInfoModal({ open, order, catalogo = [], canEdit = false, staffNames, onClose, onSave, onCancel }: Props) {

  const [form, setForm] = useState({
    productoNombre: "",
    planificadoStr: "",
    estado: "borrador" as EstadoOrden
  });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  // Estado para búsqueda de productos
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);

  // Productos filtrados por búsqueda
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return catalogo;
    const search = productSearch.toLowerCase();
    return catalogo.filter(p =>
      p.nombre.toLowerCase().includes(search) ||
      (p.envase && p.envase.toLowerCase().includes(search)) ||
      (p.vol && p.vol.toLowerCase().includes(search))
    );
  }, [catalogo, productSearch]);

  useEffect(() => {
    if (open && order) {
      setForm({
        productoNombre: order.productoNombre ?? "",
        planificadoStr: order.planificado ? String(order.planificado) : "",
        estado: order.estado,
      });
      setProductSearch("");
      setIsProductDropdownOpen(false);
      setMotivoCancelacion("");
      setShowCancelForm(false);
    }
  }, [open, order]);

  if (!open || !order) return null;

  const isCancelada = order.estado === "cancelada";
  const canSave = canEdit && !isCancelada && form.productoNombre.trim() !== "" && Number(form.planificadoStr) > 0;
  const selected = catalogo.find(p => p.nombre === form.productoNombre);
  const progreso = order.real ? Math.min((order.real / order.planificado) * 100, 100) : 0;
  const estadoActual = isCancelada ? ESTADO_CANCELADA : ESTADOS.find(e => e.value === order.estado) || ESTADOS[0];
  const turnoConfig = TURNO_COLORS[order.turno] || TURNO_COLORS.mañana;

  function handleSave() {
    if (!canSave) return;
    onSave({
      productoNombre: form.productoNombre.trim(),
      planificado: Number(form.planificadoStr),
      estado: form.estado
    });
  }

  function handleCancelar() {
    if (!onCancel || motivoCancelacion.trim().length < 3) return;
    onCancel(motivoCancelacion.trim());
  }


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">

        {/* Header with gradient based on turno */}
        <header className={`px-6 py-5 bg-gradient-to-r ${turnoConfig.gradient} flex justify-between items-center flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {turnoConfig.icon}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Detalles de Orden</h2>
              <p className={`${turnoConfig.textSecondary} text-sm mt-0.5`}>{order.productoNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="text-white" size={24} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Badge Row */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white ${estadoActual.color}`}>
              {estadoActual.icon}
              {estadoActual.label}
            </span>
            {order.opCode && (
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                O.P.: {order.opCode}
              </span>
            )}
            {order.numeroLote && (
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                Lote: {order.numeroLote}
              </span>
            )}
          </div>

          {/* Registro de fabricación: identificación real del lote */}
          {(order.numeroLote || order.correlativoFabricacion || order.correlativoProduccion || order.fechaVencimiento) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {order.numeroLote && (
                <InfoCard icon={<Hash size={18} />} label="Nº de Lote" value={order.numeroLote} color="blue" />
              )}
              {order.correlativoFabricacion != null && (
                <InfoCard icon={<FileText size={18} />} label="Correlativo Fabricación" value={String(order.correlativoFabricacion)} color="purple" />
              )}
              {order.correlativoProduccion != null && (
                <InfoCard icon={<FileText size={18} />} label="Correlativo Producción" value={String(order.correlativoProduccion)} color="green" />
              )}
              {order.fechaVencimiento && (
                <InfoCard icon={<CalendarClock size={18} />} label="Fecha de Vencimiento" value={order.fechaVencimiento} color="amber" />
              )}
            </div>
          )}

          {/* Cancelada: motivo trazado, no se puede editar más */}
          {isCancelada && order.motivoCancelacion && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-rose-900 mb-1">Lote cancelado</h4>
                <p className="text-sm text-rose-700">{order.motivoCancelacion}</p>
              </div>
            </div>
          )}

          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <InfoCard icon={<Calendar size={18} />} label="Fecha" value={order.fecha} color="blue" />
            <InfoCard icon={<Clock size={18} />} label="Turno" value={order.turno.toUpperCase()} color="purple" />
            <InfoCard icon={<MapPin size={18} />} label="Área" value={order.areaId.replace(/_/g, ' ')} color="green" />
            <InfoCard
              icon={<Users size={18} />}
              label="Asignados"
              value={order.asignados.length > 0 ? `${order.asignados.length} personas` : "Sin asignar"}
              color="amber"
            />
          </div>

          {/* Production Stats */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-800">Producción</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Planificado</p>
                <p className="text-2xl font-black text-gray-900">{order.planificado.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Real</p>
                <p className={`text-2xl font-black ${order.real ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {order.real?.toLocaleString() ?? "—"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Diferencia</p>
                <p className={`text-2xl font-black ${order.real
                  ? order.real >= order.planificado ? 'text-emerald-600' : 'text-rose-500'
                  : 'text-gray-400'
                  }`}>
                  {order.real ? (order.real - order.planificado).toLocaleString() : "—"}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                  <TrendingUp size={14} />
                  Progreso
                </span>
                <span className="text-lg font-black text-gray-900">{progreso.toFixed(0)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${progreso >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                  style={{ width: `${Math.min(progreso, 100)}%` }}
                />
              </div>
            </div>

            {(order.fechaInicioReal || order.fechaFinReal) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                <CalendarClock size={16} className="text-gray-400" />
                <span>
                  Cumplido: {order.fechaInicioReal?.slice(0, 10) ?? "—"}
                  {order.fechaFinReal && order.fechaFinReal.slice(0, 10) !== order.fechaInicioReal?.slice(0, 10)
                    ? ` → ${order.fechaFinReal.slice(0, 10)}`
                    : ""}
                </span>
              </div>
            )}
          </div>

          {/* Assigned Staff */}
          {order.asignados.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Users size={16} />
                Personal Asignado
              </h4>
              <div className="flex flex-wrap gap-2">
                {order.asignados.map((staffId) => (
                  <span key={staffId} className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-blue-800 shadow-sm border border-blue-100">
                    {staffNames?.get(staffId) ?? staffId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Edit Section - Only for Admin, y no sobre un lote ya cancelado */}
          {canEdit && !isCancelada && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FileEdit size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Editar Orden</h4>
                  <p className="text-sm text-gray-500">Modifica los detalles de esta orden</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Producto Select with Search */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Pill size={14} className="text-blue-500" />
                    Producto
                  </label>
                  <div className="relative">
                    {/* Search Input */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        ref={productInputRef}
                        type="text"
                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Buscar producto..."
                        value={isProductDropdownOpen ? productSearch : form.productoNombre}
                        onChange={e => {
                          setProductSearch(e.target.value);
                          if (!isProductDropdownOpen) setIsProductDropdownOpen(true);
                        }}
                        onFocus={() => setIsProductDropdownOpen(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronDown size={18} className={`text-gray-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Dropdown List */}
                    {isProductDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No se encontraron productos
                          </div>
                        ) : (
                          filteredProducts.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, productoNombre: p.nombre }));
                                setProductSearch("");
                                setIsProductDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between ${form.productoNombre === p.nombre ? 'bg-blue-50 text-blue-700' : 'text-gray-800'
                                }`}
                            >
                              <span className="font-medium text-sm truncate">{p.nombre}</span>
                              {p.vol && <span className="text-xs text-gray-400 ml-2">{p.vol}</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Click outside to close */}
                    {isProductDropdownOpen && (
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsProductDropdownOpen(false)}
                      />
                    )}
                  </div>
                </div>

                {/* Planificado Input */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <TrendingUp size={14} className="text-emerald-500" />
                    Cantidad Planificada
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                      type="text"
                      value={form.planificadoStr}
                      onChange={e => setForm(f => ({ ...f, planificadoStr: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Ej: 1000"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">
                      unidades
                    </div>
                  </div>
                </div>

                {/* Estado Select */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 size={14} className="text-sky-500" />
                    Estado
                  </label>
                  <div className="flex gap-2">
                    {ESTADOS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, estado: s.value }))}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-semibold text-xs transition-all
                          ${form.estado === s.value
                            ? `${s.color} text-white shadow-lg scale-105`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {s.icon}
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected product info */}
              {selected && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill size={14} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Información del Producto</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.vol && <Tag label={`Volumen: ${selected.vol}`} />}
                    {selected.envase && <Tag label={`Envase: ${selected.envase}`} />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancelar orden: propio flujo, motivo obligatorio y trazado. No
              disponible sobre un estado "terminada" ni ya cancelado. */}
          {canEdit && onCancel && !isCancelada && order.estado !== "terminada" && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              {!showCancelForm ? (
                <button
                  type="button"
                  onClick={() => setShowCancelForm(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  <XCircle size={16} />
                  Cancelar este lote
                </button>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-rose-900 mb-2">
                    <AlertTriangle size={14} />
                    Motivo de cancelación (obligatorio)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border-2 border-rose-200 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                    rows={2}
                    value={motivoCancelacion}
                    onChange={e => setMotivoCancelacion(e.target.value)}
                    placeholder="Ej: problema mecánico en la máquina, se cancela por instrucción de..."
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => { setShowCancelForm(false); setMotivoCancelacion(""); }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelar}
                      disabled={motivoCancelacion.trim().length < 3}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Confirmar cancelación
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - always visible */}
        <footer className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-gray-500">
            Creado: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cerrar
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="btn-primary"
              >
                Guardar Cambios
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}


function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-sky-50 text-sky-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  }[color] || "bg-gray-50 text-gray-600";

  return (
    <div className={`p-4 rounded-xl ${colorClasses}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider font-bold opacity-80">{label}</span>
      </div>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 bg-white border border-primary-200 rounded-md text-primary-700 text-xs font-medium shadow-sm">
      {label}
    </span>
  );
}
