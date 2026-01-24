import React, { useEffect, useState } from "react";
import type { Staff, StaffRol } from "../types";

type Props = {
  initial?: Staff | null;
  areasDisponibles: { id: string; label: string }[];
  onSubmit: (data: Omit<Staff, "id">) => void;
  onCancel: () => void;
};

const ROLES: StaffRol[] = ["Operador", "Supervisor"];

const StaffForm: React.FC<Props> = ({ initial, areasDisponibles, onSubmit, onCancel }) => {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [rolBase, setRolBase] = useState<StaffRol>(initial?.rolBase ?? "Operador");
  const [areas, setAreas] = useState<string[]>(initial?.areas ?? []);
  const [activo, setActivo] = useState<boolean>(initial?.activo ?? true);

  useEffect(() => {
    if (!initial) return;
    setNombre(initial.nombre);
    setRolBase(initial.rolBase);
    setAreas(initial.areas);
    setActivo(initial.activo);
  }, [initial]);

  function toggleArea(id: string) {
    setAreas(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return alert("El nombre es obligatorio");
    onSubmit({ nombre: nombre.trim(), rolBase, areas, activo });
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-6 border border-gray-200"
    >
      <h2 className="text-lg font-semibold text-gray-800">
        {initial ? "Editar Personal" : "Registrar Nuevo Personal"}
      </h2>

      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="staff-nombre" className="text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          id="staff-nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Ej. Juan Pérez"
        />
      </div>

      {/* Rol y activo */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="staff-rol" className="text-sm font-medium text-gray-700">Rol base</label>
          <select
            id="staff-rol"
            value={rolBase}
            onChange={e => setRolBase(e.target.value as StaffRol)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 pt-6 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={activo}
            onChange={e => setActivo(e.target.checked)}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          Personal activo
        </label>
      </div>

      {/* Áreas */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Áreas asignadas</p>
        <div className="flex flex-wrap gap-2">
          {areasDisponibles.map(a => (
            <label
              key={a.id}
              className={`cursor-pointer px-3 py-1 rounded-lg border text-sm transition 
                ${areas.includes(a.id)
                  ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <input
                type="checkbox"
                checked={areas.includes(a.id)}
                onChange={() => toggleArea(a.id)}
                className="mr-2 accent-indigo-600"
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          {initial ? "Guardar cambios" : "Crear personal"}
        </button>
      </div>
    </form>
  );
};

export default StaffForm;
