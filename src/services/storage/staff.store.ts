import type { Staff } from "@/features/staff/types";

const LS = "schedule_staff";
const uid = (p = "st") => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export function loadStaff(): Staff[] {
  const raw = localStorage.getItem(LS);
  if (!raw) return [];
  try { return JSON.parse(raw) as Staff[]; } catch { return []; }
}
export function saveStaff(list: Staff[]) { localStorage.setItem(LS, JSON.stringify(list)); }

/**
 * Lista completa del personal del mapa de capacitación
 * Todos serán Operador excepto algunos que sean Supervisor
 */
const PERSONAL_CAPACITACION: { nombre: string; area: string; rol: "Operador" | "Supervisor" }[] = [
  // BFS-PGV
  { nombre: "Tomás Bravo", area: "BFS-PGV", rol: "Operador" },
  { nombre: "Elvira Ramos", area: "BFS-PGV", rol: "Operador" },
  { nombre: "Yonatán Campos", area: "BFS-PGV", rol: "Operador" },
  { nombre: "Lidia Mamani", area: "BFS-PGV", rol: "Operador" },

  // PGV
  { nombre: "Luz Arce", area: "PGV", rol: "Operador" },
  { nombre: "Magaly Bautista", area: "PGV", rol: "Operador" },
  { nombre: "Fernando Justiniano", area: "PGV", rol: "Operador" },
  { nombre: "Royer Limachi", area: "PGV", rol: "Operador" },
  { nombre: "Pablo García", area: "PGV", rol: "Operador" },

  // Autoclave
  { nombre: "Ariel Valdivia", area: "Autoclave", rol: "Operador" },
  { nombre: "Leonel Cano", area: "Autoclave", rol: "Operador" },
  { nombre: "Pedro Uratu", area: "Autoclave", rol: "Operador" },
  { nombre: "Pedro Ligerón", area: "Autoclave", rol: "Operador" },
  { nombre: "Lyn Ruiz", area: "Autoclave", rol: "Operador" },
  { nombre: "Leonardo", area: "Autoclave", rol: "Operador" },

  // Acondicionamiento
  { nombre: "Yosmar Flores", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Denise Zeballos", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Gabriela Velásquez", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Silvia Yampara", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Yésica Masabi", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Silvia Maldonado", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Ximena Flores", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Yoselin Avendaño", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Yaneth Flores", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Berenice Flores", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Sandra Moreira", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Dalia Callejas", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Andrea Sacu", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Gabriela Ramos", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Wilma Duran", area: "Acondicionamiento", rol: "Operador" },
  { nombre: "Maribel Vedia", area: "Acondicionamiento", rol: "Operador" },

  // Soplado
  { nombre: "Daniela Perez", area: "Soplado", rol: "Operador" },
  { nombre: "Tania Ferrufino", area: "Soplado", rol: "Operador" },
  { nombre: "Monica Cossio", area: "Soplado", rol: "Operador" },
  { nombre: "Monica Lijeron", area: "Soplado", rol: "Operador" },
  { nombre: "Maria Elena Sabala", area: "Soplado", rol: "Operador" },
  { nombre: "Isaias Yucra", area: "Soplado", rol: "Operador" },

  // Equipos
  { nombre: "Vicenta Estrada", area: "Equipos", rol: "Operador" },
  { nombre: "Silvana Vaca", area: "Equipos", rol: "Operador" },
  { nombre: "Valentina Roque", area: "Equipos", rol: "Operador" },

  // Supervisores (puedes agregar más si necesitas)
  { nombre: "Juan Pérez", area: "PGV", rol: "Supervisor" },
  { nombre: "María González", area: "PGV", rol: "Supervisor" },
];

/**
 * Sincroniza el personal del mapa de capacitación con localStorage
 * Solo agrega los que no existen (no duplica)
 */
export function syncAllStaffFromCapacitacion(): { added: number; total: number } {
  const existing = loadStaff();
  const nombresExistentes = new Set(existing.map(s => s.nombre.toLowerCase()));

  let added = 0;
  for (const persona of PERSONAL_CAPACITACION) {
    if (!nombresExistentes.has(persona.nombre.toLowerCase())) {
      existing.push({
        id: uid(),
        nombre: persona.nombre,
        rolBase: persona.rol,
        areas: [persona.area],
        activo: true,
      });
      added++;
    }
  }

  saveStaff(existing);
  return { added, total: existing.length };
}

/**
 * Seed inicial - ahora carga todo el personal del mapa de capacitación
 */
export function seedStaffIfNeeded() {
  // Siempre sincronizar para asegurar que todo el personal esté disponible
  syncAllStaffFromCapacitacion();
}

/**
 * Limpia todo y recarga desde cero con todo el personal
 */
export function resetAndLoadAllStaff(): { total: number } {
  // Limpiar localStorage
  localStorage.removeItem(LS);

  // Agregar todo el personal
  const staff: Staff[] = PERSONAL_CAPACITACION.map(persona => ({
    id: uid(),
    nombre: persona.nombre,
    rolBase: persona.rol,
    areas: [persona.area],
    activo: true,
  }));

  saveStaff(staff);
  return { total: staff.length };
}

export function createStaff(data: Omit<Staff, "id">): Staff {
  const list = loadStaff(); const item: Staff = { id: uid(), ...data };
  list.push(item); saveStaff(list); return item;
}
export function updateStaff(id: string, patch: Partial<Omit<Staff, "id">>) {
  const list = loadStaff(); const i = list.findIndex(s => s.id === id); if (i < 0) return;
  list[i] = { ...list[i], ...patch }; saveStaff(list);
}
export function removeStaff(id: string) {
  saveStaff(loadStaff().filter(s => s.id !== id));
}
