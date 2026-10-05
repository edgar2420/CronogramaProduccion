import React, { useEffect, useState, useMemo } from "react";
import { GraduationCap, Search, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Save } from "lucide-react";
import * as staffApi from "@/services/api/staff.api";
import type { Staff, SkillKey, SkillLevel } from "@/features/staff/types";

type Nivel = SkillLevel | "sin_dato";

// Human-readable skill labels
const SKILL_LABELS: Record<SkillKey, string> = {
    op_ppv_vidrio: "Operador PPV Vidrio",
    aux_ppv_vidrio: "Auxiliar PPV Vidrio",
    central_pesada: "Central de Pesada",
    op_bidones: "Operador Bidones",
    aux_bidones: "Auxiliar Bidones",
    op_pgv_rigido: "Operador PGV Rígido",
    aux_pgv_rigido: "Auxiliar PGV Rígido",
    op_pgv_pvc: "Operador PGV PVC",
    aux_pgv_pvc: "Auxiliar PGV PVC",
    op_autoclave: "Operador Autoclave",
    aux_autoclave: "Auxiliar Autoclave",
    op_bfs_pgv: "Operador BFS PGV",
    prep_bfs_pgv: "Preparador BFS PGV",
    gen_vapor: "Generación de Vapor",
    integrity_test: "Integrity Test",
    aux_bfs_pgv: "Auxiliar BFS PGV",
    op_bfs_ppv: "Operador BFS PPV",
    op_inyeccion: "Operador Inyección",
    op_soplado: "Operador Soplado",
    aux_soplado: "Auxiliar Soplado",
    op_peletizadora: "Operador Peletizadora",
    aux_inyectora: "Auxiliar Inyectora",
    aux_peletizado: "Auxiliar Peletizado",
    equipos_suero: "Equipos de Suero",
    esterilizacion: "Esterilización",
};

// Commonly used skills to display in the main table
const MAIN_SKILLS: SkillKey[] = [
    "op_bfs_pgv",
    "aux_bfs_pgv",
    "op_autoclave",
    "aux_autoclave",
    "op_soplado",
    "esterilizacion",
];

const ALL_SKILLS = Object.keys(SKILL_LABELS) as SkillKey[];

const NivelBadge: React.FC<{ nivel: Nivel; onClick?: (e?: React.MouseEvent) => void; small?: boolean }> = ({ nivel, onClick, small }) => {
    const config = {
        ok: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={small ? 10 : 12} />, label: "Capacitado" },
        reforzar: { bg: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle size={small ? 10 : 12} />, label: "Reforzar" },
        capacitar: { bg: "bg-rose-100 text-rose-700 border-rose-200", icon: <XCircle size={small ? 10 : 12} />, label: "Falta Capacitar" },
        sin_dato: { bg: "bg-gray-100 text-gray-500 border-gray-200", icon: <HelpCircle size={small ? 10 : 12} />, label: "—" },
    };
    const c = config[nivel];

    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all hover:scale-105 whitespace-nowrap ${c.bg}`}
            title={`Click para cambiar nivel - Actual: ${c.label}`}
        >
            {c.icon}
            {!small && <span>{c.label}</span>}
        </button>
    );
};

// Componente para seleccionar nivel con botones individuales
const NivelSelector: React.FC<{
    nivelActual: Nivel;
    onSelect: (nivel: SkillLevel | undefined) => void
}> = ({ nivelActual, onSelect }) => {
    const niveles: { value: SkillLevel | undefined; label: string; icon: React.ReactNode; colors: string }[] = [
        { value: "ok", label: "Capacitado", icon: <CheckCircle2 size={14} />, colors: "bg-emerald-500 hover:bg-emerald-600 text-white" },
        { value: "reforzar", label: "Reforzar", icon: <AlertTriangle size={14} />, colors: "bg-amber-500 hover:bg-amber-600 text-white" },
        { value: "capacitar", label: "Capacitar", icon: <XCircle size={14} />, colors: "bg-rose-500 hover:bg-rose-600 text-white" },
        { value: undefined, label: "Sin dato", icon: <HelpCircle size={14} />, colors: "bg-gray-400 hover:bg-gray-500 text-white" },
    ];

    const getActiveNivel = () => {
        if (nivelActual === "sin_dato") return undefined;
        return nivelActual;
    };

    return (
        <div className="flex flex-wrap gap-1">
            {niveles.map((n, idx) => {
                const isActive = getActiveNivel() === n.value;
                return (
                    <button
                        key={idx}
                        onClick={() => onSelect(n.value)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${isActive
                            ? `${n.colors} ring-2 ring-offset-1 ring-gray-400 scale-105`
                            : `${n.colors} opacity-50 hover:opacity-100`
                            }`}
                        title={n.label}
                    >
                        {n.icon}
                        <span>{n.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

const CapacitacionPage: React.FC = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [search, setSearch] = useState("");
    const [filterNivel, setFilterNivel] = useState<Nivel | "todos">("todos");
    const [hasChanges, setHasChanges] = useState(false);
    const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
    const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        staffApi
            .getStaff()
            .then(setStaffList)
            .catch((err) => setLoadError(err instanceof Error ? err.message : "No se pudo cargar el personal"))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        // Solo mostrar Supervisores y Operadores
        let result = staffList.filter(s => s.activo && (s.rolBase === "Supervisor" || s.rolBase === "Operador"));

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.nombre.toLowerCase().includes(q) ||
                s.areas.join(" ").toLowerCase().includes(q) ||
                s.rolBase.toLowerCase().includes(q)
            );
        }

        if (filterNivel !== "todos") {
            result = result.filter(s => {
                if (!s.skills) return filterNivel === "sin_dato";
                const values = Object.values(s.skills);
                if (filterNivel === "sin_dato") return values.length === 0;
                return values.includes(filterNivel);
            });
        }

        return result;
    }, [staffList, search, filterNivel]);

    const cycleNivel = (staffId: string, skillKey: SkillKey) => {
        const order: (SkillLevel | undefined)[] = [undefined, "capacitar", "reforzar", "ok"];

        setStaffList(prev => prev.map(s => {
            if (s.id !== staffId) return s;
            const currentSkills = s.skills || {};
            const current = currentSkills[skillKey];
            const currentIdx = order.indexOf(current);
            const nextIdx = (currentIdx + 1) % order.length;
            const nextValue = order[nextIdx];

            const newSkills = { ...currentSkills };
            if (nextValue === undefined) {
                delete newSkills[skillKey];
            } else {
                newSkills[skillKey] = nextValue;
            }

            return { ...s, skills: newSkills };
        }));
        setChangedIds(prev => new Set(prev).add(staffId));
        setHasChanges(true);
    };

    // Función para establecer nivel directamente
    const setNivel = (staffId: string, skillKey: SkillKey, nivel: SkillLevel | undefined) => {
        setStaffList(prev => prev.map(s => {
            if (s.id !== staffId) return s;
            const newSkills = { ...(s.skills || {}) };
            if (nivel === undefined) {
                delete newSkills[skillKey];
            } else {
                newSkills[skillKey] = nivel;
            }
            return { ...s, skills: newSkills };
        }));
        setChangedIds(prev => new Set(prev).add(staffId));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            const toSave = staffList.filter((s) => changedIds.has(s.id));
            await Promise.all(
                toSave.map((staff) => staffApi.updateStaffSkills(staff.id, staff.skills ?? {}))
            );
            setChangedIds(new Set());
            setHasChanges(false);
            alert("✓ Cambios guardados correctamente");
        } catch (err) {
            alert(err instanceof Error ? err.message : "No se pudieron guardar los cambios");
        }
    };

    const getSkillLevel = (staff: Staff, skillKey: SkillKey): Nivel => {
        return staff.skills?.[skillKey] || "sin_dato";
    };

    const stats = useMemo(() => {
        let ok = 0, reforzar = 0, capacitar = 0, sin_dato = 0;
        staffList.forEach(s => {
            if (!s.skills || Object.keys(s.skills).length === 0) {
                sin_dato++;
                return;
            }
            Object.values(s.skills).forEach(n => {
                if (n === "ok") ok++;
                else if (n === "reforzar") reforzar++;
                else if (n === "capacitar") capacitar++;
            });
        });
        return { ok, reforzar, capacitar, sin_dato, total: staffList.filter(s => s.activo).length };
    }, [staffList]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <GraduationCap className="text-primary-600" size={28} />
                        Gestión de Capacitación
                    </h1>
                    <p className="page-subtitle">Administra el nivel de capacitación del personal por habilidad</p>
                    {loadError && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{loadError}</p>
                    )}
                </div>
                {hasChanges && (
                    <button className="btn-primary" onClick={handleSave}>
                        <Save size={18} /> Guardar Cambios
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card p-4 text-center">
                    <p className="text-3xl font-black text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500 font-semibold">Total Personal</p>
                </div>
                <div className="card p-4 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-500 mb-1" size={20} />
                    <p className="text-2xl font-black text-emerald-600">{stats.ok}</p>
                    <p className="text-xs text-gray-500 font-semibold">Capacitados</p>
                </div>
                <div className="card p-4 text-center">
                    <AlertTriangle className="mx-auto text-amber-500 mb-1" size={20} />
                    <p className="text-2xl font-black text-amber-600">{stats.reforzar}</p>
                    <p className="text-xs text-gray-500 font-semibold">Por Reforzar</p>
                </div>
                <div className="card p-4 text-center">
                    <XCircle className="mx-auto text-rose-500 mb-1" size={20} />
                    <p className="text-2xl font-black text-rose-600">{stats.capacitar}</p>
                    <p className="text-xs text-gray-500 font-semibold">Falta Capacitar</p>
                </div>
                <div className="card p-4 text-center">
                    <HelpCircle className="mx-auto text-gray-400 mb-1" size={20} />
                    <p className="text-2xl font-black text-gray-500">{stats.sin_dato}</p>
                    <p className="text-xs text-gray-500 font-semibold">Sin Datos</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            className="input pl-10"
                            placeholder="Buscar por nombre, rol o área..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="input w-full md:w-48"
                        value={filterNivel}
                        onChange={e => setFilterNivel(e.target.value as Nivel | "todos")}
                    >
                        <option value="todos">Todos los niveles</option>
                        <option value="ok">Capacitado</option>
                        <option value="reforzar">Reforzar</option>
                        <option value="capacitar">Falta Capacitar</option>
                        <option value="sin_dato">Sin datos</option>
                    </select>
                </div>
            </div>

            {/* Staff List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="card p-8 text-center text-gray-500">
                        No se encontró personal. Agrega personal desde la sección "Personal" del menú.
                    </div>
                ) : (
                    filtered.map(staff => (
                        <div key={staff.id} className="card overflow-hidden">
                            {/* Staff Header */}
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedStaff(expandedStaff === staff.id ? null : staff.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                                        {staff.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{staff.nombre}</h3>
                                        <p className="text-xs text-gray-500">{staff.rolBase} · {staff.areas.join(", ") || "Sin área"}</p>
                                    </div>
                                </div>

                                {/* Quick Skills Preview */}
                                <div className="flex items-center gap-2">
                                    <div className="hidden md:flex gap-1">
                                        {MAIN_SKILLS.slice(0, 4).map(skill => (
                                            <NivelBadge
                                                key={skill}
                                                nivel={getSkillLevel(staff, skill)}
                                                small
                                                onClick={(e) => {
                                                    e?.stopPropagation();
                                                    cycleNivel(staff.id, skill);
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-gray-400 text-sm">
                                        {expandedStaff === staff.id ? "▲" : "▼"}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Skills Grid */}
                            {expandedStaff === staff.id && (
                                <div className="px-4 pb-4 border-t bg-gray-50">
                                    <p className="text-sm font-semibold text-gray-700 py-3">
                                        Selecciona el nivel de capacitación para cada habilidad
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {ALL_SKILLS.map(skill => (
                                            <div
                                                key={skill}
                                                className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow"
                                            >
                                                <p className="text-xs text-gray-700 font-semibold mb-2" title={SKILL_LABELS[skill]}>
                                                    {SKILL_LABELS[skill]}
                                                </p>
                                                <NivelSelector
                                                    nivelActual={getSkillLevel(staff, skill)}
                                                    onSelect={(nivel) => setNivel(staff.id, skill, nivel)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Legend */}
            <div className="card p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Leyenda</h4>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <NivelBadge nivel="ok" />
                        <span className="text-sm text-gray-600">Listo para trabajar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <NivelBadge nivel="reforzar" />
                        <span className="text-sm text-gray-600">Necesita supervisión</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <NivelBadge nivel="capacitar" />
                        <span className="text-sm text-gray-600">Requiere capacitación</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <NivelBadge nivel="sin_dato" />
                        <span className="text-sm text-gray-600">Sin evaluar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CapacitacionPage;
