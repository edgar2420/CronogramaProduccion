import React, { useMemo, useState } from "react";
import type { User } from "@/auth/types";
import { Pencil, Trash2, Search, Power, Shield, User as UserIcon } from "lucide-react";

const UserTable: React.FC<{
  data: User[];
  onEdit: (u: User) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
}> = ({ data, onEdit, onDelete, onToggleActive }) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? data.filter(u => u.username.toLowerCase().includes(t) || u.name.toLowerCase().includes(t)) : data;
  }, [q, data]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700 font-semibold"><Shield size={12} /> Admin</span>;
      case 'supervisor':
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold"><UserIcon size={12} /> Supervisor</span>;
      default:
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-semibold"><UserIcon size={12} /> Operario</span>;
    }
  };

  return (
    <div className="card p-4">
      <div className="relative mb-4">
        <input className="input pl-9" placeholder="Buscar por usuario o nombre..." value={q} onChange={e => setQ(e.target.value)} />
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-50">
              <th className="py-3 px-2 font-semibold">Usuario</th>
              <th className="py-3 px-2 font-semibold">Nombre</th>
              <th className="py-3 px-2 font-semibold">Rol</th>
              <th className="py-3 px-2 font-semibold">Estado</th>
              <th className="py-3 px-2 font-semibold w-40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="py-3 px-2 font-medium">{u.username}</td>
                <td className="py-3 px-2">{u.name}</td>
                <td className="py-3 px-2">{getRoleBadge(u.role)}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {u.active ? "✓ Activo" : "✕ Inactivo"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    <button
                      className="btn-icon hover:bg-gray-200"
                      onClick={() => onEdit(u)}
                      title="Editar"
                    >
                      <Pencil size={16} className="text-gray-600" />
                    </button>
                    <button
                      className={`btn-icon ${u.active ? 'hover:bg-amber-100' : 'hover:bg-green-100'}`}
                      onClick={() => onToggleActive?.(u.id, !u.active)}
                      title={u.active ? "Desactivar usuario" : "Activar usuario"}
                    >
                      <Power size={16} className={u.active ? "text-amber-600" : "text-green-600"} />
                    </button>
                    <button
                      className="btn-icon hover:bg-red-100"
                      onClick={() => onDelete(u.id)}
                      title="Eliminar"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td className="py-8 text-center text-gray-500" colSpan={5}>Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UserTable;

