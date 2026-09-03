import React, { useEffect, useState } from "react";
import type { User, Role } from "@/auth/types";

type Props = {
  initial?: User | null;
  onSubmit: (data: Omit<User, "id">) => void;
  onCancel: () => void;
};

const UserForm: React.FC<Props> = ({ initial, onSubmit, onCancel }) => {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "usuario");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(initial?.active ?? true);

  useEffect(() => {
    if (!initial) return;
    setUsername(initial.username);
    setName(initial.name);
    setRole(initial.role);
    setActive(initial.active);
  }, [initial]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      alert("Completa usuario y nombre");
      return;
    }
    if (!initial && password.trim().length < 8) {
      alert("La contraseña inicial debe tener al menos 8 caracteres");
      return;
    }
    if (password && password.trim().length < 8) {
      alert("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    const payload: Omit<User, "id"> = {
      username: username.trim(),
      name: name.trim(),
      role,
      password,
      active,
    };

    onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="u-user" className="label">Usuario</label>
          <input
            id="u-user"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="u-name" className="label">Nombre</label>
          <input
            id="u-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="u-role" className="label">Rol</label>
          <select
            id="u-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="superadmin">Super Administrador</option>
            <option value="admin">Administrador</option>
            <option value="usuario">Usuario</option>
          </select>
        </div>
        <div>
          <label htmlFor="u-pass" className="label">
            Contraseña {initial ? "(dejar vacío para no cambiar)" : "(inicial)"}
          </label>
          <input
            id="u-pass"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="u-active"
          type="checkbox"
          className="h-4 w-4"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        <label htmlFor="u-active" className="text-sm">Activo</label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="btn bg-gray-100 hover:bg-gray-200"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button className="btn bg-blue-600 text-white hover:bg-blue-700">
          {initial ? "Guardar" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
