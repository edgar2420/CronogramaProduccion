import React, { useState } from "react";
import type { Product } from "../types";
import type { Area } from "@/services/api/areas.api";
import { AlertCircle } from "lucide-react";

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
  /** id del <form>, para que los botones del pie del modal lo envíen. */
  formId: string;
  mode: ProductFormMode;
  initial: Product | null;
  areas: Area[];
  onSubmit: (values: ProductFormValues) => void;
};

const ProductForm: React.FC<Props> = ({ formId, mode, initial, areas, onSubmit }) => {
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
        setError("Código, nombre y área son obligatorios.");
        return;
      }
    }
    if (requiresReason && !changeReason.trim()) {
      setError("Indica el motivo del cambio: queda registrado en el historial.");
      return;
    }
    setError(null);
    onSubmit({ codigo, nombre, vol, envase, areaId, changeReason });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div role="alert" className="form-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {mode === "deactivate" && initial && (
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{initial.nombre}</span> dejará de aparecer al programar
          órdenes. Las órdenes y versiones anteriores no se borran.
        </p>
      )}

      {mode !== "deactivate" && (
        <div className="form-grid">
          <div className="field">
            <label htmlFor="prod-codigo" className="label">Código</label>
            <input id="prod-codigo" className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej. 01" />
          </div>
          <div className="field">
            <label htmlFor="prod-area" className="label">Área</label>
            <select id="prod-area" className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="field sm:col-span-2">
            <label htmlFor="prod-nombre" className="label">Nombre del producto</label>
            <input id="prod-nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Solución Fisiológica 0,9%" />
          </div>
          <div className="field">
            <label htmlFor="prod-vol" className="label">Volumen <span className="label-optional">(opcional)</span></label>
            <input id="prod-vol" className="input" value={vol} onChange={(e) => setVol(e.target.value)} placeholder="Ej. 1000 ml" />
          </div>
          <div className="field">
            <label htmlFor="prod-envase" className="label">Envase <span className="label-optional">(opcional)</span></label>
            <input id="prod-envase" className="input" value={envase} onChange={(e) => setEnvase(e.target.value)} placeholder="Ej. Frasco infusor de PEBD Flex" />
          </div>
        </div>
      )}

      {requiresReason && (
        <div className="field">
          <label htmlFor="prod-motivo" className="label">Motivo del cambio</label>
          <textarea
            id="prod-motivo"
            className="input min-h-20"
            rows={3}
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Ej. Corrección de volumen según ficha técnica actualizada"
          />
          <p className="field-hint">
            {mode === "edit"
              ? "Se guarda como una nueva versión trazable; la versión anterior no se borra."
              : "Queda registrado en el historial del producto."}
          </p>
        </div>
      )}
    </form>
  );
};

export default ProductForm;
