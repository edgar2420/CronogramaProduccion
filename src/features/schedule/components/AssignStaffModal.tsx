import React, { useEffect, useMemo, useState } from "react";
import * as staffApi from "@/services/api/staff.api";
import type { Staff } from "@/features/staff/types";
import type { Turno } from "@/features/schedule/types";
import {
  X, Search, Users, CheckCircle2, AlertTriangle,
  XCircle, HelpCircle, Filter, UserCheck, Calendar,
  Clock, MapPin, Save, Lock, Sun, SunMedium, Moon
} from "lucide-react";

type Nivel = "x" | "reforzar" | "capacitar" | "revisar";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ROLES = [
  "Operador PPV Vidrio", "Auxiliar PPV Vidrio", "Central de pesada",
  "Operador bidones", "Auxiliar bidones",
  "Operador PGV Rígido", "Auxiliar PGV Rígido",
  "Operador PGV PVC", "Auxiliar PGV PVC",
  "Operador Autoclave", "Auxiliar Autoclave",
  "Operador BFS PGV", "Preparador BFS PGV", "Generación de vapor", "Integrity test", "Auxiliar BFS PGV",
  "Operador BFS PPV",
  "Operador Inyección", "Operador Soplado", "Auxiliar Soplado",
  "Operador Peletizadora", "Auxiliar Inyectora", "Auxiliar Peletizado",
  "Equipos de suero", "Esterilización",
] as const;
type Rol = (typeof ROLES)[number];

type FilaCap = {
  nombre: string;
  area: string;
  roles: Partial<Record<Rol, Nivel>>;
};

const CAP_DATA: FilaCap[] = [
  { nombre: "Tomás Bravo", area: "BFS-PGV", roles: { "Operador bidones": "reforzar", "Auxiliar bidones": "x", "Operador PGV Rígido": "reforzar", "Auxiliar PGV Rígido": "x", "Operador PGV PVC": "reforzar", "Auxiliar Autoclave": "x" } },
  { nombre: "Elvira Ramos", area: "BFS-PGV", roles: { "Auxiliar bidones": "x", "Auxiliar PGV Rígido": "x", "Auxiliar PGV PVC": "x", "Auxiliar Autoclave": "x", "Auxiliar BFS PGV": "x", "Operador BFS PGV": "reforzar" } },
  { nombre: "Yonatán Campos", area: "BFS-PGV", roles: { "Operador PPV Vidrio": "reforzar", "Auxiliar PPV Vidrio": "reforzar", "Operador bidones": "x", "Auxiliar bidones": "x", "Operador PGV Rígido": "x", "Auxiliar PGV Rígido": "x", "Operador PGV PVC": "x", "Auxiliar PGV PVC": "x", "Operador Autoclave": "capacitar", "Operador BFS PGV": "reforzar" } },
  { nombre: "Lidia Mamani", area: "BFS-PGV", roles: { "Operador bidones": "x", "Auxiliar bidones": "x", "Operador PGV Rígido": "x", "Operador PGV PVC": "x", "Auxiliar PGV PVC": "x", "Operador Autoclave": "capacitar", "Operador BFS PGV": "reforzar", "Preparador BFS PGV": "x" } },
  { nombre: "Luz Arce", area: "PGV", roles: { "Operador PPV Vidrio": "x", "Auxiliar PPV Vidrio": "x", "Operador bidones": "x", "Auxiliar bidones": "x", "Auxiliar PGV Rígido": "x", "Operador PGV PVC": "x", "Auxiliar Autoclave": "capacitar", "Operador BFS PGV": "reforzar", "Preparador BFS PGV": "x" } },
  { nombre: "Magaly Bautista", area: "PGV", roles: { "Auxiliar bidones": "x", "Operador PGV Rígido": "reforzar", "Auxiliar PGV Rígido": "x", "Operador PGV PVC": "x", "Auxiliar PGV PVC": "x", "Operador BFS PGV": "reforzar", "Preparador BFS PGV": "x" } },
  { nombre: "Fernando Justiniano", area: "PGV", roles: { "Operador PPV Vidrio": "x", "Operador bidones": "reforzar", "Auxiliar bidones": "x", "Operador PGV Rígido": "reforzar", "Auxiliar PGV Rígido": "x", "Operador PGV PVC": "x", "Auxiliar PGV PVC": "x", "Operador Autoclave": "reforzar", "Operador BFS PGV": "x", "Preparador BFS PGV": "x" } },
  { nombre: "Royer Limachi", area: "PGV", roles: { "Operador PPV Vidrio": "x", "Auxiliar PPV Vidrio": "x", "Operador bidones": "x", "Auxiliar bidones": "x", "Operador PGV Rígido": "x" } },
  { nombre: "Pablo García", area: "PGV", roles: { "Operador PPV Vidrio": "x" } },
  { nombre: "Ariel Valdivia", area: "Autoclave", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x" } },
  { nombre: "Leonel Cano", area: "Autoclave", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Generación de vapor": "x" } },
  { nombre: "Pedro Uratu", area: "Autoclave", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x" } },
  { nombre: "Pedro Ligerón", area: "Autoclave", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x" } },
  { nombre: "Lyn Ruiz", area: "Autoclave", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Generación de vapor": "x" } },
  { nombre: "Leonardo", area: "Autoclave", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x" } },
  { nombre: "Yosmar Flores", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Denise Zeballos", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Gabriela Velásquez", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Silvia Yampara", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Yésica Masabi", area: "Acondicionamiento", roles: { "Operador PPV Vidrio": "x", "Esterilización": "x" } },
  { nombre: "Silvia Maldonado", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Ximena Flores", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Yoselin Avendaño", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Yaneth Flores", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Berenice Flores", area: "Acondicionamiento", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Generación de vapor": "x" } },
  { nombre: "Sandra Moreira", area: "Acondicionamiento", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Generación de vapor": "x" } },
  { nombre: "Dalia Callejas", area: "Acondicionamiento", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x" } },
  { nombre: "Andrea Sacu", area: "Acondicionamiento", roles: { "Auxiliar PPV Vidrio": "x" } },
  { nombre: "Gabriela Ramos", area: "Acondicionamiento", roles: { "Operador PPV Vidrio": "x", "Esterilización": "x" } },
  { nombre: "Wilma Duran", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
  { nombre: "Daniela Perez", area: "Soplado", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x", "Operador Inyección": "reforzar" } },
  { nombre: "Vicenta Estrada", area: "Equipos", roles: { "Auxiliar PPV Vidrio": "x", "Operador PPV Vidrio": "x", "Auxiliar PGV Rígido": "x", "Operador PGV PVC": "reforzar", "Operador BFS PGV": "reforzar", "Preparador BFS PGV": "x" } },
  { nombre: "Tania Ferrufino", area: "Soplado", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x", "Operador Inyección": "reforzar" } },
  { nombre: "Monica Cossio", area: "Soplado", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x", "Operador Inyección": "reforzar" } },
  { nombre: "Monica Lijeron", area: "Soplado", roles: { "Esterilización": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x" } },
  { nombre: "Maria Elena Sabala", area: "Soplado", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x" } },
  { nombre: "Silvana Vaca", area: "Equipos", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x", "Preparador BFS PGV": "reforzar" } },
  { nombre: "Valentina Roque", area: "Equipos", roles: { "Auxiliar Autoclave": "revisar", "Operador Soplado": "revisar", "Auxiliar Soplado": "revisar", "Operador Autoclave": "x" } },
  { nombre: "Isaias Yucra", area: "Soplado", roles: { "Operador Autoclave": "x", "Auxiliar Autoclave": "x", "Operador Soplado": "x", "Auxiliar Soplado": "x" } },
  { nombre: "Maribel Vedia", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
];

const AREA_ALIASES: Record<string, string[]> = {
  PGV: ["PGV", "BFS_PGV_321", "BFS_PGV_305", "PVC_PP"],
  "BFS-PGV": ["BFS_PGV_321", "BFS_PGV_305", "PGV"],
  Autoclave: ["Autoclave"],
  Acondicionamiento: ["Acondicionamiento"],
  Soplado: ["DIVISION_PLASTICOS"],
  Equipos: ["HEMODIALISIS", "Equipos"],

  BFS_PGV_321: ["BFS_PGV_321", "PGV", "BFS-PGV"],
  BFS_PGV_305: ["BFS_PGV_305", "PGV", "BFS-PGV"],
  BFS_PPV_312: ["BFS_PPV_312", "BFS-PGV"],
  VIDRIO: ["VIDRIO"],
  PVC_PP: ["PVC_PP", "PGV"],
  HEMODIALISIS: ["HEMODIALISIS", "Equipos"],
  DIVISION_PLASTICOS: ["DIVISION_PLASTICOS", "Soplado"],
  RM: ["RM"],
};

const AREA_ROLE_LABELS: Record<string, Rol[]> = {
  VIDRIO: ["Operador PPV Vidrio", "Auxiliar PPV Vidrio", "Central de pesada"],
  BFS_PPV_312: ["Operador BFS PPV", "Auxiliar BFS PGV", "Integrity test"],

  BFS_PGV_321: [
    "Operador BFS PGV", "Auxiliar BFS PGV", "Preparador BFS PGV", "Generación de vapor", "Integrity test",
    "Operador PGV Rígido", "Auxiliar PGV Rígido", "Operador PGV PVC", "Auxiliar PGV PVC",
    "Equipos de suero", "Esterilización"
  ],
  BFS_PGV_305: [
    "Operador BFS PGV", "Auxiliar BFS PGV", "Preparador BFS PGV", "Generación de vapor", "Integrity test",
    "Operador PGV Rígido", "Auxiliar PGV Rígido", "Operador PGV PVC", "Auxiliar PGV PVC",
    "Equipos de suero", "Esterilización"
  ],
  PVC_PP: ["Operador PGV PVC", "Auxiliar PGV PVC", "Central de pesada"],
  Autoclave: ["Operador Autoclave", "Auxiliar Autoclave", "Generación de vapor"],
  DIVISION_PLASTICOS: ["Operador Soplado", "Auxiliar Soplado", "Operador Inyección", "Auxiliar Inyectora", "Operador Peletizadora", "Auxiliar Peletizado"],
  HEMODIALISIS: ["Equipos de suero"],

  PGV: ["Operador PGV Rígido", "Auxiliar PGV Rígido", "Operador PGV PVC", "Auxiliar PGV PVC"],
};

function slugId(nombre: string) {
  return "cap-" + nombre.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-");
}
function areaMatches(staffAreas: string[], boardAreaId: string) {
  return staffAreas.some((a) => (AREA_ALIASES[a] ?? [a]).includes(boardAreaId));
}
function bestNivelFor(personName: string, boardAreaId: string): "ok" | "reforzar" | "capacitar" | "sin_dato" {
  const fila = CAP_DATA.find(f => f.nombre.toLowerCase() === personName.toLowerCase());
  const labels = AREA_ROLE_LABELS[boardAreaId] ?? [];
  if (!fila || !labels.length) return "sin_dato";
  const rank = (v?: Nivel) => v === "x" ? 3 : v === "reforzar" ? 2 : v === "capacitar" ? 1 : v === "revisar" ? 1 : 0;
  let best = 0;
  for (const lab of labels) best = Math.max(best, rank(fila.roles[lab]));
  if (best >= 3) return "ok";
  if (best === 2) return "reforzar";
  if (best === 1) return "capacitar";
  return "sin_dato";
}

// Componente de badge de nivel mejorado
function LevelBadge({ level }: { level: "ok" | "reforzar" | "capacitar" | "sin_dato" }) {
  const config = {
    ok: {
      bg: "bg-emerald-100 border-emerald-300",
      text: "text-emerald-700",
      icon: <CheckCircle2 size={12} />,
      label: "Capacitado"
    },
    reforzar: {
      bg: "bg-amber-100 border-amber-300",
      text: "text-amber-700",
      icon: <AlertTriangle size={12} />,
      label: "Reforzar"
    },
    capacitar: {
      bg: "bg-rose-100 border-rose-300",
      text: "text-rose-700",
      icon: <XCircle size={12} />,
      label: "Capacitar"
    },
    sin_dato: {
      bg: "bg-gray-100 border-gray-300",
      text: "text-gray-600",
      icon: <HelpCircle size={12} />,
      label: "Sin dato"
    },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  areaId: string;
  fecha: string;
  turno: Turno;
  selectedIds: string[];
  existingAssignments?: { personId: string; personName: string; areaId: string; turno: string }[];
  onSave: (ids: string[]) => void;
};

const AssignStaffModal: React.FC<Props> = ({
  open, onClose, areaId, fecha, turno, selectedIds, existingAssignments = [], onSave
}) => {
  const [storeStaff, setStoreStaff] = useState<Staff[]>([]);
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [q, setQ] = useState("");
  const [filterLevel, setFilterLevel] = useState<"todos" | "ok" | "reforzar" | "capacitar" | "sin_dato">("todos");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    staffApi.getStaff().then((list) => {
      if (!cancelled) setStoreStaff(list);
    });
    setPicked(selectedIds);
    setQ(""); setFilterLevel("todos");
    return () => {
      cancelled = true;
    };
  }, [open, selectedIds]);


  const combined = useMemo(() => {

    const idx = new Map<string, Staff>();
    for (const s of storeStaff) idx.set(s.nombre.toLowerCase(), s);


    const base: Staff[] = [...storeStaff];

    for (const f of CAP_DATA) {
      const key = f.nombre.toLowerCase();
      if (!idx.has(key)) {
        base.push({
          id: slugId(f.nombre),
          nombre: f.nombre,
          rolBase: "Operador",
          areas: [f.area],
          activo: true,
        });
      } else {

        const s = idx.get(key)!;
        if (!s.areas.includes(f.area)) s.areas = [...s.areas, f.area];
      }
    }
    return base;
  }, [storeStaff]);

  const candidates = useMemo(() => {
    // Mostrar TODOS los empleados activos, sin filtrar por área
    const todosActivos = combined.filter(s => s.activo);
    let enriched = todosActivos.map(s => ({
      person: s,
      level: bestNivelFor(s.nombre, areaId),
    }));

    if (q.trim()) {
      const needle = q.toLowerCase();
      enriched = enriched.filter(({ person }) =>
        person.nombre.toLowerCase().includes(needle) ||
        (person.rolBase || "").toLowerCase().includes(needle) ||
        (person.areas || []).join(",").toLowerCase().includes(needle)
      );
    }
    if (filterLevel !== "todos") enriched = enriched.filter(x => x.level === filterLevel);

    const rank = (lv: "ok" | "reforzar" | "capacitar" | "sin_dato") => lv === "ok" ? 3 : lv === "reforzar" ? 2 : lv === "capacitar" ? 1 : 0;
    enriched.sort((a, b) => {
      const r = rank(b.level) - rank(a.level);
      if (r) return r;
      const sa = picked.includes(a.person.id) ? 1 : 0;
      const sb = picked.includes(b.person.id) ? 1 : 0;
      if (sa !== sb) return sb - sa;
      return a.person.nombre.localeCompare(b.person.nombre);
    });

    return enriched;
  }, [combined, areaId, q, filterLevel, picked]);

  // Check if person is blocked (already assigned to another area on same day/turno)
  function getBlockedInfo(personId: string, personName: string) {
    const existing = existingAssignments.find(
      a => (a.personId === personId || a.personName.toLowerCase() === personName.toLowerCase())
        && a.areaId !== areaId
        && a.turno === turno
    );
    return existing ? existing.areaId : null;
  }

  function toggle(id: string, personName: string) {
    const blockedArea = getBlockedInfo(id, personName);
    if (blockedArea && !picked.includes(id)) {
      alert(`${personName} ya está asignado/a a ${blockedArea.replace(/_/g, ' ')} en el turno ${turno}. No se puede asignar a múltiples áreas.`);
      return;
    }
    setPicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Stats
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      selected: picked.length,
      ok: candidates.filter(c => c.level === "ok").length,
      reforzar: candidates.filter(c => c.level === "reforzar").length,
      capacitar: candidates.filter(c => c.level === "capacitar").length,
    };
  }, [candidates, picked]);

  if (!open) return null;

  // Configuración de colores por turno
  const turnoConfig: Record<Turno, { gradient: string; textSecondary: string; icon: React.ReactNode }> = {
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
  const tc = turnoConfig[turno] || turnoConfig.mañana;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header with turno-based color */}
        <header className={`px-6 py-5 bg-gradient-to-r ${tc.gradient} text-white flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                {tc.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">Asignar Personal</h2>
                <div className={`flex items-center gap-3 ${tc.textSecondary} text-sm mt-1`}>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {fecha}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {turno === "mañana" && <><Sun size={14} /> Mañana</>}
                    {turno === "tarde" && <><SunMedium size={14} /> Tarde</>}
                    {turno === "noche" && <><Moon size={14} /> Noche</>}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {areaId.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Cerrar"
            >
              <X size={24} />
            </button>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium flex items-center gap-2">
              <UserCheck size={16} />
              {stats.selected} seleccionados
            </div>
            <div className="px-3 py-1.5 bg-sky-500/30 rounded-lg text-sm font-medium flex items-center gap-2" title="Personal disponible">
              <Users size={16} />
              {storeStaff.length} en el sistema
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/30 rounded-lg text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              {stats.ok} capacitados
            </div>
            <div className="px-3 py-1.5 bg-amber-500/30 rounded-lg text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              {stats.reforzar} por reforzar
            </div>
            <div className="px-3 py-1.5 bg-rose-500/30 rounded-lg text-sm font-medium flex items-center gap-2">
              <XCircle size={16} />
              {stats.capacitar} por capacitar
            </div>
          </div>
        </header>

        {/* Controles de búsqueda y filtro */}
        <div className="px-6 py-4 bg-gray-50 border-b flex flex-col gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="input pl-10 w-full"
              placeholder="Buscar por nombre, rol o área…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Filter buttons with icons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-500" />
            <button
              onClick={() => setFilterLevel("todos")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filterLevel === "todos"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
                }`}
            >
              <Users size={14} />
              Todos
            </button>
            <button
              onClick={() => setFilterLevel("ok")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filterLevel === "ok"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-emerald-400"
                }`}
            >
              <CheckCircle2 size={14} />
              Capacitados
            </button>
            <button
              onClick={() => setFilterLevel("reforzar")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filterLevel === "reforzar"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-amber-400"
                }`}
            >
              <AlertTriangle size={14} />
              Reforzar
            </button>
            <button
              onClick={() => setFilterLevel("capacitar")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filterLevel === "capacitar"
                ? "bg-rose-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-rose-400"
                }`}
            >
              <XCircle size={14} />
              Capacitar
            </button>
            <button
              onClick={() => setFilterLevel("sin_dato")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filterLevel === "sin_dato"
                ? "bg-gray-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                }`}
            >
              <HelpCircle size={14} />
              Sin dato
            </button>
          </div>
        </div>

        {/* Lista de personal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidates.map(({ person, level }) => {
              const blockedArea = getBlockedInfo(person.id, person.nombre);
              const isBlocked = !!blockedArea && !picked.includes(person.id);
              const isSelected = picked.includes(person.id);

              return (
                <div
                  key={person.id}
                  onClick={() => toggle(person.id, person.nombre)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${isBlocked
                    ? "bg-red-50 border-red-300 cursor-not-allowed opacity-60"
                    : isSelected
                      ? "bg-blue-50 border-blue-400 shadow-md ring-2 ring-blue-200"
                      : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                >
                  {/* Checkbox indicator */}
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                    ? "bg-blue-500 border-blue-500"
                    : isBlocked
                      ? "bg-red-200 border-red-300"
                      : "border-gray-300"
                    }`}>
                    {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    {isBlocked && <Lock size={12} className="text-red-500" />}
                  </div>

                  {/* Avatar */}
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${isSelected ? "bg-gradient-to-br from-blue-500 to-blue-600" :
                      level === "ok" ? "bg-gradient-to-br from-emerald-400 to-emerald-600" :
                        level === "reforzar" ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                          level === "capacitar" ? "bg-gradient-to-br from-rose-400 to-rose-600" :
                            "bg-gradient-to-br from-gray-400 to-gray-600"
                      }`}>
                      {person.nombre.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="font-semibold text-gray-900 truncate">{person.nombre}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{person.rolBase}</p>
                      <div className="mt-2">
                        <LevelBadge level={level} />
                      </div>
                    </div>
                  </div>

                  {/* Blocked warning */}
                  {isBlocked && (
                    <div className="mt-3 px-2 py-1.5 bg-red-100 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                        <Lock size={12} />
                        Ya asignado: {blockedArea.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}

                  {/* Capacitar warning */}
                  {level === "capacitar" && !isBlocked && (
                    <div className="mt-3 px-2 py-1.5 bg-rose-50 rounded-lg border border-rose-200">
                      <p className="text-xs text-rose-700 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Necesita capacitación
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {!candidates.length && (
              <div className="col-span-full text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No hay personal disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                  No se encontró personal compatible con <b>{areaId.replace(/_/g, ' ')}</b>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-600">
            {stats.selected} de {stats.total} personas seleccionadas
          </p>
          <div className="flex gap-3">
            <button
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => onSave(picked)}
            >
              <Save size={18} />
              Guardar Asignación
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AssignStaffModal;
