import React, { useEffect, useState } from "react";
import type { User } from "@/auth/types";
import * as usersApi from "@/services/api/users.api";
import UserTable from "@/features/users/components/UserTable";
import UserForm from "@/features/users/components/UserForm";
import { Plus, Users, UserPlus, Pencil, AlertCircle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

const AdminUsersPage: React.FC = () => {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setItems(await usersApi.getUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function onCreate() { setEditing(null); setShowForm(true); }
  function onEdit(u: User) { setEditing(u); setShowForm(true); }

  async function onDelete(id: string) {
    // El backend nunca borra un usuario (nunca DELETE): "eliminar" aquí
    // desactiva la cuenta, igual que el switch de estado.
    if (!confirm("¿Desactivar este usuario? No podrá iniciar sesión, pero su historial de auditoría se conserva.")) return;
    try {
      await usersApi.updateUser(id, { active: false });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo desactivar el usuario");
    }
  }

  async function onToggleActive(id: string, active: boolean) {
    try {
      await usersApi.updateUser(id, { active });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo actualizar el usuario");
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(data: Omit<User, "id">) {
    setFormError(null);
    setSaving(true);
    try {
      if (editing) {
        await usersApi.updateUser(editing.id, {
          name: data.name,
          role: data.role,
          active: data.active,
          password: data.password ? data.password : undefined,
        });
      } else {
        await usersApi.createUser({
          username: data.username,
          name: data.name,
          role: data.role,
          password: data.password,
        });
      }
      closeForm();
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
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

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      {loading && (
        <div className="card p-10 flex items-center justify-center">
          <div className="loading-spinner w-8 h-8" />
        </div>
      )}

      {!loading && (
        <UserTable
          data={items}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        busy={saving}
        size="lg"
        icon={editing ? <Pencil size={20} /> : <UserPlus size={20} />}
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        description={editing ? `@${editing.username}` : "Cuenta para iniciar sesión en el sistema."}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>Cancelar</button>
            <button type="submit" form="user-form" className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? "Guardar cambios" : "Crear usuario"}
            </button>
          </>
        }
      >
        {formError && (
          <div role="alert" className="form-error mb-5">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {formError}
          </div>
        )}
        {showForm && <UserForm key={editing?.id ?? "nuevo"} formId="user-form" initial={editing} onSubmit={handleSubmit} />}
      </Modal>
    </div>
  );
};
export default AdminUsersPage;
