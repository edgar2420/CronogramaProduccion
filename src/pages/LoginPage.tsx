import React, { useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { UserRound, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import logo from "../assets/logo_abd.jpg";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-950 via-blue-700 to-sky-400 text-gray-800">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg border border-blue-200 rounded-2xl shadow-2xl p-8">

        <div className="text-center mb-6">
          <img
            src={logo}
            alt="Laboratorios ABD"
            className="mx-auto h-16 w-auto rounded-lg object-contain shadow-sm"
            onError={(e) => (((e.target as HTMLImageElement).style.display = "none"))}
          />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-blue-900">
            Bienvenido
          </h1>
          <p className="text-sm text-gray-600">
            Inicia sesión para continuar al panel administrativo
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={onSubmit}>
          {/* Usuario */}
          <div>
            <label htmlFor="user" className="label text-blue-900">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                <UserRound size={18} />
              </span>
              <input
                id="user"
                className="input pl-10 border-blue-200 focus:ring-2 focus:ring-blue-400"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="pass" className="label text-blue-900">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                <Lock size={18} />
              </span>
              <input
                id="pass"
                type={showPass ? "text" : "password"}
                className="input pl-10 pr-10 border-blue-200 focus:ring-2 focus:ring-blue-400"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {msg && (
            <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm text-center">
              {msg}
            </div>
          )}

          {/* Submit */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg py-2 transition-all duration-150 shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
