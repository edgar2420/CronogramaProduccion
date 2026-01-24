import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/useAuth";

import {
  loadWeeks,
  upsertWeek,
  removeOrder,
  genId,
  publishWeek,
  countBorradorOrders,
} from "@/services/storage/schedule.store";

import type { Semana, Orden, Turno, EstadoOrden } from "@/features/schedule/types";

import OrdersBoard from "@/features/schedule/components/OrdersBoard";
import RegisterRealModal from "@/features/schedule/components/RegisterRealModal";
import AssignStaffModal from "@/features/schedule/components/AssignStaffModal";
import OrderInfoModal from "@/features/schedule/components/OrderInfoModal";
import ProgramarOrdenModal from "@/features/schedule/components/ProgramarOrdenModal";
import StatsCard from "@/features/schedule/components/StatsCard";
import FloatingCalendar from "@/components/ui/FloatingCalendar";
import FloatingPublishButton from "@/features/schedule/components/FloatingPublishButton";
import { getCatalogoPorArea } from "@/features/schedule/catalogoProductos";

import {
  Calendar,
  Pill,
  TrendingUp,
  Users,
  CheckCircle2
} from "lucide-react";

function startOfWeek(date: Date) {
  const d = new Date(date); const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff); d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function weekIdOf(d: Date) {
  const thur = new Date(d.setDate(d.getDate() + 4 - (d.getDay() || 7)));
  const yearStart = new Date(thur.getFullYear(), 0, 1);
  const diff = (thur.getTime() - yearStart.getTime()) / 86400000 + 1;
  return `${thur.getFullYear()}-W${String(Math.ceil(diff / 7)).padStart(2, "0")}`;
}
const AREAS = [
  { id: "BFS_PGV_321", label: "Área BFS PGV 321", color: "bg-blue-100 border-blue-300 hover:border-blue-500" },
  { id: "VIDRIO", label: "Área Vidrio", color: "bg-purple-100 border-purple-300 hover:border-purple-500" },
  { id: "PVC_PP", label: "Área PVC/PP", color: "bg-green-100 border-green-300 hover:border-green-500" },
  { id: "BFS_PPV_312", label: "Área BFS PPV 312", color: "bg-yellow-100 border-yellow-300 hover:border-yellow-500" },
  { id: "HEMODIALISIS", label: "Hemo-diálisis", color: "bg-red-100 border-red-300 hover:border-red-500" },
  { id: "BFS_PGV_305", label: "Área BFS PGV 305", color: "bg-indigo-100 border-indigo-300 hover:border-indigo-500" },
  { id: "DIVISION_PLASTICOS", label: "División Plásticos", color: "bg-pink-100 border-pink-300 hover:border-pink-500" },
] as const;

const TURNOS: Turno[] = ["mañana", "tarde", "noche"];

const DashboardPage: React.FC = () => {

  const { user } = useAuth();
  const canEdit = user?.role === "superadmin" || user?.role === "admin";

  const [areaId, setAreaId] = useState<string>(AREAS[0].id);
  const [weeks, setWeeks] = useState<Semana[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const monday = startOfWeek(currentDate);
  const weekId = weekIdOf(new Date(monday));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const catalogoArea = useMemo(() => getCatalogoPorArea(areaId), [areaId]);

  useEffect(() => {
    ensureSeed(areaId, new Date());
    setWeeks(loadWeeks());
  }, [areaId]);

  const currentWeek = useMemo(() =>
    weeks.find(w => w.id === weekId && w.areaId === areaId) ?? null
    , [weeks, weekId, areaId]);

  function ensureSeed(areaId: string, date: Date) {
    const monday = startOfWeek(date);
    const id = weekIdOf(monday);
    if (loadWeeks().some(w => w.id === id && w.areaId === areaId)) return;

    upsertWeek({
      id, fechaInicio: fmt(monday), fechaFin: fmt(addDays(monday, 6)), areaId,
      estado: "borrador", ordenes: []
    });
  }

  function persist(w: Semana) {
    upsertWeek(w);
    setWeeks(loadWeeks());
  }

  function addOrder(fecha: string, turno: Turno, producto: string, plan: number) {
    if (!currentWeek) return;
    persist({
      ...currentWeek,
      ordenes: [
        ...currentWeek.ordenes,
        {
          id: genId("ord"), fecha, turno,
          productoId: "AUTO", productoNombre: producto,
          planificado: plan, estado: "borrador" as EstadoOrden,
          asignados: [], areaId,
          createdAt: new Date().toISOString()
        }
      ]
    });
  }

  const setReal = (id: string, real: number) => {
    if (!currentWeek) return;
    persist({
      ...currentWeek,
      ordenes: currentWeek.ordenes.map(o => {
        if (o.id !== id) return o;
        // Auto-change state to 'terminada' when real >= planificado
        const newEstado = real >= o.planificado ? 'terminada' as EstadoOrden : o.estado;
        return { ...o, real, estado: newEstado };
      })
    });
  };

  const setAssigned = (id: string, ids: string[]) => currentWeek &&
    persist({
      ...currentWeek,
      ordenes: currentWeek.ordenes.map(o => o.id === id ? { ...o, asignados: ids } : o)
    });

  const delOrder = (id: string) => {
    removeOrder(weekId, areaId, id);
    setWeeks(loadWeeks());
  };

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickCtx, setQuickCtx] = useState<{ fecha: string, turno: Turno } | null>(null);
  const [regCtx, setRegCtx] = useState<Orden | null>(null);
  const [assignCtx, setAssignCtx] = useState<Orden | null>(null);
  const [infoOrder, setInfoOrder] = useState<Orden | null>(null);

  // Count borrador orders for publishing
  const ordenesBorrador = useMemo(() => {
    return currentWeek?.ordenes.filter(o => o.estado === "borrador").length ?? 0;
  }, [currentWeek]);

  const weekStatus = currentWeek?.estado ?? "borrador";

  const handleQuickAdd = (fecha: string) => {
    setQuickCtx({ fecha, turno: "mañana" });
    setQuickOpen(true);
  };

  const handlePublish = () => {
    publishWeek(weekId, areaId);
    setWeeks(loadWeeks());
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!currentWeek) return { totalOrders: 0, completedOrders: 0, totalPlanned: 0, totalReal: 0 };

    const totalOrders = currentWeek.ordenes.length;
    const completedOrders = currentWeek.ordenes.filter(o => o.real && o.real > 0).length;
    const totalPlanned = currentWeek.ordenes.reduce((sum, o) => sum + o.planificado, 0);
    const totalReal = currentWeek.ordenes.reduce((sum, o) => sum + (o.real || 0), 0);

    return { totalOrders, completedOrders, totalPlanned, totalReal };
  }, [currentWeek]);

  const currentArea = AREAS.find(a => a.id === areaId);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Programación Semanal</h1>
          <p className="page-subtitle">Control de producción por día, turno y orden</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span className="font-medium">{fmt(monday)} - {fmt(addDays(monday, 6))}</span>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Órdenes"
          value={stats.totalOrders}
          icon={Pill}
          color="primary"
        />
        <StatsCard
          title="Órdenes Completadas"
          value={stats.completedOrders}
          icon={CheckCircle2}
          color="success"
        />
        <StatsCard
          title="Producción Planificada"
          value={stats.totalPlanned.toLocaleString()}
          icon={TrendingUp}
          color="warning"
        />
        <StatsCard
          title="Producción Real"
          value={stats.totalReal.toLocaleString()}
          icon={Users}
          color={stats.totalReal >= stats.totalPlanned ? "success" : "gray"}
        />
      </div>

      {/* Area Selector */}
      <div className="card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Seleccionar Área de Producción</h2>
          <p className="text-sm text-gray-600">Elige el área para visualizar y gestionar las órdenes de producción</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {AREAS.map(a => (
            <button
              key={a.id}
              onClick={() => setAreaId(a.id)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                text-left
                ${a.id === areaId
                  ? a.color + ' ring-2 ring-offset-2 ring-primary-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <p className="font-semibold text-sm text-gray-900">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Board */}
      <div className="card p-6">
        <OrdersBoard
          days={days}
          canEdit={canEdit}
          getOrders={(dayKey) => {
            const orders = currentWeek?.ordenes.filter(o => o.fecha === dayKey) ?? [];
            // Non-admin users only see orders that are not in 'borrador' state
            return canEdit ? orders : orders.filter(o => o.estado !== 'borrador');
          }}
          onAdd={handleQuickAdd}
          onInfo={o => setInfoOrder(o)}
          onRegister={o => setRegCtx(o)}
          onAssign={o => setAssignCtx(o)}
          onDelete={o => delOrder(o.id)}
        />
      </div>

      {/* Modals */}
      {quickCtx && (
        <ProgramarOrdenModal
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          fecha={quickCtx.fecha}
          turno="mañana"
          catalogo={catalogoArea}
          onSave={d => {
            addOrder(d.fecha, d.turno, d.productoNombre, d.planificado);
            setQuickOpen(false);
          }}
        />
      )}

      {regCtx && (
        <RegisterRealModal
          open={true}
          onClose={() => setRegCtx(null)}
          plan={regCtx.planificado}
          producto={regCtx.productoNombre}
          turno={regCtx.turno}
          onSave={(real) => { setReal(regCtx.id, real); setRegCtx(null); }}
        />
      )}

      {assignCtx && (() => {
        // Compute all existing assignments for this date/turno from all orders
        const existingAssignments = (currentWeek?.ordenes || [])
          .filter(o => o.fecha === assignCtx.fecha && o.turno === assignCtx.turno && o.id !== assignCtx.id)
          .flatMap(o => o.asignados.map(personName => ({
            personId: personName, // Using name as ID for now
            personName,
            areaId: o.areaId,
            turno: o.turno
          })));

        return (
          <AssignStaffModal
            open={true}
            onClose={() => setAssignCtx(null)}
            areaId={assignCtx.areaId}
            fecha={assignCtx.fecha}
            turno={assignCtx.turno}
            selectedIds={assignCtx.asignados}
            existingAssignments={existingAssignments}
            onSave={(ids) => { setAssigned(assignCtx.id, ids); setAssignCtx(null); }}
          />
        );
      })()}

      {infoOrder && (
        <OrderInfoModal
          open={true}
          order={infoOrder}
          catalogo={catalogoArea}
          canEdit={canEdit}
          onClose={() => setInfoOrder(null)}
          onSave={(p) => {
            // Update order with new data
            if (!currentWeek) return;
            persist({
              ...currentWeek,
              ordenes: currentWeek.ordenes.map(o =>
                o.id === infoOrder.id
                  ? { ...o, productoNombre: p.productoNombre, planificado: p.planificado, estado: p.estado }
                  : o
              )
            });
            setInfoOrder(null);
          }}
        />
      )}

      {/* Floating Publish Button - only for admins */}
      {canEdit && (
        <FloatingPublishButton
          ordenesBorrador={ordenesBorrador}
          weekStatus={weekStatus}
          fechaRango={`${fmt(monday)} al ${fmt(addDays(monday, 6))}`}
          areaLabel={currentArea?.label ?? ""}
          onPublish={handlePublish}
        />
      )}

      {/* Floating Calendar */}
      <FloatingCalendar
        selectedDate={currentDate}
        onSelectDate={(date) => setCurrentDate(date)}
      />

    </div>
  );
};

export default DashboardPage;
