import React, { useEffect, useState } from "react";
import type { User } from "@/auth/types";
import { loadUsers, seedUsersIfNeeded, createUser, updateUser, removeUser } from "@/services/storage/users.store";
import UserTable from "@/features/users/components/UserTable";
import UserForm from "@/features/users/components/UserForm";
import { Plus, Users } from "lucide-react";

const AdminUsersPage: React.FC = () => {
  const [items, setItems] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { seedUsersIfNeeded(); setItems(loadUsers()); }, []);
  const refresh = () => setItems(loadUsers());

  function onCreate() { setEditing(null); setShowForm(true); }
  function onEdit(u: User) { setEditing(u); setShowForm(true); }
  function onDelete(id: string) {
    if (confirm("¿Eliminar usuario? Esta acción no se puede deshacer.")) {
      removeUser(id);
      refresh();
    }
  }

  function onToggleActive(id: string, active: boolean) {
    updateUser(id, { active });
    refresh();
  }

  function handleSubmit(data: Omit<User, "id">) {
    if (editing) updateUser(editing.id, data);
    else createUser(data);
    setShowForm(false); setEditing(null); refresh();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Users className="text-primary-600" size={28} />
            Gestión de Usuarios
          </h1>
          <p className="page-subtitle">Administra los usuarios del sistema</p>
        </div>
        <button className="btn-primary" onClick={onCreate}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {!showForm && (
        <UserTable
          data={items}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      )}

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? "Editar usuario" : "Nuevo usuario"}</h2>
          <UserForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}
    </div>
  );
};
export default AdminUsersPage;
