import React from "react";
import type { Orden } from "@/features/schedule/types";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import { Plus, Trash2, Users, Info, ClipboardCheck, Pill, Sun, SunMedium, Moon, FileEdit, CheckCircle2, PlayCircle, XCircle } from "lucide-react";

const TURN_CONFIG = {
  mañana: { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", badge: "#F59E0B", text: "#78350F", icon: <Sun size={14} /> },
  tarde: { bg: "linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)", badge: "#EA580C", text: "#7C2D12", icon: <SunMedium size={14} /> },
  noche: { bg: "linear-gradient(135deg, #E9D5FF 0%, #D8B4FE 100%)", badge: "#9333EA", text: "#581C87", icon: <Moon size={14} /> }
};

type Props = {
  days: Date[];
  canEdit: boolean;
  getOrders: (dayKey: string) => Orden[];
  onAdd: (dayKey: string) => void;
  onInfo: (o: Orden) => void;
  onRegister: (o: Orden) => void;
  onAssign: (o: Orden) => void;
  onDelete: (o: Orden) => void;
};

export default function OrdersBoard({
  days, canEdit, getOrders,
  onAdd, onInfo, onRegister, onAssign, onDelete
}: Props) {

  return (
    <div className="overflow-x-auto bg-gradient-to-br from-slate-50 to-blue-50 p-8">
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

          // Organizar órdenes por turno
          const ordenesMañana = ordenes.filter(o => o.turno === "mañana");
          const ordenesTarde = ordenes.filter(o => o.turno === "tarde");
          const ordenesNoche = ordenes.filter(o => o.turno === "noche");

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
              {ordenesMañana.map(o => <OrderCard key={o.id} orden={o} canEdit={canEdit} onInfo={onInfo} onRegister={onRegister} onAssign={onAssign} onDelete={onDelete} />)}

              {ordenesTarde.map(o => <OrderCard key={o.id} orden={o} canEdit={canEdit} onInfo={onInfo} onRegister={onRegister} onAssign={onAssign} onDelete={onDelete} />)}

              {ordenesNoche.map(o => <OrderCard key={o.id} orden={o} canEdit={canEdit} onInfo={onInfo} onRegister={onRegister} onAssign={onAssign} onDelete={onDelete} />)}

              {ordenes.length === 0 && (
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
  );
}


function OrderCard({ orden: o, canEdit, onInfo, onRegister, onAssign, onDelete }: { orden: Orden, canEdit: boolean, onInfo: any, onRegister: any, onAssign: any, onDelete: any }) {
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