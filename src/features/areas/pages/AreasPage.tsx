import React, { useEffect, useState } from "react";
import { Layers, Plus, Pencil, Trash2, Save, X, Power } from "lucide-react";
import * as areasApi from "@/services/api/areas.api";
import type { Area } from "@/services/api/areas.api";

const COLORS = [
    { hex: "#3b82f6", label: "Azul" },
    { hex: "#8b5cf6", label: "Morado" },
    { hex: "#22c55e", label: "Verde" },
    { hex: "#eab308", label: "Amarillo" },
    { hex: "#ef4444", label: "Rojo" },
    { hex: "#6366f1", label: "Índigo" },
    { hex: "#ec4899", label: "Rosa" },
    { hex: "#14b8a6", label: "Teal" },
];

const AreasPage: React.FC = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ code: "", name: "", colorHex: COLORS[0].hex });
    const [isNew, setIsNew] = useState(false);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            setAreas(await areasApi.getAreas());
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron cargar las áreas");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    const startNew = () => {
        setIsNew(true);
        setEditingId(null);
        setForm({ code: "", name: "", colorHex: COLORS[0].hex });
    };

    const startEdit = (area: Area) => {
        setIsNew(false);
        setEditingId(area.id);
        setForm({ code: area.code, name: area.name, colorHex: area.colorHex ?? COLORS[0].hex });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsNew(false);
    };

    async function handleSave() {
        if (!form.name.trim()) return;
        try {
            if (isNew) {
                const code = form.code.trim()
                    ? form.code.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "")
                    : form.name.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
                await areasApi.createArea({ code, name: form.name.trim(), colorHex: form.colorHex });
            } else if (editingId) {
                await areasApi.updateArea(editingId, { name: form.name.trim(), colorHex: form.colorHex });
            }
            cancelEdit();
            await refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "No se pudo guardar el área");
        }
    }

    async function toggleActive(area: Area) {
        try {
            await areasApi.setAreaActive(area.id, !area.active);
            await refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "No se pudo cambiar el estado del área");
        }
    }

    // El backend nunca borra un área (solo baja lógica): "eliminar" aquí
    // desactiva, igual que el botón OFF, para no prometer un DELETE que no existe.
    async function deactivateArea(area: Area) {
        if (!confirm(`¿Desactivar el área "${area.name}"? No se borra el historial, solo deja de estar activa.`)) return;
        await toggleActive(area);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <Layers className="text-primary-600" size={28} />
                        Gestión de Áreas
                    </h1>
                    <p className="page-subtitle">Administra las áreas de producción</p>
                </div>
                <button className="btn-primary" onClick={startNew}>
                    <Plus size={18} /> Nueva Área
                </button>
            </div>

            {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
            )}

            {/* New Area Form */}
            {isNew && (
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Nueva Área</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nombre del Área</label>
                            <input
                                className="input"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Ej: Área de Envasado"
                            />
                        </div>
                        <div>
                            <label className="label">Código (opcional, se genera del nombre)</label>
                            <input
                                className="input"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder="Ej: ENVASADO"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c.hex}
                                        type="button"
                                        title={c.label}
                                        onClick={() => setForm({ ...form, colorHex: c.hex })}
                                        style={{ backgroundColor: c.hex }}
                                        className={`w-8 h-8 rounded-lg border-2 border-white ${form.colorHex === c.hex ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-secondary" onClick={cancelEdit}><X size={16} /> Cancelar</button>
                        <button className="btn-primary" onClick={handleSave}><Save size={16} /> Guardar</button>
                    </div>
                </div>
            )}

            {/* Areas List */}
            <div className="table-shell">
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Área</th>
                                <th>Código</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="table-empty">
                                        <div className="loading-spinner w-6 h-6 mx-auto" />
                                    </td>
                                </tr>
                            )}
                            {!loading && areas.map(area => (
                                <tr key={area.id}>
                                    <td className="min-w-[14rem]">
                                        {editingId === area.id ? (
                                            <input
                                                className="input py-1.5"
                                                aria-label="Nombre del área"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: area.colorHex ?? "#94a3b8" }}
                                                />
                                                <span className="font-medium text-slate-900">{area.name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="font-mono text-xs text-slate-500 whitespace-nowrap">{area.code}</td>
                                    <td>
                                        <span className={`status-pill ${area.active ? "status-active" : "status-inactive"}`}>
                                            {area.active ? "Activa" : "Inactiva"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-1">
                                            {editingId === area.id ? (
                                                <>
                                                    <button className="row-action text-emerald-700" onClick={handleSave} aria-label={`Guardar ${area.name}`} title="Guardar"><Save size={16} /></button>
                                                    <button className="row-action" onClick={cancelEdit} aria-label="Cancelar edición" title="Cancelar"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="row-action" onClick={() => startEdit(area)} aria-label={`Editar ${area.name}`} title="Editar"><Pencil size={16} /></button>
                                                    <button
                                                        className="row-action"
                                                        onClick={() => toggleActive(area)}
                                                        aria-label={`${area.active ? "Desactivar" : "Activar"} ${area.name}`}
                                                        title={area.active ? "Desactivar" : "Activar"}
                                                    >
                                                        <Power size={16} className={area.active ? "text-amber-600" : "text-emerald-600"} />
                                                    </button>
                                                    <button className="row-action row-action-danger" onClick={() => deactivateArea(area)} aria-label={`Eliminar ${area.name}`} title="Eliminar"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && areas.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="table-empty">
                                        <Layers size={28} className="mx-auto mb-2 text-slate-300" />
                                        No hay áreas registradas todavía. Crea la primera con "Nueva Área".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && areas.length > 0 && (
                    <div className="table-footer">{areas.length} áreas</div>
                )}
            </div>
        </div>
    );
};

export default AreasPage;
