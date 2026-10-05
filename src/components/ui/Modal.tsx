import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** md: formularios cortos; lg: formularios con más campos o tablas. */
  size?: "md" | "lg" | "xl";
  /** Mientras se guarda no se cierra con Escape ni con clic afuera. */
  busy?: boolean;
  children: React.ReactNode;
  /** Botones de acción, fijos abajo aunque el contenido haga scroll. */
  footer?: React.ReactNode;
};

const SIZES = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

/**
 * Ventana modal común de la app (crear/editar orden, producto, personal,
 * usuario, área). Escape y clic en el fondo cierran, el foco arranca en el
 * primer campo y vuelve al botón que la abrió, y la página de atrás no hace
 * scroll mientras está abierta.
 */
export default function Modal({
  open, onClose, title, description, icon, size = "md", busy = false, children, footer,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])"
      );
    (first ?? panel)?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCloseRef.current();
      // Tab no se escapa del modal.
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={busy ? undefined : onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative w-full ${SIZES[size]} max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in focus:outline-none`}
      >
        <header className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-200">
          {icon && (
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900 leading-tight">{title}</h2>
            {description && <div id={descId} className="mt-0.5 text-sm text-slate-500">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="row-action -mr-2 -mt-1 shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
