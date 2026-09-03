import React from "react";
import { Building2, Filter, Save } from "lucide-react";

type Props = {
  areaId: string;
  onArea: (v: string) => void;
  estado: string;
  onEstado: (v: string) => void;
  onPublish: () => void;
  areas: readonly { id: string; label: string }[];
};

const ToolbarHeader: React.FC<Props> = ({
  areaId,
  onArea,
  estado,
  onEstado,
  onPublish,
  areas,
}) => {
  return (
    // Barra superior que ocupa TODO el ancho
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-6 lg:px-10 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Selección de área */}
          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Building2 size={20} className="text-blue-600" />
            <select
              className="bg-transparent border-none outline-none text-base font-semibold text-gray-800 cursor-pointer pr-8 min-w-[220px]"
              value={areaId}
              onChange={(e) => onArea(e.target.value)}
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Filter size={20} className="text-sky-900" />
            <select
              className="bg-transparent border-none outline-none text-base font-semibold text-gray-800 cursor-pointer pr-8 min-w-[180px]"
              value={estado}
              onChange={(e) => onEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        {/* Botón Publicar */}
        <button
          className="flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-sky-900 to-sky-800 hover:from-sky-800 hover:to-sky-700 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          onClick={onPublish}
        >
          <Save size={20} />
          <span>Publicar</span>
        </button>
      </div>
    </header>
  );
};

export default ToolbarHeader;
