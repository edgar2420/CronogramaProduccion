import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import type { Orden, EstadoOrden } from "@/features/schedule/types";
import type { ItemCatalogo } from "@/features/schedule/catalogoProductos";
import Modal from "@/components/ui/Modal";
import { Pill, AlertCircle, AlertTriangle, Loader2, XCircle, Users, ChevronDown } from "lucide-react";

type Editable = Pick<Orden, "productoNombre" | "planificado" | "estado">;

type Props = {
  open: boolean;
  order: Orden | null;
  catalogo?: ItemCatalogo[];
  canEdit?: boolean;
  /** Staff.id -> nombre. Un id sin entrada se muestra tal cual, no se oculta. */
  staffNames?: Map<string, string>;
  onClose: () => void;
  /** Si el servidor rechaza el cambio, el error se muestra en el modal. */
  onSave: (patch: Editable) => Promise<void> | void;
  /** Cancela el lote (motivo obligatorio, trazado en el audit_log). */
  onCancel?: (motivo: string) => Promise<void> | void;
};

// "cancelada" no está en el selector: cancelar exige un motivo y tiene su
// propio flujo al final del modal.
const ESTADOS: { value: EstadoOrden; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "en_proceso", label: "En proceso" },
  { value: "terminada", label: "Terminada" },
];

const ESTADO_CHIP: Record<EstadoOrden, string> = {
  borrador: "bg-slate-100 text-slate-700 ring-slate-200",
  en_proceso: "bg-blue-50 text-blue-800 ring-blue-200",
  terminada: "bg-green-50 text-green-800 ring-green-200",
  cancelada: "bg-rose-50 text-rose-800 ring-rose-200",
};
const ESTADO_LABEL: Record<EstadoOrden, string> = { borrador: "Borrador", en_proceso: "En proceso", terminada: "Terminada", cancelada: "Cancelada" };

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900 break-words">{children}</dd>
    </div>
  );
}

export default function OrderInfoModal({ open, order, catalogo = [], canEdit = false, staffNames, onClose, onSave, onCancel }: Props) {
  const [productoNombre, setProductoNombre] = useState("");
  const [planificadoStr, setPlanificadoStr] = useState("");
  const [estado, setEstado] = useState<EstadoOrden>("borrador");
  const [motivo, setMotivo] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !order) return;
    setProductoNombre(order.productoNombre ?? "");
    setPlanificadoStr(order.planificado ? String(order.planificado) : "");
    setEstado(order.estado);
    setMotivo("");
    setShowCancel(false);
    setError(null);
  }, [open, order]);

  if (!order) return null;

  const isCancelada = order.estado === "cancelada";
  const editable = canEdit && !isCancelada;
  const cambio = productoNombre !== order.productoNombre || Number(planificadoStr) !== order.planificado || estado !== order.estado;
  const progreso = order.real ? Math.min((order.real / order.planificado) * 100, 100) : 0;
  const fechaLarga = dayjs(order.fecha).locale("es").format("dddd D [de] MMMM YYYY");

  async function run(action: () => Promise<void> | void, fallback: string) {
    setError(null);
    setSaving(true);
    try {
      await action();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setSaving(false);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!productoNombre.trim()) return setError("Elige el producto.");
    if (!(Number(planificadoStr) > 0)) return setError("La cantidad planificada debe ser mayor a 0.");
    run(() => onSave({ productoNombre: productoNombre.trim(), planificado: Number(planificadoStr), estado }), "No se pudo guardar la orden");
  }

  function cancelarLote() {
    if (!onCancel) return;
    if (motivo.trim().length < 3) return setError("Escribe el motivo de la cancelación (mínimo 3 caracteres).");
    run(() => onCancel(motivo.trim()), "No se pudo cancelar el lote");
  }

  // El producto actual puede no estar en el catálogo activo del área
  // (desactivado después): se ofrece igual para no cambiarlo sin querer.
  const opciones = catalogo.some(p => p.nombre === order.productoNombre)
    ? catalogo
    : [{ id: "__actual", codigo: "", nombre: order.productoNombre }, ...catalogo];

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      icon={<Pill size={20} />}
      title={order.productoNombre}
      description={`${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} · turno ${order.turno} · ${order.areaId.replace(/_/g, " ")}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cerrar</button>
          {editable && (
            <button type="submit" form="orden-detalle" className="btn-primary" disabled={saving || !cambio}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Guardar cambios
            </button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div role="alert" className="form-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className={`tag ${ESTADO_CHIP[order.estado]}`}>{ESTADO_LABEL[order.estado]}</span>
          {order.numeroLote && <span className="tag bg-white text-slate-700 ring-slate-200">Lote {order.numeroLote}</span>}
          {order.opCode && <span className="tag bg-white text-slate-700 ring-slate-200">O.P. {order.opCode}</span>}
        </div>

        {isCancelada && order.motivoCancelacion && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-rose-900 text-sm">Lote cancelado</p>
              <p className="text-sm text-rose-800">{order.motivoCancelacion}</p>
            </div>
          </div>
        )}

        <section aria-labelledby="sec-prod">
          <h3 id="sec-prod" className="text-sm font-semibold text-slate-900 mb-3">Producción</h3>
          <dl className="grid grid-cols-3 gap-4">
            <Dato label="Planificado">{order.planificado.toLocaleString("es")}</Dato>
            <Dato label="Real">{order.real != null ? order.real.toLocaleString("es") : "—"}</Dato>
            <Dato label="Diferencia">
              {order.real != null ? (
                <span className={order.real >= order.planificado ? "text-emerald-700" : "text-rose-700"}>
                  {(order.real - order.planificado).toLocaleString("es")}
                </span>
              ) : "—"}
            </Dato>
          </dl>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progreso >= 100 ? "bg-emerald-500" : "bg-primary-500"}`} style={{ width: `${progreso}%` }} />
            </div>
            <span className="text-sm font-semibold tabular-nums text-slate-900">{progreso.toFixed(0)}%</span>
          </div>
          {(order.fechaInicioReal || order.fechaFinReal) && (
            <p className="mt-2 text-xs text-slate-500">
              Cumplido: {order.fechaInicioReal?.slice(0, 10) ?? "—"}
              {order.fechaFinReal && order.fechaFinReal.slice(0, 10) !== order.fechaInicioReal?.slice(0, 10) ? ` → ${order.fechaFinReal.slice(0, 10)}` : ""}
            </p>
          )}
          {order.observaciones && <p className="mt-2 text-sm text-slate-600">{order.observaciones}</p>}
        </section>

        {(order.correlativoFabricacion != null || order.correlativoProduccion != null || order.fechaVencimiento) && (
          <section aria-labelledby="sec-reg">
            <h3 id="sec-reg" className="text-sm font-semibold text-slate-900 mb-3">Registro de fabricación</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {order.correlativoFabricacion != null && <Dato label="Correlativo de fabricación">{order.correlativoFabricacion}</Dato>}
              {order.correlativoProduccion != null && <Dato label="Correlativo de producción">{order.correlativoProduccion}</Dato>}
              {order.fechaVencimiento && <Dato label="Vencimiento">{order.fechaVencimiento}</Dato>}
            </dl>
          </section>
        )}

        <section aria-labelledby="sec-pers">
          <h3 id="sec-pers" className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-slate-500" /> Personal asignado
          </h3>
          {order.asignados.length === 0 ? (
            <p className="text-sm text-slate-500">Sin asignar.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {order.asignados.map(id => (
                <span key={id} className="tag bg-primary-50 text-primary-800 ring-primary-200">{staffNames?.get(id) ?? id}</span>
              ))}
            </div>
          )}
        </section>

        {editable && (
          <form id="orden-detalle" onSubmit={guardar} noValidate className="border-t border-slate-200 pt-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-900">Editar orden</h3>
            <div className="form-grid">
              <div className="field sm:col-span-2">
                <label htmlFor="det-producto" className="label">Producto</label>
                <select id="det-producto" className="select" value={productoNombre} onChange={e => setProductoNombre(e.target.value)}>
                  {opciones.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="det-cantidad" className="label">Cantidad planificada</label>
                <input
                  id="det-cantidad"
                  inputMode="numeric"
                  className="input tabular-nums"
                  value={planificadoStr}
                  onChange={e => setPlanificadoStr(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <fieldset className="field">
                <legend className="label mb-1.5">Estado</legend>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map(s => (
                    <label key={s.value} className="choice">
                      <input type="radio" name="det-estado" checked={estado === s.value} onChange={() => setEstado(s.value)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </form>
        )}

        {/* Cancelar el lote: flujo aparte, con motivo obligatorio y trazado. */}
        {canEdit && onCancel && !isCancelada && order.estado !== "terminada" && (
          <section className="border-t border-slate-200 pt-5">
            {!showCancel ? (
              <button type="button" onClick={() => setShowCancel(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-800 min-h-10">
                <XCircle size={16} />
                Cancelar este lote
                <ChevronDown size={14} />
              </button>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                <div className="field">
                  <label htmlFor="det-motivo" className="label text-rose-900">Motivo de la cancelación</label>
                  <textarea
                    id="det-motivo"
                    className="input min-h-20 border-rose-200"
                    rows={2}
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej. Problema mecánico en la máquina; se cancela por instrucción de jefatura"
                    autoFocus
                  />
                  <p className="field-hint">El lote no se borra: queda como cancelado con este motivo en la auditoría.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button type="button" className="btn-secondary" onClick={() => { setShowCancel(false); setMotivo(""); }} disabled={saving}>Volver</button>
                  <button type="button" className="btn-danger" onClick={cancelarLote} disabled={saving}>
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Confirmar cancelación
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
