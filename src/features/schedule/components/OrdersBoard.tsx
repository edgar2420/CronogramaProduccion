import React, { useState } from "react";
import type { Orden, Turno } from "@/features/schedule/types";
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

import { Plus, Trash2, Users, Info, ClipboardCheck, Pill, Sun, SunMedium, Moon, FileEdit, CheckCircle2, PlayCircle, XCircle, GripVertical } from "lucide-react";

const TURN_CONFIG = {
  mañana: { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", badge: "#F59E0B", text: "#78350F", icon: <Sun size={14} /> },
  tarde: { bg: "linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)", badge: "#EA580C", text: "#7C2D12", icon: <SunMedium size={14} /> },
  noche: { bg: "linear-gradient(135deg, #E9D5FF 0%, #D8B4FE 100%)", badge: "#9333EA", text: "#581C87", icon: <Moon size={14} /> }
};

const TURNOS: Turno[] = ["mañana", "tarde", "noche"];

// Un lote terminado o cancelado ya es historia de la planta: no se reprograma
// arrastrándolo. Se sigue pudiendo abrir con "Info".
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

  // La distancia mínima deja que un click en los botones de la tarjeta siga
  // siendo un click; en táctil, mantener presionado inicia el arrastre para
  // no pelear con el scroll horizontal del tablero.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

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
      <div className="overflow-x-auto bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        {dragEnabled && (
          <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
            <GripVertical size={14} />
            Arrastra una orden a otro día o turno para reprogramarla.
          </p>
        )}

        <div className="grid min-w-[1400px] grid-cols-7 gap-4 text-center mb-8">
          {days.map(d => (
            <div key={d.toISOString()} className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
              <p className="uppercase tracking-wider text-gray-500 text-[10px] font-bold mb-1">
                {dayjs(d).format("dddd")}
              </p>
              <p className="text-2xl font-black text-blue-900">
                {dayjs(d).format("DD")}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {dayjs(d).format("MMM")}
              </p>
            </div>
          ))}
        </div>

        <div className="grid min-w-[1400px] grid-cols-7 gap-4">
          {days.map(d => {
            const fecha = d.toISOString().slice(0, 10);
            const ordenes = getOrders(fecha);

            return (
              <div key={fecha} className="flex flex-col gap-3">
                {canEdit && (
                  <button
                    onClick={() => onAdd(fecha)}
                    className="h-[80px] flex items-center justify-center gap-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl hover:from-primary-600 hover:to-primary-800 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-white font-bold shadow-lg group"
                  >
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-all">
                      <Plus size={18} />
                    </div>
                    <span className="text-sm font-semibold">Nueva Orden</span>
                  </button>
                )}

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
                  <div className="h-[280px] rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 flex flex-col items-center justify-center text-gray-400">
                    <Pill size={32} className="mb-2 opacity-30" />
                    <span className="text-xs font-medium">Sin órdenes</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="rotate-2 scale-105 shadow-2xl rounded-2xl cursor-grabbing">
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
  const c = TURN_CONFIG[turno];
  const isDragging = draggingId !== null;

  // Fuera de un arrastre, un carril vacío no ocupa espacio.
  if (ordenes.length === 0 && !isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-2xl transition-colors duration-150 ${isDragging ? "p-1.5 -m-1.5" : ""} ${isOver ? "bg-blue-100/80 ring-2 ring-blue-400" : isDragging ? "bg-white/40" : ""}`}
    >
      {isDragging && (
        <div
          className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: c.badge }}
        >
          {React.cloneElement(c.icon, { size: 11 })}
          {turno}
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
        <div className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-[11px] font-medium ${isOver ? "border-blue-400 text-blue-600" : "border-gray-300 text-gray-400"}`}>
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
      className={`${disabled ? "" : "cursor-grab"} ${ghost ? "opacity-30" : ""}`}
      title={disabled ? undefined : "Arrastra para mover a otro día o turno"}
    >
      <OrderCard orden={orden} canEdit={canEdit} {...handlers} />
    </div>
  );
}


function OrderCard({ orden: o, canEdit, onInfo, onRegister, onAssign, onDelete }: CardHandlers & { orden: Orden, canEdit: boolean }) {
  const c = TURN_CONFIG[o.turno];
  const progreso = o.real ? Math.min((o.real / o.planificado) * 100, 100) : 0;

  // Estado badges
  const estadoConfig = {
    borrador: { bg: 'bg-amber-500', icon: <FileEdit size={9} />, label: 'BORRADOR' },
    en_proceso: { bg: 'bg-blue-500', icon: <PlayCircle size={9} />, label: 'EN PROCESO' },
    terminada: { bg: 'bg-green-600', icon: <CheckCircle2 size={9} />, label: 'TERMINADA' },
    cancelada: { bg: 'bg-rose-600', icon: <XCircle size={9} />, label: 'CANCELADA' },
  };
  const estadoCfg = estadoConfig[o.estado] ?? estadoConfig.borrador;

  const cancelada = o.estado === "cancelada";

  return (
    <div
      style={{ background: c.bg }}
      className={`h-[280px] rounded-2xl p-4 shadow-md border border-white/50 hover:shadow-xl transition-all duration-300 flex flex-col backdrop-blur-sm relative group ${cancelada ? "opacity-70 grayscale-[35%]" : ""}`}
    >

      <div className="flex items-start justify-between mb-3 gap-2">

        <div className="relative flex-shrink-0">
          <div className="bg-white/80 p-2 rounded-lg shadow-sm cursor-help">
            <Pill size={18} />
          </div>

          {/* Tooltip con nombre del producto al pasar el mouse */}
          <div className="absolute left-0 top-full mt-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 whitespace-nowrap pointer-events-none">
            {o.productoNombre}
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </div>
        </div>

        {/* Nombre del producto siempre visible (truncado) */}
        <div className="flex-1 min-w-0 mx-2">
          <p className="text-xs font-bold truncate" style={{ color: c.text }} title={o.productoNombre}>
            {o.productoNombre}
          </p>
        </div>


        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">

          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold shadow-sm border border-white/30 ${estadoCfg.bg} text-white`}
          >
            {estadoCfg.icon}
            <span>{estadoCfg.label}</span>
          </span>

          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold shadow-sm border border-white/30"
            style={{ background: c.badge, color: 'white' }}
          >
            {React.cloneElement(c.icon, { size: 10 })}
            <span>{o.turno.toUpperCase()}</span>
          </span>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 mb-3 shadow-sm border border-white/50">
        <div className="grid grid-cols-2 gap-2.5 text-xs mb-2">
          <div>
            <p className="text-gray-500 font-medium text-[9px] uppercase tracking-wide mb-0.5">Planificado</p>
            <p className="text-lg font-black text-gray-900">{o.planificado}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium text-[9px] uppercase tracking-wide mb-0.5">Real</p>
            <p className="text-lg font-black text-gray-900">{o.real ?? "-"}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-gray-600">Progreso</span>
            <span className="text-xs font-black text-gray-900">{progreso.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 shadow-sm"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <ActionBtn icon={<Info size={12} />} color="slate" onClick={() => onInfo(o)} label="Info" />
        {!cancelada && (
          <ActionBtn icon={<ClipboardCheck size={12} />} color="emerald" onClick={() => onRegister(o)} label="Registrar" />
        )}
        {canEdit && <ActionBtn icon={<Users size={12} />} color="blue" onClick={() => onAssign(o)} label="Asignar" />}
        {canEdit && <ActionBtn icon={<Trash2 size={12} />} color="rose" onClick={() => onDelete(o)} label="Eliminar" />}
      </div>

    </div>
  );
}


function ActionBtn({ icon, color, onClick, label }: { icon: any, color: string, onClick: () => void, label: string }) {

  const styles = {
    blue: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200",
    rose: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200",
    emerald: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200",
    slate: "bg-slate-600 hover:bg-slate-700 text-white shadow-slate-200"
  }[color];

  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl transition-all font-bold text-[10px] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${styles}`}>
      {icon} <span className="truncate">{label}</span>
    </button>
  );
}
