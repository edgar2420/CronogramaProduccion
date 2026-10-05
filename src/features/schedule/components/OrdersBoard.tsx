import React, { useEffect, useRef, useState } from "react";
import type { Orden, Turno, EstadoOrden } from "@/features/schedule/types";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { Plus, Trash2, Users, ClipboardCheck, Sun, SunMedium, Moon, GripVertical, CalendarX2, Lock } from "lucide-react";

// Cada turno se reconoce por un color propio (borde de la tarjeta + etiqueta)
// y siempre también por su nombre: el color nunca es la única señal.
const TURN_CONFIG: Record<Turno, { border: string; chip: string; label: string; Icon: typeof Sun }> = {
  mañana: { border: "border-l-amber-400", chip: "bg-amber-50 text-amber-800 ring-amber-200", label: "Mañana", Icon: Sun },
  tarde: { border: "border-l-orange-500", chip: "bg-orange-50 text-orange-800 ring-orange-200", label: "Tarde", Icon: SunMedium },
  noche: { border: "border-l-purple-500", chip: "bg-purple-50 text-purple-800 ring-purple-200", label: "Noche", Icon: Moon },
};

const ESTADO_CONFIG: Record<EstadoOrden, { chip: string; label: string }> = {
  borrador: { chip: "bg-slate-100 text-slate-700 ring-slate-200", label: "Borrador" },
  en_proceso: { chip: "bg-blue-50 text-blue-800 ring-blue-200", label: "En proceso" },
  terminada: { chip: "bg-green-50 text-green-800 ring-green-200", label: "Terminada" },
  cancelada: { chip: "bg-rose-50 text-rose-800 ring-rose-200", label: "Cancelada" },
};

const TURNOS: Turno[] = ["mañana", "tarde", "noche"];

const fmtNum = (n: number) => n.toLocaleString("es", { maximumFractionDigits: 2 });

// Un lote terminado o cancelado ya es historia de la planta: no se reprograma
// arrastrándolo. Se sigue pudiendo abrir para ver su detalle.
function isMovable(o: Orden) {
  return o.estado !== "terminada" && o.estado !== "cancelada";
}

// id de un carril (día + turno) como zona donde soltar.
const laneId = (fecha: string, turno: Turno) => `${fecha}|${turno}`;
function parseLaneId(id: string): { fecha: string; turno: Turno } {
  const [fecha, turno] = id.split("|");
  return { fecha, turno: turno as Turno };
}

type CardHandlers = {
  onInfo: (o: Orden) => void;
  onRegister: (o: Orden) => void;
  onAssign: (o: Orden) => void;
  onDelete: (o: Orden) => void;
};

type Props = CardHandlers & {
  days: Date[];
  canEdit: boolean;
  /** false cuando la semana está cerrada: se ve, pero no se reprograma. */
  canMove: boolean;
  getOrders: (dayKey: string) => Orden[];
  onAdd: (dayKey: string) => void;
  onMove: (o: Orden, fecha: string, turno: Turno) => void;
};

export default function OrdersBoard({
  days, canEdit, canMove, getOrders,
  onAdd, onMove, onInfo, onRegister, onAssign, onDelete
}: Props) {
  const dragEnabled = canEdit && canMove;
  const [dragging, setDragging] = useState<Orden | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayKey = dayjs().format("YYYY-MM-DD");

  // La distancia mínima deja que un click en los botones de la tarjeta siga
  // siendo un click; en táctil, mantener presionado inicia el arrastre para
  // no pelear con el scroll horizontal del tablero.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  // En pantallas angostas (tablet) el tablero se desplaza de lado: al abrir
  // una semana que incluye hoy, arranca mostrando el día de hoy.
  const weekKey = days[0]?.toISOString();
  useEffect(() => {
    const container = scrollRef.current;
    const today = container?.querySelector<HTMLElement>("[data-today='true']");
    if (!container || !today) return;
    container.scrollLeft = today.offsetLeft - container.offsetLeft;
  }, [weekKey]);

  const handlers: CardHandlers = { onInfo, onRegister, onAssign, onDelete };

  const handleDragStart = (e: DragStartEvent) => {
    setDragging((e.active.data.current?.orden as Orden | undefined) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const orden = e.active.data.current?.orden as Orden | undefined;
    if (!orden || !e.over) return;
    const { fecha, turno } = parseLaneId(String(e.over.id));
    if (fecha === orden.fecha && turno === orden.turno) return;
    onMove(orden, fecha, turno);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
      // Los carriles vacíos aparecen recién al empezar a arrastrar y mueven el
      // layout: hay que volver a medir las zonas, no usar las del inicio.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      {dragEnabled && (
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <GripVertical size={14} />
          Arrastra una orden a otro día o turno para reprogramarla.
        </p>
      )}
      {canEdit && !canMove && (
        <p className="text-xs text-slate-600 mb-3 flex items-center gap-1.5">
          <Lock size={14} />
          Semana cerrada: es histórico y sus órdenes ya no se pueden reprogramar.
        </p>
      )}

      <div ref={scrollRef} className="overflow-x-auto snap-x snap-mandatory -mx-2 px-2 pb-2">
        <div className="grid grid-flow-col auto-cols-[minmax(140px,1fr)] gap-3">
          {days.map(d => {
            const fecha = d.toISOString().slice(0, 10);
            const ordenes = getOrders(fecha);
            const isToday = fecha === todayKey;

            return (
              <section
                key={fecha}
                data-today={isToday}
                aria-label={dayjs(d).format("dddd D [de] MMMM")}
                className={`snap-start flex flex-col gap-3 rounded-2xl p-2 ${isToday ? "bg-primary-50 ring-2 ring-primary-300" : "bg-slate-50"}`}
              >
                <header className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-slate-200">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {dayjs(d).format("ddd")}
                    </p>
                    <p className="text-slate-900">
                      <span className="text-2xl font-bold">{dayjs(d).format("D")}</span>{" "}
                      <span className="text-sm text-slate-500">{dayjs(d).format("MMM")}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {isToday && <span className="font-semibold text-primary-700">Hoy · </span>}
                      {ordenes.length === 0 ? "Sin órdenes" : `${ordenes.length} ${ordenes.length === 1 ? "orden" : "órdenes"}`}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => onAdd(fecha)}
                      className="shrink-0 w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 transition-colors"
                      aria-label={`Nueva orden el ${dayjs(d).format("dddd D [de] MMMM")}`}
                      title="Nueva orden"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </header>

                {TURNOS.map(turno => (
                  <TurnLane
                    key={turno}
                    fecha={fecha}
                    turno={turno}
                    ordenes={ordenes.filter(o => o.turno === turno)}
                    canEdit={canEdit}
                    dragEnabled={dragEnabled}
                    draggingId={dragging?.id ?? null}
                    handlers={handlers}
                  />
                ))}

                {ordenes.length === 0 && !dragging && (
                  <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <CalendarX2 size={20} className="mb-1" />
                    <span className="text-xs">Sin órdenes</span>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="rotate-2 shadow-2xl rounded-xl cursor-grabbing">
            <OrderCard orden={dragging} canEdit={canEdit} {...handlers} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}


function TurnLane({ fecha, turno, ordenes, canEdit, dragEnabled, draggingId, handlers }: {
  fecha: string;
  turno: Turno;
  ordenes: Orden[];
  canEdit: boolean;
  dragEnabled: boolean;
  draggingId: string | null;
  handlers: CardHandlers;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: laneId(fecha, turno), disabled: !dragEnabled });
  const { Icon, label } = TURN_CONFIG[turno];
  const isDragging = draggingId !== null;

  // Fuera de un arrastre, un carril vacío no ocupa espacio.
  if (ordenes.length === 0 && !isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-xl transition-colors duration-150 ${isDragging ? "p-1.5 -m-1.5" : ""} ${isOver ? "bg-primary-100 ring-2 ring-primary-400" : isDragging ? "bg-white/60" : ""}`}
    >
      {isDragging && (
        <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-600">
          <Icon size={12} />
          {label}
        </div>
      )}

      {ordenes.map(o => (
        <DraggableCard
          key={o.id}
          orden={o}
          canEdit={canEdit}
          disabled={!dragEnabled || !isMovable(o)}
          ghost={o.id === draggingId}
          handlers={handlers}
        />
      ))}

      {ordenes.length === 0 && (
        <div className={`h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-medium ${isOver ? "border-primary-400 text-primary-700" : "border-slate-300 text-slate-400"}`}>
          Soltar aquí
        </div>
      )}
    </div>
  );
}


function DraggableCard({ orden, canEdit, disabled, ghost, handlers }: {
  orden: Orden;
  canEdit: boolean;
  disabled: boolean;
  ghost: boolean;
  handlers: CardHandlers;
}) {
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: orden.id,
    data: { orden },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-xl ${disabled ? "" : "cursor-grab"} ${ghost ? "opacity-30" : ""}`}
    >
      <OrderCard orden={orden} canEdit={canEdit} {...handlers} />
    </div>
  );
}


function OrderCard({ orden: o, canEdit, onInfo, onRegister, onAssign, onDelete }: CardHandlers & { orden: Orden, canEdit: boolean }) {
  const turno = TURN_CONFIG[o.turno];
  const estado = ESTADO_CONFIG[o.estado] ?? ESTADO_CONFIG.borrador;
  const cancelada = o.estado === "cancelada";
  const progreso = o.real ? Math.min((o.real / o.planificado) * 100, 100) : 0;

  const acciones = [
    !cancelada && { key: "reg", label: "Registrar", Icon: ClipboardCheck, onClick: () => onRegister(o), className: "text-emerald-700 hover:bg-emerald-50" },
    canEdit && { key: "asig", label: "Asignar", Icon: Users, onClick: () => onAssign(o), className: "text-primary-700 hover:bg-primary-50" },
    canEdit && { key: "del", label: "Eliminar", Icon: Trash2, onClick: () => onDelete(o), className: "text-rose-700 hover:bg-rose-50" },
  ].filter(Boolean) as { key: string; label: string; Icon: typeof Users; onClick: () => void; className: string }[];

  return (
    <article className={`@container bg-white rounded-xl border border-slate-200 border-l-4 ${turno.border} shadow-sm hover:shadow-md transition-shadow ${cancelada ? "opacity-75" : ""}`}>
      <div className="p-3 space-y-2">
        {/* El nombre abre el detalle: es el área de click más grande de la tarjeta. */}
        <button
          type="button"
          onClick={() => onInfo(o)}
          className={`block w-full text-left text-sm font-semibold leading-snug text-slate-900 line-clamp-2 break-words hyphens-auto rounded hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${cancelada ? "line-through decoration-slate-400" : ""}`}
          title={`${o.productoNombre} — ver detalle`}
        >
          {o.productoNombre}
        </button>

        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${turno.chip}`}>
            <turno.Icon size={12} />
            {turno.label}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${estado.chip}`}>
            {estado.label}
          </span>
        </div>

        {(o.numeroLote || o.opCode) && (
          <p className="text-xs text-slate-500 truncate" title={[o.numeroLote && `Lote ${o.numeroLote}`, o.opCode && `O.P. ${o.opCode}`].filter(Boolean).join(" · ")}>
            {o.numeroLote && <>Lote <span className="font-medium text-slate-700">{o.numeroLote}</span></>}
            {o.numeroLote && o.opCode && " · "}
            {o.opCode && <>O.P. <span className="font-medium text-slate-700">{o.opCode}</span></>}
          </p>
        )}

        <div className="flex items-baseline justify-between gap-2 text-xs text-slate-500">
          <span>Plan <span className="text-sm font-semibold text-slate-900 tabular-nums">{fmtNum(o.planificado)}</span></span>
          <span>Real <span className="text-sm font-semibold text-slate-900 tabular-nums">{o.real != null ? fmtNum(o.real) : "—"}</span></span>
        </div>

        {o.real != null && (
          <div
            className="h-1.5 bg-slate-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progreso)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Cumplimiento"
          >
            <div className="h-full bg-emerald-500" style={{ width: `${progreso}%` }} />
          </div>
        )}
      </div>

      {acciones.length > 0 && (
        <div className="grid border-t border-slate-100" style={{ gridTemplateColumns: `repeat(${acciones.length}, minmax(0, 1fr))` }}>
          {acciones.map(({ key, label, Icon, onClick, className }, i) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={`min-h-11 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 ${i > 0 ? "border-l border-slate-100" : ""} ${i === 0 ? "rounded-bl-xl" : ""} ${i === acciones.length - 1 ? "rounded-br-xl" : ""} ${className}`}
              aria-label={`${label} — ${o.productoNombre}`}
              title={label}
            >
              <Icon size={15} />
              {/* En columnas angostas (laptop con la semana completa) queda solo el
                  ícono; el nombre sigue en aria-label y en el title. */}
              <span className="hidden @[11rem]:block">{label}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
