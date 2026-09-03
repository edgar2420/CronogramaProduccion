import React, { useMemo, useState } from "react";
import type { Staff } from "@/features/staff/types";
import { Pencil, Trash2, Search } from "lucide-react";

type Props = {
  data: Staff[];
  onEdit: (item: Staff) => void;
  onDelete: (id: string) => void;
};

const StaffTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data;
    return data.filter(s => s.nombre.toLowerCase().includes(t));
  }, [q, data]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      {/* Buscador */}
      <div className="relative mb-5">
        <input
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Buscar personal por nombre..."
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
      </div>

      {/* Tabla */}
      <div className="overflow-auto rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-700">
              <th className="py-3 px-4 font-medium text-left">Nombre</th>
              <th className="py-3 px-4 font-medium text-left">Rol</th>
              <th className="py-3 px-4 font-medium text-left">Áreas asignadas</th>
              <th className="py-3 px-4 font-medium text-left">Estado</th>
              <th className="py-3 px-4 font-medium text-center w-36">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, i) => (
              <tr 
                key={s.id} 
                className={`border-b transition hover:bg-blue-50/40 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                }`}
              >
                <td className="py-3 px-4 font-medium text-gray-800">{s.nombre}</td>
                <td className="py-3 px-4 text-gray-700">{s.rolBase}</td>

                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {s.areas.map(a => (
                      <span
                        key={a}
                        className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.activo 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {s.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button 
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                      onClick={()=>onEdit(s)}
                    >
                      <Pencil size={16}/>
                    </button>

                    <button 
                      className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                      onClick={()=>onDelete(s.id)}
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
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

export default StaffTable;
