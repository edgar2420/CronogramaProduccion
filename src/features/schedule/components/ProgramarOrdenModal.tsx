import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import type { Turno } from "@/features/schedule/types";
import type { ItemCatalogo } from "@/features/schedule/catalogoProductos";
import Modal from "@/components/ui/Modal";
import { Sun, SunMedium, Moon, Pill, Search, CalendarPlus, AlertCircle, X } from "lucide-react";

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

// Mismos colores de turno que el tablero (borde de la tarjeta + etiqueta).
const TURNOS: { value: Turno; label: string; Icon: typeof Sun; on: string }[] = [
  { value: "mañana", label: "Mañana", Icon: Sun, on: "bg-amber-50 border-amber-400 text-amber-900" },
  { value: "tarde", label: "Tarde", Icon: SunMedium, on: "bg-orange-50 border-orange-500 text-orange-900" },
  { value: "noche", label: "Noche", Icon: Moon, on: "bg-purple-50 border-purple-500 text-purple-900" },
];

const FORM_ID = "programar-orden";

export default function ProgramarOrdenModal({ open, onClose, fecha, turno, catalogo, onSave }: Props) {
  const [selectedTurno, setSelectedTurno] = useState<Turno>(turno);
  const [productoId, setProductoId] = useState("");
  const [query, setQuery] = useState("");
  const [planificadoStr, setPlanificadoStr] = useState("");
  const [opCode, setOpCode] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    setSelectedTurno(turno);
    setProductoId("");
    setQuery("");
    setPlanificadoStr("");
    setOpCode("");
    setNumeroLote("");
    setError(null);
  }, [open, turno]);

  const producto = catalogo.find(p => p.id === productoId);
  const fechaLarga = dayjs(fecha).locale("es").format("dddd D [de] MMMM YYYY");

  const resultados = useMemo(() => {
    const t = query.trim().toLowerCase();
    return t ? catalogo.filter(p => p.nombre.toLowerCase().includes(t) || p.codigo?.toLowerCase().includes(t)) : catalogo;
  }, [catalogo, query]);

  useEffect(() => setActiveIdx(0), [query]);

  const elegir = (p: ItemCatalogo) => {
    setProductoId(p.id);
    setQuery("");
    setError(null);
    // El siguiente dato obligatorio es la cantidad.
    requestAnimationFrame(() => cantidadRef.current?.focus());
  };

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && resultados[activeIdx]) { e.preventDefault(); elegir(resultados[activeIdx]); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return setError("Elige el producto a fabricar.");
    const plan = Number(planificadoStr);
    if (!plan || plan <= 0) return setError("Indica la cantidad planificada (mayor a 0).");
    onSave({
      fecha,
      turno: selectedTurno,
      productoId: producto.id,
      productoNombre: producto.nombre,
      planificado: plan,
      opCode: opCode.trim() || undefined,
      numeroLote: numeroLote.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<CalendarPlus size={20} />}
      title="Nueva orden de producción"
      description={fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" form={FORM_ID} className="btn-primary">Programar orden</button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} className="space-y-6" noValidate>
        {error && (
          <div role="alert" className="form-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <fieldset className="field">
          <legend className="label mb-1.5">Turno</legend>
          <div className="grid grid-cols-3 gap-2">
            {TURNOS.map(({ value, label, Icon, on }) => (
              <label
                key={value}
                className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-medium cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-400 ${
                  selectedTurno === value ? on : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="turno"
                  value={value}
                  checked={selectedTurno === value}
                  onChange={() => setSelectedTurno(value)}
                  className="sr-only"
                />
                <Icon size={16} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="orden-producto" className="label">Producto</label>
          {producto ? (
            <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2.5">
              <div className="w-9 h-9 rounded-lg bg-white text-primary-700 flex items-center justify-center shrink-0">
                <Pill size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{producto.nombre}</p>
                <p className="text-xs text-slate-600 truncate">
                  {[producto.vol, producto.envase].filter(Boolean).join(" · ") || "Sin volumen ni envase registrados"}
                </p>
              </div>
              <button
                type="button"
                className="row-action"
                aria-label="Cambiar producto"
                title="Cambiar producto"
                onClick={() => { setProductoId(""); requestAnimationFrame(() => searchRef.current?.focus()); }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-300 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-300/40 overflow-hidden">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="orden-producto"
                  ref={searchRef}
                  data-autofocus
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-activedescendant={resultados[activeIdx] ? `${listId}-${activeIdx}` : undefined}
                  autoComplete="off"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onSearchKey}
                  placeholder={`Buscar entre ${catalogo.length} productos del área…`}
                  className="w-full h-11 pl-10 pr-3 text-sm focus:outline-none"
                />
              </div>
              <ul id={listId} role="listbox" aria-label="Productos" className="max-h-56 overflow-y-auto border-t border-slate-200">
                {resultados.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => elegir(p)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`px-3 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 ${i === activeIdx ? "bg-primary-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-slate-900">{p.nombre}</p>
                    {(p.vol || p.envase) && (
                      <p className="text-xs text-slate-500">{[p.vol, p.envase].filter(Boolean).join(" · ")}</p>
                    )}
                  </li>
                ))}
                {resultados.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-slate-500">Ningún producto coincide con "{query}".</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="field sm:col-span-2">
            <label htmlFor="orden-cantidad" className="label">Cantidad planificada</label>
            <div className="relative">
              <input
                id="orden-cantidad"
                ref={cantidadRef}
                inputMode="numeric"
                className="input pr-20 text-base font-semibold tabular-nums"
                value={planificadoStr}
                onChange={e => setPlanificadoStr(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej. 15000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">unidades</span>
            </div>
            {planificadoStr && (
              <p className="field-hint">{Number(planificadoStr).toLocaleString("es")} unidades</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="orden-op" className="label">O.P. <span className="label-optional">(opcional)</span></label>
            <input id="orden-op" className="input" value={opCode} onChange={e => setOpCode(e.target.value)} placeholder="Ej. 1005" />
          </div>

          <div className="field">
            <label htmlFor="orden-lote" className="label">Nº de lote <span className="label-optional">(opcional)</span></label>
            <input id="orden-lote" className="input" value={numeroLote} onChange={e => setNumeroLote(e.target.value)} placeholder="Ej. 1020266" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
