import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/auth/useAuth";

import type { Semana, Orden, Turno } from "@/features/schedule/types";
import type { ItemCatalogo } from "@/features/schedule/catalogoProductos";

import OrdersBoard from "@/features/schedule/components/OrdersBoard";
import RegisterRealModal from "@/features/schedule/components/RegisterRealModal";
import AssignStaffModal from "@/features/schedule/components/AssignStaffModal";
import OrderInfoModal from "@/features/schedule/components/OrderInfoModal";
import ProgramarOrdenModal from "@/features/schedule/components/ProgramarOrdenModal";
import StatsCard from "@/features/schedule/components/StatsCard";
import FloatingCalendar from "@/components/ui/FloatingCalendar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import dayjs from "dayjs";
import "dayjs/locale/es";
import FloatingPublishButton from "@/features/schedule/components/FloatingPublishButton";

import * as productsApi from "@/services/api/products.api";
import * as areasApi from "@/services/api/areas.api";
import * as semanasApi from "@/services/api/semanas.api";
import * as ordenesApi from "@/services/api/ordenes.api";
import * as staffApi from "@/services/api/staff.api";
import type { Turno as BackendTurno } from "@/services/api/ordenes.api";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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

// TODO: esta lista sigue hardcodeada (no es localStorage, pero tampoco viene
// del backend todavía). Unificarla con GET /api/v1/areas queda pendiente:
// requiere coordinar con el módulo de Personal/Staff, que también referencia
// estos mismos códigos de área por string en varios lugares (AssignStaffModal).
// Paleta azul/celeste: cada área se distingue por tono e intensidad dentro de
// la misma familia, en vez de usar colores ajenos a la identidad visual.
const AREAS = [
  { id: "BFS_PGV_321", label: "Área BFS PGV 321", color: "bg-blue-100 border-blue-400", dot: "#2563eb" },
  { id: "VIDRIO", label: "Área Vidrio", color: "bg-sky-100 border-sky-400", dot: "#0ea5e9" },
  { id: "PVC_PP", label: "Área PVC/PP", color: "bg-cyan-100 border-cyan-400", dot: "#06b6d4" },
  { id: "BFS_PPV_312", label: "Área BFS PPV 312", color: "bg-blue-50 border-blue-300", dot: "#60a5fa" },
  { id: "HEMODIALISIS", label: "Hemo-diálisis", color: "bg-sky-200 border-sky-500", dot: "#0284c7" },
  { id: "BFS_PGV_305", label: "Área BFS PGV 305", color: "bg-blue-200 border-blue-500", dot: "#1d4ed8" },
  { id: "DIVISION_PLASTICOS", label: "División Plásticos", color: "bg-cyan-50 border-cyan-300", dot: "#22d3ee" },
] as const;

// El backend usa "manana" (sin tilde, restricción de enum); el resto de la
// app usa "mañana". Única frontera de conversión, igual que en staff.api.ts.
function turnoToBackend(t: Turno): BackendTurno {
  return t === "mañana" ? "manana" : t;
}
function turnoFromBackend(t: BackendTurno): Turno {
  return t === "manana" ? "mañana" : t;
}

const DashboardPage: React.FC = () => {

  const { user } = useAuth();
  const canEdit = user?.role === "superadmin" || user?.role === "admin";

  const [areaId, setAreaId] = useState<string>(AREAS[0].id);
  const [weeks, setWeeks] = useState<Semana[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [products, setProducts] = useState<ItemCatalogo[]>([]);
  // Área a la que corresponde `products`: la semana se carga recién cuando el
  // catálogo es del área que se está viendo (un área puede no tener productos).
  const [catalogAreaId, setCatalogAreaId] = useState<string | null>(null);
  const [staffNames, setStaffNames] = useState<Map<string, string>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const monday = startOfWeek(currentDate);
  const weekId = weekIdOf(new Date(monday));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sunday = addDays(monday, 6);
  const rangoSemana = monday.getMonth() === sunday.getMonth()
    ? `${dayjs(monday).format("D")} – ${dayjs(sunday).format("D MMM YYYY")}`
    : `${dayjs(monday).format("D MMM")} – ${dayjs(sunday).format("D MMM YYYY")}`;
  const esSemanaActual = fmt(monday) === fmt(startOfWeek(new Date()));

  // id real de la Semana en el backend (UUID) para la semana/área que se ve
  // ahora mismo. weekId sigue siendo la etiqueta ISO usada como clave local.
  const semanaBackendIdRef = useRef<string | null>(null);
  const areaUuidCacheRef = useRef<Map<string, string>>(new Map());

  const resolveAreaUuid = useCallback(async (code: string): Promise<string> => {
    const cached = areaUuidCacheRef.current.get(code);
    if (cached) return cached;
    const areas = await areasApi.getAreas();
    for (const a of areas) areaUuidCacheRef.current.set(a.code, a.id);
    const found = areaUuidCacheRef.current.get(code);
    if (!found) throw new Error(`Área no encontrada en el backend: ${code}`);
    return found;
  }, []);

  const refreshWeek = useCallback(async () => {
    const uuid = await resolveAreaUuid(areaId);
    const fechaInicio = fmt(monday);
    const fechaFin = fmt(addDays(monday, 6));
    const semana = await semanasApi.ensureSemana({ areaId: uuid, fechaInicio, fechaFin });
    semanaBackendIdRef.current = semana.id;

    const rows = await ordenesApi.getOrdenes(semana.id);
    const productNameById = new Map(products.map((p) => [p.id, p.nombre]));
    const ordenes: Orden[] = await Promise.all(
      rows.map(async (o): Promise<Orden> => {
        const asigs = await ordenesApi.getAsignaciones(o.id);
        return {
          id: o.id,
          fecha: o.fecha.slice(0, 10),
          turno: turnoFromBackend(o.turno),
          productoId: o.productId,
          productoNombre: productNameById.get(o.productId) ?? "(producto)",
          planificado: Number(o.planificado),
          real: o.real ? Number(o.real) : undefined,
          estado: o.estado,
          asignados: asigs.map((a) => a.staffId),
          areaId,
          opCode: o.opCode ?? undefined,
          observaciones: o.observaciones ?? undefined,
          createdAt: new Date().toISOString(),
          numeroLote: o.numeroLote ?? undefined,
          correlativoFabricacion: o.correlativoFabricacion ?? undefined,
          correlativoProduccion: o.correlativoProduccion ?? undefined,
          fechaVencimiento: o.fechaVencimiento ?? undefined,
          volumenUnitarioL: o.volumenUnitarioL ? Number(o.volumenUnitarioL) : undefined,
          volumenTotalL: o.volumenTotalL ? Number(o.volumenTotalL) : undefined,
          fechaInicioReal: o.fechaInicioReal ?? undefined,
          fechaFinReal: o.fechaFinReal ?? undefined,
          motivoCancelacion: o.motivoCancelacion ?? undefined,
        };
      })
    );

    setWeeks((prev) => {
      const others = prev.filter((w) => !(w.id === weekId && w.areaId === areaId));
      return [
        ...others,
        { id: weekId, fechaInicio, fechaFin, areaId, estado: semana.estado, ordenes },
      ];
    });
  }, [areaId, monday, weekId, products, resolveAreaUuid]);

  // Personal del sistema, para resolver "asignados" (ids) a nombres al
  // mostrar. Se carga una sola vez: el personal no es específico del área
  // que se está viendo y una orden puede tener asignados de cualquier área.
  useEffect(() => {
    let cancelled = false;
    staffApi
      .getStaff()
      .then((list) => {
        if (cancelled) return;
        setStaffNames(new Map(list.map((s) => [s.id, s.nombre])));
      })
      .catch(() => {
        /* si falla, se muestran los ids tal cual — no bloquea el dashboard */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Catálogo de productos del área seleccionada.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // El API filtra por el UUID del área (no por su código) y pagina de a
        // 200 como máximo; ningún área tiene tantos productos activos.
        const areaUuid = await resolveAreaUuid(areaId);
        const result = await productsApi.getProducts({ areaId: areaUuid, activeOnly: true, pageSize: 200 });
        if (cancelled) return;
        setProducts(
          result.items.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, vol: p.vol ?? undefined, envase: p.envase ?? undefined }))
        );
        setCatalogAreaId(areaId);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "No se pudo cargar el catálogo de productos");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [areaId, resolveAreaUuid]);

  // Semana + órdenes de la semana/área vista. Espera a tener el catálogo
  // cargado para poder resolver el nombre del producto de cada orden.
  useEffect(() => {
    if (catalogAreaId !== areaId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    refreshWeek()
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "No se pudo cargar la semana");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, weekId, catalogAreaId]);

  const currentWeek = useMemo(() =>
    weeks.find(w => w.id === weekId && w.areaId === areaId) ?? null
    , [weeks, weekId, areaId]);

  async function addOrder(
    fecha: string,
    turno: Turno,
    productoId: string,
    plan: number,
    registro?: { opCode?: string; numeroLote?: string }
  ) {
    if (!semanaBackendIdRef.current) return;
    try {
      await ordenesApi.createOrden({
        semanaId: semanaBackendIdRef.current,
        fecha,
        turno: turnoToBackend(turno),
        productId: productoId,
        planificado: plan,
        opCode: registro?.opCode || null,
        numeroLote: registro?.numeroLote || null,
      });
      await refreshWeek();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo crear la orden");
    }
  }

  const setReal = async (id: string, real: number, observaciones?: string) => {
    try {
      await ordenesApi.registerReal(id, real, observaciones);
      await refreshWeek();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo registrar la producción real");
    }
  };

  const setAssigned = async (id: string, ids: string[]) => {
    const orden = currentWeek?.ordenes.find((o) => o.id === id);
    if (!orden) return;
    const after = new Set(ids);
    const toAdd = ids.filter((sid) => !new Set(orden.asignados).has(sid));
    try {
      const current = await ordenesApi.getAsignaciones(id);
      const toRemove = current.filter((a) => !after.has(a.staffId));
      for (const asig of toRemove) {
        await ordenesApi.revokeAssignment(asig.id);
      }
      for (const staffId of toAdd) {
        await ordenesApi.assignStaff(id, { staffId, rolOperativo: "Operador" });
      }
      await refreshWeek();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo actualizar la asignación de personal");
    }
  };

  // Eliminar siempre pasa por una confirmación: el botón está junto a
  // "Asignar" en la tarjeta y un click de más no debería quitar una orden.
  const [deleteCtx, setDeleteCtx] = useState<Orden | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteCtx) return;
    setDeleting(true);
    try {
      await ordenesApi.deleteOrden(deleteCtx.id);
      await refreshWeek();
      setDeleteCtx(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar la orden");
    } finally {
      setDeleting(false);
    }
  };

  // Reprogramación arrastrando una tarjeta en el tablero. Se mueve primero en
  // pantalla para que el arrastre se sienta inmediato, y si el servidor la
  // rechaza se recarga la semana para dejarla donde realmente está.
  const moveOrder = async (orden: Orden, fecha: string, turno: Turno) => {
    if (orden.asignados.length > 0 && orden.turno !== turno) {
      const ok = confirm(
        `Esta orden tiene ${orden.asignados.length} persona(s) asignada(s) al turno ${orden.turno}. ` +
        `Al moverla al turno ${turno} las asignaciones se mantienen; revísalas después. ¿Continuar?`
      );
      if (!ok) return;
    }

    setWeeks((prev) => prev.map((w) =>
      w.id === weekId && w.areaId === areaId
        ? { ...w, ordenes: w.ordenes.map((o) => (o.id === orden.id ? { ...o, fecha, turno } : o)) }
        : w
    ));

    try {
      await ordenesApi.updateOrden(orden.id, { fecha, turno: turnoToBackend(turno) });
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo mover la orden");
      await refreshWeek().catch(() => undefined);
    }
  };

  const cancelOrder = async (id: string, motivo: string) => {
    try {
      await ordenesApi.cancelOrden(id, motivo);
      await refreshWeek();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo cancelar la orden");
    }
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

  const handlePublish = async () => {
    if (!semanaBackendIdRef.current) return;
    try {
      await semanasApi.publishSemana(semanaBackendIdRef.current);
      await refreshWeek();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo publicar la semana");
    }
  };

  const handleClose = async () => {
    if (!semanaBackendIdRef.current) return;
    try {
      await semanasApi.closeSemana(semanaBackendIdRef.current);
      await refreshWeek();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo cerrar la semana");
    }
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
  const cumplimiento = stats.totalPlanned > 0
    ? Math.round((stats.totalReal / stats.totalPlanned) * 100)
    : 0;

  const estadoSemanaBadge: Record<string, { label: string; className: string }> = {
    borrador: { label: "Borrador", className: "bg-white/20 text-white" },
    publicado: { label: "Publicada", className: "bg-emerald-400/25 text-emerald-50" },
    cerrado: { label: "Cerrada", className: "bg-slate-900/30 text-blue-100" },
  };

  return (
    <div className="space-y-6">

      {/* Encabezado con degradado de marca: contexto de semana y acciones */}
      <div className="gradient-brand rounded-2xl shadow-lg text-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Programación Semanal</h1>
            <p className="text-blue-100 mt-1">Control de producción por día, turno y orden</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Navegación de semanas: la acción más frecuente del cronograma. */}
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-xl p-1">
              <button
                onClick={() => setCurrentDate(addDays(monday, -7))}
                className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
                aria-label="Semana anterior"
                title="Semana anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2 px-2 min-w-[11rem] justify-center">
                <Calendar size={18} className="shrink-0" />
                <span className="font-semibold text-sm whitespace-nowrap">{rangoSemana}</span>
              </div>
              <button
                onClick={() => setCurrentDate(addDays(monday, 7))}
                className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
                aria-label="Semana siguiente"
                title="Semana siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            {!esSemanaActual && (
              <button
                onClick={() => setCurrentDate(new Date())}
                className="min-h-11 px-4 rounded-xl bg-white text-blue-800 font-semibold text-sm hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors shadow-sm"
              >
                Ir a esta semana
              </button>
            )}
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${estadoSemanaBadge[weekStatus]?.className ?? "bg-white/20 text-white"}`}>
              {estadoSemanaBadge[weekStatus]?.label ?? weekStatus}
            </span>
            {canEdit && weekStatus === "publicado" && (
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-800 font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                title="Cierra la semana. Solo se puede si no quedan órdenes en borrador."
              >
                Cerrar semana
              </button>
            )}
          </div>
        </div>

        {/* Barra de cumplimiento real vs planificado */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-100 mb-1.5">
            <span>Cumplimiento de la semana</span>
            <span>{cumplimiento}% · {stats.totalReal.toLocaleString()} de {stats.totalPlanned.toLocaleString()} unid.</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(cumplimiento, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {loadError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{loadError}</div>
      )}

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
          color="accent"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Área de Producción</h2>
          <p className="text-sm text-gray-600">Elige el área para visualizar y gestionar sus órdenes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {AREAS.map(a => {
            const isActive = a.id === areaId;
            return (
              <button
                key={a.id}
                onClick={() => setAreaId(a.id)}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 text-left
                  transition-all duration-200
                  ${isActive
                    ? `${a.color} ring-2 ring-offset-2 ring-primary-500 shadow-sm`
                    : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50/40'
                  }
                `}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: a.dot }}
                />
                <p className={`font-semibold text-sm ${isActive ? "text-blue-900" : "text-gray-700"}`}>
                  {a.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Board */}
      <div className="card p-3 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="loading-spinner w-8 h-8" />
          </div>
        ) : (
          <OrdersBoard
            days={days}
            canEdit={canEdit}
            canMove={weekStatus !== "cerrado"}
            onMove={moveOrder}
            getOrders={(dayKey) => {
              const orders = currentWeek?.ordenes.filter(o => o.fecha === dayKey) ?? [];
              // Non-admin users only see orders that are not in 'borrador' state
              return canEdit ? orders : orders.filter(o => o.estado !== 'borrador');
            }}
            onAdd={handleQuickAdd}
            onInfo={o => setInfoOrder(o)}
            onRegister={o => setRegCtx(o)}
            onAssign={o => setAssignCtx(o)}
            onDelete={o => setDeleteCtx(o)}
          />
        )}
      </div>

      {/* Modals */}
      {quickCtx && (
        <ProgramarOrdenModal
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          fecha={quickCtx.fecha}
          turno="mañana"
          catalogo={products}
          onSave={d => {
            addOrder(d.fecha, d.turno, d.productoId, d.planificado, { opCode: d.opCode, numeroLote: d.numeroLote });
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
          onSave={(real, obs) => { setReal(regCtx.id, real, obs); setRegCtx(null); }}
        />
      )}

      {assignCtx && (() => {
        // Compute all existing assignments for this date/turno from all orders
        // (misma semana/área cargada en memoria; el backend es la autoridad real
        // del conflicto cruzando todas las semanas — ver AssignStaffUseCase).
        const existingAssignments = (currentWeek?.ordenes || [])
          .filter(o => o.fecha === assignCtx.fecha && o.turno === assignCtx.turno && o.id !== assignCtx.id)
          .flatMap(o => o.asignados.map(staffId => ({
            personId: staffId,
            personName: staffId,
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
          catalogo={products}
          canEdit={canEdit}
          staffNames={staffNames}
          onClose={() => setInfoOrder(null)}
          onSave={async (p) => {
            const producto = products.find((prod) => prod.nombre === p.productoNombre);
            try {
              await ordenesApi.updateOrden(infoOrder.id, {
                productId: producto?.id,
                planificado: p.planificado,
                estado: p.estado,
              });
              await refreshWeek();
            } catch (err) {
              alert(err instanceof Error ? err.message : "No se pudo actualizar la orden");
            }
            setInfoOrder(null);
          }}
          onCancel={async (motivo) => {
            await cancelOrder(infoOrder.id, motivo);
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

      <ConfirmDialog
        open={deleteCtx !== null}
        tone="danger"
        title="¿Eliminar esta orden?"
        confirmLabel="Eliminar orden"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCtx(null)}
      >
        {deleteCtx && (
          <>
            <p>
              <span className="font-semibold text-slate-900">{deleteCtx.productoNombre}</span>
              {" — "}{dayjs(deleteCtx.fecha).format("dddd D [de] MMMM")}, turno {deleteCtx.turno}
              {deleteCtx.numeroLote && <>, lote {deleteCtx.numeroLote}</>}.
            </p>
            <p>La orden se quita del cronograma; queda registrada en la bitácora de auditoría.</p>
            {deleteCtx.numeroLote && (
              <p>Si el lote se programó pero no se fabricó, usa <span className="font-semibold">Cancelar este lote</span> en el detalle de la orden: así queda registrado el motivo.</p>
            )}
          </>
        )}
      </ConfirmDialog>

      {/* Floating Calendar */}
      <FloatingCalendar
        selectedDate={currentDate}
        onSelectDate={(date) => setCurrentDate(date)}
      />

    </div>
  );
};

export default DashboardPage;
