import React, { useEffect, useState, useMemo } from "react";
import { GraduationCap, Search, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Save, ChevronDown } from "lucide-react";
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

const NIVEL_CONFIG: Record<Nivel, { bg: string; Icon: typeof CheckCircle2; label: string }> = {
    ok: { bg: "bg-emerald-50 text-emerald-800 ring-emerald-200", Icon: CheckCircle2, label: "Capacitado" },
    reforzar: { bg: "bg-amber-50 text-amber-800 ring-amber-200", Icon: AlertTriangle, label: "Reforzar" },
    capacitar: { bg: "bg-rose-50 text-rose-800 ring-rose-200", Icon: XCircle, label: "Falta capacitar" },
    sin_dato: { bg: "bg-slate-50 text-slate-500 ring-slate-200", Icon: HelpCircle, label: "Sin evaluar" },
};

const NivelBadge: React.FC<{ nivel: Nivel; onClick?: () => void; skillLabel?: string }> = ({ nivel, onClick, skillLabel }) => {
    const c = NIVEL_CONFIG[nivel];
    const content = (
        <>
            <c.Icon size={12} />
            <span>{c.label}</span>
        </>
    );
    if (!onClick) return <span className={`tag ${c.bg}`}>{content}</span>;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`tag min-h-8 ${c.bg} hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400`}
            aria-label={`${skillLabel ?? "Habilidad"}: ${c.label}. Cambiar nivel`}
            title="Click para cambiar el nivel"
        >
            {content}
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
            alert("Cambios guardados correctamente");
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <GraduationCap className="text-primary-600" size={28} />
                        Gestión de Capacitación
                    </h1>
                    <p className="page-subtitle">Nivel de capacitación del personal por habilidad</p>
                </div>
                {hasChanges && (
                    <button className="btn-primary" onClick={handleSave}>
                        <Save size={18} /> Guardar cambios ({changedIds.size})
                    </button>
                )}
            </div>

            {loadError && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loadError}</p>
            )}

            <div className="table-shell">
                <div className="table-toolbar">
                    <label className="table-search">
                        <span className="sr-only">Buscar personal</span>
                        <Search size={18} />
                        <input
                            placeholder="Buscar por nombre, rol o área…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filtrar por nivel</span>
                        <select
                            className="table-select w-full sm:w-auto"
                            value={filterNivel}
                            onChange={e => setFilterNivel(e.target.value as Nivel | "todos")}
                        >
                            <option value="todos">Todos los niveles</option>
                            <option value="ok">Capacitado</option>
                            <option value="reforzar">Reforzar</option>
                            <option value="capacitar">Falta capacitar</option>
                            <option value="sin_dato">Sin evaluar</option>
                        </select>
                    </label>
                </div>

                {/* Resumen: hace también de leyenda de los niveles. */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 border-b border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">{stats.total} personas</span>
                    <span className="inline-flex items-center gap-1.5"><NivelBadge nivel="ok" /> {stats.ok}</span>
                    <span className="inline-flex items-center gap-1.5"><NivelBadge nivel="reforzar" /> {stats.reforzar}</span>
                    <span className="inline-flex items-center gap-1.5"><NivelBadge nivel="capacitar" /> {stats.capacitar}</span>
                    <span className="inline-flex items-center gap-1.5"><NivelBadge nivel="sin_dato" /> {stats.sin_dato} personas</span>
                </div>

                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Personal</th>
                                {MAIN_SKILLS.map(skill => (
                                    <th key={skill} className="normal-case tracking-normal">{SKILL_LABELS[skill]}</th>
                                ))}
                                <th className="text-right">Todas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={MAIN_SKILLS.length + 2} className="table-empty"><div className="loading-spinner w-6 h-6 mx-auto" /></td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={MAIN_SKILLS.length + 2} className="table-empty">
                                        No se encontró personal. Agrega personal desde la sección Personal del menú.
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.map(staff => {
                                const expanded = expandedStaff === staff.id;
                                return (
                                    <React.Fragment key={staff.id}>
                                        <tr className={changedIds.has(staff.id) ? "bg-amber-50/60" : undefined}>
                                            <td className="min-w-[15rem]">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 font-semibold flex items-center justify-center shrink-0">
                                                        {staff.nombre.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">{staff.nombre}</p>
                                                        <p className="text-xs text-slate-500 truncate">{staff.rolBase} · {staff.areas.join(", ") || "Sin área"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {MAIN_SKILLS.map(skill => (
                                                <td key={skill} className="whitespace-nowrap">
                                                    <NivelBadge
                                                        nivel={getSkillLevel(staff, skill)}
                                                        skillLabel={`${staff.nombre}, ${SKILL_LABELS[skill]}`}
                                                        onClick={() => cycleNivel(staff.id, skill)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="text-right">
                                                <button
                                                    className="row-action"
                                                    onClick={() => setExpandedStaff(expanded ? null : staff.id)}
                                                    aria-expanded={expanded}
                                                    aria-label={`${expanded ? "Ocultar" : "Ver"} todas las habilidades de ${staff.nombre}`}
                                                    title="Todas las habilidades"
                                                >
                                                    <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                                                </button>
                                            </td>
                                        </tr>
                                        {expanded && (
                                            <tr className="hover:bg-transparent">
                                                <td colSpan={MAIN_SKILLS.length + 2} className="bg-slate-50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 py-1">
                                                        {ALL_SKILLS.map(skill => (
                                                            <div key={skill} className="bg-white rounded-xl p-3 border border-slate-200">
                                                                <p className="text-xs text-slate-700 font-semibold mb-2">{SKILL_LABELS[skill]}</p>
                                                                <NivelSelector
                                                                    nivelActual={getSkillLevel(staff, skill)}
                                                                    onSelect={(nivel) => setNivel(staff.id, skill, nivel)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    {filtered.length} de {stats.total} personas · Click en un nivel para cambiarlo; se guarda con Guardar cambios.
                </div>
            </div>
        </div>
    );
};

export default CapacitacionPage;
