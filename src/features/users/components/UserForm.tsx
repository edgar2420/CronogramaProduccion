import React, { useState } from "react";
import type { User, Role } from "@/auth/types";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

type Props = {
  /** id del <form>, para que los botones del pie del modal lo envíen. */
  formId: string;
  initial?: User | null;
  onSubmit: (data: Omit<User, "id">) => void;
};

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "usuario", label: "Usuario", hint: "Ve el cronograma publicado y registra producción." },
  { value: "admin", label: "Administrador", hint: "Programa órdenes, personal y productos." },
  { value: "superadmin", label: "Superadmin", hint: "Además gestiona usuarios y áreas." },
];

const UserForm: React.FC<Props> = ({ formId, initial, onSubmit }) => {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "usuario");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      setError("Completa el usuario y el nombre.");
      return;
    }
    if (!initial && password.trim().length < 8) {
      setError("La contraseña inicial debe tener al menos 8 caracteres.");
      return;
    }
    if (password && password.trim().length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setError(null);
    onSubmit({ username: username.trim(), name: name.trim(), role, password, active });
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
        <div className="field">
          <label htmlFor="u-name" className="label">Nombre</label>
          <input id="u-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María Gómez" autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="u-user" className="label">Usuario</label>
          <input
            id="u-user"
            className={`input ${initial ? "bg-slate-50 text-slate-500" : ""}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            readOnly={!!initial}
            placeholder="Ej. mgomez"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <p className="field-hint">{initial ? "El usuario no se puede cambiar." : "Con este nombre inicia sesión."}</p>
        </div>

        <div className="field sm:col-span-2">
          <label htmlFor="u-pass" className="label">
            {initial ? <>Nueva contraseña <span className="label-optional">(déjala vacía para no cambiarla)</span></> : "Contraseña inicial"}
          </label>
          <div className="relative">
            <input
              id="u-pass"
              className="input pr-12"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 row-action"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="field-hint">Mínimo 8 caracteres.</p>
        </div>
      </div>

      <fieldset className="field">
        <legend className="label mb-1.5">Rol</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROLES.map(r => (
            <label key={r.value} className="choice items-start py-2.5 min-h-0">
              <input type="radio" name="u-role" className="mt-0.5" checked={role === r.value} onChange={() => setRole(r.value)} />
              <span>
                <span className="block font-medium">{r.label}</span>
                <span className="block text-xs text-slate-500 font-normal">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="choice">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Usuario activo (puede iniciar sesión)
      </label>
    </form>
  );
};

export default UserForm;
