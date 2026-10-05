import React, { useMemo, useState } from "react";
import type { Staff } from "@/features/staff/types";
import { Pencil, Trash2, Search, UserX } from "lucide-react";

type Props = {
  data: Staff[];
  onEdit: (item: Staff) => void;
  onDelete: (id: string) => void;
};

const StaffTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const [q, setQ] = useState("");
  const [rol, setRol] = useState("TODOS");

  const roles = useMemo(() => [...new Set(data.map(s => s.rolBase))].sort(), [data]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter(s => {
      if (rol !== "TODOS" && s.rolBase !== rol) return false;
      return !t || s.nombre.toLowerCase().includes(t);
    });
  }, [q, rol, data]);

  return (
    <div className="table-shell">
      <div className="table-toolbar">
        <label className="table-search">
          <span className="sr-only">Buscar personal</span>
          <Search size={18} />
          <input placeholder="Buscar personal por nombre…" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">Filtrar por rol</span>
          <select className="table-select w-full sm:w-auto" value={rol} onChange={e => setRol(e.target.value)}>
            <option value="TODOS">Todos los roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Áreas asignadas</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="font-medium text-slate-900 min-w-[14rem]">{s.nombre}</td>
                <td className="whitespace-nowrap">{s.rolBase}</td>
                <td className="min-w-[12rem]">
                  <div className="flex flex-wrap gap-1">
                    {s.areas.map(a => (
                      <span key={a} className="tag bg-primary-50 text-primary-800 ring-primary-200">{a}</span>
                    ))}
                    {s.areas.length === 0 && <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${s.activo ? "status-active" : "status-inactive"}`}>
                    {s.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button className="row-action" onClick={() => onEdit(s)} aria-label={`Editar ${s.nombre}`} title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button className="row-action row-action-danger" onClick={() => onDelete(s.id)} aria-label={`Eliminar ${s.nombre}`} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  <UserX size={28} className="mx-auto mb-2 text-slate-300" />
                  {data.length === 0 ? "Todavía no hay personal registrado." : "Nadie coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        {filtered.length === data.length ? `${data.length} personas` : `Mostrando ${filtered.length} de ${data.length} personas`}
      </div>
    </div>
  );
};

export default StaffTable;
