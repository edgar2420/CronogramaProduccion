import React, { useState } from "react";
import type { Staff, StaffRol } from "../types";
import { AlertCircle } from "lucide-react";

type Props = {
  /** id del <form>, para que los botones del pie del modal lo envíen. */
  formId: string;
  initial?: Staff | null;
  areasDisponibles: { id: string; label: string }[];
  onSubmit: (data: Omit<Staff, "id">) => void;
};

const ROLES: StaffRol[] = ["Operador", "Supervisor"];

const StaffForm: React.FC<Props> = ({ formId, initial, areasDisponibles, onSubmit }) => {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [rolBase, setRolBase] = useState<StaffRol>(initial?.rolBase ?? "Operador");
  const [areas, setAreas] = useState<string[]>(initial?.areas ?? []);
  const [activo, setActivo] = useState<boolean>(initial?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  function toggleArea(id: string) {
    setAreas(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError(null);
    onSubmit({ nombre: nombre.trim(), rolBase, areas, activo });
  }

  return (
    <form id={formId} onSubmit={submit} className="space-y-6" noValidate>
      {error && (
        <div role="alert" className="form-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="form-grid">
        <div className="field sm:col-span-2">
          <label htmlFor="staff-nombre" className="label">Nombre completo</label>
          <input
            id="staff-nombre"
            className="input"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Juan Pérez Rojas"
            autoComplete="off"
          />
        </div>

        <fieldset className="field">
          <legend className="label mb-1.5">Rol base</legend>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => (
              <label key={r} className="choice">
                <input type="radio" name="staff-rol" checked={rolBase === r} onChange={() => setRolBase(r)} />
                {r}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <span className="label">Estado</span>
          <label className="choice self-start">
            <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} />
            Personal activo
          </label>
        </div>
      </div>

      <fieldset className="field">
        <legend className="label mb-1.5">Áreas asignadas <span className="label-optional">(opcional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {areasDisponibles.map(a => (
            <label key={a.id} className="choice">
              <input type="checkbox" checked={areas.includes(a.id)} onChange={() => toggleArea(a.id)} />
              {a.label}
            </label>
          ))}
        </div>
        <p className="field-hint">Define en qué áreas se le puede asignar a una orden.</p>
      </fieldset>
    </form>
  );
};

export default StaffForm;
