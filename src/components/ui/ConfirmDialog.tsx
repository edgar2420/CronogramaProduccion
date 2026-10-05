import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" para acciones destructivas: botón rojo y foco inicial en Cancelar. */
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Diálogo de confirmación de la app, en lugar del confirm() nativo del
 * navegador: mismo estilo que el resto, se cierra con Escape o clic fuera, y
 * en una acción destructiva el foco arranca en "Cancelar" para que un Enter
 * accidental no borre nada.
 */
export default function ConfirmDialog({
  open, title, children, confirmLabel, cancelLabel = "Cancelar",
  tone = "primary", busy = false, onConfirm, onCancel,
}: Props) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    (tone === "danger" ? cancelRef : confirmRef).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, tone, busy, onCancel]);

  if (!open) return null;

  const confirmClass = tone === "danger" ? "btn-danger" : "btn-primary";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={busy ? undefined : onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in"
      >
        <div className="flex items-start gap-4">
          {tone === "danger" && (
            <div className="shrink-0 w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">{title}</h2>
            {children && <div className="mt-2 text-sm text-slate-600 space-y-2">{children}</div>}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button ref={cancelRef} type="button" className="btn-secondary min-h-11" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} type="button" className={`${confirmClass} min-h-11`} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
