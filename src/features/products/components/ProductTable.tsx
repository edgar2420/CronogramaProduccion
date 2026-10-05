import React, { useMemo, useState } from "react";
import type { Product } from "../types";
import type { Area } from "@/services/api/areas.api";
import { Pencil, Ban, History, Search, PackageSearch } from "lucide-react";

type Props = {
  data: Product[];
  areas: Area[];
  onEdit: (item: Product) => void;
  onDeactivate: (item: Product) => void;
  onHistory: (item: Product) => void;
};

const ProductTable: React.FC<Props> = ({ data, areas, onEdit, onDeactivate, onHistory }) => {
  const [q, setQ] = useState("");
  const [areaFilter, setAreaFilter] = useState("TODAS");

  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter((p) => {
      if (areaFilter !== "TODAS" && p.areaId !== areaFilter) return false;
      if (!t) return true;
      return p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t);
    });
  }, [q, areaFilter, data]);

  return (
    <div className="table-shell">
      <div className="table-toolbar">
        <label className="table-search">
          <span className="sr-only">Buscar producto</span>
          <Search size={18} />
          <input
            placeholder="Buscar por nombre o código…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por área</span>
          <select className="table-select w-full sm:w-auto" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
            <option value="TODAS">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Vol.</th>
              <th>Envase</th>
              <th>Área</th>
              <th>Versión</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const area = areaById.get(p.areaId);
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-slate-500 whitespace-nowrap">{p.codigo}</td>
                  <td className="font-medium text-slate-900 min-w-[14rem]">{p.nombre}</td>
                  <td className="whitespace-nowrap">{p.vol ?? "—"}</td>
                  <td className="whitespace-nowrap">{p.envase ?? "—"}</td>
                  <td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: area?.colorHex ?? "#94a3b8" }} />
                      {area?.name ?? p.areaId}
                    </span>
                  </td>
                  <td className="text-slate-500 tabular-nums">v{p.version}</td>
                  <td>
                    <span className={`status-pill ${p.active ? "status-active" : "status-inactive"}`}>
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="row-action" onClick={() => onEdit(p)} aria-label={`Editar ${p.nombre}`} title="Editar (crea una nueva versión)">
                        <Pencil size={16} />
                      </button>
                      <button className="row-action" onClick={() => onHistory(p)} aria-label={`Historial de ${p.nombre}`} title="Historial de versiones">
                        <History size={16} />
                      </button>
                      {p.active && (
                        <button className="row-action row-action-danger" onClick={() => onDeactivate(p)} aria-label={`Desactivar ${p.nombre}`} title="Desactivar">
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="table-empty">
                  <PackageSearch size={28} className="mx-auto mb-2 text-slate-300" />
                  {data.length === 0 ? "Todavía no hay productos." : "Ningún producto coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        {filtered.length === data.length
          ? `${data.length} productos`
          : `Mostrando ${filtered.length} de ${data.length} productos`}
      </div>
    </div>
  );
};

export default ProductTable;
