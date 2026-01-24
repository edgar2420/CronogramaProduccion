import React, { useEffect, useMemo, useState } from "react";
import type { Turno } from "@/features/schedule/types";

type OutRow = {
  fecha: string;
  turno: Turno;
  productoNombre: string;
  planificado: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  defaultFecha: string;
  defaultTurno: Turno;
  turnos: Turno[];
  onSave: (rows: OutRow[]) => void;
  catalogo?: { id: string; nombre: string; codigo?: string }[];
};

type RowState = {
  fecha: string;
  turno: Turno;
  productoId: string;
  planificado: string; // string para permitir vacío
};

const ProgramarMultiplesModal: React.FC<Props> = ({
  open, onClose, defaultFecha, defaultTurno, turnos, onSave, catalogo = []
}) => {

  const [rows, setRows] = useState<RowState[]>([
    { fecha: defaultFecha, turno: defaultTurno, productoId: "", planificado: "" }
  ]);

  // índice por id
  const byId = useMemo(() => {
    const m = new Map<string, { id: string; nombre: string; codigo?: string }>();
    catalogo.forEach(p => m.set(p.id, p));
    return m;
  }, [catalogo]);

  // defaults para nueva fila (hereda de la última)
  const lastDefaults = useMemo(
    () => rows.length
      ? { fecha: rows[rows.length - 1].fecha, turno: rows[rows.length - 1].turno }
      : { fecha: defaultFecha, turno: defaultTurno },
    [rows, defaultFecha, defaultTurno]
  );

  useEffect(() => {
    if (open) {
      setRows([{ fecha: defaultFecha, turno: defaultTurno, productoId: "", planificado: "" }]);
    }
  }, [open, defaultFecha, defaultTurno]);

  function setRow(idx: number, patch: Partial<RowState>) {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows(prev => [
      ...prev,
      { fecha: lastDefaults.fecha, turno: lastDefaults.turno, productoId: "", planificado: "" }
    ]);
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }

  // Validación
  function isRowValid(r: RowState) {
    const okFecha = /^\d{4}-\d{2}-\d{2}$/.test(r.fecha);
    const okTurno = ["mañana", "tarde", "noche"].includes(r.turno);
    const okProd = !!r.productoId && byId.has(r.productoId);
    const num = Number(r.planificado);
    const okPlan = !isNaN(num) && num > 0;
    return okFecha && okTurno && okProd && okPlan;
  }

  const validCount = rows.filter(isRowValid).length;
  const canSave = rows.length > 0 && validCount === rows.length;

  function handleSave() {
    if (!canSave) return;
    const out: OutRow[] = rows.map(r => {
      const pr = byId.get(r.productoId)!;
      return {
        fecha: r.fecha,
        turno: r.turno,
        productoNombre: pr.nombre,
        planificado: Number(r.planificado)
      };
    });
    onSave(out);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Ocultar flechas en number */}
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Programar múltiples órdenes</h3>
          <button className="text-gray-500 hover:text-black" onClick={onClose}>✕</button>
        </div>

        <div className="p-5 space-y-3">
          {/* Atajos */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Atajos:</span>
            <button
              className="btn bg-blue-50 hover:bg-blue-100 text-blue-900"
              onClick={addRow}
              type="button"
            >
              + Agregar fila
            </button>
            <span className="ml-auto text-sm text-gray-600">
              {validCount}/{rows.length} filas completas
            </span>
          </div>

          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Turno</th>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3">Plan</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const pr = r.productoId ? byId.get(r.productoId) : undefined;
                  const isValid = isRowValid(r);
                  return (
                    <tr key={idx} className="border-t">
                      {/* Fecha */}
                      <td className="py-2 px-3 align-top">
                        <input
                          type="date"
                          className="input"
                          value={r.fecha}
                          onChange={e => setRow(idx, { fecha: e.target.value })}
                        />
                      </td>

                      {/* Turno */}
                      <td className="py-2 px-3 align-top">
                        <select
                          className="input"
                          value={r.turno}
                          onChange={e => setRow(idx, { turno: e.target.value as Turno })}
                        >
                          {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Producto */}
                      <td className="py-2 px-3 align-top w-[40%]">
                        <select
                          className="input"
                          value={r.productoId}
                          onChange={e => setRow(idx, { productoId: e.target.value })}
                        >
                          <option value="">Selecciona un producto…</option>
                          {catalogo.map((p, i) => (
                            <option key={`${p.id}-${i}`} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                        {/* Hint solo con nombre (sin código) */}
                        <div className="mt-1 text-[11px] text-gray-500 h-4">
                          {pr ? <span className="truncate">{pr.nombre}</span> : null}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-2 px-3 align-top">
                        <input
                          type="number"
                          className="input"
                          min={1}
                          inputMode="numeric"
                          value={r.planificado}
                          onChange={e => setRow(idx, { planificado: e.target.value })}
                          placeholder=""
                        />
                      </td>

                      {/* Quitar */}
                      <td className="py-2 px-3 align-top">
                        <button
                          className="btn bg-rose-50 hover:bg-rose-100 text-rose-900"
                          onClick={() => removeRow(idx)}
                          type="button"
                        >
                          Quitar
                        </button>
                        {!isValid && (
                          <div className="mt-1 text-[11px] text-rose-600">Completa esta fila</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="btn" onClick={onClose} type="button">Cancelar</button>
            <button
              className={`btn ${canSave ? "bg-purple-900 hover:bg-purple-800 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
              disabled={!canSave}
              onClick={handleSave}
              type="button"
            >
              Guardar órdenes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramarMultiplesModal;
