import React, { useEffect, useState } from "react";
import { Layers, Plus, Pencil, Trash2, Power, AlertCircle, Loader2, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
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
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

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
        setFormError(null);
    };

    async function handleSave(e?: React.FormEvent) {
        e?.preventDefault();
        if (!form.name.trim()) {
            setFormError("El nombre del área es obligatorio.");
            return;
        }
        setFormError(null);
        setSaving(true);
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
            setFormError(err instanceof Error ? err.message : "No se pudo guardar el área");
        } finally {
            setSaving(false);
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

            <Modal
                open={isNew || editingId !== null}
                onClose={cancelEdit}
                busy={saving}
                icon={isNew ? <Plus size={20} /> : <Pencil size={20} />}
                title={isNew ? "Nueva área" : "Editar área"}
                description={isNew ? "Las áreas agrupan productos, personal y el cronograma." : form.name}
                footer={
                    <>
                        <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={saving}>Cancelar</button>
                        <button type="submit" form="area-form" className="btn-primary" disabled={saving}>
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            {isNew ? "Crear área" : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                <form id="area-form" onSubmit={handleSave} className="space-y-6" noValidate>
                    {formError && (
                        <div role="alert" className="form-error">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            {formError}
                        </div>
                    )}
                    <div className="form-grid">
                        <div className={`field ${isNew ? "" : "sm:col-span-2"}`}>
                            <label htmlFor="area-nombre" className="label">Nombre del área</label>
                            <input
                                id="area-nombre"
                                className="input"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Ej. Área de Envasado"
                            />
                        </div>
                        {isNew && (
                            <div className="field">
                                <label htmlFor="area-codigo" className="label">Código <span className="label-optional">(opcional)</span></label>
                                <input
                                    id="area-codigo"
                                    className="input font-mono"
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value })}
                                    placeholder="Se genera del nombre"
                                />
                                <p className="field-hint">
                                    Quedará como <span className="font-mono text-slate-700">{(form.code.trim() ? form.code.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "") : form.name.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "")) || "—"}</span>. No se puede cambiar después.
                                </p>
                            </div>
                        )}
                    </div>
                    <fieldset className="field">
                        <legend className="label mb-1.5">Color</legend>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => {
                                const selected = form.colorHex === c.hex;
                                return (
                                    <button
                                        key={c.hex}
                                        type="button"
                                        aria-label={c.label}
                                        aria-pressed={selected}
                                        title={c.label}
                                        onClick={() => setForm({ ...form, colorHex: c.hex })}
                                        style={{ backgroundColor: c.hex }}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 ${selected ? "ring-2 ring-offset-2 ring-slate-900" : "hover:scale-105"}`}
                                    >
                                        {selected && <Check size={18} />}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                </form>
            </Modal>

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
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: area.colorHex ?? "#94a3b8" }}
                                            />
                                            <span className="font-medium text-slate-900">{area.name}</span>
                                        </div>
                                    </td>
                                    <td className="font-mono text-xs text-slate-500 whitespace-nowrap">{area.code}</td>
                                    <td>
                                        <span className={`status-pill ${area.active ? "status-active" : "status-inactive"}`}>
                                            {area.active ? "Activa" : "Inactiva"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-1">
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
