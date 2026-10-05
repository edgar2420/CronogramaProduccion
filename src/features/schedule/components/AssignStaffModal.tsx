import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import * as staffApi from "@/services/api/staff.api";
import type { Staff, SkillKey, SkillLevel } from "@/features/staff/types";
import type { Turno } from "@/features/schedule/types";
import Modal from "@/components/ui/Modal";
import { Search, Users, X, AlertCircle, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

// Habilidades que cuentan para cada área. Solo sirven para MOSTRAR el nivel
// de capacitación como referencia: no filtran ni bloquean a nadie.
const SKILLS_POR_AREA: Record<string, SkillKey[]> = {
  VIDRIO: ["op_ppv_vidrio", "aux_ppv_vidrio", "central_pesada"],
  BFS_PPV_312: ["op_bfs_ppv", "aux_bfs_pgv", "integrity_test"],
  BFS_PGV_321: ["op_bfs_pgv", "aux_bfs_pgv", "prep_bfs_pgv", "gen_vapor", "integrity_test", "op_pgv_rigido", "aux_pgv_rigido", "op_pgv_pvc", "aux_pgv_pvc", "equipos_suero", "esterilizacion"],
  BFS_PGV_305: ["op_bfs_pgv", "aux_bfs_pgv", "prep_bfs_pgv", "gen_vapor", "integrity_test", "op_pgv_rigido", "aux_pgv_rigido", "op_pgv_pvc", "aux_pgv_pvc", "equipos_suero", "esterilizacion"],
  PVC_PP: ["op_pgv_pvc", "aux_pgv_pvc", "central_pesada"],
  DIVISION_PLASTICOS: ["op_soplado", "aux_soplado", "op_inyeccion", "aux_inyectora", "op_peletizadora", "aux_peletizado"],
  HEMODIALISIS: ["equipos_suero"],
};

const NIVEL: Record<SkillLevel, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: "Capacitado", className: "bg-emerald-50 text-emerald-800 ring-emerald-200", Icon: CheckCircle2 },
  reforzar: { label: "Reforzar", className: "bg-amber-50 text-amber-800 ring-amber-200", Icon: AlertTriangle },
  capacitar: { label: "Falta capacitar", className: "bg-rose-50 text-rose-800 ring-rose-200", Icon: XCircle },
};

/** Mejor nivel registrado en las habilidades del área, o null si no hay datos. */
function nivelEnArea(s: Staff, areaCode: string): SkillLevel | null {
  const keys = SKILLS_POR_AREA[areaCode] ?? [];
  const niveles = keys.map(k => s.skills?.[k]).filter(Boolean) as SkillLevel[];
  if (niveles.includes("ok")) return "ok";
  if (niveles.includes("reforzar")) return "reforzar";
  if (niveles.includes("capacitar")) return "capacitar";
  return null;
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Código del área de la orden (BFS_PGV_321, VIDRIO, …). */
  areaId: string;
  productoNombre: string;
  fecha: string;
  turno: Turno;
  selectedIds: string[];
  /** Guarda la asignación; si el servidor la rechaza, el error se muestra en el modal. */
  onSave: (ids: string[]) => Promise<void>;
};

const AssignStaffModal: React.FC<Props> = ({ open, onClose, areaId, productoNombre, fecha, turno, selectedIds, onSave }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPicked(selectedIds);
    setQ("");
    setError(null);
    setLoading(true);
    staffApi.getStaff()
      .then(list => { if (!cancelled) setStaff(list.filter(s => s.activo)); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el personal"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, selectedIds]);

  const byId = useMemo(() => new Map(staff.map(s => [s.id, s])), [staff]);

  // Todo el personal activo, sin restricción por capacitación ni por área.
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return staff
      .filter(s => !t || s.nombre.toLowerCase().includes(t) || s.rolBase.toLowerCase().includes(t) || s.areas.join(" ").toLowerCase().includes(t))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [staff, q]);

  const toggle = (id: string) => setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(picked);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la asignación");
    } finally {
      setSaving(false);
    }
  };

  const fechaLarga = dayjs(fecha).locale("es").format("dddd D [de] MMMM");

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      icon={<Users size={20} />}
      title="Asignar personal"
      description={`${productoNombre} · ${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} · turno ${turno}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={guardar} disabled={saving || loading}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            Guardar asignación{picked.length ? ` (${picked.length})` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div role="alert" className="form-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Seleccionados: se pueden quitar sin buscarlos en la lista. */}
        <div className="field">
          <span className="label">Asignados ({picked.length})</span>
          {picked.length === 0 ? (
            <p className="text-sm text-slate-500">Nadie asignado todavía. Elige personas de la lista.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {picked.map(id => {
                const s = byId.get(id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 pl-3 pr-1 h-9 rounded-full bg-primary-50 text-primary-800 ring-1 ring-inset ring-primary-200 text-sm">
                    {s?.nombre ?? "Persona no encontrada"}
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                      aria-label={`Quitar a ${s?.nombre ?? "esta persona"}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <label className="table-search block border-b border-slate-200 p-2">
            <span className="sr-only">Buscar personal</span>
            <Search size={18} className="!left-5" />
            <input data-autofocus placeholder={`Buscar entre ${staff.length} personas…`} value={q} onChange={e => setQ(e.target.value)} />
          </label>

          <ul className="max-h-[45vh] overflow-y-auto divide-y divide-slate-100" aria-label="Personal disponible">
            {loading && (
              <li className="py-10 flex justify-center"><div className="loading-spinner w-6 h-6" /></li>
            )}
            {!loading && lista.map(s => {
              const checked = picked.includes(s.id);
              const nivel = nivelEnArea(s, areaId);
              return (
                <li key={s.id}>
                  <label className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 has-[:focus-visible]:bg-slate-50 ${checked ? "bg-primary-50/60" : ""}`}>
                    <input type="checkbox" className="w-4 h-4 accent-primary-600 shrink-0" checked={checked} onChange={() => toggle(s.id)} />
                    <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0">
                      {s.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900 truncate">{s.nombre}</span>
                      <span className="block text-xs text-slate-500 truncate">{s.rolBase}{s.areas.length ? ` · ${s.areas.join(", ")}` : ""}</span>
                    </span>
                    {nivel && (
                      <span className={`tag ${NIVEL[nivel].className}`} title="Nivel de capacitación registrado (solo referencia)">
                        {React.createElement(NIVEL[nivel].Icon, { size: 12 })}
                        {NIVEL[nivel].label}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
            {!loading && lista.length === 0 && (
              <li className="py-10 text-center text-sm text-slate-500">
                {staff.length === 0 ? "No hay personal activo registrado." : `Nadie coincide con "${q}".`}
              </li>
            )}
          </ul>
        </div>

        <p className="field-hint">
          Puedes asignar a cualquier persona activa; el nivel de capacitación se muestra solo como referencia.
          Lo único que el sistema impide es asignar a la misma persona en dos áreas en el mismo turno.
        </p>
      </div>
    </Modal>
  );
};

export default AssignStaffModal;
