import React, { useEffect, useMemo, useState } from "react";
import StaffTable from "../components/StaffTable";
import StaffForm from "../components/StaffForm";
import type { Staff } from "../types";
import {
  loadStaff,
  seedStaffIfNeeded,
  createStaff,
  updateStaff,
  removeStaff,
  resetAndLoadAllStaff,
} from "../../../services/storage/staff.store";
import {
  downloadStaffAsTxt,
  importStaffFromTxt,
  getStaffSummary
} from "../../../services/storage/staffFile.service";
import { Plus, ShieldCheck, AlertTriangle, GraduationCap, Filter, Download, Upload, FileText, Users, RefreshCw } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   ÁREAS (catálogo completo)
   ────────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AREAS = [
  { id: "BFS_PGV_321", label: "ÁREA BFS PGV 321" },
  { id: "VIDRIO", label: "ÁREA VIDRIO" },
  { id: "PVC_PP", label: "ÁREA PVC O PP" },
  { id: "BFS_PPV_312", label: "ÁREA BFS PPV 312" },
  { id: "HEMODIALISIS", label: "ÁREA HEMODIÁLISIS" },
  { id: "BFS_PGV_305", label: "ÁREA BFS PGV 305" },
  { id: "DIVISION_PLASTICOS", label: "ÁREA DIVISIÓN PLÁSTICOS" },
  // Áreas operativas usadas en tu lista (para filtrar el mapa de capacitación):
  { id: "PGV", label: "PGV" },
  { id: "BFS-PGV", label: "BFS-PGV" },
  { id: "Autoclave", label: "Autoclave" },
  { id: "Acondicionamiento", label: "Acondicionamiento" },
  { id: "Soplado", label: "Soplado" },
  { id: "Equipos", label: "Equipos de suero" },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
   ROLES / COMPETENCIAS (columnas de tu matriz)
   ────────────────────────────────────────────────────────────────────────── */
const ROLES = [
  "Operador PPV Vidrio",
  "Auxiliar PPV Vidrio",
  "Central de pesada",
  "Operador bidones",
  "Auxiliar bidones",
  "Operador PGV Rígido",
  "Auxiliar PGV Rígido",
  "Operador PGV PVC",
  "Auxiliar PGV PVC",
  "Operador Autoclave",
  "Auxiliar Autoclave",
  "Operador BFS PGV",
  "Preparador BFS PGV",
  "Generación de vapor",
  "Integrity test",
  "Auxiliar BFS PGV",
  "Operador BFS PPV",
  "Operador Inyección",
  "Operador Soplado",
  "Auxiliar Soplado",
  "Operador Peletizadora",
  "Auxiliar Inyectora",
  "Auxiliar Peletizado",
  "Equipos de suero",
  "Esterilización",
] as const;

type Rol = (typeof ROLES)[number];
type Nivel = "x" | "reforzar" | "capacitar" | "revisar"; // estados que mencionaste

type FilaCap = {
  nombre: string;
  area: string; // "Área dependiente"
  roles: Partial<Record<Rol, Nivel>>;
};

/* ──────────────────────────────────────────────────────────────────────────
   DATA: Mapa (puedes seguir extendiendo)
   Notas:
   - Solo puse los roles que marcaste en tus filas. Añade/edita tranquilamente.
   - Usa 'x' = capacitado; 'reforzar' / 'capacitar' / 'revisar' según tu lista.
   ────────────────────────────────────────────────────────────────────────── */
const CAP_DATA: FilaCap[] = [
  {
    nombre: "Tomás Bravo",
    area: "BFS-PGV",
    roles: {
      "Operador bidones": "reforzar",
      "Auxiliar bidones": "x",
      "Operador PGV Rígido": "reforzar",
      "Auxiliar PGV Rígido": "x",
      "Operador PGV PVC": "reforzar",
      "Auxiliar Autoclave": "x",
    },
  },
  {
    nombre: "Elvira Ramos",
    area: "BFS-PGV",
    roles: {
      "Auxiliar bidones": "x",
      "Auxiliar PGV Rígido": "x",
      "Auxiliar PGV PVC": "x",
      "Auxiliar Autoclave": "x",
      "Auxiliar BFS PGV": "x",
      "Operador BFS PGV": "reforzar",
    },
  },
  {
    nombre: "Yonatán Campos",
    area: "BFS-PGV",
    roles: {
      "Operador PPV Vidrio": "reforzar",
      "Auxiliar PPV Vidrio": "reforzar",
      "Operador bidones": "x",
      "Auxiliar bidones": "x",
      "Operador PGV Rígido": "x",
      "Auxiliar PGV Rígido": "x",
      "Operador PGV PVC": "x",
      "Auxiliar PGV PVC": "x",
      "Operador Autoclave": "capacitar",
      "Operador BFS PGV": "reforzar",
    },
  },
  {
    nombre: "Lidia Mamani",
    area: "BFS-PGV",
    roles: {
      "Operador bidones": "x",
      "Auxiliar bidones": "x",
      "Operador PGV Rígido": "x",
      "Operador PGV PVC": "x",
      "Auxiliar PGV PVC": "x",
      "Operador Autoclave": "capacitar",
      "Operador BFS PGV": "reforzar",
      "Preparador BFS PGV": "x",
    },
  },
  {
    nombre: "Luz Arce",
    area: "PGV",
    roles: {
      "Operador PPV Vidrio": "x",
      "Auxiliar PPV Vidrio": "x",
      "Operador bidones": "x",
      "Auxiliar bidones": "x",
      "Auxiliar PGV Rígido": "x",
      "Operador PGV PVC": "x",
      "Auxiliar Autoclave": "capacitar",
      "Operador BFS PGV": "reforzar",
      "Preparador BFS PGV": "x",
    },
  },
  {
    nombre: "Magaly Bautista",
    area: "PGV",
    roles: {
      "Auxiliar bidones": "x",
      "Operador PGV Rígido": "reforzar",
      "Auxiliar PGV Rígido": "x",
      "Operador PGV PVC": "x",
      "Auxiliar PGV PVC": "x",
      "Operador BFS PGV": "reforzar",
      "Preparador BFS PGV": "x",
    },
  },
  {
    nombre: "Fernando Justiniano",
    area: "PGV",
    roles: {
      "Operador PPV Vidrio": "x",
      "Operador bidones": "reforzar",
      "Auxiliar bidones": "x",
      "Operador PGV Rígido": "reforzar",
      "Auxiliar PGV Rígido": "x",
      "Operador PGV PVC": "x",
      "Auxiliar PGV PVC": "x",
      "Operador Autoclave": "reforzar",
      "Operador BFS PGV": "x",
      "Preparador BFS PGV": "x",
    },
  },
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
  {
    nombre: "Daniela Perez",
    area: "Soplado",
    roles: {
      "Operador Autoclave": "x",
      "Auxiliar Autoclave": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
      "Operador Inyección": "reforzar",
    },
  },
  {
    nombre: "Vicenta Estrada",
    area: "Equipos",
    roles: {
      "Auxiliar PPV Vidrio": "x",
      "Operador PPV Vidrio": "x",
      "Auxiliar PGV Rígido": "x",
      "Operador PGV PVC": "reforzar",
      "Operador BFS PGV": "reforzar",
      "Preparador BFS PGV": "x",
    },
  },
  {
    nombre: "Tania Ferrufino",
    area: "Soplado",
    roles: {
      "Operador Autoclave": "x",
      "Auxiliar Autoclave": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
      "Operador Inyección": "reforzar",
    },
  },
  {
    nombre: "Monica Cossio",
    area: "Soplado",
    roles: {
      "Operador Autoclave": "x",
      "Auxiliar Autoclave": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
      "Operador Inyección": "reforzar",
    },
  },
  {
    nombre: "Monica Lijeron",
    area: "Soplado",
    roles: {
      "Esterilización": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
    },
  },
  {
    nombre: "Maria Elena Sabala",
    area: "Soplado",
    roles: {
      "Operador Autoclave": "x",
      "Auxiliar Autoclave": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
    },
  },
  {
    nombre: "Silvana Vaca",
    area: "Equipos",
    roles: {
      "Operador Autoclave": "x",
      "Auxiliar Autoclave": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
      "Preparador BFS PGV": "reforzar",
    },
  },
  {
    nombre: "Valentina Roque",
    area: "Equipos",
    roles: {
      "Auxiliar Autoclave": "revisar",
      "Operador Soplado": "revisar",
      "Auxiliar Soplado": "revisar",
      "Operador Autoclave": "x",
    },
  },
  {
    nombre: "Isaias Yucra",
    area: "Soplado",
    roles: {
      "Operador Autoclave": "x",
      "Auxiliar Autoclave": "x",
      "Operador Soplado": "x",
      "Auxiliar Soplado": "x",
    },
  },
  { nombre: "Maribel Vedia", area: "Acondicionamiento", roles: { "Esterilización": "x" } },
];

/* ──────────────────────────────────────────────────────────────────────────
   Componente auxiliar: Badge por nivel
   ────────────────────────────────────────────────────────────────────────── */
function NivelBadge({ nivel }: { nivel: Nivel | undefined }) {
  if (!nivel) return null;
  const map: Record<Nivel, string> = {
    x: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200",
    reforzar: "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200",
    capacitar: "bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border border-sky-200",
    revisar: "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200",
  };
  const label: Record<Nivel, string> = {
    x: "✓ Capacitado",
    reforzar: "⚠ Reforzar",
    capacitar: "📚 Capacitar",
    revisar: "👁 Revisar",
  };
  return <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${map[nivel]}`}>{label[nivel]}</span>;
}

/* ──────────────────────────────────────────────────────────────────────────
   Vista principal
   ────────────────────────────────────────────────────────────────────────── */
const AdminStaffPage: React.FC = () => {
  const [items, setItems] = useState<Staff[]>([]);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [showForm, setShowForm] = useState(false);

  // filtros del mapa
  const [areaFiltro, setAreaFiltro] = useState<string>("TODAS");
  const [rolFiltro, setRolFiltro] = useState<Rol>("Operador PPV Vidrio");

  useEffect(() => {
    seedStaffIfNeeded();
    setItems(loadStaff());
  }, []);

  function refresh() {
    setItems(loadStaff());
  }

  function onCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function onEdit(it: Staff) {
    setEditing(it);
    setShowForm(true);
  }
  function onDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    removeStaff(id);
    refresh();
  }

  function handleSubmit(data: Omit<Staff, "id">) {
    if (editing) updateStaff(editing.id, data);
    else createStaff(data);
    setShowForm(false);
    setEditing(null);
    refresh();
  }

  // Filtrado rápido del mapa
  const filasFiltradas = useMemo(() => {
    return CAP_DATA.filter((f) =>
      areaFiltro === "TODAS" ? true : f.area === areaFiltro
    );
  }, [areaFiltro]);

  const capacitados = useMemo(
    () => filasFiltradas.filter((f) => f.roles[rolFiltro] === "x").map((f) => f.nombre),
    [filasFiltradas, rolFiltro]
  );
  const reforzar = useMemo(
    () => filasFiltradas.filter((f) => f.roles[rolFiltro] === "reforzar").map((f) => f.nombre),
    [filasFiltradas, rolFiltro]
  );
  const capacitar = useMemo(
    () =>
      filasFiltradas
        .filter((f) => f.roles[rolFiltro] === "capacitar" || f.roles[rolFiltro] === "revisar")
        .map((f) => f.nombre),
    [filasFiltradas, rolFiltro]
  );

  // Resumen del personal guardado
  const staffSummary = useMemo(() => getStaffSummary(), [items]);

  // Handler para exportar TXT
  const handleExportTxt = () => {
    downloadStaffAsTxt();
    refresh();
  };

  // Handler para importar TXT
  const handleImportTxt = async () => {
    try {
      const result = await importStaffFromTxt();
      alert(`✅ Importación completada:\n\n📥 ${result.imported} nuevos registros importados\n📊 ${result.total} registros encontrados en el archivo`);
      refresh();
    } catch (error) {
      alert(`❌ Error al importar: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header + botones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Gestión de Personal</h1>
          <p className="text-sm text-slate-500">Administra tu equipo y consulta el mapa de capacitación</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Botón Guardar como TXT */}
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-xl font-medium text-sm"
            onClick={handleExportTxt}
            title="Descargar lista como archivo .txt"
          >
            <Download size={16} />
            Guardar como TXT
          </button>
          {/* Botón Importar desde TXT */}
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-200 hover:shadow-xl font-medium text-sm"
            onClick={handleImportTxt}
            title="Cargar personal desde archivo .txt"
          >
            <Upload size={16} />
            Importar TXT
          </button>
          {/* Botón Recargar Todo el Personal */}
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-200 hover:shadow-xl font-medium text-sm"
            onClick={() => {
              if (confirm("¿Recargar todo el personal del mapa de capacitación?\n\nEsto agregará TODOS los empleados del sistema.")) {
                const result = resetAndLoadAllStaff();
                alert(`✅ Personal recargado!\n\n👥 ${result.total} personas cargadas\n(Solo Operadores y Supervisores)`);
                refresh();
              }
            }}
            title="Recargar todo el personal del mapa de capacitación"
          >
            <RefreshCw size={16} />
            Recargar Todo
          </button>
          {/* Botón Nuevo Personal */}
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 font-medium"
            onClick={onCreate}
          >
            <Plus size={18} />
            Nuevo Personal
          </button>
        </div>
      </div>

      {/* Resumen del Personal Guardado Localmente */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 shadow-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Personal Guardado Localmente</h2>
            <p className="text-xs text-slate-500">Este es el personal disponible para asignación en los cronogramas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-indigo-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{staffSummary.total}</p>
          </div>

          {/* Activos */}
          <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Activos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{staffSummary.activos}</p>
          </div>

          {/* Por Rol */}
          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm col-span-2 sm:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-amber-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Por Rol</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(staffSummary.porRol).map(([rol, count]) => (
                <span key={rol} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                  {rol}: <strong>{count}</strong>
                </span>
              ))}
              {Object.keys(staffSummary.porRol).length === 0 && (
                <span className="text-sm text-slate-400">Sin personal registrado</span>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <FileText size={14} />
            <span>
              <strong>Nota:</strong> El personal se guarda en tu navegador (localStorage).
              Usa "Guardar como TXT" para tener una copia en tu carpeta de <strong>Descargas</strong>.
            </span>
          </p>
        </div>
      </div>

      {/* Tu tabla de edición usual */}
      {!showForm && <StaffTable data={items} onEdit={onEdit} onDelete={onDelete} />}

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {editing ? "Editar personal" : "Nuevo personal"}
              </h2>
              <p className="text-sm text-slate-500">
                {editing ? "Actualiza la información del empleado" : "Añade un nuevo miembro al equipo"}
              </p>
            </div>
          </div>
          <StaffForm
            initial={editing}
            areasDisponibles={[
              { id: "PGV", label: "PGV" },
              { id: "BFS-PGV", label: "BFS-PGV" },
              { id: "Autoclave", label: "Autoclave" },
              { id: "Acondicionamiento", label: "Acondicionamiento" },
              { id: "Soplado", label: "Soplado" },
              { id: "Equipos", label: "Equipos de suero" },
            ]}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {/* ───────────────────────────────────────────────
          MAPA DE CAPACITACIÓN (solo lectura)
         ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Filter size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mapa de Capacitación</h2>
              <p className="text-sm text-slate-500">Visualiza el estado de formación del equipo</p>
            </div>
          </div>
          <div className="ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
              >
                <option value="TODAS">Todas las áreas</option>
                {[...new Set(CAP_DATA.map((f) => f.area))].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                value={rolFiltro}
                onChange={(e) => setRolFiltro(e.target.value as Rol)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Listas por estado */}
        <div className="grid gap-5 md:grid-cols-3 mb-6">
          <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ShieldCheck className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg">Capacitados</h3>
                <p className="text-xs text-emerald-600">{capacitados.length} personas</p>
              </div>
            </div>
            {capacitados.length ? (
              <ul className="space-y-2">
                {capacitados.map((n) => (
                  <li key={n} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-emerald-100 hover:border-emerald-200 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{n}</span>
                    <NivelBadge nivel="x" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">No hay registros</div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 text-lg">Reforzar</h3>
                <p className="text-xs text-amber-600">{reforzar.length} personas</p>
              </div>
            </div>
            {reforzar.length ? (
              <ul className="space-y-2">
                {reforzar.map((n) => (
                  <li key={n} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-amber-100 hover:border-amber-200 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{n}</span>
                    <NivelBadge nivel="reforzar" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">No hay registros</div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <GraduationCap className="text-sky-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sky-800 text-lg">Capacitar / Revisar</h3>
                <p className="text-xs text-sky-600">{capacitar.length} personas</p>
              </div>
            </div>
            {capacitar.length ? (
              <ul className="space-y-2">
                {capacitar.map((n) => (
                  <li key={n} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-sky-100 hover:border-sky-200 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{n}</span>
                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-sky-100 text-sky-700">
                      Capacitar/Revisar
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">No hay registros</div>
            )}
          </div>
        </div>

        {/* Tabla compacta (opcional) */}
        <div className="rounded-xl bg-slate-50 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Detalle de capacitación
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold">Personal</th>
                  <th className="py-3 px-4 text-left font-semibold">Área</th>
                  <th className="py-3 px-4 text-left font-semibold">Rol seleccionado</th>
                  <th className="py-3 px-4 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.map((f) => {
                  const nivel = f.roles[rolFiltro];
                  return (
                    <tr key={`${f.nombre}-${rolFiltro}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">{f.nombre}</td>
                      <td className="py-3 px-4 text-slate-600">{f.area}</td>
                      <td className="py-3 px-4 text-slate-600">{rolFiltro}</td>
                      <td className="py-3 px-4">
                        <NivelBadge nivel={nivel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStaffPage;