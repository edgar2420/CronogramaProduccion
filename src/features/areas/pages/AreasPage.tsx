import React, { useEffect, useState } from "react";
import { Layers, Plus, Pencil, Trash2, Save, X } from "lucide-react";

// Types
interface Area {
    id: string;
    label: string;
    color: string;
    activo: boolean;
}

const COLORS = [
    { bg: "bg-blue-100", border: "border-blue-300", label: "Azul" },
    { bg: "bg-purple-100", border: "border-purple-300", label: "Morado" },
    { bg: "bg-green-100", border: "border-green-300", label: "Verde" },
    { bg: "bg-yellow-100", border: "border-yellow-300", label: "Amarillo" },
    { bg: "bg-red-100", border: "border-red-300", label: "Rojo" },
    { bg: "bg-indigo-100", border: "border-indigo-300", label: "Índigo" },
    { bg: "bg-pink-100", border: "border-pink-300", label: "Rosa" },
    { bg: "bg-teal-100", border: "border-teal-300", label: "Teal" },
];

const LS_KEY = "app_areas";

function loadAreas(): Area[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    // Default areas
    return [
        { id: "BFS_PGV_321", label: "Área BFS PGV 321", color: "bg-blue-100 border-blue-300", activo: true },
        { id: "VIDRIO", label: "Área Vidrio", color: "bg-purple-100 border-purple-300", activo: true },
        { id: "PVC_PP", label: "Área PVC/PP", color: "bg-green-100 border-green-300", activo: true },
        { id: "BFS_PPV_312", label: "Área BFS PPV 312", color: "bg-yellow-100 border-yellow-300", activo: true },
        { id: "HEMODIALISIS", label: "Hemo-diálisis", color: "bg-red-100 border-red-300", activo: true },
        { id: "BFS_PGV_305", label: "Área BFS PGV 305", color: "bg-indigo-100 border-indigo-300", activo: true },
        { id: "DIVISION_PLASTICOS", label: "División Plásticos", color: "bg-pink-100 border-pink-300", activo: true },
    ];
}

function saveAreas(areas: Area[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(areas));
}

const AreasPage: React.FC = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ id: "", label: "", color: COLORS[0].bg + " " + COLORS[0].border });
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        setAreas(loadAreas());
    }, []);

    const refresh = () => setAreas(loadAreas());

    const startNew = () => {
        setIsNew(true);
        setEditingId(null);
        setForm({ id: "", label: "", color: COLORS[0].bg + " " + COLORS[0].border });
    };

    const startEdit = (area: Area) => {
        setIsNew(false);
        setEditingId(area.id);
        setForm({ id: area.id, label: area.label, color: area.color });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsNew(false);
    };

    const handleSave = () => {
        if (!form.label.trim()) return;

        let updated: Area[];
        if (isNew) {
            const newId = form.label.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
            updated = [...areas, { id: newId, label: form.label.trim(), color: form.color, activo: true }];
        } else {
            updated = areas.map(a => a.id === editingId ? { ...a, label: form.label.trim(), color: form.color } : a);
        }

        saveAreas(updated);
        refresh();
        cancelEdit();
    };

    const toggleActive = (id: string) => {
        const updated = areas.map(a => a.id === id ? { ...a, activo: !a.activo } : a);
        saveAreas(updated);
        refresh();
    };

    const deleteArea = (id: string) => {
        if (!confirm("¿Eliminar esta área? Las órdenes asociadas quedarán sin área.")) return;
        const updated = areas.filter(a => a.id !== id);
        saveAreas(updated);
        refresh();
    };

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

            {/* New Area Form */}
            {isNew && (
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Nueva Área</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nombre del Área</label>
                            <input
                                className="input"
                                value={form.label}
                                onChange={e => setForm({ ...form, label: e.target.value })}
                                placeholder="Ej: Área de Envasado"
                            />
                        </div>
                        <div>
                            <label className="label">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c.label}
                                        onClick={() => setForm({ ...form, color: c.bg + " " + c.border })}
                                        className={`w-8 h-8 rounded-lg border-2 ${c.bg} ${c.border} ${form.color.includes(c.bg) ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
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
            <div className="card">
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600 bg-gray-50">
                                <th className="py-3 px-4 font-semibold">Área</th>
                                <th className="py-3 px-4 font-semibold">ID</th>
                                <th className="py-3 px-4 font-semibold">Estado</th>
                                <th className="py-3 px-4 font-semibold w-40">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {areas.map(area => (
                                <tr key={area.id} className="border-t hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4">
                                        {editingId === area.id ? (
                                            <input
                                                className="input py-1"
                                                value={form.label}
                                                onChange={e => setForm({ ...form, label: e.target.value })}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded ${area.color}`} />
                                                <span className="font-medium">{area.label}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{area.id}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${area.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {area.activo ? "✓ Activo" : "✕ Inactivo"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            {editingId === area.id ? (
                                                <>
                                                    <button className="btn-icon hover:bg-green-100" onClick={handleSave}><Save size={16} className="text-green-600" /></button>
                                                    <button className="btn-icon hover:bg-gray-200" onClick={cancelEdit}><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn-icon hover:bg-gray-200" onClick={() => startEdit(area)}><Pencil size={16} /></button>
                                                    <button className="btn-icon hover:bg-amber-100" onClick={() => toggleActive(area.id)}>
                                                        <span className={`text-xs font-bold ${area.activo ? 'text-amber-600' : 'text-green-600'}`}>
                                                            {area.activo ? 'OFF' : 'ON'}
                                                        </span>
                                                    </button>
                                                    <button className="btn-icon hover:bg-red-100" onClick={() => deleteArea(area.id)}><Trash2 size={16} className="text-red-600" /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AreasPage;
