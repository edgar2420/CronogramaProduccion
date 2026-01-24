import type { Semana, Orden } from "@/features/schedule/types";

export const LS_SCHEDULE = "schedule_weeks";

export function loadWeeks(): Semana[] {
  const raw = localStorage.getItem(LS_SCHEDULE);
  if (!raw) return [];
  try { return JSON.parse(raw) as Semana[]; } catch { return []; }
}

export function saveWeeks(weeks: Semana[]) {
  localStorage.setItem(LS_SCHEDULE, JSON.stringify(weeks));
}

export function upsertWeek(week: Semana) {
  const weeks = loadWeeks();
  const i = weeks.findIndex(w => w.id === week.id && w.areaId === week.areaId);
  if (i >= 0) weeks[i] = week; else weeks.push(week);
  saveWeeks(weeks);
}

export function createEmptyWeek(params: { id: string; fechaInicio: string; fechaFin: string; areaId: string }): Semana {
  return { ...params, estado: "borrador", ordenes: [] };
}

export function addOrder(weekId: string, areaId: string, order: Orden) {
  const weeks = loadWeeks();
  const w = weeks.find(x => x.id === weekId && x.areaId === areaId);
  if (!w) return;
  w.ordenes.push(order);
  saveWeeks(weeks);
}

export function genId(prefix = "ord"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}


/* ⬇⬇⬇  NUEVO: usado por DashboardPage.tsx  */
export function removeOrder(weekId: string, areaId: string, orderId: string) {
  const weeks = loadWeeks();
  const w = weeks.find(x => x.id === weekId && x.areaId === areaId);
  if (!w) return;
  w.ordenes = w.ordenes.filter(o => o.id !== orderId);
  saveWeeks(weeks);
}

/* ⬇⬇⬇ Funciones de publicación */
export function publishWeek(weekId: string, areaId: string) {
  const weeks = loadWeeks();
  const w = weeks.find(x => x.id === weekId && x.areaId === areaId);
  if (!w) return;

  // Cambiar estado de la semana a publicado
  w.estado = "publicado";

  // Cambiar todas las órdenes en borrador a en_proceso
  w.ordenes = w.ordenes.map(o => ({
    ...o,
    estado: o.estado === "borrador" ? "en_proceso" : o.estado
  }));

  saveWeeks(weeks);
}

export function getWeekStatus(weekId: string, areaId: string): "borrador" | "publicado" | "cerrado" | null {
  const weeks = loadWeeks();
  const w = weeks.find(x => x.id === weekId && x.areaId === areaId);
  return w?.estado ?? null;
}

export function countBorradorOrders(weekId: string, areaId: string): number {
  const weeks = loadWeeks();
  const w = weeks.find(x => x.id === weekId && x.areaId === areaId);
  if (!w) return 0;
  return w.ordenes.filter(o => o.estado === "borrador").length;
}

