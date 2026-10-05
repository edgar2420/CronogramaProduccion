import React, { useEffect, useState } from "react";
import { ClipboardCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import type { Turno } from "@/features/schedule/types";
import Modal from "@/components/ui/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: number;
  producto: string;
  turno: Turno;
  /** Si el servidor rechaza el registro, el error se muestra en el modal. */
  onSave: (real: number, obs?: string) => Promise<void> | void;
};

const RegisterRealModal: React.FC<Props> = ({ open, onClose, plan, producto, turno, onSave }) => {
  const [real, setReal] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReal("");
    setObs("");
    setError(null);
  }, [open]);

  const realNum = Number(real || 0);
  const eficacia = plan ? Math.round((realNum / plan) * 100) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(realNum) || realNum <= 0) {
      setError("Indica la cantidad producida (mayor a 0).");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(realNum, obs.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la producción");
    } finally {
      setSaving(false);
    }
  }

  const barColor = eficacia >= 100 ? "bg-emerald-500" : eficacia >= 80 ? "bg-amber-500" : "bg-rose-500";

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      icon={<ClipboardCheck size={20} />}
      title="Registrar producción"
      description={`${producto} · turno ${turno}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="registrar-real" className="btn-primary" disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            Guardar producción
          </button>
        </>
      }
    >
      <form id="registrar-real" onSubmit={submit} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="form-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <span className="label">Planificado</span>
            <p className="h-11 flex items-center text-lg font-semibold text-slate-900 tabular-nums">{plan.toLocaleString("es")}</p>
          </div>
          <div className="field">
            <label htmlFor="real" className="label">Cantidad producida</label>
            <input
              id="real"
              inputMode="numeric"
              className="input text-lg font-semibold tabular-nums"
              value={real}
              onChange={(e) => setReal(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Cumplimiento</span>
            <span className="font-semibold tabular-nums text-slate-900">{eficacia}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(eficacia, 100)}%` }} />
          </div>
          {realNum >= plan && plan > 0 && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-700"><CheckCircle2 size={16} /> Meta alcanzada</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="obs" className="label">Observaciones <span className="label-optional">(opcional)</span></label>
          <textarea
            id="obs"
            className="input min-h-20"
            rows={3}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ej. Se paró 2 horas por mantenimiento del chiller"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RegisterRealModal;
