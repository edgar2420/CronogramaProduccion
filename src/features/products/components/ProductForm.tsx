import React, { useState } from "react";
import type { Product } from "../types";
import type { Area } from "@/services/api/areas.api";
import { Save, X } from "lucide-react";

export type ProductFormMode = "create" | "edit" | "deactivate";

export type ProductFormValues = {
  codigo: string;
  nombre: string;
  vol: string;
  envase: string;
  areaId: string;
  /** Obligatorio en "edit" y "deactivate": por qué se hace el cambio (trazabilidad). */
  changeReason: string;
};

type Props = {
  mode: ProductFormMode;
  initial: Product | null;
  areas: Area[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
};

const ProductForm: React.FC<Props> = ({ mode, initial, areas, onSubmit, onCancel }) => {
  const [codigo, setCodigo] = useState(initial?.codigo ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [vol, setVol] = useState(initial?.vol ?? "");
  const [envase, setEnvase] = useState(initial?.envase ?? "");
  const [areaId, setAreaId] = useState(initial?.areaId ?? areas[0]?.id ?? "");
  const [changeReason, setChangeReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requiresReason = mode === "edit" || mode === "deactivate";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "deactivate") {
      if (!codigo.trim() || !nombre.trim() || !areaId) {
        setError("Código, nombre y área son obligatorios");
        return;
      }
    }
    if (requiresReason && !changeReason.trim()) {
      setError("Debes indicar el motivo del cambio (queda registrado en el historial)");
      return;
    }
    setError(null);
    onSubmit({ codigo, nombre, vol, envase, areaId, changeReason });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {mode !== "deactivate" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Código</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: 01"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Área</label>
            <select
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Nombre del producto</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Solución Fisiológica 0,9%"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Volumen (opcional)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={vol}
              onChange={(e) => setVol(e.target.value)}
              placeholder="Ej: 1000 ml"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Envase (opcional)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={envase}
              onChange={(e) => setEnvase(e.target.value)}
              placeholder="Ej: Frasco infusor de PEBD Flex"
            />
          </div>
        </div>
      )}

      {requiresReason && (
        <div>
          <label className="text-sm font-medium text-slate-700">
            Motivo del cambio <span className="text-red-500">*</span>
          </label>
          <textarea
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={2}
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Ej: Corrección de volumen según ficha técnica actualizada"
          />
          <p className="text-xs text-slate-500 mt-1">
            Este producto quedará como una nueva versión trazable; la versión anterior no se borra.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          <X size={16} /> Cancelar
        </button>
        <button type="submit" className="btn-primary">
          <Save size={16} /> {mode === "deactivate" ? "Confirmar desactivación" : "Guardar"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
