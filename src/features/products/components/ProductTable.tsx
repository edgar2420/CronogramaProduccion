import React, { useMemo, useState } from "react";
import type { Product } from "../types";
import type { Area } from "@/services/api/areas.api";
import { Pencil, Ban, History, Search } from "lucide-react";

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

  const areaNameById = useMemo(() => new Map(areas.map((a) => [a.id, a.name])), [areas]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter((p) => {
      if (areaFilter !== "TODAS" && p.areaId !== areaFilter) return false;
      if (!t) return true;
      return p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t);
    });
  }, [q, areaFilter, data]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Buscar producto por nombre o código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
        >
          <option value="TODAS">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-auto rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-700">
              <th className="py-3 px-4 font-medium text-left">Código</th>
              <th className="py-3 px-4 font-medium text-left">Nombre</th>
              <th className="py-3 px-4 font-medium text-left">Vol.</th>
              <th className="py-3 px-4 font-medium text-left">Envase</th>
              <th className="py-3 px-4 font-medium text-left">Área</th>
              <th className="py-3 px-4 font-medium text-left">Versión</th>
              <th className="py-3 px-4 font-medium text-left">Estado</th>
              <th className="py-3 px-4 font-medium text-center w-40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b transition hover:bg-blue-50/40 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
              >
                <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.codigo}</td>
                <td className="py-3 px-4 font-medium text-gray-800">{p.nombre}</td>
                <td className="py-3 px-4 text-gray-600">{p.vol ?? "—"}</td>
                <td className="py-3 px-4 text-gray-600">{p.envase ?? "—"}</td>
                <td className="py-3 px-4 text-gray-600">{areaNameById.get(p.areaId) ?? p.areaId}</td>
                <td className="py-3 px-4 text-gray-500">v{p.version}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      p.active ? "bg-green-100 text-green-700" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                      onClick={() => onEdit(p)}
                      title="Editar (crea una nueva versión)"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      onClick={() => onHistory(p)}
                      title="Ver historial de versiones"
                    >
                      <History size={16} />
                    </button>
                    {p.active && (
                      <button
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                        onClick={() => onDeactivate(p)}
                        title="Desactivar"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
