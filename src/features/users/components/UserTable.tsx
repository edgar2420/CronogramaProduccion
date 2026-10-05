import React, { useMemo, useState } from "react";
import type { User, Role } from "@/auth/types";
import { Pencil, Trash2, Search, Power, ShieldCheck, Shield, User as UserIcon, UserX } from "lucide-react";

const ROLE_CONFIG: Record<Role, { label: string; className: string; Icon: typeof Shield }> = {
  superadmin: { label: "Superadmin", className: "bg-primary-50 text-primary-800 ring-primary-200", Icon: ShieldCheck },
  admin: { label: "Admin", className: "bg-sky-50 text-sky-800 ring-sky-200", Icon: Shield },
  usuario: { label: "Usuario", className: "bg-slate-100 text-slate-700 ring-slate-200", Icon: UserIcon },
};

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

  return (
    <div className="table-shell">
      <div className="table-toolbar">
        <label className="table-search">
          <span className="sr-only">Buscar usuario</span>
          <Search size={18} />
          <input placeholder="Buscar por usuario o nombre…" value={q} onChange={e => setQ(e.target.value)} />
        </label>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const role = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.usuario;
              return (
                <tr key={u.id}>
                  <td className="min-w-[14rem]">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 font-semibold flex items-center justify-center shrink-0">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${role.className}`}>
                      <role.Icon size={12} />
                      {role.label}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${u.active ? "status-active" : "status-inactive"}`}>
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="row-action" onClick={() => onEdit(u)} aria-label={`Editar ${u.username}`} title="Editar">
                        <Pencil size={16} />
                      </button>
                      {onToggleActive && (
                        <button
                          className="row-action"
                          onClick={() => onToggleActive(u.id, !u.active)}
                          aria-label={`${u.active ? "Desactivar" : "Activar"} ${u.username}`}
                          title={u.active ? "Desactivar usuario" : "Activar usuario"}
                        >
                          <Power size={16} className={u.active ? "text-amber-600" : "text-emerald-600"} />
                        </button>
                      )}
                      <button className="row-action row-action-danger" onClick={() => onDelete(u.id)} aria-label={`Eliminar ${u.username}`} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  <UserX size={28} className="mx-auto mb-2 text-slate-300" />
                  {data.length === 0 ? "Todavía no hay usuarios." : "Ningún usuario coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        {filtered.length === data.length ? `${data.length} ${data.length === 1 ? "usuario" : "usuarios"}` : `Mostrando ${filtered.length} de ${data.length} usuarios`}
      </div>
    </div>
  );
};

export default UserTable;
